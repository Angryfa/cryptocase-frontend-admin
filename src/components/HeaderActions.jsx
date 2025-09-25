import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import root from "../assets/styles/Root.module.css";
import s from "../assets/styles/HeaderActions.module.css";

export default function HeaderActions() {
   const { isAuthenticated, user, logout } = useAuth();
   const navigate = useNavigate();

   const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

   return (
      <nav className={s.wrap}>
         <Link to="/" className={root.btn}>Статистика</Link>
         <Link to="/users" className={root.btn}>Пользователи</Link>
         <Link to="/cases" className={root.btn}>Кейсы</Link>
         <Link to="/case-types" className={root.btn}>Типы кейсов</Link>
         <Link to="/ref-levels" className={root.btn}>Проценты</Link>
         <Link to="/tickets" className={root.btn}>Тикеты</Link>
         {!isAuthenticated ? (
            <Link to="/login" className={root.btnPrimary}>Войти</Link>
         ) : (
            <>
               <span className={s.nick}>{user?.email || user?.username}</span>
               <button className={root.btn} onClick={handleLogout}>Выйти</button>
            </>
         )}
      </nav>
   );
}
