import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChartPie,
  Compass,
  CreditCard,
  Home,
  ListChecks,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from './store';
import { formatMoney, formatDateLong } from './lib';
import type { Role, Tab } from './types';
import { Avatar, IconButton, Logo, Toasts } from './components/ui';
import { NotificationsSheet, ProfileSheet } from './components/dialogs';
import { ParentHome } from './screens/parent/Home';
import { BudgetScreen } from './screens/parent/Budget';
import { TasksScreen } from './screens/shared/TasksScreen';
import { GoalsScreen } from './screens/shared/GoalsScreen';
import { FamilyScreen } from './screens/parent/Family';
import { KidHome } from './screens/kid/KidHome';
import { MissionsScreen } from './screens/kid/Missions';
import { AchievementsScreen } from './screens/kid/Achievements';
import { CardScreen } from './screens/shared/CardScreen';
import { TeenHome } from './screens/teen/TeenHome';
import { TeenBudget } from './screens/teen/TeenBudget';

interface NavItem {
  id: Tab;
  label: string;
  icon: LucideIcon;
}

const ALL_TABS: Tab[] = [
  'home',
  'budget',
  'tasks',
  'goals',
  'family',
  'card',
  'missions',
  'achievements',
];

const readHash = (): Tab => {
  const value = window.location.hash.replace('#', '');
  return ALL_TABS.includes(value as Tab) ? (value as Tab) : 'home';
};

const NAV: Record<Role, NavItem[]> = {
  parent: [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'budget', label: 'Бюджет', icon: ChartPie },
    { id: 'tasks', label: 'Задания', icon: ListChecks },
    { id: 'goals', label: 'Цели', icon: Target },
    { id: 'family', label: 'Семья', icon: Users },
  ],
  teen: [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'budget', label: 'Мой бюджет', icon: ChartPie },
    { id: 'tasks', label: 'Задания', icon: ListChecks },
    { id: 'goals', label: 'Цели', icon: Target },
    { id: 'card', label: 'Карта', icon: CreditCard },
  ],
  kid: [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'missions', label: 'Миссии', icon: Compass },
    { id: 'goals', label: 'Цели', icon: Target },
    { id: 'card', label: 'Карта', icon: CreditCard },
    { id: 'achievements', label: 'Награды', icon: Trophy },
  ],
};

export default function App() {
  const { state, currentMember, dispatch, notify, toasts, dismissToast } = useApp();
  const role = currentMember.role;
  const nav = NAV[role];
  const [tab, setTab] = useState<Tab>(readHash);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const previousProfile = useRef(state.profile);

  const activeTab: Tab = nav.some((item) => item.id === tab) ? tab : 'home';
  const reviewCount = state.tasks.filter(
    (task) => task.status === 'review' && (role === 'parent' || task.assignee === currentMember.id),
  ).length;

  useEffect(() => {
    if (previousProfile.current === state.profile) return;
    previousProfile.current = state.profile;
    setTab('home');
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0 });
  }, [state.profile]);

  useEffect(() => {
    const onHashChange = () => {
      setTab(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.role = role;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      const colors: Record<Role, string> = {
        parent: '#f5f1fc',
        teen: '#f1f6fd',
        kid: '#f8f2ff',
      };
      themeColor.setAttribute('content', colors[role]);
    }
    document.title = `${nav.find((item) => item.id === activeTab)?.label ?? 'Главная'} · Семья+`;
  }, [role, activeTab, nav]);

  const navigate = (next: Tab) => {
    setTab(next);
    const nextHash = `#${next}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchProfile = (profile: 'milana' | 'karina' | 'timur') => {
    if (profile === state.profile) return;
    const member = state.members.find((item) => item.id === profile);
    dispatch({ type: 'switch-profile', id: profile });
    notify(`Профиль «${member?.firstName ?? ''}»`, 'Интерфейс и данные переключены мгновенно');
  };

  const renderScreen = () => {
    if (role === 'parent') {
      if (activeTab === 'budget') return <BudgetScreen />;
      if (activeTab === 'tasks') return <TasksScreen />;
      if (activeTab === 'goals') return <GoalsScreen onNavigate={navigate} />;
      if (activeTab === 'family') return <FamilyScreen />;
      return <ParentHome onNavigate={navigate} />;
    }
    if (role === 'teen') {
      if (activeTab === 'budget') return <TeenBudget />;
      if (activeTab === 'tasks') return <TasksScreen />;
      if (activeTab === 'goals') return <GoalsScreen onNavigate={navigate} />;
      if (activeTab === 'card') return <CardScreen onNavigate={navigate} />;
      return <TeenHome onNavigate={navigate} />;
    }
    if (activeTab === 'missions') return <MissionsScreen />;
    if (activeTab === 'goals') return <GoalsScreen onNavigate={navigate} />;
    if (activeTab === 'card') return <CardScreen onNavigate={navigate} />;
    if (activeTab === 'achievements') return <AchievementsScreen onNavigate={navigate} />;
    return <KidHome onNavigate={navigate} />;
  };

  return (
    <div className="app" data-role={role}>
      <aside className="sidebar">
        <Logo />
        <nav className="sidebar__nav" aria-label="Основная навигация">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'is-active' : ''}`}
                onClick={() => navigate(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <Icon size={19} />
                {item.label}
                {item.id === 'tasks' && reviewCount > 0 && (
                  <span className="nav-item__badge">{reviewCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar__profiles">
          <div className="sidebar__profiles-title">
            Профиль семьи
            <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 700 }}>демо</span>
          </div>
          {state.members
            .filter((member) => ['milana', 'karina', 'timur'].includes(member.id))
            .map((member) => (
              <button
                key={member.id}
                className={`profile-mini ${state.profile === member.id ? 'is-active' : ''}`}
                onClick={() => switchProfile(member.id as 'milana' | 'karina' | 'timur')}
              >
                <Avatar member={member} size={30} />
                <span className="profile-mini__text">
                  <strong>{member.firstName}</strong>
                  <span>
                    {member.role === 'parent' ? 'Родитель' : member.role === 'teen' ? 'Подросток' : 'Ребёнок'}
                    {' · '}
                    {formatMoney(member.balance)}
                  </span>
                </span>
                {state.profile === member.id && (
                  <span className="profile-mini__check" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.4 6.2 11.5 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
        </div>

        <div className="sidebar__foot">
          <span className="status-dot" />
          Защищено ВТБ · демо-прототип<br />одна семья, три взгляда
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="topbar__brand" onClick={() => setProfileOpen(true)} aria-label="Открыть профиль">
            <Logo compact />
          </button>
          <div className="topbar__right">
            <span className="topbar__date">{formatDateLong()}</span>
            <IconButton
              label="Уведомления"
              className="notif-btn"
              onClick={() => {
                setNotificationsOpen(true);
                setUnread(false);
              }}
            >
              <Bell size={18} />
              {unread && reviewCount > 0 && <span className="notif-dot" />}
            </IconButton>
            <button className="topbar__profile" onClick={() => setProfileOpen(true)}>
              <span className="topbar__profile-text">
                <strong>{currentMember.firstName}</strong>
                <span>{role === 'parent' ? 'Родитель' : role === 'teen' ? 'Подросток' : 'Ребёнок'}</span>
              </span>
              <Avatar member={currentMember} size={36} />
            </button>
          </div>
        </header>

        <main className="main">{renderScreen()}</main>
      </div>

      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`mobile-nav__item ${activeTab === item.id ? 'is-active' : ''}`}
              onClick={() => navigate(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <Icon size={20} />
              {item.label}
              {item.id === 'tasks' && reviewCount > 0 && (
                <span className="mobile-nav__badge">{reviewCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onNavigate={navigate}
      />
      <NotificationsSheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={navigate}
      />
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
