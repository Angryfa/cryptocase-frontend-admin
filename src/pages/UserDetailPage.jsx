import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/Admin.module.css";
import root from "../assets/styles/Root.module.css";
import u from "../assets/styles/UserDetail.module.css";
import SpinDetailsModal from "../components/SpinDetailsModal";

export default function UserDetailPage() {
   const { id } = useParams();
   const { authFetch } = useAuth();
   const [loading, setLoading] = useState(true);
   const [data, setData] = useState(null);
   const [editing, setEditing] = useState(false);
   const [formData, setFormData] = useState({});
   const [saving, setSaving] = useState(false);
   const [spinsPage, setSpinsPage] = useState(1);
   const [spinsData, setSpinsData] = useState(null);
   const [spinsLoading, setSpinsLoading] = useState(false);
   const [showSpinner, setShowSpinner] = useState(false);
   const spinsSectionRef = useRef(null);
   const loadingTimeoutRef = useRef(null);
   const [blocks, setBlocks] = useState({
      withdrawal: [],
      deposit: [],
      account: []
   });
   const [ticketsOpenCount, setTicketsOpenCount] = useState(0);
   const [ticketsClosedCount, setTicketsClosedCount] = useState(0);
   const [userTicketsOpen, setUserTicketsOpen] = useState([]);
   const [userTicketsClosed, setUserTicketsClosed] = useState([]);
   const [promoActs, setPromoActs] = useState([]);
   const [promoLoading, setPromoLoading] = useState(false);
   const [showBlockModal, setShowBlockModal] = useState(false);
   const [editingBlocks, setEditingBlocks] = useState(false);
   const [blockForm, setBlockForm] = useState({
      block_type: '',
      reason: ''
   });
   const [spinDetailsModal, setSpinDetailsModal] = useState({ open: false, spinId: null });

   const fmt2 = (v) => Number(v ?? 0).toFixed(2);

   useEffect(() => {
      let mounted = true;
      (async () => {
         setLoading(true);
         const res = await authFetch(`/api/admin/users/${id}/details/`);
         const json = res.ok ? await res.json() : null;
         if (mounted) {
            setData(json);
            if (json) {
               setFormData({
                  username: json.user.username || '',
                  email: json.user.email || '',
                  first_name: json.user.first_name || '',
                  last_name: json.user.last_name || '',
                  is_staff: json.user.is_staff || false,
                  is_superuser: json.user.is_superuser || false,
                  profile: {
                     phone: json.user.profile?.phone || ''
                  }
               });
               setBlocks(json.blocks || { withdrawal: [], deposit: [], account: [] });
            }
            setLoading(false);
         }
      })();
      return () => { mounted = false; };
   }, [authFetch, id]);

   // Отдельный useEffect для загрузки истории круток
   useEffect(() => {
      let mounted = true;
      (async () => {
         setSpinsLoading(true);

         // Показываем спиннер только если загрузка длится больше 300мс
         loadingTimeoutRef.current = setTimeout(() => {
            if (mounted) {
               setShowSpinner(true);
            }
         }, 300);

         const res = await authFetch(`/api/admin/users/${id}/spins/?page=${spinsPage}&page_size=20`);
         const json = res.ok ? await res.json() : null;

         if (mounted) {
            // Очищаем таймер
            if (loadingTimeoutRef.current) {
               clearTimeout(loadingTimeoutRef.current);
            }
            setSpinsData(json);
            setSpinsLoading(false);
            setShowSpinner(false);
         }
      })();
      return () => {
         mounted = false;
         if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
         }
      };
   }, [authFetch, id, spinsPage]);

  // Загрузка счетчиков тикетов пользователя (по email/username)
  useEffect(() => {
     let mounted = true;
     (async () => {
        try {
           const res = await authFetch(`/api/support/tickets/`);
           const list = res.ok ? await res.json() : [];
           const email = data?.user?.email?.toLowerCase?.() || "";
           const username = data?.user?.username?.toLowerCase?.() || "";
           const mine = Array.isArray(list) ? list.filter(t => {
              const u = t.user || {};
              const ue = (u.email || "").toLowerCase();
              const un = (u.username || "").toLowerCase();
              return (email && ue === email) || (username && un === username);
           }) : [];
           const openArr = mine.filter(t => t.status !== "closed");
           const closedArr = mine.filter(t => t.status === "closed");
           if (mounted) {
             setTicketsOpenCount(openArr.length);
             setTicketsClosedCount(closedArr.length);
             setUserTicketsOpen(openArr);
             setUserTicketsClosed(closedArr);
           }
        } catch {}
     })();
     return () => { mounted = false; };
  }, [authFetch, data?.user?.email, data?.user?.username]);

  // Загрузка активаций промокодов пользователя
  useEffect(() => {
     const userId = data?.user?.id;
     if (!userId) return;
     let mounted = true;
     (async () => {
        try {
           setPromoLoading(true);
           const res = await authFetch(`/api/admin/promocode-activations/`);
           const payload = res.ok ? await res.json() : [];
           const list = Array.isArray(payload) ? payload : (payload?.results || []);
           const mine = list.filter(a => (a?.user?.id === userId));
           // по убыванию даты
           mine.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
           if (mounted) setPromoActs(mine);
        } catch {
        } finally {
           if (mounted) setPromoLoading(false);
        }
     })();
     return () => { mounted = false; };
  }, [authFetch, data?.user?.id]);

   const handleSave = async () => {
      setSaving(true);
      try {
         const res = await authFetch(`/api/admin/users/${id}/`, {
            method: 'PATCH',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
         });

         if (res.ok) {
            // Обновляем данные
            const updatedData = await res.json();
            setData(prev => ({
               ...prev,
               user: updatedData
            }));
            setEditing(false);
         } else {
            alert('Ошибка при сохранении данных');
         }
      } catch (error) {
         alert('Ошибка при сохранении данных');
      } finally {
         setSaving(false);
      }
   };

   const handleInputChange = (field, value) => {
      if (field.startsWith('profile.')) {
         const profileField = field.replace('profile.', '');
         setFormData(prev => ({
            ...prev,
            profile: {
               ...prev.profile,
               [profileField]: value
            }
         }));
      } else {
         setFormData(prev => ({
            ...prev,
            [field]: value
         }));
      }
   };

   const handleSpinsPageChange = (newPage) => {
      setSpinsPage(newPage);
   };

   const handleCreateBlock = async () => {
      if (!blockForm.block_type) {
         alert('Выберите тип блокировки');
         return;
      }

      // Проверяем, что для выбранного типа еще нет активных блокировок
      if (blocks[blockForm.block_type].length > 0) {
         alert('Для этого типа блокировки уже существует активная блокировка');
         return;
      }

      try {
         const endpoint = `/api/admin/users/${id}/blocks/${blockForm.block_type}/`;
         const res = await authFetch(endpoint, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason: blockForm.reason }),
         });

         if (res.ok) {
            const newBlock = await res.json();
            setBlocks(prev => ({
               ...prev,
               [blockForm.block_type]: [newBlock, ...prev[blockForm.block_type]]
            }));
            setShowBlockModal(false);
            setBlockForm({ block_type: '', reason: '' });
            setEditingBlocks(false); // Автоматически выходим из режима редактирования
            alert('Блокировка успешно создана');
         } else {
            const error = await res.json();
            alert('Ошибка при создании блокировки: ' + (error.detail || 'Неизвестная ошибка'));
         }
      } catch (error) {
         alert('Ошибка при создании блокировки');
      }
   };

   const handleRemoveBlock = async (blockType, blockId) => {
      if (!window.confirm('Вы уверены, что хотите удалить эту блокировку?')) {
         return;
      }

      try {
         const res = await authFetch(`/api/admin/users/${id}/blocks/${blockType}/${blockId}/`, {
            method: 'DELETE',
         });

         if (res.ok) {
            setBlocks(prev => ({
               ...prev,
               [blockType]: prev[blockType].filter(block => block.id !== blockId)
            }));

            // Проверяем, остались ли блокировки после удаления
            const remainingBlocks = blocks[blockType].filter(block => block.id !== blockId);
            const totalBlocks = blocks.withdrawal.length + blocks.deposit.length + blocks.account.length - 1;

            // Если больше нет блокировок, выходим из режима редактирования
            if (totalBlocks === 0) {
               setEditingBlocks(false);
            }

            alert('Блокировка успешно удалена');
         } else {
            alert('Ошибка при удалении блокировки');
         }
      } catch (error) {
         alert('Ошибка при удалении блокировки');
      }
   };

   if (loading || !data) return <div className={s.page}><div className={s.card}>Загрузка…</div></div>;

   // CSS для анимации спиннера
   const spinnerStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

   const user = data.user;
   const profile = user.profile || {};
   const r = data.referrals || {};

   return (
      <>
         <div className={s.page}>
         <style>{spinnerStyle}</style>
         <div className={s.header}>
            <h2 className={s.title}>Пользователь #{user.id} — {user.username || user.email}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
               {editing ? (
                  <>
                     <button
                        onClick={handleSave}
                        disabled={saving}
                        className={root.btnPrimary}
                        style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '8px',
                           opacity: saving ? 0.7 : 1,
                           cursor: saving ? 'not-allowed' : 'pointer'
                        }}
                     >
                        {saving ? (
                           <>
                              <div style={{
                                 width: '14px',
                                 height: '14px',
                                 border: '2px solid #fff',
                                 borderTop: '2px solid transparent',
                                 borderRadius: '50%',
                                 animation: 'spin 1s linear infinite'
                              }}></div>
                              Сохранение...
                           </>
                        ) : (
                           <>
                              <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                                 <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                              </svg>
                              Сохранить
                           </>
                        )}
                     </button>
                     <button
                        onClick={() => setEditing(false)}
                        className={root.btn}
                        style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '8px'
                        }}
                     >
                        <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                           <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                        Отмена
                     </button>
                  </>
               ) : (
                  <button
                     onClick={() => setEditing(true)}
                     className={root.btnPrimary}
                     style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                     }}
                  >
                     <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                     </svg>
                     Редактировать
                  </button>
               )}
               <Link
                  to="/users"
                  className={root.btn}
                  style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px'
                  }}
               >
                  <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                     <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  Назад
               </Link>
         </div>
      </div>

         {/* Основная информация о пользователе */}
         <div className={s.card}>
            <h3 style={{ marginTop: 0 }}>Основная информация</h3>
            {editing ? (
               <div style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  padding: '25px',
                  borderRadius: '12px',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
               }}>
                  <div style={{
                     display: 'grid',
                     gridTemplateColumns: '1fr 1fr',
                     gap: '20px',
                     marginBottom: '20px'
                  }}>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{
                           fontWeight: '600',
                           color: '#495057',
                           marginBottom: '8px',
                           fontSize: '14px'
                        }}>
                           Username
                        </label>
                        <input
                           type="text"
                           value={formData.username}
                           onChange={(e) => handleInputChange('username', e.target.value)}
                           style={{
                              padding: '12px 16px',
                              border: '2px solid #e9ecef',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                              backgroundColor: '#fff'
                           }}
                           onFocus={(e) => e.target.style.borderColor = '#007bff'}
                           onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                        />
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{
                           fontWeight: '600',
                           color: '#495057',
                           marginBottom: '8px',
                           fontSize: '14px'
                        }}>
                           Email
                        </label>
                        <input
                           type="email"
                           value={formData.email}
                           onChange={(e) => handleInputChange('email', e.target.value)}
                           style={{
                              padding: '12px 16px',
                              border: '2px solid #e9ecef',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                              backgroundColor: '#fff'
                           }}
                           onFocus={(e) => e.target.style.borderColor = '#007bff'}
                           onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                        />
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{
                           fontWeight: '600',
                           color: '#495057',
                           marginBottom: '8px',
                           fontSize: '14px'
                        }}>
                           Имя
                        </label>
                        <input
                           type="text"
                           value={formData.first_name}
                           onChange={(e) => handleInputChange('first_name', e.target.value)}
                           style={{
                              padding: '12px 16px',
                              border: '2px solid #e9ecef',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                              backgroundColor: '#fff'
                           }}
                           onFocus={(e) => e.target.style.borderColor = '#007bff'}
                           onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                        />
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{
                           fontWeight: '600',
                           color: '#495057',
                           marginBottom: '8px',
                           fontSize: '14px'
                        }}>
                           Фамилия
                        </label>
                        <input
                           type="text"
                           value={formData.last_name}
                           onChange={(e) => handleInputChange('last_name', e.target.value)}
                           style={{
                              padding: '12px 16px',
                              border: '2px solid #e9ecef',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                              backgroundColor: '#fff'
                           }}
                           onFocus={(e) => e.target.style.borderColor = '#007bff'}
                           onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                        />
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{
                           fontWeight: '600',
                           color: '#495057',
                           marginBottom: '8px',
                           fontSize: '14px'
                        }}>
                           Телефон
                        </label>
                        <input
                           type="text"
                           value={formData.profile.phone}
                           onChange={(e) => handleInputChange('profile.phone', e.target.value)}
                           placeholder="+7 (999) 123-45-67"
                           style={{
                              padding: '12px 16px',
                              border: '2px solid #e9ecef',
                              borderRadius: '8px',
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                              backgroundColor: '#fff'
                           }}
                           onFocus={(e) => e.target.style.borderColor = '#007bff'}
                           onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                        />
                     </div>

                  </div>

                  {/* Информационная панель */}
                  <div style={{
                     background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                     padding: '15px',
                     borderRadius: '8px',
                     border: '1px solid #90caf9',
                     marginTop: '20px'
                  }}>
                     <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#1565c0',
                        fontWeight: '600'
                     }}>
                        <span style={{ fontSize: '18px' }}>ℹ️</span>
                        <span>Редактирование данных пользователя</span>
                     </div>
                     <p style={{
                        margin: '8px 0 0 0',
                        color: '#1976d2',
                        fontSize: '13px',
                        lineHeight: '1.4'
                     }}>
                        Изменения будут сохранены после нажатия кнопки "Сохранить".
                     </p>
                  </div>
               </div>
            ) : (
               <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '12px',
                  border: '1px solid #dee2e6'
               }}>
                  <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     padding: '15px',
                     backgroundColor: '#fff',
                     borderRadius: '8px',
                     border: '1px solid #e9ecef',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                     <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</span>
                     <span style={{ fontSize: '16px', fontWeight: '600', color: '#495057', marginTop: '4px' }}>{user.username}</span>
                  </div>

                  <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     padding: '15px',
                     backgroundColor: '#fff',
                     borderRadius: '8px',
                     border: '1px solid #e9ecef',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                     <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</span>
                     <span style={{ fontSize: '16px', fontWeight: '600', color: '#495057', marginTop: '4px' }}>{user.email}</span>
                  </div>

                  <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     padding: '15px',
                     backgroundColor: '#fff',
                     borderRadius: '8px',
                     border: '1px solid #e9ecef',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                     <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Имя</span>
                     <span style={{ fontSize: '16px', fontWeight: '600', color: '#495057', marginTop: '4px' }}>{user.first_name || '-'}</span>
                  </div>

                  <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     padding: '15px',
                     backgroundColor: '#fff',
                     borderRadius: '8px',
                     border: '1px solid #e9ecef',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                     <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Фамилия</span>
                     <span style={{ fontSize: '16px', fontWeight: '600', color: '#495057', marginTop: '4px' }}>{user.last_name || '-'}</span>
                  </div>

                  <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     padding: '15px',
                     backgroundColor: '#fff',
                     borderRadius: '8px',
                     border: '1px solid #e9ecef',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                     <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Телефон</span>
                     <span style={{ fontSize: '16px', fontWeight: '600', color: '#495057', marginTop: '4px' }}>{profile.phone || '-'}</span>
                  </div>


                  <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     padding: '15px',
                     backgroundColor: '#fff',
                     borderRadius: '8px',
                     border: '1px solid #e9ecef',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                     gridColumn: '1 / -1'
                  }}>
                     <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Дата регистрации</span>
                     <span style={{ fontSize: '16px', fontWeight: '600', color: '#495057', marginTop: '4px' }}>
                        {user.date_joined ? new Date(user.date_joined).toLocaleString('ru-RU') : '-'}
                     </span>
                  </div>
               </div>
            )}
         </div>

         {/* Блокировки */}
         <div className={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3 style={{ marginTop: 0 }}>Блокировки</h3>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {editingBlocks ? (
                     <>
                        {/* Показываем кнопку добавления только если есть доступные типы для блокировки */}
                        {(blocks.withdrawal.length === 0 || blocks.deposit.length === 0 || blocks.account.length === 0) && (
                           <button
                              onClick={() => setShowBlockModal(true)}
                              className={root.btnPrimary}
                              style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '8px'
                              }}
                           >
                              <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                                 <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                              </svg>
                              Добавить блокировку
                           </button>
                        )}
                        <button
                           onClick={() => setEditingBlocks(false)}
                           className={root.btn}
                           style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                           }}
                        >
                           <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                           </svg>
                           Завершить редактирование
                        </button>
                     </>
                  ) : (
                     <button
                        onClick={() => setEditingBlocks(true)}
                        className={root.btnPrimary}
                        style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '8px'
                        }}
                     >
                        <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                           <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                        Редактировать блокировки
                     </button>
                  )}
               </div>
            </div>

            {/* Информационная панель для режима редактирования блокировок */}
            {editingBlocks && (
               <div style={{
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #90caf9',
                  marginBottom: '20px'
               }}>
                  <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '10px',
                     color: '#1565c0',
                     fontWeight: '600'
                  }}>
                     <span style={{ fontSize: '18px' }}>✏️</span>
                     <span>Режим редактирования блокировок</span>
                  </div>
                  <p style={{
                     margin: '8px 0 0 0',
                     color: '#1976d2',
                     fontSize: '13px',
                     lineHeight: '1.4'
                  }}>
                     Вы можете добавлять новые блокировки (максимум одна каждого типа) или удалять существующие.
                     {blocks.withdrawal.length > 0 && blocks.deposit.length > 0 && blocks.account.length > 0 ?
                        ' Все типы блокировок уже активны.' :
                        ' Нажмите "Завершить редактирование" для выхода из режима.'
                     }
                  </p>
               </div>
            )}

            {blocks.withdrawal.length > 0 || blocks.deposit.length > 0 || blocks.account.length > 0 ? (
               <div style={{
                  display: 'grid',
                  gap: '20px'
               }}>
                  {/* Блокировки вывода */}
                  {blocks.withdrawal.length > 0 && (
                     <div>
                        <h4 style={{ margin: '0 0 12px 0', color: '#856404', fontSize: '16px', fontWeight: '600' }}>
                           🚫 Блокировки вывода ({blocks.withdrawal.length})
                        </h4>
                        <div style={{ display: 'grid', gap: '8px' }}>
                           {blocks.withdrawal.map(block => (
                              <div key={block.id} style={{
                                 padding: '12px',
                                 backgroundColor: '#fff3cd',
                                 borderRadius: '8px',
                                 border: '1px solid #ffeaa7',
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center'
                              }}>
                                 <div>
                                    <div style={{ fontSize: '12px', color: '#856404', marginBottom: '4px' }}>
                                       {new Date(block.created_at).toLocaleString('ru-RU')}
                                    </div>
                                    {block.reason && (
                                       <div style={{ fontSize: '14px', color: '#495057' }}>
                                          {block.reason}
                                       </div>
                                    )}
                                    {block.blocked_by && (
                                       <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                          Заблокировал: {block.blocked_by.username}
                                       </div>
                                    )}
                                 </div>
                                 {editingBlocks && (
                                    <button
                                       onClick={() => handleRemoveBlock('withdrawal', block.id)}
                                       style={{
                                          padding: '6px 12px',
                                          backgroundColor: '#dc3545',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          transition: 'all 0.2s ease',
                                          boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
                                       }}
                                       onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = '#c82333';
                                          e.target.style.transform = 'translateY(-1px)';
                                       }}
                                       onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = '#dc3545';
                                          e.target.style.transform = 'translateY(0)';
                                       }}
                                    >
                                       <svg style={{ width: '12px', height: '12px', fill: 'currentColor' }} viewBox="0 0 24 24">
                                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                       </svg>
                                       Удалить
                                    </button>
                                 )}
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Блокировки ввода */}
                  {blocks.deposit.length > 0 && (
                     <div>
                        <h4 style={{ margin: '0 0 12px 0', color: '#0c5460', fontSize: '16px', fontWeight: '600' }}>
                           🚫 Блокировки ввода ({blocks.deposit.length})
                        </h4>
                        <div style={{ display: 'grid', gap: '8px' }}>
                           {blocks.deposit.map(block => (
                              <div key={block.id} style={{
                                 padding: '12px',
                                 backgroundColor: '#d1ecf1',
                                 borderRadius: '8px',
                                 border: '1px solid #bee5eb',
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center'
                              }}>
                                 <div>
                                    <div style={{ fontSize: '12px', color: '#0c5460', marginBottom: '4px' }}>
                                       {new Date(block.created_at).toLocaleString('ru-RU')}
                                    </div>
                                    {block.reason && (
                                       <div style={{ fontSize: '14px', color: '#495057' }}>
                                          {block.reason}
                                       </div>
                                    )}
                                    {block.blocked_by && (
                                       <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                          Заблокировал: {block.blocked_by.username}
                                       </div>
                                    )}
                                 </div>
                                 {editingBlocks && (
                                    <button
                                       onClick={() => handleRemoveBlock('deposit', block.id)}
                                       style={{
                                          padding: '6px 12px',
                                          backgroundColor: '#dc3545',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          transition: 'all 0.2s ease',
                                          boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
                                       }}
                                       onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = '#c82333';
                                          e.target.style.transform = 'translateY(-1px)';
                                       }}
                                       onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = '#dc3545';
                                          e.target.style.transform = 'translateY(0)';
                                       }}
                                    >
                                       <svg style={{ width: '12px', height: '12px', fill: 'currentColor' }} viewBox="0 0 24 24">
                                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                       </svg>
                                       Удалить
                                    </button>
                                 )}
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Блокировки аккаунта */}
                  {blocks.account.length > 0 && (
                     <div>
                        <h4 style={{ margin: '0 0 12px 0', color: '#721c24', fontSize: '16px', fontWeight: '600' }}>
                           🚫 Блокировки аккаунта ({blocks.account.length})
                        </h4>
                        <div style={{ display: 'grid', gap: '8px' }}>
                           {blocks.account.map(block => (
                              <div key={block.id} style={{
                                 padding: '12px',
                                 backgroundColor: '#f8d7da',
                                 borderRadius: '8px',
                                 border: '1px solid #f5c6cb',
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center'
                              }}>
                                 <div>
                                    <div style={{ fontSize: '12px', color: '#721c24', marginBottom: '4px' }}>
                                       {new Date(block.created_at).toLocaleString('ru-RU')}
                                    </div>
                                    {block.reason && (
                                       <div style={{ fontSize: '14px', color: '#495057' }}>
                                          {block.reason}
                                       </div>
                                    )}
                                    {block.blocked_by && (
                                       <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                          Заблокировал: {block.blocked_by.username}
                                       </div>
                                    )}
                                 </div>
                                 {editingBlocks && (
                                    <button
                                       onClick={() => handleRemoveBlock('account', block.id)}
                                       style={{
                                          padding: '6px 12px',
                                          backgroundColor: '#dc3545',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          transition: 'all 0.2s ease',
                                          boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
                                       }}
                                       onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = '#c82333';
                                          e.target.style.transform = 'translateY(-1px)';
                                       }}
                                       onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = '#dc3545';
                                          e.target.style.transform = 'translateY(0)';
                                       }}
                                    >
                                       <svg style={{ width: '12px', height: '12px', fill: 'currentColor' }} viewBox="0 0 24 24">
                                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                       </svg>
                                       Удалить
                                    </button>
                                 )}
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            ) : (
               <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6c757d',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
               }}>
                  <svg style={{ width: '48px', height: '48px', fill: 'currentColor', marginBottom: '16px' }} viewBox="0 0 24 24">
                     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>Нет активных блокировок</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>Пользователь не заблокирован</div>
               </div>
            )}
         </div>

         {/* Тикеты пользователя */}
         <div className={s.card}>
         <h3 style={{ marginTop: 0 }}>Тикеты пользователя</h3>
         <div style={{ display: 'grid', gap: 16 }}>
            <div>
               <div className={s.cardTitle} style={{ marginBottom: 8 }}>Открытые ({ticketsOpenCount})</div>
               <div className={s.tableWrap}>
                  <table className={s.table}>
                     <thead>
                        <tr>
                           <th>ID</th>
                           <th>Тема</th>
                           <th>Создан</th>
                           <th></th>
                        </tr>
                     </thead>
                     <tbody>
                        {(userTicketsOpen || []).map(t => (
                           <tr key={t.id}>
                              <td>{t.id}</td>
                              <td>{t.subject}</td>
                              <td>{new Date(t.created_at).toLocaleString('ru-RU')}</td>
                              <td>
                                 <Link className={root.btn} to={`/tickets?q=${encodeURIComponent(user.email || user.username || '')}&open=${t.id}`}>Открыть</Link>
                              </td>
                           </tr>
                        ))}
                        {(!userTicketsOpen || userTicketsOpen.length === 0) && (
                           <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Нет открытых тикетов</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            <div>
               <div className={s.cardTitle} style={{ marginBottom: 8 }}>Закрытые ({ticketsClosedCount})</div>
               <div className={s.tableWrap}>
                  <table className={s.table}>
                     <thead>
                        <tr>
                           <th>ID</th>
                           <th>Тема</th>
                           <th>Создан</th>
                           <th>Закрыт</th>
                           <th></th>
                        </tr>
                     </thead>
                     <tbody>
                        {(userTicketsClosed || []).map(t => (
                           <tr key={t.id}>
                              <td>{t.id}</td>
                              <td>{t.subject}</td>
                              <td>{new Date(t.created_at).toLocaleString('ru-RU')}</td>
                              <td>{t.closed_at ? new Date(t.closed_at).toLocaleString('ru-RU') : '—'}</td>
                              <td>
                                 <Link className={root.btn} to={`/tickets?q=${encodeURIComponent(user.email || user.username || '')}&open=${t.id}`}>Открыть</Link>
                              </td>
                           </tr>
                        ))}
                        {(!userTicketsClosed || userTicketsClosed.length === 0) && (
                           <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Нет закрытых тикетов</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
         </div>

         {/* Финансы */}
         <div className={s.card}>
            <h3 style={{ marginTop: 0 }}>Финансы</h3>
            <div className={u.finRow}>
               <div className={u.finCard}><div className={u.finLabel}>Баланс, $</div><div className={u.finValue}>{fmt2(profile.balance_usd)}</div></div>
               <div className={u.finCard}><div className={u.finLabel}>Подтвержденные депозиты, $</div><div className={u.finValue}>{fmt2(data.approved_deposits_total)}</div></div>
               <div className={u.finCard}><div className={u.finLabel}>Подтвержденные выводы, $</div><div className={u.finValue}>{fmt2(data.approved_withdrawals_total)}</div></div>
               <div className={u.finCard}><div className={u.finLabel}>Выиграл, $</div><div className={u.finValue}>{fmt2(profile.won_total_usd)}</div></div>
               <div className={u.finCard}><div className={u.finLabel}>Проиграл, $</div><div className={u.finValue}>{fmt2(profile.lost_total_usd)}</div></div>
            </div>
         </div>

         <div className={s.card}>
         <h3 style={{ marginTop: 0 }}>Активации промокодов</h3>
         {promoLoading ? (
            <div>Загрузка…</div>
         ) : (
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr>
                        <th>ID</th>
                        <th>Код</th>
                        <th>Сумма, $</th>
                        <th>Дата</th>
                     </tr>
                  </thead>
                  <tbody>
                     {promoActs.length ? promoActs.map(a => (
                        <tr key={a.id}>
                           <td>{a.id}</td>
                           <td>{a.promocode?.code}</td>
                           <td>{Number(a.amount_usd || 0).toFixed(2)}</td>
                           <td>{a.created_at ? new Date(a.created_at).toLocaleString('ru-RU') : ''}</td>
                        </tr>
                     )) : (
                        <tr>
                           <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Активации не найдены</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         )}
      </div>

         {/* Депозиты */}
         <div className={s.card}>
            <h3 style={{ marginTop: 0 }}>История депозитов</h3>
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr><th>ID</th><th>Дата</th><th>Сумма, $</th><th>Метод</th><th>Статус</th><th>Комментарий</th></tr>
                  </thead>
                  <tbody>
                     {(data.deposits || []).map(dep => (
                        <tr key={dep.id}>
                           <td>{dep.id}</td>
                           <td>{new Date(dep.created_at).toLocaleString('ru-RU')}</td>
                           <td>{fmt2(dep.amount_usd)}</td>
                           <td>{dep.method || '-'}</td>
                           <td>
                              <span style={{
                                 padding: '2px 8px',
                                 borderRadius: '4px',
                                 fontSize: '12px',
                                 backgroundColor: dep.status.code === 'approved' ? '#d4edda' :
                                    dep.status.code === 'rejected' ? '#f8d7da' : '#fff3cd',
                                 color: dep.status.code === 'approved' ? '#155724' :
                                    dep.status.code === 'rejected' ? '#721c24' : '#856404'
                              }}>
                                 {dep.status.name}
                              </span>
                           </td>
                           <td>{dep.comment || '-'}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Выводы */}
         <div className={s.card}>
            <h3 style={{ marginTop: 0 }}>История выводов</h3>
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr><th>ID</th><th>Дата</th><th>Сумма, $</th><th>Метод</th><th>Статус</th><th>Комментарий</th></tr>
                  </thead>
                  <tbody>
                     {(data.withdrawals || []).map(wd => (
                        <tr key={wd.id}>
                           <td>{wd.id}</td>
                           <td>{new Date(wd.created_at).toLocaleString('ru-RU')}</td>
                           <td>{fmt2(wd.amount_usd)}</td>
                           <td>{wd.method || '-'}</td>
                           <td>
                              <span style={{
                                 padding: '2px 8px',
                                 borderRadius: '4px',
                                 fontSize: '12px',
                                 backgroundColor: wd.status.code === 'approved' ? '#d4edda' :
                                    wd.status.code === 'rejected' ? '#f8d7da' : '#fff3cd',
                                 color: wd.status.code === 'approved' ? '#155724' :
                                    wd.status.code === 'rejected' ? '#721c24' : '#856404'
                              }}>
                                 {wd.status.name}
                              </span>
                           </td>
                           <td>{wd.comment || '-'}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Рефералы */}
         <div className={s.card}>
            <h3 style={{ marginTop: 0 }}>Рефералы</h3>
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr><th colSpan={5}>Уровень 1 (процент: {r.level1_percent ?? 0}%)</th></tr>
                     <tr><th>ID</th><th>Email</th><th>Username</th><th>Пригласил</th><th>Процент</th></tr>
                  </thead>
                  <tbody>
                     {(r.level1 || []).map(x => (
                        <tr key={`l1-${x.id}`}>
                           <td>{x.id}</td><td>{x.email}</td><td>{x.username}</td><td>-</td><td>{x.percent}%</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr><th colSpan={5}>Уровень 2 (процент: {r.level2_percent ?? 0}%)</th></tr>
                     <tr><th>ID</th><th>Email</th><th>Username</th><th>Пригласил</th><th>Процент</th></tr>
                  </thead>
                  <tbody>
                     {(r.level2 || []).map(x => (
                        <tr key={`l2-${x.id}`}>
                           <td>{x.id}</td><td>{x.email}</td><td>{x.username}</td>
                           <td>{x.referred_by ? (x.referred_by.username || x.referred_by.email) : '-'}</td>
                           <td>{x.percent}%</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* История круток */}
         <div className={s.card} ref={spinsSectionRef} style={{ position: 'relative' }}>
            <h3 style={{ marginTop: 0 }}>История круток</h3>

            {/* Оверлей загрузки */}
            {showSpinner && (
               <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '8px'
               }}>
                  <div style={{
                     padding: '20px',
                     backgroundColor: 'white',
                     borderRadius: '8px',
                     boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '10px'
                  }}>
                     <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #f3f3f3',
                        borderTop: '2px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                     }}></div>
                     Загрузка...
                  </div>
               </div>
            )}

            <div className={s.tableWrap}>
               <table className={s.table}>
                  <thead>
                     <tr><th>ID</th><th>Когда</th><th>Кейс</th><th>Приз</th><th>Сумма, $</th><th>Действия</th></tr>
                  </thead>
                  <tbody>
                     {(spinsData?.spins || []).map(sp => (
                        <tr key={sp.id}>
                           <td>{sp.id}</td>
                           <td>{new Date(sp.created_at).toLocaleString('ru-RU')}</td>
                           <td>{sp.case?.name}</td>
                           <td>{sp.prize?.title}</td>
                           <td>{fmt2(sp.prize?.amount_usd)}</td>
                           <td>
                              <button
                                 className={root.btn}
                                 style={{ fontSize: "0.9em", padding: "4px 12px" }}
                                 onClick={() => setSpinDetailsModal({ open: true, spinId: sp.id })}
                              >
                                 Подробнее
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Пагинация для круток */}
            {spinsData?.pagination && (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <div>
                     Показано {((spinsData.pagination.page - 1) * spinsData.pagination.page_size) + 1}-
                     {Math.min(spinsData.pagination.page * spinsData.pagination.page_size, spinsData.pagination.total)}
                     <span> </span> из {spinsData.pagination.total} записей
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <button
                        className={spinsData.pagination.has_previous && !spinsLoading ? root.btnPrimary : root.btn}
                        onClick={() => handleSpinsPageChange(Math.max(1, spinsData.pagination.page - 1))}
                        disabled={!spinsData.pagination.has_previous || spinsLoading}
                        style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '6px',
                           opacity: (!spinsData.pagination.has_previous || spinsLoading) ? 0.5 : 1,
                           cursor: (!spinsData.pagination.has_previous || spinsLoading) ? 'not-allowed' : 'pointer'
                        }}
                     >
                        <svg style={{ width: '14px', height: '14px', fill: 'currentColor' }} viewBox="0 0 24 24">
                           <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                        Предыдущая
                     </button>
                     <span style={{
                        padding: '8px 12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#495057'
                     }}>
                        {spinsData.pagination.page} из {spinsData.pagination.total_pages}
                     </span>
                     <button
                        className={spinsData.pagination.has_next && !spinsLoading ? root.btnPrimary : root.btn}
                        onClick={() => handleSpinsPageChange(spinsData.pagination.page + 1)}
                        disabled={!spinsData.pagination.has_next || spinsLoading}
                        style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '6px',
                           opacity: (!spinsData.pagination.has_next || spinsLoading) ? 0.5 : 1,
                           cursor: (!spinsData.pagination.has_next || spinsLoading) ? 'not-allowed' : 'pointer'
                        }}
                     >
                        Следующая
                        <svg style={{ width: '14px', height: '14px', fill: 'currentColor' }} viewBox="0 0 24 24">
                           <path d="M4 11v2h12.17l-5.59 5.59L12 20l8-8-8-8-1.41 1.41L16.17 11H4z" />
                        </svg>
                     </button>
                  </div>
               </div>
            )}
         </div>

         {/* Модальное окно для создания блокировки */}
         {showBlockModal && (
            <div style={{
               position: 'fixed',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               backgroundColor: 'rgba(0, 0, 0, 0.5)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 1000
            }}>
               <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  width: '90%',
                  maxWidth: '520px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
               }}>
                  <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>Добавить блокировку</h3>

                  {/* Проверяем, есть ли доступные типы для блокировки */}
                  {blocks.withdrawal.length > 0 && blocks.deposit.length > 0 && blocks.account.length > 0 ? (
                     <div style={{
                        padding: '24px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        border: '2px solid #e9ecef',
                        textAlign: 'center',
                        marginBottom: '24px'
                     }}>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#6c757d', marginBottom: '12px' }}>
                           🚫 Все типы блокировок уже активны
                        </div>
                        <div style={{ fontSize: '14px', color: '#6c757d', lineHeight: '1.5' }}>
                           У пользователя уже есть активные блокировки всех типов.<br />
                           Для добавления новой блокировки сначала удалите существующую.
                        </div>
                     </div>
                  ) : (
                     <>
                        <div style={{ marginBottom: '20px' }}>
                           <label style={{
                              display: 'block',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px',
                              fontSize: '14px'
                           }}>
                              Тип блокировки
                           </label>
                           <select
                              value={blockForm.block_type}
                              onChange={(e) => setBlockForm(prev => ({ ...prev, block_type: e.target.value }))}
                              style={{
                                 width: '100%',
                                 padding: '12px 16px',
                                 border: '2px solid #e9ecef',
                                 borderRadius: '8px',
                                 fontSize: '14px',
                                 backgroundColor: '#fff'
                              }}
                           >
                              <option value="">Выберите тип блокировки</option>
                              <>
                                 {blocks.withdrawal.length === 0 && (
                                    <option value="withdrawal">🚫 Блокировка вывода</option>
                                 )}
                                 {blocks.deposit.length === 0 && (
                                    <option value="deposit">🚫 Блокировка ввода</option>
                                 )}
                                 {blocks.account.length === 0 && (
                                    <option value="account">🚫 Блокировка аккаунта</option>
                                 )}
                              </>
                           </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                           <label style={{
                              display: 'block',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px',
                              fontSize: '14px'
                           }}>
                              Причина блокировки
                           </label>
                           <textarea
                              value={blockForm.reason}
                              onChange={(e) => setBlockForm(prev => ({ ...prev, reason: e.target.value }))}
                              placeholder="Укажите причину блокировки..."
                              rows={3}
                              style={{
                                 width: '100%',
                                 padding: '12px 16px',
                                 border: '2px solid #e9ecef',
                                 borderRadius: '8px',
                                 fontSize: '14px',
                                 resize: 'vertical',
                                 fontFamily: 'inherit',
                                 boxSizing: 'border-box',
                                 minHeight: '80px',
                                 maxHeight: '120px'
                              }}
                           />
                        </div>
                     </>
                  )}

                  <div style={{
                     display: 'flex',
                     gap: '12px',
                     justifyContent: 'flex-end'
                  }}>
                     <button
                        onClick={() => {
                           setShowBlockModal(false);
                           setBlockForm({ block_type: '', reason: '' });
                        }}
                        className={root.btn}
                        style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '8px'
                        }}
                     >
                        Отмена
                     </button>
                     {/* Показываем кнопку создания только если есть доступные типы */}
                     {!(blocks.withdrawal.length > 0 && blocks.deposit.length > 0 && blocks.account.length > 0) && (
                        <button
                           onClick={handleCreateBlock}
                           className={root.btnPrimary}
                           style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                           }}
                        >
                           <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                           </svg>
                           Создать блокировку
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
      
      <SpinDetailsModal
         open={spinDetailsModal.open}
         onClose={() => setSpinDetailsModal({ open: false, spinId: null })}
         spinId={spinDetailsModal.spinId}
      />
      </>
   );
}