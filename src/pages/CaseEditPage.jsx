import { useEffect, useRef, useState } from "react";
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
         <div className={s.field}>
            <label>Название приза</label>
            <input value={value.title} onChange={e => onChange(idx, { ...value, title: e.target.value })} />
         </div>
         <div className={s.field}>
            <label>Сумма, $</label>
            <input type="number" value={value.amount_usd} onChange={e => onChange(idx, { ...value, amount_usd: e.target.value })} />
         </div>
         <div className={s.field}>
            <label>Вес</label>
            <input type="number" value={value.weight} onChange={e => onChange(idx, { ...value, weight: e.target.value })} />
         </div>
         <div className={s.field}>
            <label>&nbsp;</label>
            <button type="button" className={root.btn} onClick={() => onRemove(idx)}>Удалить</button>
         </div>
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

   // avatar state
   const [avatarFile, setAvatarFile] = useState(null);
   const [avatarPreview, setAvatarPreview] = useState("");
   const fileInputRef = useRef(null);
   const objectUrlRef = useRef(null);

   const [error, setError] = useState("");
   const [ok, setOk] = useState("");

   useEffect(() => {
      let mounted = true;
      (async () => {
         const [resCase, resTypes] = await Promise.all([
            authFetch(`/api/admin/cases/${id}/`),
            authFetch(`/api/cases/types/`),
         ]);
         const dataCase = await resCase.json();
         const dataTypes = await resTypes.json();
         if (!mounted) return;
         setCaseData(dataCase);
         setTypes(dataTypes);
         setName(dataCase.name);
         setPrice(dataCase.price_usd);
         setTypeId(dataCase.type?.id ? String(dataCase.type.id) : (dataCase.type_id != null ? String(dataCase.type_id) : ""));
         setAvailableFrom(isoToLocalInput(dataCase.available_from));
         setAvailableTo(isoToLocalInput(dataCase.available_to));
         setSpinsTotal(dataCase.spins_total || 0);
         setIsActive(Boolean(dataCase.is_active));
         setPrizes((dataCase.prizes || []).map(p => ({
            id: p.id,
            title: p.title,
            amount_usd: p.amount_usd,
            weight: p.weight,
         })));

         // выставляем предпросмотр текущего аватара, если он есть
         setAvatarPreview(dataCase.avatar_url || "");
         setLoading(false);
      })();
      return () => { mounted = false; };
   }, [authFetch, id]);

   useEffect(() => {
      // cleanup ObjectURL при размонтировании
      return () => {
         if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      };
   }, []);

   const onAvatarChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) {
         setAvatarFile(null);
         // если убрать предпросмотр — покажем оригинальный avatar_url из caseData
         setAvatarPreview(caseData?.avatar_url || "");
         return;
      }
      // базовая валидация
      const name = (file.name || "").toLowerCase();
      const isImage = file.type?.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
      const maxSizeMB = 10; // лимит 10 МБ (как на бэке)
      if (!isImage) {
         setError("Разрешены только изображения (JPG/PNG)");
         if (fileInputRef.current) fileInputRef.current.value = "";
         return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
         setError(`Размер изображения не должен превышать ${maxSizeMB} МБ`);
         if (fileInputRef.current) fileInputRef.current.value = "";
         return;
      }
      setError("");
      setAvatarFile(file);
      // предпросмотр выбранного файла
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setAvatarPreview(url);
   };

   const clearChosenAvatar = () => {
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // preview не меняем: останется выбранный objectURL или новый серверный URL
    };

   const addPrize = () => setPrizes(p => [...p, { title: "", amount_usd: 0, weight: 1 }]);
   const setPrize = (idx, v) => setPrizes(p => p.map((x, i) => i === idx ? v : x));
   const removePrize = (idx) => setPrizes(p => p.filter((_, i) => i !== idx));

   const onSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setOk("");
    
      try {
        const toIsoOrNull = (v) => (v ? new Date(v).toISOString() : "");
    
        const fd = new FormData();
        fd.append("name", String(name));
        fd.append("price_usd", String(Number(price)));
        fd.append("is_active", isActive ? "true" : "false");
        fd.append("type_id", String(typeId));
        if (availableFrom) fd.append("available_from", toIsoOrNull(availableFrom));
        if (availableTo) fd.append("available_to", toIsoOrNull(availableTo));
        fd.append("spins_total", String(Number(spinsTotal || 0)));
    
        fd.append(
          "prizes",
          JSON.stringify(
            (prizes || []).map((p) => ({
              ...(p.id ? { id: p.id } : {}),
              title: p.title,
              amount_usd: Number(p.amount_usd),
              weight: Number(p.weight || 1),
            }))
          )
        );
    
        if (avatarFile) {
          fd.append("avatar", avatarFile, avatarFile.name);
        }
    
        const res = await authFetch(`/api/admin/cases/${id}/`, {
          method: "PUT",
          body: fd,
        });
    
        if (!res.ok) {
          let msg = "Ошибка";
          try {
            const err = await res.json();
            if (err?.detail) msg = err.detail;
            else if (err && typeof err === "object") {
              msg = Object.entries(err)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                .join("; ");
            }
          } catch {}
          throw new Error(msg);
        }
    
        const updated = await res.json().catch(() => null);
    
        // Если бэкенд вернул новый URL — сразу показываем его (с bust-квери),
        // и только после этого освобождаем objectURL.
        if (updated?.avatar_url) {
          const bust =
            updated.avatar_url +
            (updated.avatar_url.includes("?") ? "&" : "?") +
            "v=" +
            Date.now();
    
          setAvatarPreview(bust);
          setCaseData((prev) =>
            prev ? { ...prev, avatar_url: bust } : { avatar_url: bust }
          );
    
          // теперь можно безопасно освободить объект-URL
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
        }
    
        // инпут сбрасываем, но preview НЕ трогаем
        setAvatarFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    
        setOk("Сохранено");
      } catch (err) {
        setError(err.message || "Ошибка");
      }
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
               <button className={root.btn} onClick={() => nav("/cases")}>Назад</button>
               <button className={root.btn} onClick={onDelete}>Удалить</button>
            </div>
         </div>

         <div className={s.card}>
            <form onSubmit={onSubmit} className={s.formRow}>
               <div className={s.formRow} style={{ gridTemplateColumns: "1fr 1fr", display: "grid", gap: 12 }}>
                  <div className={s.field}><label>Название</label><input value={name} onChange={e => setName(e.target.value)} /></div>
                  <div className={s.field}><label>Цена, $</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
                  <div className={s.field}>
                     <label>Тип кейса</label>
                     <select value={typeId} onChange={e => setTypeId(e.target.value)}>
                        <option value="">Выберите тип</option>
                        {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  </div>
                  <div className={s.field}><label>Открыт с</label><input type="datetime-local" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} /></div>
                  <div className={s.field}><label>Открыт до</label><input type="datetime-local" value={availableTo} onChange={e => setAvailableTo(e.target.value)} /></div>
                  <div className={s.field}><label>Лимит круток</label><input type="number" value={spinsTotal} onChange={e => setSpinsTotal(e.target.value)} /></div>
                  <div className={s.field}><label>Активен</label><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /></div>

                  {/* Аватар кейса */}
                  <div className={s.field} style={{ gridColumn: "1 / span 2" }}>
                     <label>Аватар кейса</label>
                     <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                           {avatarPreview ? (
                              <img
                                 key={avatarPreview}
                                 src={avatarPreview}
                                 alt="avatar"
                                 width={120}
                                 height={120}
                                 style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e5e5e5" }}
                              />
                           ) : (
                              <div style={{ width: 120, height: 120, background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                                 нет изображения
                              </div>
                           )}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                           <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={onAvatarChange}
                           />
                           {avatarFile && (
                              <button type="button" className={root.btn} onClick={clearChosenAvatar}>
                                 Отменить выбор
                              </button>
                           )}
                        </div>
                        <div className={s.hint}>Поддерживаются JPG/PNG до 10 МБ.</div>
                     </div>
                  </div>
               </div>

               <div className={s.field}>
                  <label>Призы</label>
                  {prizes.map((p, idx) => (
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
