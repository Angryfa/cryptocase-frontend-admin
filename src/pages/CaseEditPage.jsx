import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

function isoToLocalInput(iso) {
   if (!iso) return "";
   const d = new Date(iso);
   const pad = (n) => String(n).padStart(2, "0");
   const yyyy = d.getFullYear();
   const mm = pad(d.getMonth() + 1);
   const dd = pad(d.getDate());
   const hh = pad(d.getHours());
   const mi = pad(d.getMinutes());
   return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function PrizeRow({ idx, value, onChange, onRemove }) {
   return (
      <div className={s.formRow}>
         <div className={s.field}><label>Название приза</label><input value={value.title} onChange={e=>onChange(idx, { ...value, title: e.target.value })} /></div>
         <div className={s.field}><label>Сумма, $</label><input type="number" value={value.amount_usd} onChange={e=>onChange(idx, { ...value, amount_usd: e.target.value })} /></div>
         <div className={s.field}><label>Вес</label><input type="number" value={value.weight} onChange={e=>onChange(idx, { ...value, weight: e.target.value })} /></div>
         <div className={s.field}><label>&nbsp;</label><button type="button" className={root.btn} onClick={()=>onRemove(idx)}>Удалить</button></div>
      </div>
   );
}

export default function CaseEditPage() {
   const { id } = useParams();
   const nav = useNavigate();
   const { authFetch } = useAuth();

   const [loading, setLoading] = useState(true);
   const [types, setTypes] = useState([]);
   const [caseData, setCaseData] = useState(null);

   const [name, setName] = useState("");
   const [price, setPrice] = useState(0);
   const [typeId, setTypeId] = useState("");
   const [availableFrom, setAvailableFrom] = useState("");
   const [availableTo, setAvailableTo] = useState("");
   const [spinsTotal, setSpinsTotal] = useState(0);
   const [isActive, setIsActive] = useState(true);
   const [prizes, setPrizes] = useState([]);

   const [error, setError] = useState("");
   const [ok, setOk] = useState("");

   useEffect(() => {
      let mounted = true;
      (async () => {
         const [resCase, resTypes] = await Promise.all([
            authFetch(`/api/cases/${id}/`),
            authFetch(`/api/cases/types/`),
         ]);
         const dataCase = await resCase.json();
         const dataTypes = await resTypes.json();
         if (!mounted) return;
         setCaseData(dataCase);
         setTypes(dataTypes);
         setName(dataCase.name);
         setPrice(dataCase.price_usd);
         setTypeId(dataCase.type?.id || "");
         setAvailableFrom(isoToLocalInput(dataCase.available_from));
         setAvailableTo(isoToLocalInput(dataCase.available_to));
         setSpinsTotal(dataCase.spins_total || 0);
         setIsActive(Boolean(dataCase.is_active));
         setPrizes((dataCase.prizes || []).map(p => ({ title: p.title, amount_usd: p.amount_usd, weight: p.weight })));
         setLoading(false);
      })();
      return () => { mounted = false; };
   }, [authFetch, id]);

   const addPrize = () => setPrizes(p => [...p, { title: "", amount_usd: 0, weight: 1 }]);
   const setPrize = (idx, v) => setPrizes(p => p.map((x,i)=> i===idx? v : x));
   const removePrize = (idx) => setPrizes(p => p.filter((_,i)=> i!==idx));

   const onSubmit = async (e) => {
      e.preventDefault(); setError(""); setOk("");
      try {
         const toIsoOrNull = (v) => v ? new Date(v).toISOString() : null;
         const payload = {
            name,
            price_usd: Number(price),
            is_active: !!isActive,
            type_id: Number(typeId),
            available_from: toIsoOrNull(availableFrom),
            available_to: toIsoOrNull(availableTo),
            spins_total: Number(spinsTotal),
            prizes: prizes.map(p => ({ title: p.title, amount_usd: Number(p.amount_usd), weight: Number(p.weight||1) })),
         };
         const res = await authFetch(`/api/admin/cases/${id}/`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
         if (!res.ok) { const err = await res.json().catch(()=>({detail:"Ошибка"})); throw new Error(err.detail || JSON.stringify(err)); }
         setOk("Сохранено");
      } catch (err) { setError(err.message || "Ошибка"); }
   };

   const onDelete = async () => {
      if (!window.confirm("Удалить кейс? Действие необратимо.")) return;
      const res = await authFetch(`/api/admin/cases/${id}/`, { method: "DELETE" });
      if (res.ok) nav("/cases", { replace: true });
   };

   if (loading) return <div className={s.page}><div className={s.card}>Загрузка...</div></div>;

   return (
      <div className={s.page}>
         <div className={s.header}>
            <h2 className={s.title}>Редактирование кейса #{caseData?.id}</h2>
            <div className={s.actions}>
               <button className={root.btn} onClick={()=>nav("/cases")}>Назад</button>
               <button className={root.btn} onClick={onDelete}>Удалить</button>
            </div>
         </div>
         <div className={s.card}>
            <form onSubmit={onSubmit} className={s.formRow}>
               <div className={s.formRow} style={{ gridTemplateColumns: "1fr 1fr", display: "grid", gap: 12 }}>
                  <div className={s.field}><label>Название</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
                  <div className={s.field}><label>Цена, $</label><input type="number" value={price} onChange={e=>setPrice(e.target.value)} /></div>
                  <div className={s.field}><label>Тип кейса</label>
                     <select value={typeId} onChange={e=>setTypeId(e.target.value)}>
                        <option value="">Выберите тип</option>
                        {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  </div>
                  <div className={s.field}><label>Открыт с</label><input type="datetime-local" value={availableFrom} onChange={e=>setAvailableFrom(e.target.value)} /></div>
                  <div className={s.field}><label>Открыт до</label><input type="datetime-local" value={availableTo} onChange={e=>setAvailableTo(e.target.value)} /></div>
                  <div className={s.field}><label>Лимит круток</label><input type="number" value={spinsTotal} onChange={e=>setSpinsTotal(e.target.value)} /></div>
                  <div className={s.field}><label>Активен</label><input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} /></div>
               </div>
               <div className={s.field}>
                  <label>Призы</label>
                  {prizes.map((p,idx)=> (
                     <PrizeRow key={idx} idx={idx} value={p} onChange={setPrize} onRemove={removePrize} />
                  ))}
                  <button type="button" className={root.btn} onClick={addPrize}>Добавить приз</button>
               </div>
               <div className={s.actions}>
                  <button type="submit" className={root.btnPrimary}>Сохранить</button>
                  {error && <div style={{ color: "red" }}>{error}</div>}
                  {ok && <div style={{ color: "green" }}>{ok}</div>}
               </div>
            </form>
         </div>
      </div>
   );
}
