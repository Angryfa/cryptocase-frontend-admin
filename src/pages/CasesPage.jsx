import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

function PrizeRow({ idx, value, onChange, onRemove }) {
	return (
		<div className={s.formRow}>
			<div className={s.field}>
				<label>Название приза</label>
				<input value={value.title} onChange={e=>onChange(idx, { ...value, title: e.target.value })} />
			</div>
			<div className={s.field}>
				<label>Сумма, $</label>
				<input type="number" value={value.amount_usd} onChange={e=>onChange(idx, { ...value, amount_usd: e.target.value })} />
			</div>
			<div className={s.field}>
				<label>Вес</label>
				<input type="number" value={value.weight} onChange={e=>onChange(idx, { ...value, weight: e.target.value })} />
			</div>
			<div className={s.field}>
				<label>&nbsp;</label>
				<button type="button" className={root.btn} onClick={()=>onRemove(idx)}>Удалить</button>
			</div>
		</div>
	);
}

export default function CasesPage() {
	const { authFetch } = useAuth();
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [types, setTypes] = useState([]);

	const [error, setError] = useState("");

	useEffect(() => {
		let mounted = true;
		(async () => {
			const [resCases, resTypes] = await Promise.all([
				authFetch("/api/cases/?all=1"),
				authFetch("/api/cases/types/")
			]);
			const dataCases = await resCases.json();
			const dataTypes = await resTypes.json();
			if (mounted) { setItems(dataCases); setTypes(dataTypes); setLoading(false); }
		})();
		return () => { mounted = false; };
	}, [authFetch]);

	// создание вынесено на отдельную страницу

	if (loading) return <div>Загрузка...</div>;

	return (
		<div className={s.page}>
			
			<div className={s.header}>
				<h2 className={s.title}>Кейсы</h2>
				<Link className={root.btnPrimary} to="/cases/create">Создать кейс</Link>
			</div>

			<div className={s.card}>
				<h3 style={{ marginTop: 0 }}>Список кейсов</h3>
				<div className={s.tableWrap}>
					<table className={s.table}>
						<thead>
							<tr>
								<th>ID</th>
								<th>Имя</th>
								<th>Цена</th>
								<th>Тип</th>
								<th>Активен</th>
								<th>Круток</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{items.map(c => (
								<tr key={c.id}>
									<td>{c.id}</td>
									<td>{c.name}</td>
									<td>{c.price_usd}</td>
									<td>{c.type?.name}</td>
									<td>{String(c.is_active)}</td>
									<td>{c.spins_used}/{c.spins_total}</td>
									<td><Link className={root.btn} to={`/cases/${c.id}`}>Редактировать</Link></td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
