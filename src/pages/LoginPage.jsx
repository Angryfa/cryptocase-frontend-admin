import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import s from "../assets/styles/Auth.module.css";
import root from "../assets/styles/Root.module.css";

export default function LoginPage() {
	const { login } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const nav = useNavigate();
	const loc = useLocation();

	const onSubmit = async (e) => {
		e.preventDefault();
		setError("");
		try {
			await login(email, password);
			nav(loc.state?.from?.pathname || "/", { replace: true });
		} catch (err) { setError(err.message || "Ошибка"); }
	};

	return (
		<div className={s.root}>
			<div className={s.card}>
				<h2 className={s.title}>Вход в админку</h2>
				<form className={s.form} onSubmit={onSubmit}>
					<div className={s.field}>
						<label>Email</label>
						<input className={s.input} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
					</div>
					<div className={s.field}>
						<label>Пароль</label>
						<input className={s.input} placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
					</div>
					<div className={s.actions}>
						<button className={root.btnPrimary} type="submit">Войти</button>
						{error && <div className={s.error}>{error}</div>}
					</div>
				</form>
			</div>
		</div>
	);
}
