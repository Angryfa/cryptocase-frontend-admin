import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

export default function PromocodeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await authFetch(`/api/admin/promocodes/${id}/`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Ошибка загрузки");
      setForm({
        code: data.code || "",
        promo_type: data.promo_type || "multi",
        amount_usd: Number(data.amount_usd || 0).toFixed(2),
        max_activations: data.max_activations ?? 1,
        is_active: !!data.is_active,
        starts_at: data.starts_at ? new Date(data.starts_at).toISOString().slice(0,16) : "",
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString().slice(0,16) : "",
      });
    } catch (e) {
      setError(e.message || "Ошибка загрузки");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
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
      const res = await authFetch(`/api/admin/promocodes/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Ошибка сохранения");
      navigate("/promocodes");
    } catch (e) { setError(e.message || "Ошибка сохранения"); }
    finally { setSaving(false); }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h2 className={s.title}>Редактирование промокода</h2>
      </div>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      <div className={`${s.card} ${s.cardNarrow}`}>
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
            <button className={root.btn} onClick={() => navigate("/promocodes")}>Назад</button>
            <button className={root.btnPrimary} onClick={save} disabled={saving}>Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  );
}


