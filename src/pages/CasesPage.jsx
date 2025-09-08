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

	// форма
	const [name, setName] = useState("");
	const [price, setPrice] = useState(0);
	const [typeId, setTypeId] = useState("");
	const [availableFrom, setAvailableFrom] = useState("");
	const [availableTo, setAvailableTo] = useState("");
	const [spinsTotal, setSpinsTotal] = useState(0);
	const [prizes, setPrizes] = useState([]);
	const [error, setError] = useState("");
	const [ok, setOk] = useState("");

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

	const addPrize = () => setPrizes(p => [...p, { title: "", amount_usd: 0, weight: 1 }]);
	const setPrize = (idx, v) => setPrizes(p => p.map((x,i)=> i===idx? v : x));
	const removePrize = (idx) => setPrizes(p => p.filter((_,i)=> i!==idx));

	const onSubmit = async (e) => {
		e.preventDefault();
		setError(""); setOk("");
		try {
			const toIsoOrNull = (v) => v ? new Date(v).toISOString() : null;
			const payload = {
				name,
				price_usd: Number(price),
				is_active: true,
				type_id: Number(typeId),
				available_from: toIsoOrNull(availableFrom),
				available_to: toIsoOrNull(availableTo),
				spins_total: Number(spinsTotal),
				prizes: prizes.map(p => ({ title: p.title, amount_usd: Number(p.amount_usd), weight: Number(p.weight||1) })),
			};
			const res = await authFetch("/api/admin/cases/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const err = await res.json().catch(()=>({detail:"Ошибка"}));
				throw new Error(err.detail || JSON.stringify(err));
			}
			const created = await res.json();
			setItems(i => [created, ...i]);
			setOk("Кейс создан");
			setName(""); setPrice(0); setTypeId(""); setAvailableFrom(""); setAvailableTo(""); setSpinsTotal(0); setPrizes([]);
		} catch (err) { setError(err.message || "Ошибка"); }
	};

	if (loading) return <div>Загрузка...</div>;

	return (
		<div className={s.page}>
			<div className={s.header}><h2 className={s.title}>Кейсы</h2></div>
			<div className={`${s.card} ${s.cardNarrow}`}>
				<h3 style={{ marginTop: 0 }}>Создать кейс</h3>
				<form onSubmit={onSubmit} className={s.formCompact}>
					<div className={s.cols2}>
						<div className={s.field}><label>Название</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
						<div className={s.field}><label>Цена, $</label><input type="number" value={price} onChange={e=>setPrice(e.target.value)} /></div>
						<div className={s.field}><label>Тип кейса</label>
							<select value={typeId} onChange={e=>setTypeId(e.target.value)}>
								<option value="">Выберите тип</option>
								{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
							</select>
						</div>
						<div className={s.field}><label>Открыт с</label><input type="datetime-local" value={availableFrom} onChange={e=>setAvailableFrom(e.target.value)} /></div>
						<div className={s.field}><label>Открыт до</label><input type="datetime-local" value={availableTo} onChange={e=>setAvailableTo(e.target.value)} /></div>
						<div className={s.field}><label>Лимит круток</label><input type="number" value={spinsTotal} onChange={e=>setSpinsTotal(e.target.value)} /></div>
					</div>
					<div className={s.field}>
						<label>Призы</label>
						{prizes.map((p,idx)=> (
							<PrizeRow key={idx} idx={idx} value={p} onChange={setPrize} onRemove={removePrize} />
						))}
						<button type="button" className={root.btn} onClick={addPrize}>Добавить приз</button>
					</div>
					<div className={s.actions}>
						<button type="submit" className={root.btnPrimary}>Создать</button>
						{error && <div style={{ color: "red" }}>{error}</div>}
						{ok && <div style={{ color: "green" }}>{ok}</div>}
					</div>
				</form>
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
