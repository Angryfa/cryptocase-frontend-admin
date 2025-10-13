import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

export default function NewUsersPage() {
   const { authFetch } = useAuth();
   const [searchParams] = useSearchParams();
   const [loading, setLoading] = useState(false);
   const [preset, setPreset] = useState("7d");
   const [from, setFrom] = useState("");
   const [to, setTo] = useState("");
   const [data, setData] = useState(null);
   const [error, setError] = useState("");

   // Инициализация фильтров из URL параметров и загрузка данных
   useEffect(() => {
      const urlPreset = searchParams.get('preset');
      const urlFrom = searchParams.get('from');
      const urlTo = searchParams.get('to');

      // Устанавливаем фильтры
      if (urlPreset) {
         setPreset(urlPreset);
      }

      if (urlFrom || urlTo) {
         setPreset('custom');
         if (urlFrom) {
            setFrom(new Date(urlFrom).toISOString().slice(0, 16));
         }
         if (urlTo) {
            setTo(new Date(urlTo).toISOString().slice(0, 16));
         }
      }

      // Сразу загружаем данные с параметрами из URL
      async function loadWithUrlParams() {
         setLoading(true);
         setError("");
         try {
            const queryParams = new URLSearchParams();
            if (urlFrom || urlTo) {
               if (urlFrom) queryParams.set("from", urlFrom);
               if (urlTo) queryParams.set("to", urlTo);
            } else if (urlPreset) {
               queryParams.set("preset", urlPreset);
            } else {
               queryParams.set("preset", "7d"); // значение по умолчанию
            }

            const res = await authFetch(`/api/admin/dashboard/?${queryParams.toString()}`);
            if (!res.ok) {
               const err = await res.json().catch(() => ({}));
               throw new Error(err?.detail || "Ошибка загрузки данных");
            }
            const j = await res.json();
            setData(j);
         } catch (e) {
            setError(e.message || "Ошибка");
         } finally {
            setLoading(false);
         }
      }

      loadWithUrlParams();
   }, [searchParams, authFetch]);

   const query = new URLSearchParams();
   if (preset === "custom" && (from || to)) {
      if (from) query.set("from", new Date(from).toISOString());
      if (to) query.set("to", new Date(to).toISOString());
   } else {
      query.set("preset", preset);
   }

   async function load() {
      setLoading(true);
      setError("");
      try {
         const res = await authFetch(`/api/admin/dashboard/?${query.toString()}`);
         if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.detail || "Ошибка загрузки данных");
         }
         const j = await res.json();
         setData(j);
      } catch (e) {
         setError(e.message || "Ошибка");
      } finally {
         setLoading(false);
      }
   }

   const k = data?.kpis || {};
   const newUsersList = data?.new_users_list || [];

   return (
      <div className={root.container}>
         <div className={s.header}>
            <h2 className={s.title}>Новые пользователи</h2>
         </div>

         {/* KPI */}
         <div className={s.grid2} style={{ marginBottom: 16, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className={s.card}>
               <div className={s.kpiTitle}>Новые пользователи</div>
               <div className={s.kpiValue}>{fmt(k.new_users, 0)}</div>
               <div className={s.kpiSub}>за выбранный период</div>
            </div>
            <div className={s.card}>
               <div className={s.kpiTitle}>Из них от рефералов</div>
               <div className={s.kpiValue}>{fmt(k.new_users_from_referrals, 0)}</div>
               <div className={s.kpiSub}>за выбранный период</div>
            </div>
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

         {/* Таблица новых пользователей */}
         <div className={s.card}>
            <div className={s.cardTitle}>Список новых пользователей</div>
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Дата регистрации</th>
                        <th>Баланс, $</th>
                        <th>Реферал</th>
                     </tr>
                  </thead>
                  <tbody>
                     {newUsersList.length > 0 ? (
                        newUsersList.map(u => (
                           <tr key={u.id}>
                              <td>{u.id}</td>
                              <td><Link to={`/users/${u.id}`} style={{ color: '#007bff', textDecoration: 'none' }}>{u.email}</Link></td>
                              <td>{u.username}</td>
                              <td>{new Date(u.date_joined).toLocaleString('ru-RU')}</td>
                              <td>{fmt(u.profile__balance_usd)}</td>
                              <td>{u.referral__referred_by_id ? 'Да' : 'Нет'}</td>
                           </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={6} style={{ textAlign: 'center' }}>
                              Новых пользователей нет на данный период
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
}
