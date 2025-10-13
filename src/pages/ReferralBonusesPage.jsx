import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import root from "../assets/styles/Root.module.css";
import s from "../assets/styles/Admin.module.css";

function fmt(n, digits = 2) {
   if (n == null) return "—";
   const num = typeof n === "string" ? Number(n) : n;
   if (Number.isNaN(num)) return "—";
   return num.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default function ReferralBonusesPage() {
   const { authFetch } = useAuth();
   const [loading, setLoading] = useState(false);
   const [page, setPage] = useState(1);
   const [data, setData] = useState(null);
   const [error, setError] = useState("");

   async function load() {
      setLoading(true);
      setError("");
      try {
         // Всегда запрашиваем данные за последние 24 часа
         const now = new Date();
         const from = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 часа назад

         const params = new URLSearchParams();
         params.set("from", from.toISOString());
         params.set("to", now.toISOString());
         params.set("page", page);
         params.set("page_size", 50);

         const res = await authFetch(`/api/admin/referral-bonuses/?${params.toString()}`);
         if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.detail || "Ошибка загрузки");
         }
         const j = await res.json();
         setData(j);
      } catch (e) {
         setError(e.message || "Ошибка");
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      load();
      // eslint-disable-next-line
   }, [page]);

   const items = data?.items || [];
   const pagination = data?.pagination || {};

   return (
      <div className={root.container}>
         <div className={s.header}>
            <h2 className={s.title}>Реферальные отчисления за последние 24 часа</h2>
            <button className={root.btn} type="button" onClick={load} disabled={loading}>
               {loading ? "Загрузка..." : "Обновить"}
            </button>
         </div>

         {error && (
            <div className={s.card} style={{ marginBottom: 16, backgroundColor: '#fee', color: 'red' }}>
               {error}
            </div>
         )}

         {/* Итоговая сумма */}
         <div className={s.card} style={{ marginBottom: 16 }}>
            <div className={s.kpiTitle}>Общая сумма отчислений за 24 часа</div>
            <div className={s.kpiValue}>${fmt(data?.total_sum_usd)}</div>
            {data?.period && (
               <div className={s.kpiSub}>
                  {new Date(data.period.from).toLocaleString("ru-RU")} — {new Date(data.period.to).toLocaleString("ru-RU")}
               </div>
            )}
         </div>

         {/* Таблица */}
         <div className={s.card}>
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr>
                        <th>ID</th>
                        <th>Дата/Время</th>
                        <th>Реферер (получил)</th>
                        <th>Реферал (пополнил)</th>
                        <th>Депозит ID</th>
                        <th>Сумма депозита</th>
                        <th>Уровень</th>
                        <th>Процент</th>
                        <th>Отчисление (USDT)</th>
                     </tr>
                  </thead>
                  <tbody>
                     {items.length > 0 ? items.map((item) => (
                        <tr key={item.id}>
                           <td>{item.id}</td>
                           <td>{new Date(item.created_at).toLocaleString("ru-RU")}</td>
                           <td>
                              <div>{item.referrer.username || `ID:${item.referrer.id}`}</div>
                              <div style={{ fontSize: '0.85em', color: '#888' }}>{item.referrer.email}</div>
                           </td>
                           <td>
                              <div>{item.referral.username || `ID:${item.referral.id}`}</div>
                              <div style={{ fontSize: '0.85em', color: '#888' }}>{item.referral.email}</div>
                           </td>
                           <td>#{item.deposit.id}</td>
                           <td>${fmt(item.deposit.amount_usd)}</td>
                           <td>L{item.level}</td>
                           <td>{fmt(item.percent)}%</td>
                           <td style={{ fontWeight: 'bold', color: '#000' }}>
                              ${fmt(item.amount_usd)}
                           </td>
                        </tr>
                     )) : (
                        <tr>
                           <td colSpan={9} style={{ textAlign: "center" }}>
                              {loading ? "Загрузка..." : "Нет реферальных отчислений за последние 24 часа"}
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Пагинация */}
            {pagination.total_pages > 1 && (
               <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <button
                     className={root.btn}
                     disabled={page <= 1}
                     onClick={() => setPage(page - 1)}
                  >
                     Назад
                  </button>
                  <span>
                     Страница {pagination.page} из {pagination.total_pages}
                     ({pagination.total_count} записей)
                  </span>
                  <button
                     className={root.btn}
                     disabled={page >= pagination.total_pages}
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