import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import root from "../assets/styles/Root.module.css";
import s from "../assets/styles/Admin.module.css";

export default function UsersPage() {
	const { authFetch } = useAuth();
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		(async () => {
			const res = await authFetch("/api/admin/users/");
			const data = await res.json();
			if (mounted) { setItems(data); setLoading(false); }
		})();
		return () => { mounted = false; };
	}, [authFetch]);

	const fmt = (v) => Number(v ?? 0).toFixed(2);

	const filtered = useMemo(() => items.filter(u => !u.is_staff && !u.is_superuser), [items]);

	return (
		<div className={s.page}>
			<div className={s.header}>
				<h2 className={s.title}>Пользователи</h2>
			</div>
			<div className={`${s.card} ${s.tableWrap}`}>
				{loading ? (
					<div>Загрузка...</div>
				) : (
					<table className={s.table}>
						<thead>
							<tr>
								<th>ID</th>
								<th>Email</th>
								<th>Username</th>
								<th>Баланс, $</th>
								<th>Депозит, $</th>
								<th>Выиграл, $</th>
								<th>Проиграл, $</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{filtered.map(u => (
								<tr key={u.id}>
									<td>{u.id}</td>
									<td>{u.email}</td>
									<td>{u.username}</td>
									<td>{fmt(u.profile?.balance_usd)}</td>
									<td>{fmt(u.profile?.deposit_total_usd)}</td>
									<td>{fmt(u.profile?.won_total_usd)}</td>
									<td>{fmt(u.profile?.lost_total_usd)}</td>
									<td><Link className={root.btn} to={`/users/${u.id}`}>Открыть</Link></td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
