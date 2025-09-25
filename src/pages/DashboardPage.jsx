import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import root from "../assets/styles/Root.module.css";
import s from "../assets/styles/Admin.module.css";

const PRESETS = [
   { value: "today", label: "Сегодня" },
   { value: "yesterday", label: "Вчера" },
   { value: "7d", label: "7 дней" },
   { value: "30d", label: "30 дней" },
   { value: "this_month", label: "Текущий месяц" },
   { value: "prev_month", label: "Прошлый месяц" },
   { value: "custom", label: "Период..." },
];

function fmt(n, digits = 2) {
   if (n == null) return "—";
   const num = typeof n === "string" ? Number(n) : n;
   if (Number.isNaN(num)) return "—";
   return num.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default function DashboardPage() {
   const { authFetch } = useAuth();
   const [loading, setLoading] = useState(false);
   const [preset, setPreset] = useState("7d");
   const [from, setFrom] = useState("");   // ISO `YYYY-MM-DDTHH:mm`
   const [to, setTo] = useState("");
   const [data, setData] = useState(null);
   const [error, setError] = useState("");

   const query = useMemo(() => {
      if (preset === "custom" && (from || to)) {
         const params = new URLSearchParams();
         if (from) params.set("from", new Date(from).toISOString());
         if (to) params.set("to", new Date(to).toISOString());
         return params.toString();
      }
      const params = new URLSearchParams();
      params.set("preset", preset);
      return params.toString();
   }, [preset, from, to]);

   async function load() {
      setLoading(true);
      setError("");
      try {
         const res = await authFetch(`/api/admin/dashboard/?${query}`);
         if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.detail || "Ошибка загрузки дашборда");
         }
         const j = await res.json();
         setData(j);
      } catch (e) {
         setError(e.message || "Ошибка");
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => { load(); /* eslint-disable-next-line */ }, [query]);

   const k = data?.kpis || {};
   const depositsSum = k.deposits_sum_usd ?? null;
   const winsSum = k.wins_usd ?? null;
   const lossesSum = k.losses_usd ?? null;

   const spinsByType = data?.spins_by_type || [];
   const topBySpins = data?.top_users?.by_spins || [];
   const topByProfit = data?.top_users?.by_user_profit || [];

   return (
      <div className={root.container}>
         <div className={s.header}>
            <h2 className={s.title}>Дашборд</h2>
         </div>

         {/* Фильтры периода */}
         <div className={s.card} style={{ marginBottom: 16 }}>
            <div className={s.formRow} style={{ gap: 12, alignItems: "end", flexWrap: "wrap" }}>
               <div className={s.field}>
                  <label>Период</label>
                  <select value={preset} onChange={(e) => setPreset(e.target.value)}>
                     {PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
               </div>
               {preset === "custom" && (
                  <>
                     <div className={s.field}>
                        <label>С</label>
                        <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
                     </div>
                     <div className={s.field}>
                        <label>По</label>
                        <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
                     </div>
                  </>
               )}
               <button className={root.btn} type="button" onClick={load} disabled={loading}>
                  Обновить
               </button>
               {loading && <span>Загрузка…</span>}
               {error && <span style={{ color: "red" }}>{error}</span>}
               {data?.period && (
                  <div className={s.hint}>
                     Период: {new Date(data.period.from).toLocaleString("ru-RU")} — {new Date(data.period.to).toLocaleString("ru-RU")}
                  </div>
               )}
            </div>
         </div>

         {/* KPI */}
         <div className={s.grid3} style={{ marginBottom: 16 }}>
            <div className={s.card}>
               <div className={s.kpiTitle}>Прибыль</div>
               <div className={s.kpiValue}>${fmt(k.profit_usd)}</div>
               <div className={s.kpiSub}>
                  Депозиты: ${fmt(depositsSum)} · Выигрыши: ${fmt(winsSum)} · Проигрыши: ${fmt(lossesSum)}
               </div>
            </div>
            <div className={s.card}>
               <div className={s.kpiTitle}>Прокруток (всего)</div>
               <div className={s.kpiValue}>{fmt(k.spins_count, 0)}</div>
               <div className={s.kpiSub}>по выбранному периоду</div>
            </div>
            <div className={s.card}>
               <div className={s.kpiTitle}>Новые пользователи</div>
               <div className={s.kpiValue}>{fmt(k.new_users, 0)}</div>
               <div className={s.kpiSub}>Из них от рефералов: {fmt(k.new_users_from_referrals, 0)}</div>
            </div>
         </div>

         {/* Депозиты / Выводы */}
         <div className={s.grid2} style={{ marginBottom: 16 }}>
            <div className={s.card}>
               <div className={s.cardTitle}>Депозиты</div>
               <div className={s.kpiValue}>${fmt(k.deposits?.sum_completed_usd)}</div>
               <div className={s.kpiSub}>Всего заявок: ${fmt(k.deposits?.sum_all_usd)}</div>
            </div>
            <div className={s.card}>
               <div className={s.cardTitle}>Выводы</div>
               <div className={s.kpiValue}>${fmt(k.withdrawals?.sum_completed_usd)}</div>
               <div className={s.kpiSub}>Всего заявок: ${fmt(k.withdrawals?.sum_all_usd)}</div>
            </div>
         </div>

         {/* Спин-активность по типам */}
         <div className={s.card} style={{ marginBottom: 16 }}>
            <div className={s.cardTitle}>Прокрутки по типам кейсов</div>
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr>
                        <th>ID типа</th>
                        <th>Type</th>
                        <th>Название</th>
                        <th>Прокруток</th>
                     </tr>
                  </thead>
                  <tbody>
                     {spinsByType.length ? spinsByType.map((r, i) => (
                        <tr key={i}>
                           <td>{r.type_id}</td>
                           <td>{r.type}</td>
                           <td>{r.name}</td>
                           <td>{fmt(r.spins, 0)}</td>
                        </tr>
                     )) : (
                        <tr><td colSpan={4} style={{ textAlign: "center" }}>Нет данных</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Топы пользователей */}
         <div className={s.grid2}>
            <div className={s.card}>
               <div className={s.cardTitle}>Топ по прокруткам</div>
               <div className={s.tableWrap}>
                  <table className={s.table}>
                     <thead>
                        <tr>
                           <th>User</th>
                           <th>Email</th>
                           <th>Прокруток</th>
                        </tr>
                     </thead>
                     <tbody>
                        {topBySpins.length ? topBySpins.map((u, i) => (
                           <tr key={i}>
                              <td>{u.username || u.user_id}</td>
                              <td>{u.email || "—"}</td>
                              <td>{fmt(u.spins, 0)}</td>
                           </tr>
                        )) : (
                           <tr><td colSpan={3} style={{ textAlign: "center" }}>Нет данных</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className={s.card}>
               <div className={s.cardTitle}>Топ по прибыли пользователя</div>
               <div className={s.tableWrap}>
                  <table className={s.table}>
                     <thead>
                        <tr>
                           <th>User</th>
                           <th>Email</th>
                           <th>Прибыль пользователя, $</th>
                        </tr>
                     </thead>
                     <tbody>
                        {topByProfit.length ? topByProfit.map((u, i) => (
                           <tr key={i}>
                              <td>{u.username || u.user_id}</td>
                              <td>{u.email || "—"}</td>
                              <td>{fmt(u.user_profit_usd)}</td>
                           </tr>
                        )) : (
                           <tr><td colSpan={3} style={{ textAlign: "center" }}>Нет данных</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

      </div>
   );
}
