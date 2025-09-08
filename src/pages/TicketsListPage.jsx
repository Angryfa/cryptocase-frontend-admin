import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

export default function TicketsListPage() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await authFetch(`/api/support/tickets/`);
    const data = res.ok ? await res.json() : [];
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const fmt = (s) => ({ open: "Открыт", answered: "Отвечен", closed: "Закрыт" }[s] || s);

  return (
    <div className={s.page}>
      <div className={s.header}><h2 className={s.title}>Тикеты</h2></div>
      <div className={s.card}>
        {loading ? <div>Загрузка...</div> : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr><th>ID</th><th>Пользователь</th><th>Тема</th><th>Статус</th><th>Создан</th><th></th></tr>
              </thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td title={t.user?.email || ""}>{t.user?.username || t.user?.email || t.user?.id}</td>
                    <td>{t.subject}</td>
                    <td>{fmt(t.status)}</td>
                    <td>{new Date(t.created_at).toLocaleString("ru-RU")}</td>
                    <td><Link className={root.btn} to={`/tickets/${t.id}`}>Открыть</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


