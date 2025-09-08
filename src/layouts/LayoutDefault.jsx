import Header from "../components/Header";
import { Outlet } from "react-router-dom";
import root from "../assets/styles/Root.module.css";

export default function LayoutDefault() {
   return (
      <div className={root.app}>
         <Header />
         <main className={`${root.main} ${root.container}`}>
            <Outlet />
         </main>
      </div>
   );
}
