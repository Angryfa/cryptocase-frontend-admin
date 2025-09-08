import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

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
		<div style={{ maxWidth: 360, margin: "40px auto" }}>
			<h2>Админ вход</h2>
			<form onSubmit={onSubmit}>
				<input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
				<input placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
				<button type="submit">Войти</button>
				{error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
			</form>
		</div>
	);
}
