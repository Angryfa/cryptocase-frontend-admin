import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

export default function CaseTypeEditPage() {
   const { id } = useParams();
   const nav = useNavigate();
   const { authFetch } = useAuth();

   const [loading, setLoading] = useState(true);
   const [type, setType] = useState("");
   const [name, setName] = useState("");
   const [isLimited, setIsLimited] = useState(false);
   const [isTimed, setIsTimed] = useState(false);
   const [sortOrder, setSortOrder] = useState(100);
   const [isActive, setIsActive] = useState(true);

   const [error, setError] = useState("");
   const [ok, setOk] = useState("");

   useEffect(() => {
      let mounted = true;
      (async () => {
         const res = await authFetch(`/api/admin/case-types/${id}/`);
         const data = await res.json();
         if (!mounted) return;
         setType(data.type || "");
         setName(data.name || "");
         setIsLimited(!!data.is_limited);
         setIsTimed(!!data.is_timed);
         setSortOrder(data.sort_order ?? 100);
         setIsActive(!!data.is_active);
         setLoading(false);
      })();
      return () => { mounted = false; };
   }, [authFetch, id]);

   const onSubmit = async (e) => {
      e.preventDefault(); setError(""); setOk("");
      try {
         const payload = { type, name, is_limited: !!isLimited, is_timed: !!isTimed, sort_order: Number(sortOrder), is_active: !!isActive };
         const res = await authFetch(`/api/admin/case-types/${id}/`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
         if (!res.ok) { const err = await res.json().catch(()=>({detail:"Ошибка"})); throw new Error(err.detail || JSON.stringify(err)); }
         setOk("Сохранено");
      } catch (err) { setError(err.message || "Ошибка"); }
   };

   const onDelete = async () => {
      if (!window.confirm("Удалить тип кейса? Действие необратимо.")) return;
      const res = await authFetch(`/api/admin/case-types/${id}/`, { method: "DELETE" });
      if (res.ok) nav("/case-types", { replace: true });
   };

   if (loading) return <div className={s.page}><div className={s.card}>Загрузка...</div></div>;

   return (
      <div className={s.page}>
         <div className={s.header}>
            <h2 className={s.title}>Редактирование типа кейса #{id}</h2>
            <div className={s.actions}>
               <button className={root.btn} onClick={()=>nav("/case-types")}>Назад</button>
               <button className={root.btn} onClick={onDelete}>Удалить</button>
            </div>
         </div>
         <div className={s.card}>
            <form onSubmit={onSubmit} className={s.formRow}>
               <div className={s.formRow} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", display: "grid", gap: 12 }}>
                  <div className={s.field}><label>Системный код (slug)</label><input value={type} onChange={e=>setType(e.target.value)} /></div>
                  <div className={s.field}><label>Имя</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
                  <div className={s.field}><label>Сортировка</label><input type="number" value={sortOrder} onChange={e=>setSortOrder(e.target.value)} /></div>
                  <div className={s.field}><label>Опции</label>
                     <label><input type="checkbox" checked={isLimited} onChange={e=>setIsLimited(e.target.checked)} /> Лимитный</label>
                     <label><input type="checkbox" checked={isTimed} onChange={e=>setIsTimed(e.target.checked)} /> По времени</label>
                     <label><input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} /> Активен</label>
                  </div>
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
