import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

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
      if (!res.ok) { const err = await res.json().catch(()=>({detail:"Ошибка"})); throw new Error(err.detail || JSON.stringify(err)); }
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

  return (
    <div className={s.page}>
      <div className={s.header}><h2 className={s.title}>Проценты</h2></div>
      <div className={s.card}>
        <h3 style={{ marginTop: 0 }}>Кэшбэк</h3>
        {cashback ? (
          <div className={s.formCompact} style={{ maxWidth: 520 }}>
            <div className={s.field}><label>Включён</label>
              <input type="checkbox" checked={!!cashback.enabled} onChange={e=>setCashback({ ...cashback, enabled: e.target.checked })} />
            </div>
            <div className={s.field}><label>Процент, %</label>
              <input type="number" value={cashback.percent} onChange={e=>setCashback({ ...cashback, percent: e.target.value })} />
            </div>
            <div className={s.actions}><button className={root.btnPrimary} onClick={saveCashback}>Сохранить</button></div>
          </div>
        ) : (
          <div>Нет настроек</div>
        )}
      </div>
      <div className={s.card}>
        {loading ? (
          <div>Загрузка...</div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Уровень</th>
                  <th>Процент, %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(row => (
                  <tr key={row.id}>
                    <td>L{row.level}</td>
                    <td>
                      <input type="number" min={0} step={0.01} value={row.percent}
                             onChange={e=>setPercent(row.id, e.target.value)} />
                    </td>
                    <td>
                      <button className={root.btnPrimary} disabled={saving} onClick={()=>saveRow(row)}>Сохранить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className={s.actions}>
          {error && <div style={{ color: "red" }}>{error}</div>}
          {ok && <div style={{ color: "green" }}>{ok}</div>}
        </div>
      </div>
    </div>
  );
}


