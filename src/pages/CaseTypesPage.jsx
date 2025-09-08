import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

export default function CaseTypesPage() {
	const { authFetch } = useAuth();
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);

	const [type, setType] = useState("");
	const [name, setName] = useState("");
	const [isLimited, setIsLimited] = useState(false);
	const [isTimed, setIsTimed] = useState(false);
	const [sortOrder, setSortOrder] = useState(100);
	const [isActive, setIsActive] = useState(true);
	const [error, setError] = useState("");
	const [ok, setOk] = useState("");

	useEffect(() => {
		let mounted = true;
		(async () => {
			const res = await authFetch("/api/admin/case-types/");
			const data = await res.json();
			if (mounted) { setItems(data); setLoading(false); }
		})();
		return () => { mounted = false; };
	}, [authFetch]);

	const onSubmit = async (e) => {
		e.preventDefault(); setError(""); setOk("");
		try {
			const payload = { type, name, is_limited: !!isLimited, is_timed: !!isTimed, sort_order: Number(sortOrder), is_active: !!isActive };
			const res = await authFetch("/api/admin/case-types/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
			if (!res.ok) { const err = await res.json().catch(()=>({detail:"Ошибка"})); throw new Error(err.detail || JSON.stringify(err)); }
			const created = await res.json();
			setItems(list => [created, ...list]);
			setOk("Тип создан");
			setType(""); setName(""); setIsLimited(false); setIsTimed(false); setSortOrder(100); setIsActive(true);
		} catch (err) { setError(err.message || "Ошибка"); }
	};

	if (loading) return <div>Загрузка...</div>;

	return (
		<div className={s.page}>
			<div className={s.header}><h2 className={s.title}>Типы кейсов</h2></div>
			<div className={`${s.card} ${s.cardNarrow}`}>
				<h3 style={{ marginTop: 0 }}>Создать тип</h3>
				<form onSubmit={onSubmit} className={s.formCompact}>
					<div className={s.cols2}>
						<div className={s.field}><label>Системный код (slug)</label><input value={type} onChange={e=>setType(e.target.value)} placeholder="standard / limited / timed" /></div>
						<div className={s.field}><label>Имя</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Обычный / Лимитированный / По времени" /></div>
						<div className={s.field}><label>Сортировка</label><input type="number" value={sortOrder} onChange={e=>setSortOrder(e.target.value)} /></div>
						<div className={s.field}><label>Опции</label>
							<label><input type="checkbox" checked={isLimited} onChange={e=>setIsLimited(e.target.checked)} /> Лимитный</label>
							<label><input type="checkbox" checked={isTimed} onChange={e=>setIsTimed(e.target.checked)} /> По времени</label>
							<label><input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} /> Активен</label>
						</div>
					</div>
					<div className={s.actions}>
						<button type="submit" className={root.btnPrimary}>Создать</button>
						{error && <div style={{ color: "red" }}>{error}</div>}
						{ok && <div style={{ color: "green" }}>{ok}</div>}
					</div>
				</form>
			</div>

			<div className={s.card}>
				<h3 style={{ marginTop: 0 }}>Список типов</h3>
				<div className={s.tableWrap}>
					<table className={s.table}>
						<thead>
							<tr>
								<th>ID</th>
								<th>type</th>
								<th>name</th>
								<th>limited</th>
								<th>timed</th>
								<th>active</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{items.map(t => (
								<tr key={t.id}>
									<td>{t.id}</td>
									<td>{t.type}</td>
									<td>{t.name}</td>
									<td>{String(t.is_limited)}</td>
									<td>{String(t.is_timed)}</td>
									<td>{String(t.is_active)}</td>
									<td><Link className={root.btn} to={`/case-types/${t.id}`}>Редактировать</Link></td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
