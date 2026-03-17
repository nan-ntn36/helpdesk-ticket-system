import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectUser, selectUserRole } from '@/features/auth/authSelectors';
import { logoutThunk } from '@/features/auth/authThunks';
import {
  LayoutDashboard, Ticket, Plus, Users, FolderOpen,
  UserCircle, LogOut, TicketCheck, ChevronLeft, Menu,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectUserRole);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/auth/login');
  };

  const mainNav = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: role === 'ADMIN' || role === 'AGENT' },
    { to: '/app/tickets', icon: Ticket, label: 'Tickets', show: true },
    { to: '/app/tickets/new', icon: Plus, label: 'New Ticket', show: true },
    { to: '/app/profile', icon: UserCircle, label: 'Profile', show: true },
  ];

  const adminNav = [
    { to: '/admin/users', icon: Users, label: 'Users', show: role === 'ADMIN' },
    { to: '/admin/categories', icon: FolderOpen, label: 'Categories', show: role === 'ADMIN' },
  ];

  const renderNavItem = (item: typeof mainNav[0]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/app/tickets'}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.navActive : ''}`
      }
      title={item.label}
    >
      <item.icon size={20} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBox} onClick={() => navigate('/app/dashboard')} style={{ cursor: 'pointer' }}>
            <TicketCheck size={20} />
          </div>
          {!collapsed && (
            <div className={styles.logoTextWrap} onClick={() => navigate('/app/dashboard')} style={{ cursor: 'pointer' }}>
              <span className={styles.logoText}>HelpDesk</span>
              <span className={styles.logoSub}>SYSTEM</span>
            </div>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {!collapsed && <div className={styles.navSection}>MAIN</div>}
          {mainNav.filter(i => i.show).map(renderNavItem)}

          {adminNav.some(i => i.show) && (
            <>
              {!collapsed && <div className={styles.navSection}>ADMIN</div>}
              {adminNav.filter(i => i.show).map(renderNavItem)}
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className={styles.userMeta}>
                <span className={styles.userName}>{user?.fullName}</span>
                <span className={styles.userRole}>{role}</span>
              </div>
            )}
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Header Bar */}
      <header className={`${styles.header} ${collapsed ? styles.headerExpanded : ''}`}>
        <div className={styles.headerSearch}>
          <Search size={16} className={styles.headerSearchIcon} />
          <input
            className={styles.headerSearchInput}
            placeholder="Search anything..."
            readOnly
          />
          <span className={styles.headerSearchHint}>⌘K</span>
        </div>
        <div className={styles.headerActions}>
          <NotificationDropdown />
          <div className={styles.headerAvatar}>
            {user?.fullName?.charAt(0).toUpperCase()}{user?.fullName?.split(' ').pop()?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${styles.main} ${collapsed ? styles.mainExpanded : ''}`}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
