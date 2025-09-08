import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({ children }) {
	const { isAuthenticated, bootstrapping } = useAuth();
	const loc = useLocation();
	if (bootstrapping) return null;
	if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: loc }} />;
	return children;
}
