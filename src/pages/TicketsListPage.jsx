import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/TicketsCenterAdmin.module.css";
import root from "../assets/styles/Root.module.css";

export default function TicketsListPage() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const active = useMemo(()=> items.find(t=>t.id===activeId) || items[0], [items, activeId]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await authFetch(`/api/support/tickets/`);
    const data = res.ok ? await res.json() : [];
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const fmtStatus = (s) => (s === 'closed' ? 'Закрыт' : 'Открыт');

  const onReply = async () => {
    if (!active) return;
    setError("");
    try {
      const form = new FormData();
      form.append("body", body);
      if (file) form.append("attachment", file);
      const res = await authFetch(`/api/support/tickets/${active.id}/reply/`, { method: "POST", body: form, headers: {} });
      if (!res.ok) throw new Error("Не удалось отправить");
      setBody(""); setFile(null);
      await load();
    } catch (e) { setError(e.message || "Ошибка"); }
  };

  const onClose = async () => {
    if (!active) return;
    await authFetch(`/api/support/tickets/${active.id}/close/`, { method: "POST" });
    await load();
  };

  return (
    <div className={s.wrap}>
      <div className={s.top}>
        <h2 className={s.title}>Центр тикетов (админ)</h2>
      </div>

      <div className={s.grid}>
        <div className={s.left}>
          <div className={s.search}><input placeholder="Поиск" /></div>
          <div className={s.list}>
            {loading ? <div style={{padding:12}}>Загрузка…</div> : (
              items.length === 0 ? <div className={s.emptyList}>Тикетов нет</div> : items.map(t => (
                <div key={t.id} className={`${s.item} ${active?.id===t.id? s.itemActive: ''}`} onClick={()=>setActiveId(t.id)}>
                  <h4 className={s.itTitle}>{t.subject}</h4>
                  <div className={s.itMeta}>
                    <span>{new Date(t.created_at).toLocaleString("ru-RU")}</span>
                    <span className={s.pill}>
                      <span className={t.status === 'closed' ? s.dotRed : s.dotGreen}></span>
                      {fmtStatus(t.status)}
                    </span>
                    <span title={t.user?.email || ''}>{t.user?.username || t.user?.email || `user#${t.user?.id}`}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={s.right}>
          <div className={s.head}>
            <h3 className={s.subject}>Тема: {active?.subject || ""}</h3>
            {active && active.status !== 'closed' && (
              <button className={s.closeBtn} onClick={onClose}>Закрыть</button>
            )}
          </div>
          <div className={s.chat}>
            {!active && <div>Выберите тикет слева…</div>}
            {active?.messages?.map(m => (
              <div key={m.id} className={`${s.bubbleRow} ${(active?.user && m?.author && m.author.id === active.user.id) ? s.mineRow : ''}`}>
                <div className={`${s.msg} ${(active?.user && m?.author && m.author.id === active.user.id) ? s.mine : ''}`}>
                  <div className={s.name}>{(active?.user && m?.author && m.author.id === active.user.id) ? (m.author?.username || m.author?.email || 'Пользователь') : 'Техподдержка'}</div>
                  <div className={s.meta}>{new Date(m.created_at).toLocaleString("ru-RU")}</div>
                  <div>{m.body}</div>
                  {m.attachment && <div><a href={m.attachment} target="_blank" rel="noreferrer">Вложение</a></div>}
                  {m.read_by_user_at && (
                    <div className={s.receipt} title={`Прочитано пользователем: ${new Date(m.read_by_user_at).toLocaleString('ru-RU')}`}>
                      ✓ Прочитано пользователем
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {active && active.status !== 'closed' && (
            <div className={s.composer}>
              <textarea placeholder="Ваш ответ" value={body} onChange={e=>setBody(e.target.value)} />
              <div className={s.actions}>
                <label className={s.file}><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0] || null)} /><span className={s.fileBtn}>Файл</span></label>
                <button className={root.btnPrimary} onClick={(e)=>{e.preventDefault(); onReply();}}>Отправить</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


