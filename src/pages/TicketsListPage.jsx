import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "../assets/styles/TicketsCenterAdmin.module.css";
import root from "../assets/styles/Root.module.css";

export default function TicketsListPage() {
  const { authFetch } = useAuth();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [closedMode, setClosedMode] = useState(false);

  const [activeId, setActiveId] = useState(null);
  const [desiredActiveId, setDesiredActiveId] = useState(null);
  const [search, setSearch] = useState("");

  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  // ref до контейнера чата для автоскролла вниз
  const chatRef = useRef(null);
  const scrollChatToBottom = () => {
    const el = chatRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  const fmtStatus = (st) => (st === "closed" ? "Закрыт" : "Открыт");

  const load = async () => {
    setLoading(true);
    const res = await authFetch(`/api/support/tickets/`);
    const data = res.ok ? await res.json() : [];
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, []);

  // Инициализация поиска и активного тикета из query-string (?q=...&open=ID)
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const q = params.get("q") || "";
    if (q) setSearch(q);
    const openId = params.get("open");
    if (openId) setDesiredActiveId(Number(openId));
  }, [location.search]);

  // После загрузки списка — попытаться активировать нужный тикет
  useEffect(() => {
    if (!desiredActiveId || !items.length) return;
    const found = items.find(t => t.id === desiredActiveId);
    if (found) setActiveId(found.id);
  }, [desiredActiveId, items]);

  // Разделяем на активные/закрытые
  const openItemsRaw = useMemo(
    () => items.filter((t) => t.status !== "closed"),
    [items]
  );
  const closedItemsRaw = useMemo(
    () => items.filter((t) => t.status === "closed"),
    [items]
  );

  // Поиск по теме/почте/имени/ID
  const q = search.trim().toLowerCase();
  const match = (t) => {
    if (!q) return true;
    const fields = [
      t.subject,
      t.user && t.user.username,
      t.user && t.user.email,
      String(t.id),
      fmtStatus(t.status),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return fields.includes(q);
  };

  const openItems = useMemo(() => openItemsRaw.filter(match), [openItemsRaw, q]);
  const closedItems = useMemo(
    () => closedItemsRaw.filter(match),
    [closedItemsRaw, q]
  );

  const active = useMemo(
    () => items.find((t) => t.id === activeId) || null,
    [items, activeId]
  );

  const onReply = async () => {
    if (!active) return;
    setError("");
    try {
      const form = new FormData();
      form.append("body", body);
      if (file) form.append("attachment", file);

      const res = await authFetch(`/api/support/tickets/${active.id}/reply/`, {
        method: "POST",
        body: form,
        headers: {},
      });
      if (!res.ok) throw new Error("Не удалось отправить");

      setBody("");
      setFile(null);
      await load();
      // после обновления данных проскроллим вниз
      setTimeout(scrollChatToBottom, 0);
    } catch (e) {
      setError((e && e.message) || "Ошибка");
    }
  };

  const onClose = async () => {
    if (!active) return;
    await authFetch(`/api/support/tickets/${active.id}/close/`, {
      method: "POST",
    });
    await load();

    // После закрытия — мягко переключаемся на следующий открытый
    const next = openItemsRaw.find((t) => t.id !== active.id);
    setActiveId(next ? next.id : null);
  };

  const renderItem = (t) => (
    <div
      key={t.id}
      className={`${s.item} ${active && active.id === t.id ? s.itemActive : ""} ${t.unread_for_staff ? s.itemUnread : ""}`}
      onClick={async () => {
        setActiveId(t.id);
        // Оптимистично снимаем метку непрочитанного сразу
        if (t.unread_for_staff) {
          setItems((prev) => prev.map((it) => it.id === t.id ? { ...it, unread_for_staff: false, unread_count_for_staff: 0 } : it));
        }
        // И параллельно отправляем отметку на бэкенд
        try { await authFetch(`/api/support/tickets/${t.id}/mark-read/`, { method: "POST" }); } catch {}
        // проскроллим вниз при открытии тикета
        setTimeout(scrollChatToBottom, 0);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setActiveId(t.id);
          if (t.unread_for_staff) {
            setItems((prev) => prev.map((it) => it.id === t.id ? { ...it, unread_for_staff: false, unread_count_for_staff: 0 } : it));
          }
          (async () => { try { await authFetch(`/api/support/tickets/${t.id}/mark-read/`, { method: "POST" }); } catch {} })();
          setTimeout(scrollChatToBottom, 0);
        }
      }}
    >
      <h4 className={s.itTitle}>{t.subject}</h4>
      <div className={s.itMeta}>
        <span>{new Date(t.created_at).toLocaleString("ru-RU")}</span>
        <span className={s.pill}>
          <span className={t.status === "closed" ? s.dotRed : s.dotGreen} />
          {fmtStatus(t.status)}
        </span>
        {t.unread_for_staff && (
          <span className={`${s.pill} ${s.pillBlue}`} title="Непрочитанные сообщения">
            <span className={s.dotYellow} />
            {t.unread_count_for_staff || 1}
          </span>
        )}
        <span title={(t.user && t.user.email) || ""}>
          {(t.user && (t.user.username || t.user.email)) ||
            `user#${t.user ? t.user.id : ""}`}
        </span>
      </div>
    </div>
  );

  return (
    <div className={s.wrap}>
      <div className={s.top}>
        <h2 className={s.title}>Центр тикетов (админ)</h2>
      </div>

      <div className={s.grid}>
        {/* Левая колонка */}
        <div className={`${s.left} ${closedMode ? s.leftClosedMode : ""}`}>
          <div className={s.search}>
            <input
              placeholder="Поиск"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Активные */}
          <div className={`${s.section} ${s.sectionOpen}`}>
            <div className={s.sectionHead}>
              <button
                className={s.sectionHeadBtn}
                onClick={() => setClosedMode(false)}
                aria-pressed={!closedMode}
              >
                <span className={s.sectionTitle}>Активные</span>
                <span className={s.sectionCount}>{openItemsRaw.length}</span>
              </button>
            </div>
            <div className={s.list}>
              {loading ? (
                <div style={{ padding: 12 }}>Загрузка…</div>
              ) : openItems.length === 0 ? (
                <div className={s.emptyList}>Активных тикетов нет</div>
              ) : (
                openItems.map(renderItem)
              )}
            </div>
          </div>

          {/* Закрытые */}
          <div className={`${s.section} ${s.sectionClosed}`}>
            <div className={s.sectionHead}>
              <button
                className={s.sectionHeadBtn}
                onClick={() => setClosedMode((v) => !v)}
                aria-pressed={closedMode}
              >
                <span className={s.sectionTitle}>Закрытые тикеты</span>
                <span className={s.sectionCount}>{closedItemsRaw.length}</span>
                <span className={`${s.caret} ${closedMode ? s.caretUp : ""}`} />
              </button>
            </div>

            <div className={`${s.list} ${closedMode ? "" : s.listCollapsed}`}>
              {loading ? (
                <div style={{ padding: 12 }}>Загрузка…</div>
              ) : closedItems.length === 0 ? (
                <div className={s.emptyList}>Закрытых тикетов нет</div>
              ) : (
                closedItems.map(renderItem)
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка */}
        {active ? (
          <div className={s.right}>
            <div className={s.head}>
              <h3 className={s.subject}>Тема: {active.subject}</h3>
              {active.status !== "closed" && (
                <button className={s.closeBtn} onClick={onClose}>
                  Закрыть
                </button>
              )}
            </div>

            <div className={s.chat} ref={chatRef}>
              {error && <div className={s.error}>{error}</div>}

              {active.messages &&
                active.messages.map((m) => {
                  const isUser =
                    active.user && m && m.author && m.author.id === active.user.id;
                  return (
                    <div
                      key={m.id}
                      className={`${s.bubbleRow} ${isUser ? s.mineRow : ""}`}
                    >
                      <div className={`${s.msg} ${isUser ? s.mine : ""}`}>
                        <div className={s.name}>
                          {isUser
                            ? m.author.username ||
                              m.author.email ||
                              "Пользователь"
                            : "Техподдержка"}
                        </div>
                        <div className={s.meta}>
                          {new Date(m.created_at).toLocaleString("ru-RU")}
                        </div>
                        <div>{m.body}</div>
                        {m.attachment && (
                          <div>
                            <a
                              href={m.attachment}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Вложение
                            </a>
                          </div>
                        )}
                        {m.read_by_user_at && (
                          <div
                            className={s.receipt}
                            title={`Прочитано пользователем: ${new Date(
                              m.read_by_user_at
                            ).toLocaleString("ru-RU")}`}
                          >
                            ✓ Прочитано пользователем
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {active.status !== "closed" && (
              <div className={s.composer}>
                <textarea
                  placeholder="Ваш ответ"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onReply();
                    }
                  }}
                />
                <div className={s.actions}>
                  <label className={s.file}>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => {
                        const fl =
                          e.target && e.target.files && e.target.files[0]
                            ? e.target.files[0]
                            : null;
                        setFile(fl);
                      }}
                    />
                    <span className={s.fileBtn}>Файл</span>
                  </label>
                  <button
                    className={root.btnPrimary}
                    onClick={(e) => {
                      e.preventDefault();
                      onReply();
                    }}
                  >
                    Отправить
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={s.rightEmpty}>
            <div className={s.placeholderBox}>
              <span>Выберите тикет слева</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
