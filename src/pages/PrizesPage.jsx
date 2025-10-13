import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

export default function PrizesPage() {
   const { authFetch } = useAuth();
   const [items, setItems] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await authFetch("/api/cases/prizes/");
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setItems(Array.isArray(data) ? data : []);
            setLoading(false);
          }
        } else {
          if (mounted) {
            setError("Ошибка загрузки призов");
            setItems([]);
            setLoading(false);
          }
        }
      } catch (e) {
        if (mounted) {
          setError("Ошибка загрузки призов");
          setItems([]);
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [authFetch]);

   if (loading) return <div>Загрузка...</div>;

   return (
      <div className={s.page}>
         <div className={s.header}>
            <h2 className={s.title}>Призы</h2>
            <Link className={root.btnPrimary} to="/prizes/create">Создать приз</Link>
         </div>

         {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

         <div className={s.card}>
            <h3 style={{ marginTop: 0 }}>Список призов</h3>
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Изображение</th>
                        <th>Активен</th>
                        <th>Создан</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     {items.map(prize => (
                        <tr key={prize.id}>
                           <td>{prize.id}</td>
                           <td>{prize.name}</td>
                           <td>
                              {prize.image_url ? (
                                 <img
                                    src={prize.image_url}
                                    alt={prize.name}
                                    width="40"
                                    height="40"
                                    style={{ objectFit: "cover", borderRadius: 4 }}
                                 />
                              ) : (
                                 "—"
                              )}
                           </td>
                           <td>{String(prize.is_active)}</td>
                           <td>{new Date(prize.created_at).toLocaleDateString()}</td>
                           <td>
                              <Link className={root.btn} to={`/prizes/${prize.id}`}>
                                 Редактировать
                              </Link>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
}
