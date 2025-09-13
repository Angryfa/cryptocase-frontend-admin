import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";
import p from "../assets/styles/Percentages.module.css";

export default function ReferralLevelsPage() {
   const { authFetch } = useAuth();
   const [items, setItems] = useState([]);
   const [cashback, setCashback] = useState(null);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState("");
   const [ok, setOk] = useState("");

   useEffect(() => {
      let mounted = true;
      (async () => {
         const [resLevels, resCashback] = await Promise.all([
            authFetch("/api/admin/ref-levels/"),
            authFetch("/api/admin/cashback-settings/")
         ]);
         const data = await resLevels.json();
         const cs = await resCashback.json();
         if (mounted) { setItems(data); setCashback(cs?.[0] || null); setLoading(false); }
      })();
      return () => { mounted = false; };
   }, [authFetch]);

   const setPercent = (id, value) => {
      setItems(list => list.map(it => it.id === id ? { ...it, percent: value } : it));
   };

   const saveRow = async (row) => {
      setError(""); setOk(""); setSaving(true);
      try {
         const res = await authFetch(`/api/admin/ref-levels/${row.id}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level: row.level, percent: Number(row.percent) }),
         });
         if (!res.ok) { const err = await res.json().catch(() => ({ detail: "Ошибка" })); throw new Error(err.detail || JSON.stringify(err)); }
         setOk("Сохранено");
      } catch (e) { setError(e.message || "Ошибка"); }
      finally { setSaving(false); }
   };

   const saveCashback = async () => {
      if (!cashback) return;
      const res = await authFetch(`/api/admin/cashback-settings/${cashback.id}/`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ ...cashback, percent: Number(cashback.percent) })
      });
      if (res.ok) setOk("Сохранено"); else setError("Не удалось сохранить кэшбэк");
   };
   const runCashback = async () => {
      setError(""); setOk("");
      try {
         const res = await authFetch("/api/admin/cashback-settings/run/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               percent: Number(cashback.percent),  // можно не указывать — возьмётся из настроек
               upsert: true,
               dry_run: false,
               // at: new Date().toISOString(),  // если хочешь задать момент вручную
            }),
         });
         const d = await res.json().catch(() => ({}));
         if (!res.ok) throw new Error(d?.detail || "Не удалось запустить расчёт");
         setOk(`OK: created ${d.created}, updated ${d.updated}, skipped ${d.skipped} @ ${d.as_of}`);
      } catch (e) {
         setError(e.message || "Ошибка запуска");
      }
   };

   return (
      <div className={s.page}>
         <div className={s.header}><h2 className={s.title}>Проценты</h2></div>

         <div className={p.grid}>
            <div className={p.card}>
               <h3 className={p.cardTitle}>Кэшбэк</h3>
               {cashback ? (
                  <div className={p.form}>
                     <div className={p.row}>
                        <div className={p.label}>Включён</div>
                        <input className={p.toggle} type="checkbox" checked={!!cashback.enabled} onChange={e => setCashback({ ...cashback, enabled: e.target.checked })} />
                     </div>
                     <div className={p.row}>
                        <div className={p.label}>Процент</div>
                        <div className={p.inputWrap}>
                           <input className={p.input} type="number" min={0} step={0.01} value={cashback.percent} onChange={e => setCashback({ ...cashback, percent: e.target.value })} />
                           <span className={p.suffix}>%</span>
                        </div>
                     </div>
                     <div className={p.actions}>
                        <button className={root.btnPrimary} onClick={saveCashback}>Сохранить</button>
                        <button className={root.btn} style={{ marginLeft: 8 }} onClick={runCashback}>
                           Тест кэшбэк
                        </button>
                     </div>

                  </div>
               ) : (
                  <div className={p.hint}>Нет настроек</div>
               )}
            </div>

            <div className={p.card}>
               <h3 className={p.cardTitle}>Реферальные уровни</h3>
               {loading ? (
                  <div>Загрузка…</div>
               ) : (
                  <div className={p.levels}>
                     {items.map(row => (
                        <div key={row.id} className={p.levelRow}>
                           <div className={p.levelBadge}>L{row.level}</div>
                           <div className={p.inputWrap}>
                              <input className={p.input} type="number" min={0} step={0.01} value={row.percent}
                                 onChange={e => setPercent(row.id, e.target.value)} />
                              <span className={p.suffix}>%</span>
                           </div>
                           <button className={root.btnPrimary} disabled={saving} onClick={() => saveRow(row)}>Сохранить</button>
                        </div>
                     ))}
                  </div>
               )}
               <div className={p.notice}>
                  {error && <div className={p.err}>{error}</div>}
                  {ok && <div className={p.ok}>{ok}</div>}
               </div>
            </div>
         </div>
      </div>
   );
}


