import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

export default function CaseTypesPage() {
	const { authFetch } = useAuth();
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);

	const [error, setError] = useState("");

	useEffect(() => {
		let mounted = true;
		(async () => {
			const res = await authFetch("/api/admin/case-types/");
			const data = await res.json();
			if (mounted) { setItems(data); setLoading(false); }
		})();
		return () => { mounted = false; };
	}, [authFetch]);

	// создание вынесено на отдельную страницу

	if (loading) return <div>Загрузка...</div>;

	return (
		<div className={s.page}>
			<div className={s.header}>
				<h2 className={s.title}>Типы кейсов</h2>
				<Link className={root.btnPrimary} to="/case-types/create">Создать тип</Link>
			</div>

			<div className={s.card}>
				<h3 style={{ marginTop: 0 }}>Список типов</h3>
				{error && <div style={{ color: "red" }}>{error}</div>}
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
