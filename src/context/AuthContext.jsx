import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const AuthContext = createContext(null);

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
const EP_ME = "/api/auth/me/";
const EP_LOGIN = "/api/auth/login/";
const EP_REFRESH = "/api/auth/refresh/";

const LS_ACCESS = "admin_accessToken";
const LS_REFRESH = "admin_refreshToken";

function decodeJwt(token) {
	try {
		const [, payload] = token.split(".");
		return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
	} catch { return null; }
}

export function AuthProvider({ children }) {
	const [accessToken, setAccessToken] = useState(() => localStorage.getItem(LS_ACCESS));
	const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(LS_REFRESH));
	const [user, setUser] = useState(null);
	const [bootstrapping, setBootstrapping] = useState(() => !!localStorage.getItem(LS_ACCESS));
	const isAuthenticated = !!accessToken && !!user && (user.is_staff || user.is_superuser);
	const refreshTimer = useRef(null);

	const saveTokens = (access, refresh) => {
		if (access) { localStorage.setItem(LS_ACCESS, access); setAccessToken(access); }
		if (refresh) { localStorage.setItem(LS_REFRESH, refresh); setRefreshToken(refresh); }
	};

	const clearTokens = () => {
		localStorage.removeItem(LS_ACCESS);
		localStorage.removeItem(LS_REFRESH);
		setAccessToken(null);
		setRefreshToken(null);
	};

	const logout = () => {
		clearTokens();
		setUser(null);
		if (refreshTimer.current) clearTimeout(refreshTimer.current);
	};

	const scheduleRefresh = (token) => {
		if (refreshTimer.current) clearTimeout(refreshTimer.current);
		const data = decodeJwt(token);
		if (!data?.exp) return;
		const expiresAtMs = data.exp * 1000;
		const delay = Math.max(0, expiresAtMs - Date.now() - 30_000);
		refreshTimer.current = setTimeout(() => { silentRefresh(); }, delay);
	};

	const loadUser = async (token = accessToken) => {
		if (!token) return false;
		try {
			const res = await fetch(`${API_BASE}${EP_ME}`, { headers: { Authorization: `Bearer ${token}` } });
			if (!res.ok) throw new Error("auth fail");
			const data = await res.json();
			if (!data?.is_staff && !data?.is_superuser) throw new Error("not admin");
			setUser(data);
			return true;
		} catch {
			logout();
			return false;
		}
	};

	const login = async (email, password) => {
		const res = await fetch(`${API_BASE}${EP_LOGIN}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok || !data?.access) throw new Error(data?.detail || data?.error || "Ошибка входа");
		saveTokens(data.access, data.refresh);
		scheduleRefresh(data.access);
		await loadUser(data.access);
		return true;
	};

	const silentRefresh = async () => {
		if (!refreshToken) return logout();
		try {
			const res = await fetch(`${API_BASE}${EP_REFRESH}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refresh: refreshToken }),
			});
			if (!res.ok) throw new Error("refresh failed");
			const data = await res.json();
			if (!data?.access) throw new Error("no access");
			saveTokens(data.access, null);
			scheduleRefresh(data.access);
			return data.access;
		} catch { logout(); return null; }
	};

	useEffect(() => {
		if (accessToken) {
			setBootstrapping(true);
			scheduleRefresh(accessToken);
			loadUser(accessToken).finally(() => setBootstrapping(false));
		} else {
			setBootstrapping(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [accessToken]);

	const authFetch = async (url, init = {}, _retry = false) => {
		const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
		const headers = new Headers(init.headers || {});
		if (!isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
		if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
		const res = await fetch(`${API_BASE}${url}`, { ...init, headers });
		if (res.status !== 401 || _retry) return res;
		const newAccess = await silentRefresh();
		if (!newAccess) return res;
		const retryHeaders = new Headers(init.headers || {});
		if (!isFormData && !retryHeaders.has("Content-Type")) retryHeaders.set("Content-Type", "application/json");
		retryHeaders.set("Authorization", `Bearer ${newAccess}`);
		return fetch(`${API_BASE}${url}`, { ...init, headers: retryHeaders });
	};

	const value = useMemo(() => ({
		accessToken,
		refreshToken,
		isAuthenticated,
		bootstrapping,
		user,
		login,
		logout,
		authFetch,
		API_BASE,
	}), [accessToken, refreshToken, isAuthenticated, user, bootstrapping]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
