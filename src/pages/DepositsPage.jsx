import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import root from "../assets/styles/Root.module.css";
import s from "../assets/styles/Admin.module.css";

const PRESETS = [
   { value: "today", label: "Сегодня" },
   { value: "yesterday", label: "Вчера" },
   { value: "7d", label: "7 дней" },
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

function getStatusColor(code) {
   if (code === "approved" || code === "done" || code === "completed" || code === "paid" || code === "success") {
      return "#4CAF50"; // зеленый
   }
   if (code === "rejected" || code === "cancelled") {
      return "#f44336"; // красный
   }
   if (code === "pending") {
      return "#FF9800"; // оранжевый
   }
   return "#999"; // серый по умолчанию
}

export default function DepositsPage() {
   const { authFetch } = useAuth();
   const [searchParams] = useSearchParams();

   // Инициализация preset из URL параметра
   const initialPreset = searchParams.get("preset") || "7d";

   const [loading, setLoading] = useState(false);
   const [preset, setPreset] = useState(initialPreset);
   const [from, setFrom] = useState("");
   const [to, setTo] = useState("");
   const [deposits, setDeposits] = useState([]);
   const [total, setTotal] = useState(0);
   const [page, setPage] = useState(1);
   const [pageSize] = useState(50);
   const [data, setData] = useState(null);
   const [error, setError] = useState("");

   // Построение query параметров
   const query = useMemo(() => {
      if (preset === "custom" && (from || to)) {
         const params = new URLSearchParams();
         if (from) params.set("from", new Date(from).toISOString());
         if (to) params.set("to", new Date(to).toISOString());
         params.set("page", page);
         params.set("page_size", pageSize);
         return params.toString();
      }
      const params = new URLSearchParams();
      params.set("preset", preset);
      params.set("page", page);
      params.set("page_size", pageSize);
      return params.toString();
   }, [preset, from, to, page, pageSize]);

   async function loadDeposits() {
      setLoading(true);
      setError("");
      try {
         const res = await authFetch(`/api/admin/deposits/?${query}`);
         if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.detail || "Ошибка загрузки депозитов");
         }
         const j = await res.json();
         setData(j);
         setDeposits(j.deposits || []);
         setTotal(j.total || 0);
      } catch (e) {
         setError(e.message || "Ошибка");
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      loadDeposits();
      // eslint-disable-next-line
   }, [query]);

   const totalPages = Math.ceil(total / pageSize);

   return (
      <div className={root.container}>
         <div className={s.header}>
            <h2 className={s.title}>Депозиты</h2>
         </div>

         {/* Фильтр периода */}
         <div className={s.card} style={{ marginBottom: 16 }}>
            <div className={s.formRow} style={{ gap: 12, alignItems: "end", flexWrap: "wrap" }}>
               <div className={s.field}>
                  <label>Период</label>
                  <select value={preset} onChange={(e) => { setPreset(e.target.value); setPage(1); }}>
                     {PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
               </div>
               {preset === "custom" && (
                  <>
                     <div className={s.field}>
                        <label>С</label>
                        <input
                           type="datetime-local"
                           value={from}
                           onChange={(e) => setFrom(e.target.value)}
                        />
                     </div>
                     <div className={s.field}>
                        <label>По</label>
                        <input
                           type="datetime-local"
                           value={to}
                           onChange={(e) => setTo(e.target.value)}
                        />
                     </div>
                  </>
               )}
               <button className={root.btn} type="button" onClick={loadDeposits} disabled={loading}>
                  {loading ? "Загрузка..." : "Обновить"}
               </button>
               {error && <span style={{ color: "red" }}>{error}</span>}
            </div>
            {data?.period && (
               <div className={s.hint} style={{ marginTop: 12 }}>
                  Период: {new Date(data.period.from).toLocaleString("ru-RU")} — {new Date(data.period.to).toLocaleString("ru-RU")}
               </div>
            )}
         </div>

         {/* Итоговая информация */}
         <div className={s.card} style={{ marginBottom: 16 }}>
            <div className={s.kpiTitle}>Всего депозитов</div>
            <div className={s.kpiValue}>{total}</div>
            <div className={s.kpiSub}>за выбранный период</div>
         </div>

         {/* Таблица депозитов */}
         <div className={s.card}>
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr>
                        <th>ID</th>
                        <th>Пользователь</th>
                        <th>Email</th>
                        <th>Сумма ($)</th>
                        <th>Метод</th>
                        <th>Статус</th>
                        <th>Дата создания</th>
                        <th>Дата обработки</th>
                     </tr>
                  </thead>
                  <tbody>
                     {deposits.length > 0 ? deposits.map((dep) => (
                        <tr key={dep.id}>
                           <td>#{dep.id}</td>
                           <td>
                              <div>{dep.user.username || `ID:${dep.user.id}`}</div>
                           </td>
                           <td>
                              <div style={{ fontSize: '0.9em', color: '#888' }}>
                                 {dep.user.email}
                              </div>
                           </td>
                           <td style={{ fontWeight: 'bold' }}>
                              ${fmt(dep.amount_usd)}
                           </td>
                           <td>{dep.method || "—"}</td>
                           <td>
                              <span style={{
                                 color: getStatusColor(dep.status.code),
                                 fontWeight: 'bold'
                              }}>
                                 {dep.status.name}
                              </span>
                           </td>
                           <td>{new Date(dep.created_at).toLocaleString("ru-RU")}</td>
                           <td>
                              {dep.processed_at
                                 ? new Date(dep.processed_at).toLocaleString("ru-RU")
                                 : "—"
                              }
                           </td>
                        </tr>
                     )) : (
                        <tr>
                           <td colSpan={8} style={{ textAlign: "center" }}>
                              {loading ? "Загрузка..." : "Нет депозитов за выбранный период"}
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
               <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <button
                     className={root.btn}
                     disabled={page <= 1}
                     onClick={() => setPage(page - 1)}
                  >
                     Назад
                  </button>
                  <span>
                     Страница {page} из {totalPages} ({total} депозитов)
                  </span>
                  <button
                     className={root.btn}
                     disabled={page >= totalPages}
                     onClick={() => setPage(page + 1)}
                  >
                     Вперед
                  </button>
               </div>
            )}
         </div>
      </div>
   );
}