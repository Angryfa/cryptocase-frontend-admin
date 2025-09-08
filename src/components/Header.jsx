import { Link } from "react-router-dom";
import root from "../assets/styles/Root.module.css";
import styles from "../assets/styles/Header.module.css";
import HeaderActions from "./HeaderActions";

export default function Header() {
   return (
      <header className={styles.header}>
         <div className={`${root.container} ${styles.bar}`}>
            <Link to="/" className={styles.logo}>CRYPTOCASE — Admin</Link>
            <HeaderActions />
         </div>
      </header>
   );
}
