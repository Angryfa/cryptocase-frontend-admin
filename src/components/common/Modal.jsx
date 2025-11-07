import React from "react";
import styles from "../../assets/styles/Modal.module.css";

export default function Modal({ open, onClose, title, children }) {
   if (!open) return null;
   return (
      <div className={styles.backdrop} onClick={onClose}>
         <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
               <h4>{title}</h4>
               <button className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>
            </div>
            <div className={styles.body}>{children}</div>
         </div>
      </div>
   );
}

