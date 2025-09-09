import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

export default function CaseTypeCreatePage() {
  const { authFetch } = useAuth();
  const nav = useNavigate();
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [isLimited, setIsLimited] = useState(false);
  const [isTimed, setIsTimed] = useState(false);
  const [sortOrder, setSortOrder] = useState(100);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      const payload = { type, name, is_limited: !!isLimited, is_timed: !!isTimed, sort_order: Number(sortOrder), is_active: !!isActive };
      const res = await authFetch("/api/admin/case-types/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json().catch(()=>({detail:"Ошибка"})); throw new Error(err.detail || JSON.stringify(err)); }
      nav("/case-types", { replace: true });
    } catch (err) { setError(err.message || "Ошибка"); }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h2 className={s.title}>Новый тип кейса</h2>
        <Link className={root.btn} to="/case-types">Назад</Link>
      </div>
      <div className={`${s.card} ${s.cardNarrow}`}>
        <form onSubmit={onSubmit} className={`${s.formCompact}`}>
          <div className={s.cols2}>
            <div className={s.field}><label>Системный код (slug)</label><input value={type} onChange={e=>setType(e.target.value)} placeholder="standard / limited / timed" required /></div>
            <div className={s.field}><label>Имя</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Обычный / Лимитированный / По времени" required /></div>
            <div className={s.field}><label>Сортировка</label><input type="number" value={sortOrder} onChange={e=>setSortOrder(e.target.value)} /></div>
            <div className={s.field}><label>Опции</label>
              <label><input type="checkbox" checked={isLimited} onChange={e=>setIsLimited(e.target.checked)} /> Лимитный</label>
              <label><input type="checkbox" checked={isTimed} onChange={e=>setIsTimed(e.target.checked)} /> По времени</label>
              <label><input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} /> Активен</label>
            </div>
          </div>
          <div className={s.actions}>
            <button type="submit" className={root.btnPrimary}>Создать тип</button>
            {error && <div style={{ color: "red" }}>{error}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}


