import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

function CreateModal({ open, onClose, onCreated }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState({
    code: "",
    promo_type: "multi",
    amount_usd: "0.00",
    max_activations: 1,
    is_active: true,
    starts_at: "",
    ends_at: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true); setError("");
    try {
      const body = {
        code: form.code.trim(),
        promo_type: form.promo_type,
        amount_usd: Number(form.amount_usd || 0).toFixed(2),
        max_activations: Number(form.max_activations || 1),
        is_active: !!form.is_active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      const res = await authFetch("/api/admin/promocodes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Ошибка сохранения");
      onCreated && onCreated();
      onClose();
    } catch (e) {
      setError(e.message || "Ошибка сохранения");
    } finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div className={s.modal}>
      <div className={s.modalContent} style={{ minWidth: 420 }}>
        <div className={s.modalHeader}>
          <h3>Создать промокод</h3>
          <button onClick={onClose}>×</button>
        </div>
        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
        <div className={s.formCompact}>
          <div className={s.field}>
            <label>Код</label>
            <input value={form.code} onChange={e=>onChange("code", e.target.value)} />
          </div>
          <div className={s.cols2}>
            <div className={s.field}>
              <label>Тип</label>
              <select value={form.promo_type} onChange={e=>onChange("promo_type", e.target.value)}>
                <option value="multi">Многоразовый</option>
                <option value="single">Одноразовый</option>
              </select>
            </div>
            <div className={s.field}>
              <label>Номинал, $</label>
              <input type="number" step="0.01" value={form.amount_usd} onChange={e=>onChange("amount_usd", e.target.value)} />
            </div>
          </div>
          <div className={s.cols2}>
            <div className={s.field}>
              <label>Макс. активаций</label>
              <input type="number" value={form.max_activations} onChange={e=>onChange("max_activations", e.target.value)} />
            </div>
            <div className={s.field}>
              <label>Активен</label>
              <select value={form.is_active ? "1" : "0"} onChange={e=>onChange("is_active", e.target.value === "1")}> 
                <option value="1">Да</option>
                <option value="0">Нет</option>
              </select>
            </div>
          </div>
          <div className={s.cols2}>
            <div className={s.field}>
              <label>Начало (опц.)</label>
              <input type="datetime-local" value={form.starts_at} onChange={e=>onChange("starts_at", e.target.value)} />
            </div>
            <div className={s.field}>
              <label>Окончание (опц.)</label>
              <input type="datetime-local" value={form.ends_at} onChange={e=>onChange("ends_at", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={root.btn} onClick={onClose} disabled={saving}>Отмена</button>
            <button className={root.btnPrimary} onClick={submit} disabled={saving}>Создать</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromocodesPage() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const fetchAll = async () => {
    setLoading(true); setError("");
    try {
      const [r1, r2] = await Promise.all([
        authFetch("/api/admin/promocodes/"),
        authFetch("/api/admin/promocode-activations/")
      ]);
      const d1 = await r1.json();
      const d2 = await r2.json();
      setItems(Array.isArray(d1) ? d1 : (d1?.results || []));
      setActs(Array.isArray(d2) ? d2 : (d2?.results || []));
    } catch (e) {
      setError("Ошибка загрузки данных");
    } finally { setLoading(false); }
  };

  useEffect(() => { let m = true; fetchAll(); return () => { m = false; }; }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(it => `${it.code}`.toLowerCase().includes(s));
  }, [q, items]);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h2 className={s.title}>Промокоды</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input className={s.searchInput} placeholder="Поиск по коду" value={q} onChange={e=>setQ(e.target.value)} />
          <button className={root.btnPrimary} onClick={() => setOpen(true)}>Создать промокод</button>
        </div>
      </div>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      <div className={s.grid1}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Список промокодов</h3>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Код</th>
                  <th>Тип</th>
                  <th>Номинал, $</th>
                  <th>Лимит</th>
                  <th>Остаток</th>
                  <th>Активен</th>
                  <th>Дата</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.code}</td>
                    <td><span className={s.badge}>{p.promo_type === "single" ? "Одноразовый" : "Многоразовый"}</span></td>
                    <td>{Number(p.amount_usd).toFixed(2)}</td>
                    <td>{p.max_activations}</td>
                    <td>{p.remaining_activations}</td>
                    <td>{p.is_active ? "Да" : "Нет"}</td>
                    <td>{(p.starts_at ? new Date(p.starts_at).toLocaleString() : "—") + " — " + (p.ends_at ? new Date(p.ends_at).toLocaleString() : "—")}</td>
                    <td>
                      <Link className={root.btn} to={`/promocodes/${p.id}`}>Редактировать</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>История активаций</h3>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Код</th>
                  <th>Пользователь</th>
                  <th>Сумма, $</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {acts.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.promocode?.code}</td>
                    <td>{a.user?.email || a.user?.username || a.user?.id}</td>
                    <td>{Number(a.amount_usd).toFixed(2)}</td>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateModal open={open} onClose={()=>setOpen(false)} onCreated={fetchAll} />
    </div>
  );
}


