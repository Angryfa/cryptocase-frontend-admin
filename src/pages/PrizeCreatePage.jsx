import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

export default function PrizeCreatePage() {
   const { authFetch } = useAuth();
   const nav = useNavigate();
   const [name, setName] = useState("");
   const [imageFile, setImageFile] = useState(null);
   const [imagePreview, setImagePreview] = useState("");
   const [isActive, setIsActive] = useState(true);
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
   const objectUrlRef = useRef(null);

   const onImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
         // Очищаем предыдущий URL
         if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
         }

         setImageFile(file);
         const url = URL.createObjectURL(file);
         objectUrlRef.current = url;
         setImagePreview(url);
      }
   };

   const clearImage = () => {
      if (objectUrlRef.current) {
         URL.revokeObjectURL(objectUrlRef.current);
         objectUrlRef.current = null;
      }
      setImageFile(null);
      setImagePreview("");
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
         const formData = new FormData();
         formData.append("name", name);
         formData.append("is_active", isActive);
         if (imageFile) {
            formData.append("image", imageFile);
         }

         const res = await authFetch("/api/cases/prizes/", {
            method: "POST",
            body: formData,
         });

         if (res.ok) {
            nav("/prizes");
         } else {
            const data = await res.json();
            setError(data.detail || "Ошибка создания приза");
         }
      } catch (e) {
         setError("Ошибка создания приза");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className={s.page}>
         <div className={s.header}>
            <h2 className={s.title}>Создать приз</h2>
            <Link className={root.btn} to="/prizes">← Назад к списку</Link>
         </div>

         <div className={s.card}>
            <form onSubmit={handleSubmit}>
               <div className={s.field}>
                  <label>Название приза *</label>
                  <input
                     type="text"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     required
                     placeholder="Например: Bitcoin, USDT, Ethereum"
                  />
               </div>

               <div className={s.field}>
                  <label>Изображение приза</label>
                  <input
                     type="file"
                     accept="image/*"
                     onChange={onImageChange}
                  />
                  {imagePreview && (
                     <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                        <img
                           src={imagePreview}
                           alt="preview"
                           width={72}
                           height={72}
                           style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e5e5e5" }}
                        />
                        <button type="button" className={root.btn} onClick={clearImage}>
                           Удалить файл
                        </button>
                     </div>
                  )}
                  <div className={s.hint}>Поддерживаются изображения до 5 МБ.</div>
               </div>

               <div className={s.field}>
                  <label>
                     <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                     />
                     {" "}Активен
                  </label>
                  <div className={s.hint}>Неактивные призы не будут доступны для выбора в кейсах</div>
               </div>

               <div className={s.actions}>
                  <button type="submit" className={root.btnPrimary} disabled={loading}>
                     {loading ? "Создаем..." : "Создать приз"}
                  </button>
                  {error && <div style={{ color: "red" }}>{error}</div>}
               </div>
            </form>
         </div>
      </div>
   );
}
