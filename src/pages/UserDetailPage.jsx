import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";
import u from "../assets/styles/UserDetail.module.css";

export default function UserDetailPage() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fmt2 = (v) => Number(v ?? 0).toFixed(2);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await authFetch(`/api/admin/users/${id}/details/`);
      const json = res.ok ? await res.json() : null;
      if (mounted) { setData(json); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [authFetch, id]);

  if (loading || !data) return <div className={s.page}><div className={s.card}>Загрузка…</div></div>;

  const u = data.user;
  const profile = u.profile || {};
  const r = data.referrals || {};

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h2 className={s.title}>Пользователь #{u.id} — {u.username || u.email}</h2>
        <Link className={root.btn} to="/users">Назад</Link>
      </div>

      <div className={s.card}>
        <h3 style={{marginTop:0}}>Финансы</h3>
        <div className={u.finRow}>
          <div className={u.finCard}><div className={u.finLabel}>Баланс, $</div><div className={u.finValue}>{fmt2(profile.balance_usd)}</div></div>
          <div className={u.finCard}><div className={u.finLabel}>Депозит, $</div><div className={u.finValue}>{fmt2(profile.deposit_total_usd)}</div></div>
          <div className={u.finCard}><div className={u.finLabel}>Выиграл, $</div><div className={u.finValue}>{fmt2(profile.won_total_usd)}</div></div>
          <div className={u.finCard}><div className={u.finLabel}>Проиграл, $</div><div className={u.finValue}>{fmt2(profile.lost_total_usd)}</div></div>
        </div>
      </div>

      <div className={s.card}>
        <h3 style={{marginTop:0}}>Рефералы</h3>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th colSpan={5}>Уровень 1 (процент: {r.level1_percent ?? 0}%)</th></tr>
              <tr><th>ID</th><th>Email</th><th>Username</th><th>Пригласил</th><th>Процент</th></tr>
            </thead>
            <tbody>
              {(r.level1||[]).map(x=> (
                <tr key={`l1-${x.id}`}>
                  <td>{x.id}</td><td>{x.email}</td><td>{x.username}</td><td>-</td><td>{x.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th colSpan={5}>Уровень 2 (процент: {r.level2_percent ?? 0}%)</th></tr>
              <tr><th>ID</th><th>Email</th><th>Username</th><th>Пригласил</th><th>Процент</th></tr>
            </thead>
            <tbody>
              {(r.level2||[]).map(x=> (
                <tr key={`l2-${x.id}`}>
                  <td>{x.id}</td><td>{x.email}</td><td>{x.username}</td>
                  <td>{x.referred_by ? (x.referred_by.username || x.referred_by.email) : '-'}</td>
                  <td>{x.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={s.card}>
        <h3 style={{marginTop:0}}>История круток</h3>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>ID</th><th>Когда</th><th>Кейс</th><th>Приз</th><th>Сумма, $</th></tr>
            </thead>
            <tbody>
              {(data.spins||[]).map(sp => (
                <tr key={sp.id}>
                  <td>{sp.id}</td>
                  <td>{new Date(sp.created_at).toLocaleString('ru-RU')}</td>
                  <td>{sp.case?.name}</td>
                  <td>{sp.prize?.title}</td>
                  <td>{fmt2(sp.prize?.amount_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


