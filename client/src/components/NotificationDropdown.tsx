import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Ticket, UserCheck, MessageSquare } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { notificationApi } from '@/api/endpoints';
import styles from './NotificationDropdown.module.css';

interface Notification {
  id: number;
  type: 'NEW_TICKET' | 'TICKET_ASSIGNED' | 'NEW_COMMENT';
  ticketId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  ticket?: { id: number; title: string };
}

export function NotificationDropdown() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Load persisted notifications from API on mount
  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data.data ?? []);
    } catch { /* not authenticated yet */ }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen to real-time socket events and reload from DB
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const reload = () => loadNotifications();

    socket.on('notification:new-ticket', reload);
    socket.on('notification:ticket-assigned', reload);
    socket.on('notification:new-comment', reload);

    return () => {
      socket.off('notification:new-ticket', reload);
      socket.off('notification:ticket-assigned', reload);
      socket.off('notification:new-comment', reload);
    };
  }, [loadNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await notificationApi.markAsRead(n.id);
        setNotifications(prev => prev.map(item =>
          item.id === n.id ? { ...item, isRead: true } : item
        ));
      } catch { /* ignore */ }
    }
    setOpen(false);
    navigate(`/app/tickets/${n.ticketId}`);
  };

  const clearAll = async () => {
    try {
      await notificationApi.clearAll();
      setNotifications([]);
    } catch { /* ignore */ }
    setOpen(false);
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
    return date.toLocaleDateString('vi-VN');
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_TICKET': return <Ticket size={16} />;
      case 'NEW_COMMENT': return <MessageSquare size={16} />;
      case 'TICKET_ASSIGNED': return <UserCheck size={16} />;
    }
  };

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button className={styles.bellBtn} onClick={() => setOpen(!open)}>
        <Bell size={18} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Thông báo</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button className={styles.clearBtn} onClick={markAllRead}>Đã đọc</button>
              )}
              {notifications.length > 0 && (
                <button className={styles.clearBtn} onClick={clearAll}>Xoá tất cả</button>
              )}
            </div>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>Không có thông báo</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className={styles.itemIcon}>
                    {getIcon(n.type)}
                  </div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>{n.ticket?.title ?? `Ticket #${n.ticketId}`}</div>
                    <div className={styles.itemMessage}>{n.message}</div>
                  </div>
                  <div className={styles.itemTime}>{formatTime(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
