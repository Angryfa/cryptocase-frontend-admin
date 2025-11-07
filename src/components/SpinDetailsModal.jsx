import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Modal from "./common/Modal";
import styles from "../assets/styles/SpinDetailsModal.module.css";
import root from "../assets/styles/Root.module.css";

function fmt2(n) { const v = Number(n ?? 0); return Number.isFinite(v) ? v.toFixed(2) : "0.00"; }
async function copy(text) { try { await navigator.clipboard.writeText(String(text)); } catch { } }

/**
 * Props:
 * - open: boolean
 * - spinId: number|null
 * - baseUrl: string  // например: "/api/cases/spins/"
 * - onClose: () => void
 */
export default function SpinDetailsModal({ open, spinId, baseUrl = "/api/cases/spins/", onClose }) {
   const { authFetch } = useAuth();

   const [details, setDetails] = useState(null);
   const [detailsLoading, setDetailsLoading] = useState(false);
   const [detailsError, setDetailsError] = useState("");
   const [verifying, setVerifying] = useState(false);
   const [verifyResult, setVerifyResult] = useState(null);
   const [extraSpinModal, setExtraSpinModal] = useState({ open: false, spinId: null, isBonusSpin: false });

   useEffect(() => {
      if (!open || !spinId) return;
      let alive = true;
      setDetails(null);
      setVerifyResult(null);
      setDetailsError("");
      setDetailsLoading(true);

      (async () => {
         try {
            // Определяем URL в зависимости от baseUrl (если baseUrl указывает на bonus-spins, это BonusSpin)
            const isBonusSpin = baseUrl.includes('bonus-spins');
            const url = isBonusSpin 
               ? `/api/cases/bonus-spins/${spinId}/`
               : `${baseUrl}${spinId}/`;
            const r = await authFetch(url, { headers: { Accept: "application/json" } });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const d = await r.json();
            if (alive) {
               // Добавляем флаг is_extra_open для BonusSpin
               if (isBonusSpin) {
                  d.is_extra_open = true;
                  d.parent_spin_id = d.parent_spin_id;
               }
               setDetails(d);
            }
         } catch (e) {
            if (alive) setDetailsError("Не удалось получить детали крутки.");
         } finally {
            if (alive) setDetailsLoading(false);
         }
      })();

      return () => { alive = false; };
   }, [open, spinId, baseUrl, authFetch, extraSpinModal.isBonusSpin]);

   const runVerify = async () => {
      if (!spinId) return;
      setVerifying(true);
      setVerifyResult(null);
      try {
         const r = await authFetch(`${baseUrl}${spinId}/verify/`, { headers: { Accept: "application/json" } });
         if (!r.ok) throw new Error(`HTTP ${r.status}`);
         const d = await r.json();
         setVerifyResult(d);
      } catch {
         setVerifyResult({ ok: false, error: "Не удалось выполнить проверку." });
      } finally {
         setVerifying(false);
      }
   };

   const handleOpenExtraSpinPF = async (bonusSpinId) => {
      // BonusSpin теперь в отдельной таблице, используем специальный endpoint
      setExtraSpinModal({ open: true, spinId: bonusSpinId, isBonusSpin: true });
   };
   const totalWeight = Array.isArray(details?.weights_snapshot)
      ? details.weights_snapshot.reduce((s, w) => s + (Number(w?.weight) || 0), 0)
      : 0;

   // Определяем заголовок модального окна
   // Дополнительное открытие определяется по наличию parent_spin_id или по флагу is_extra_open
   const isExtraOpen = details && (details.parent_spin_id || details.is_extra_open);
   const modalTitle = isExtraOpen
      ? `Дополнительное открытие #${spinId ?? ""}`
      : `Крутка #${spinId ?? ""}`;

   return (
      <>
      <Modal open={open} onClose={onClose} title={modalTitle}>
         {detailsLoading ? (
            <div className={styles.helper}>Загрузка деталей…</div>
         ) : detailsError ? (
            <div className={styles.error}>{detailsError}</div>
         ) : !details ? (
            <div className={styles.helper}>Нет данных.</div>
         ) : (
            <div className={styles.details}>
               <section>
                  <h5>Общее</h5>
                  <div className={styles.kv}><span>ID</span><div className={styles.valueRow}><span className={styles.badge}>#{details.id}</span></div></div>
                  <div className={styles.kv}><span>Дата</span><div className={styles.valueRow}>{new Date(details.created_at).toLocaleString("ru-RU")}</div></div>
                  <div className={styles.kv}><span>Кейс</span><div className={styles.valueRow}>{details.case_name ?? details.case?.name ?? `#${details.case}`}</div></div>
                  <div className={styles.kv}>
                     <span>Приз</span>
                     <div className={styles.valueRow}>
                        {details.case_prize?.id && (
                           <span className={styles.badge}>#{details.case_prize.id}</span>
                        )}
                        <span style={{ marginLeft: details.case_prize?.id ? '8px' : '0' }}>
                           {details.prize_title ?? details.prize?.title ?? "—"}
                        </span>
                     </div>
                  </div>
                  <div className={styles.kv}>
                     <span>Сумма, $</span>
                     <div className={styles.valueRow}>
                        {details.has_bonus && details.base_amount_usd ? (
                           <span className={styles.badge}>
                              {fmt2(details.base_amount_usd)} 
                              {details.bonus_type === "multiplier" && details.bonus_multiplier ? (
                                 ` (${fmt2(details.actual_amount_usd)} x${details.bonus_multiplier})`
                              ) : details.bonus_type === "extra_open" && details.bonus_spins ? (
                                 ` (${fmt2(details.actual_amount_usd)} + доп. открытие)`
                              ) : (
                                 ` (${fmt2(details.actual_amount_usd)})`
                              )}
                           </span>
                        ) : (
                           <span className={styles.badge}>{fmt2(details.actual_amount_usd ?? details.amount_usd ?? details.prize?.amount_usd)}</span>
                        )}
                     </div>
                  </div>
                  {details.has_bonus && (
                     <div className={styles.kv}>
                        <span>Бонус</span>
                        <div className={styles.valueRow}>
                           <span className={styles.badge} style={{ background: "#4CAF50", color: "white" }}>
                              {details.bonus_description || details.bonus_type_display || "Бонус"}
                           </span>
                        </div>
                     </div>
                  )}
                  {details.has_bonus && details.bonus_type === "extra_open" && (() => {
                     // Используем bonus_spins_list если доступен, иначе старое поле bonus_spins
                     const bonusSpinsData = details.bonus_spins_list || details.bonus_spins || [];
                     return Array.isArray(bonusSpinsData) && bonusSpinsData.length > 0 && (
                        <div className={styles.kv}>
                           <span>Доп. открытия</span>
                           <div className={styles.valueRow}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                                 {bonusSpinsData.map((spin, idx) => {
                                    const bonusSpinId = spin.bonus_spin_id || spin.spin_id || spin.spinId;
                                    return (
                                       <div 
                                          key={idx}
                                          style={{ 
                                             padding: "8px 12px", 
                                             border: "1px solid #e0e0e0", 
                                             borderRadius: 6,
                                             display: "flex",
                                             justifyContent: "space-between",
                                             alignItems: "center"
                                          }}
                                       >
                                          <div>
                                             <b>Доп. открытие #{idx + 1}:</b> +${fmt2(spin.amount)}
                                             {spin.nonce && (
                                                <span style={{ marginLeft: 8, fontSize: "0.85em", color: "#666" }}>
                                                   (Nonce: {spin.nonce})
                                                </span>
                                             )}
                                          </div>
                                          {bonusSpinId && (
                                             <button
                                                className={root.btn}
                                                style={{ fontSize: "0.9em", padding: "4px 12px" }}
                                                onClick={() => handleOpenExtraSpinPF(bonusSpinId)}
                                             >
                                                PF
                                             </button>
                                          )}
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>
                        </div>
                     );
                  })()}
               </section>

               <section>
                  <h5>Provably Fair</h5>
                  
                  {/* Показываем что это дополнительное открытие, если это так */}
                  {isExtraOpen && (
                     <div className={styles.kv}>
                        <span>Тип</span>
                        <div className={styles.valueRow}>
                           <span className={styles.badge} style={{ background: "#2196F3", color: "white" }}>
                              🔄 ДОПОЛНИТЕЛЬНОЕ ОТКРЫТИЕ
                           </span>
                        </div>
                     </div>
                  )}
                  
                  {details.has_bonus && details.base_amount_usd && (
                     <div className={styles.kv}>
                        <span>Начальный выигрыш</span>
                        <div className={styles.valueRow}>
                           <span className={styles.badge}>${fmt2(details.base_amount_usd)}</span>
                        </div>
                     </div>
                  )}
                  
                  {details.has_bonus && (
                     <div className={styles.kv}>
                        <span>Итоговый выигрыш</span>
                        <div className={styles.valueRow}>
                           <span className={styles.badge}>
                              ${fmt2(details.actual_amount_usd)}
                              {details.bonus_type === "multiplier" && details.bonus_multiplier && (
                                 ` (x${details.bonus_multiplier})`
                              )}
                              {details.bonus_type === "extra_open" && (
                                 ` (с бонусом)`
                              )}
                           </span>
                        </div>
                     </div>
                  )}

                  <div className={styles.kv}>
                     <span>Server Seed Hash</span>
                     <div className={styles.valueRow}>
                        <code className={`${styles.codeBox} ${styles.clip}`}>{details.server_seed_hash}</code>
                        <button className={styles.copyBtn} onClick={() => copy(details.server_seed_hash)}>Копировать</button>
                     </div>
                  </div>

                  <div className={styles.kv}>
                     <span>Server Seed</span>
                     <div className={styles.valueRow}>
                        {"server_seed" in details && details.server_seed ? (
                           <>
                              <code className={`${styles.codeBox} ${styles.clip}`}>{details.server_seed}</code>
                              <button className={styles.copyBtn} onClick={() => copy(details.server_seed)}>Копировать</button>
                           </>
                        ) : (
                           <div className={styles.note}>Скрыт до "ревила".</div>
                        )}
                     </div>
                  </div>

                  <div className={styles.kv}>
                     <span>Client Seed</span>
                     <div className={styles.valueRow}>
                        <code className={styles.codeBox}>{details.client_seed}</code>
                        <button className={styles.copyBtn} onClick={() => copy(details.client_seed)}>Копировать</button>
                     </div>
                  </div>

                  <div className={styles.kv}>
                     <span>Nonce</span>
                     <div className={styles.valueRow}><span className={styles.badge}>{details.nonce}</span></div>
                  </div>

                  <div className={styles.kv}>
                     <span>Roll Digest</span>
                     <div className={styles.valueRow}>
                        <code className={`${styles.codeBox} ${styles.clip}`}>{details.roll_digest}</code>
                        <button className={styles.copyBtn} onClick={() => copy(details.roll_digest)}>Копировать</button>
                     </div>
                  </div>

                  <div className={styles.kv}>
                     <span>RNG Value</span>
                     <div className={styles.valueRow}><code className={styles.codeBox}>{String(details.rng_value)}</code></div>
                  </div>

                  <button className={styles.primaryBtn} onClick={runVerify} disabled={verifying}>
                     {verifying ? "Проверяем…" : "Проверить честность"}
                  </button>

                  {verifyResult && (
                     <div className={`${styles.verifyBox} ${verifyResult.ok ? styles.ok : styles.bad}`}>
                        <div><strong>Проверка:</strong> {verifyResult.ok ? "ОК" : "НЕ СОВПАЛО"}</div>
                        {verifyResult.checks && (
                           <ul>
                              <li>ServerSeedHash: {String(verifyResult.checks.serverSeedHashMatches)}</li>
                              <li>RollDigest: {String(verifyResult.checks.rollDigestMatches)}</li>
                              <li>Приз совпал: {String(verifyResult.checks.prizeMatches)}</li>
                           </ul>
                        )}
                     </div>
                  )}
               </section>

               {Array.isArray(details.weights_snapshot) && details.weights_snapshot.length > 0 && (
                  <section>
                     <h5>Снимок весов</h5>
                     <div className={styles.weights}>
                        <table>
                           <thead>
                              <tr>
                                 <th>Prize ID</th>
                                 <th>Название приза</th>
                                 <th className={styles.num}>Вес</th>
                                 <th className={styles.num}>Сумма, $</th>
                                 <th className={styles.num}>Шанс, %</th>
                              </tr>
                           </thead>
                           <tbody>
                              {details.weights_snapshot.map((w, i) => (
                                 <tr key={i}>
                                    <td className={styles.code}>{w.prize_id}</td>
                                    <td>{w.prize_name || "—"}</td>
                                    <td className={styles.num}>{w.weight}</td>
                                    <td className={styles.num}>
                                       {w.amount_min_usd && w.amount_max_usd && w.amount_min_usd !== w.amount_max_usd
                                          ? `${fmt2(w.amount_min_usd)}-${fmt2(w.amount_max_usd)}`
                                          : fmt2(w.amount_usd || w.amount_min_usd)
                                       }
                                    </td>
                                    <td className={styles.num}>{totalWeight ? ((Number(w.weight) / totalWeight) * 100).toFixed(2) : "—"}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </section>
               )}
            </div>
         )}
      </Modal>
      
      {/* Модальное окно для дополнительного открытия */}
      {extraSpinModal.open && extraSpinModal.spinId && (
         <SpinDetailsModal
            open={extraSpinModal.open}
            onClose={() => setExtraSpinModal({ open: false, spinId: null, isBonusSpin: false })}
            spinId={extraSpinModal.spinId}
            baseUrl={extraSpinModal.isBonusSpin ? "/api/cases/bonus-spins/" : baseUrl}
         />
      )}
   </>
   );
}
