import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";

function PrizeRow({ idx, value, onChange, onRemove, availablePrizes }) {
   return (
      <div className={s.formRow}>
         <div className={s.field}>
            <label>Приз</label>
            <select
               value={value.prize_id || ""}
               onChange={e => {
                  const selectedPrize = availablePrizes.find(p => p.id == e.target.value);
                  onChange(idx, {
                     ...value,
                     prize_id: e.target.value,
                     prize_name: selectedPrize?.name || ""
                  });
               }}
            >
               <option value="">Выберите приз</option>
               {availablePrizes.map(prize => (
                  <option key={prize.id} value={prize.id}>
                     {prize.name}
                  </option>
               ))}
            </select>
         </div>
         <div className={s.field}>
            <label>Мин. сумма, $</label>
            <input
               type="number"
               step="0.01"
               value={value.amount_min_usd}
               onChange={e => onChange(idx, { ...value, amount_min_usd: e.target.value })}
            />
         </div>
         <div className={s.field}>
            <label>Макс. сумма, $</label>
            <input
               type="number"
               step="0.01"
               value={value.amount_max_usd}
               onChange={e => onChange(idx, { ...value, amount_max_usd: e.target.value })}
            />
         </div>
         <div className={s.field}>
            <label>Вес (вероятность)</label>
            <input
               type="number"
               value={value.weight}
               onChange={e => onChange(idx, { ...value, weight: e.target.value })}
            />
         </div>
         <div className={s.field}>
            <label>&nbsp;</label>
            <button type="button" className={root.btn} onClick={() => onRemove(idx)}>Удалить</button>
         </div>
      </div>
   );
}

export default function CaseCreatePage() {
   const { authFetch } = useAuth();
   const nav = useNavigate();
   const [types, setTypes] = useState([]);
   const [availablePrizes, setAvailablePrizes] = useState([]);
   const [name, setName] = useState("");
   const [price, setPrice] = useState(0);
   const [typeId, setTypeId] = useState("");
   const [availableFrom, setAvailableFrom] = useState("");
   const [availableTo, setAvailableTo] = useState("");
   const [spinsTotal, setSpinsTotal] = useState(0);
   const [prizes, setPrizes] = useState([]);
   const [error, setError] = useState("");

   // NEW: avatar file + preview
   const [avatarFile, setAvatarFile] = useState(null);
   const [avatarPreview, setAvatarPreview] = useState("");
   const objectUrlRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [resTypes, resPrizes] = await Promise.all([
          authFetch("/api/cases/types/"),
          authFetch("/api/cases/prizes/")
        ]);
        const dataTypes = await resTypes.json();
        const dataPrizes = await resPrizes.json();
        if (mounted) { 
          setTypes(Array.isArray(dataTypes) ? dataTypes : []);
          setAvailablePrizes(Array.isArray(dataPrizes) ? dataPrizes.filter(p => p.is_active) : []);
        }
      } catch (e) {
        if (mounted) {
          setError("Ошибка загрузки данных");
          setTypes([]);
          setAvailablePrizes([]);
        }
      }
    })();
    return () => { mounted = false; };
  }, [authFetch]);

   useEffect(() => {
      // cleanup ObjectURL при смене файла/размонтировании
      return () => {
         if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      };
   }, []);

   const onAvatarChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) {
         setAvatarFile(null);
         setAvatarPreview("");
         return;
      }
      // базовая валидация
      const isImage = file.type.startsWith("image/");
      const maxSizeMB = 5; // лимит 5 МБ
      if (!isImage) {
         setError("Разрешены только файлы-изображения");
         e.target.value = "";
         return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
         setError(`Размер изображения не должен превышать ${maxSizeMB} МБ`);
         e.target.value = "";
         return;
      }
      setError("");
      setAvatarFile(file);
      // предпросмотр
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setAvatarPreview(url);
   };

   const clearAvatar = () => {
      setAvatarFile(null);
      setAvatarPreview("");
   };

   const addPrize = () => setPrizes(p => [...p, { prize_id: "", amount_min_usd: 0.01, amount_max_usd: 1.00, weight: 1 }]);
   const setPrize = (idx, v) => setPrizes(p => p.map((x, i) => i === idx ? v : x));
   const removePrize = (idx) => setPrizes(p => p.filter((_, i) => i !== idx));

   const onSubmit = async (e) => {
      e.preventDefault(); setError("");
      try {
         const toIsoOrNull = (v) => v ? new Date(v).toISOString() : "";

         // Собираем multipart/form-data
         const fd = new FormData();
         fd.append("name", String(name));
         fd.append("price_usd", String(Number(price)));
         fd.append("is_active", "true");
         fd.append("type_id", String(Number(typeId)));
         if (availableFrom) fd.append("available_from", toIsoOrNull(availableFrom));
         if (availableTo) fd.append("available_to", toIsoOrNull(availableTo));
         if (spinsTotal) fd.append("spins_total", String(Number(spinsTotal)));

         // Важно: prizes как JSON-строка (сервер должен это принять)
         fd.append("prizes", JSON.stringify(
            prizes.map(p => ({
               prize_id: Number(p.prize_id),
               amount_min_usd: Number(p.amount_min_usd),
               amount_max_usd: Number(p.amount_max_usd),
               weight: Number(p.weight || 1),
            }))
         ));

         // Файл (опционально)
         if (avatarFile) {
            fd.append("avatar", avatarFile, avatarFile.name);
         }

         const res = await authFetch("/api/admin/cases/", {
            method: "POST",
            // НЕ указывать Content-Type вручную — браузер проставит boundary
            body: fd
         });

         if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Ошибка" }));
            throw new Error(err.detail || JSON.stringify(err));
         }
         nav("/cases", { replace: true });
      } catch (err) {
         setError(err.message || "Ошибка");
      }
   };

   return (
      <div className={s.page}>
         <div className={s.header}>
            <h2 className={s.title}>Создать кейс</h2>
            <Link className={root.btn} to="/cases">Назад</Link>
         </div>

         <div className={`${s.card} ${s.cardNarrow}`}>
            <form onSubmit={onSubmit} className={s.formCompact}>
               <div className={s.cols2}>
                  <div className={s.field}>
                     <label>Название</label>
                     <input value={name} onChange={e => setName(e.target.value)} required />
                  </div>

                  <div className={s.field}>
                     <label>Цена, $</label>
                     <input type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                  </div>

                  <div className={s.field}>
                     <label>Тип кейса</label>
                     <select value={typeId} onChange={e => setTypeId(e.target.value)} required>
                        <option value="">Выберите тип</option>
                        {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  </div>

                  <div className={s.field}>
                     <label>Открыт с</label>
                     <input type="datetime-local" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} />
                  </div>

                  <div className={s.field}>
                     <label>Открыт до</label>
                     <input type="datetime-local" value={availableTo} onChange={e => setAvailableTo(e.target.value)} />
                  </div>

                  <div className={s.field}>
                     <label>Лимит круток</label>
                     <input type="number" value={spinsTotal} onChange={e => setSpinsTotal(e.target.value)} />
                  </div>

                  {/* NEW: аватар */}
                  <div className={s.field}>
                     <label>Аватар кейса</label>
                     <input
                        type="file"
                        accept="image/*"
                        onChange={onAvatarChange}
                     />
                     {avatarPreview && (
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                           <img
                              src={avatarPreview}
                              alt="preview"
                              width={72}
                              height={72}
                              style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e5e5e5" }}
                           />
                           <button type="button" className={root.btn} onClick={clearAvatar}>
                              Удалить файл
                           </button>
                        </div>
                     )}
                     <div className={s.hint}>Поддерживаются изображения до 5 МБ.</div>
                  </div>
               </div>

               <div className={s.field}>
                  <label>Призы</label>
                  {prizes.map((p, idx) => (
                     <PrizeRow
                        key={idx}
                        idx={idx}
                        value={p}
                        onChange={setPrize}
                        onRemove={removePrize}
                        availablePrizes={availablePrizes}
                     />
                  ))}
                  <button type="button" className={root.btn} onClick={addPrize}>Добавить приз</button>
               </div>

               <div className={s.actions}>
                  <button type="submit" className={root.btnPrimary}>Создать</button>
                  {error && <div style={{ color: "red" }}>{error}</div>}
               </div>
            </form>
         </div>
      </div>
   );
}
