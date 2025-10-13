import { useState, useMemo } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Sidebar.module.css";
import root from "../assets/styles/Root.module.css";

export default function LayoutSidebar() {
   const [open, setOpen] = useState(false);
   const { isAuthenticated, user, logout } = useAuth();
   const nick = useMemo(() => user?.email || user?.username || "Админ", [user]);
   return (
      <div className={s.layout}>
         {open && <div className={s.backdrop} onClick={() => setOpen(false)} />}
         <aside className={`${s.sidebar} ${open ? s.sidebarOpen : ""}`}>
            <div className={s.sideCol}>
               <Link to="/" className={s.brand}>CRYPTO<b>CASES</b></Link>
               <nav className={s.nav} onClick={() => setOpen(false)}>
                  <NavLink
                     to="/"
                     end
                     className={({ isActive }) => (isActive ? `${s.link} ${s.linkActive}` : s.link)}
                  >
                     <svg className={s.icon} viewBox="0 0 24 24">
                        <path d="M4 13h4v7H4v-7zm6-6h4v13h-4V7zm6 3h4v10h-4V10zM3 3h18v2H3V3z" />
                     </svg>
                     Статистика
                  </NavLink>
                  <NavLink to="/users" className={({ isActive }) => isActive ? `${s.link} ${s.linkActive}` : s.link}>
                     <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" /></svg>
                     Пользователи
                  </NavLink>
                  <NavLink to="/cases" className={({ isActive }) => isActive ? `${s.link} ${s.linkActive}` : s.link}>
                     <svg className={s.icon} viewBox="0 0 24 24"><path d="M3 7h18v12H3zM8 3h8l2 4H6z" /></svg>
                     Кейсы
                  </NavLink>
                  <NavLink to="/prizes" className={({ isActive }) => isActive ? `${s.link} ${s.linkActive}` : s.link}>
                     <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                     Призы
                  </NavLink>
                  <NavLink to="/case-types" className={({ isActive }) => isActive ? `${s.link} ${s.linkActive}` : s.link}>
                     <svg className={s.icon} viewBox="0 0 24 24"><path d="M4 4h16v12H5l-1 4z" /></svg>
                     Виды кейсов
                  </NavLink>
                  <NavLink to="/ref-levels" className={({ isActive }) => isActive ? `${s.link} ${s.linkActive}` : s.link}>
                     <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 3l8 4v6c0 4.4-3.6 8-8 8s-8-3.6-8-8V7l8-4z" /></svg>
                     Проценты
                  </NavLink>
                  <NavLink to="/tickets" className={({ isActive }) => isActive ? `${s.link} ${s.linkActive}` : s.link}>
                     <svg className={s.icon} viewBox="0 0 24 24"><path d="M4 4h16v12H5l-1 4z" /></svg>
                     Тикеты
                  </NavLink>
                  <NavLink to="/deposits" className={({ isActive }) => isActive ? `${s.link} ${s.linkActive}` : s.link}>
                     <svg className={s.icon} viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                     </svg>
                     Депозиты
                  </NavLink>
                  <NavLink to="/withdrawals" className={({ isActive }) => isActive ? `${s.link} ${s.linkActive}` : s.link}>
                     <svg className={s.icon} viewBox="0 0 24 24">
                        <path d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z" />
                     </svg>
                     Выводы
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
                  <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" /></svg>
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

