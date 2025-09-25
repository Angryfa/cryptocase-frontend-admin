import { useState, useMemo } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Sidebar.module.css";
import root from "../assets/styles/Root.module.css";

export default function LayoutSidebar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const nick = useMemo(()=> user?.email || user?.username || "Админ", [user]);
  return (
    <div className={s.layout}>
      {open && <div className={s.backdrop} onClick={()=>setOpen(false)} />}
      <aside className={`${s.sidebar} ${open ? s.sidebarOpen : ""}`}>
        <div className={s.sideCol}>
          <Link to="/" className={s.brand}>CRYPTO<b>CASES</b></Link>
          <nav className={s.nav} onClick={()=>setOpen(false)}>
            <NavLink to="/users" className={({isActive})=> isActive ? `${s.link} ${s.linkActive}` : s.link}>
              <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg>
              Пользователи
            </NavLink>
            <NavLink to="/cases" className={({isActive})=> isActive ? `${s.link} ${s.linkActive}` : s.link}>
              <svg className={s.icon} viewBox="0 0 24 24"><path d="M3 7h18v12H3zM8 3h8l2 4H6z"/></svg>
              Кейсы
            </NavLink>
            <NavLink to="/case-types" className={({isActive})=> isActive ? `${s.link} ${s.linkActive}` : s.link}>
              <svg className={s.icon} viewBox="0 0 24 24"><path d="M4 4h16v12H5l-1 4z"/></svg>
              Виды кейсов
            </NavLink>
            <NavLink to="/ref-levels" className={({isActive})=> isActive ? `${s.link} ${s.linkActive}` : s.link}>
              <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 3l8 4v6c0 4.4-3.6 8-8 8s-8-3.6-8-8V7l8-4z"/></svg>
              Проценты
            </NavLink>
            <NavLink to="/tickets" className={({isActive})=> isActive ? `${s.link} ${s.linkActive}` : s.link}>
              <svg className={s.icon} viewBox="0 0 24 24"><path d="M4 4h16v12H5l-1 4z"/></svg>
              Тикеты
            </NavLink>
          </nav>
          <div className={s.sideFooter}>
            <p>© {new Date().getFullYear()} CRYPTOCASE</p>
          </div>
        </div>
      </aside>
      <main className={s.content}>
        <div className={s.userbar}>
          <Link to="/users" className={s.userLeft}>
            <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg>
            {nick}
          </Link>
          <div className={s.userRight}>
            {isAuthenticated ? (
              <button className={root.btn} onClick={logout}>Выйти</button>
            ) : (
              <Link className={root.btnPrimary} to="/login">Войти</Link>
            )}
          </div>
        </div>
        <div className={s.inner}><Outlet /></div>
      </main>
    </div>
  );
}

