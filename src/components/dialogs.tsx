import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  ClipboardCheck,
  Copy,
  CreditCard,
  ExternalLink,
  Flame,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../store';
import {
  deadlineLabel,
  formatMoney,
  percent,
  relativeDay,
} from '../lib';
import { REPO_URL } from '../config';
import type { Goal, Member, ProfileId, Tab, TaskKind } from '../types';
import {
  Avatar,
  ActorAvatar,
  Button,
  CategoryIcon,
  Chip,
  EmptyState,
  Progress,
  Sheet,
  Switch,
} from './ui';
import { GoalImage, GoalCelebration, TransactionList, roleLabel } from './common';
import { BankCard } from './BankCard';

const parseAmount = (value: string): number =>
  Math.round(Number(value.replace(/\s/g, '').replace(',', '.')) || 0);

const deadlineInput = (days = 30): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export function ProfileSheet({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: Tab) => void;
}) {
  const { state, currentMember, dispatch, notify } = useApp();
  const [resetOpen, setResetOpen] = useState(false);
  const profiles = state.members.filter((member) => ['milana', 'karina', 'timur'].includes(member.id));

  const switchProfile = (member: Member) => {
    dispatch({ type: 'switch-profile', id: member.id as ProfileId });
    notify(`Профиль «${member.firstName}»`, 'Интерфейс и данные переключены мгновенно');
    onClose();
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Профиль" subtitle="Один аккаунт — три взгляда на семейные деньги">
        <div className="profile-current">
          <Avatar member={currentMember} size={48} />
          <div className="profile-current__text">
            <strong>{currentMember.name}</strong>
            <span>{roleLabel(currentMember)} · {formatMoney(currentMember.balance)}</span>
          </div>
          <Chip tone="accent">Вы здесь</Chip>
        </div>

        <div className="section-head" style={{ marginTop: 8 }}>
          <div>
            <h2>Переключить профиль</h2>
            <p>Так работает семейный доступ в Семье+</p>
          </div>
        </div>
        <div>
          {profiles.map((member) => (
            <button
              key={member.id}
              className={`profile-option ${member.id === currentMember.id ? 'is-active' : ''}`}
              onClick={() => switchProfile(member)}
            >
              <Avatar member={member} size={40} />
              <span className="profile-option__text">
                <strong>{member.firstName}</strong>
                <span>{roleLabel(member)}</span>
              </span>
              {member.id === currentMember.id && <Check size={18} className="profile-option__check" />}
            </button>
          ))}
        </div>

        <hr className="divider" />

        <div className="settings-list">
          {currentMember.role === 'parent' ? (
            <button
              className="notification"
              onClick={() => {
                onNavigate('family');
                onClose();
              }}
            >
              <span className="notification__icon"><Users size={18} /></span>
              <span className="notification__text">
                <strong>Семейный профиль</strong>
                <span>Участники, лимиты и безопасность</span>
              </span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="notification"
              onClick={() => {
                onNavigate(currentMember.role === 'kid' ? 'achievements' : 'card');
                onClose();
              }}
            >
              <span className="notification__icon"><Sparkles size={18} /></span>
              <span className="notification__text">
                <strong>{currentMember.role === 'kid' ? 'Мои достижения' : 'Моя карта и приватность'}</strong>
                <span>{currentMember.role === 'kid' ? 'Уровень, серия и награды' : 'Настройки личных трат'}</span>
              </span>
              <ArrowRight size={16} />
            </button>
          )}
          <div className="switch-row">
            <span className="switch-row__text">
              <strong>Уведомления</strong>
              <span>Задания, лимиты и важные события семьи</span>
            </span>
            <Switch
              checked={state.settings.push}
              onChange={(value) => {
                dispatch({ type: 'update-settings', patch: { push: value } });
                notify(value ? 'Уведомления включены' : 'Уведомления выключены', undefined, 'info');
              }}
              label="Уведомления"
            />
          </div>
        </div>

        <hr className="divider" />

        <div className="danger-zone">
          <div>
            <strong>Демо-режим</strong>
            <span>Все изменения хранятся только в этом браузере</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetOpen(true)}
            icon={<RotateCcw size={14} />}
          >
            Сбросить
          </Button>
        </div>

        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="notification"
          style={{ marginTop: 8, textDecoration: 'none' }}
        >
          <span className="notification__icon"><ExternalLink size={18} /></span>
          <span className="notification__text">
            <strong>Проект «Семья+»</strong>
            <span>Концепт команды «Девочки и банки» · GitHub</span>
          </span>
          <ArrowRight size={16} />
        </a>
      </Sheet>

      <ResetSheet open={resetOpen} onClose={() => setResetOpen(false)} onDone={onClose} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function NotificationsSheet({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: Tab) => void;
}) {
  const { state, currentMember } = useApp();
  const reviewTasks = state.tasks.filter(
    (task) =>
      task.status === 'review' &&
      (currentMember.role === 'parent' || task.assignee === currentMember.id),
  );
  const activeTasks = state.tasks.filter(
    (task) => task.status === 'active' && task.assignee === currentMember.id,
  );
  const firstMission = state.missions.find((mission) => !mission.completed);
  const vacation = state.goals[0];

  const notifications = useMemo(() => {
    if (currentMember.role === 'parent') {
      return [
        reviewTasks.length
          ? {
              icon: <ClipboardCheck size={18} />,
              title: `${reviewTasks.length} ${reviewTasks.length === 1 ? 'задание ждёт' : 'задания ждут'} проверки`,
              text: `${reviewTasks[0].assignee === 'timur' ? 'Тимур' : 'Карина'} отметил${reviewTasks[0].assignee === 'karina' ? 'а' : ''} выполнение: «${reviewTasks[0].title}»`,
              time: '5 мин',
              tab: 'tasks' as Tab,
            }
          : null,
        vacation
          ? {
              icon: <Target size={18} />,
              title: 'Цель «Сочи» ближе ещё на шаг',
              text: `Накоплено ${formatMoney(vacation.saved)} из ${formatMoney(vacation.target)}. Осталось ${formatMoney(Math.max(0, vacation.target - vacation.saved))}.`,
              time: '1 ч',
              tab: 'goals' as Tab,
            }
          : null,
        {
          icon: <Sparkles size={18} />,
          title: 'AI-прогноз расходов обновлён',
          text: 'Кафе и доставка растут быстрее обычного. Посмотрите, где можно сэкономить без потери качества.',
          time: '3 ч',
          tab: 'budget' as Tab,
        },
      ].filter(Boolean) as {
        icon: React.ReactNode;
        title: string;
        text: string;
        time: string;
        tab: Tab;
      }[];
    }

    if (currentMember.role === 'teen') {
      return [
        activeTasks[0]
          ? {
              icon: <ClipboardCheck size={18} />,
              title: 'Новое задание от мамы',
              text: `«${activeTasks[0].title}» · награда ${formatMoney(activeTasks[0].reward)}`,
              time: '10 мин',
              tab: 'tasks' as Tab,
            }
          : null,
        {
          icon: <CreditCard size={18} />,
          title: 'Дневной лимит почти израсходован',
          text: `Потрачено ${formatMoney(currentMember.spentToday)} из ${formatMoney(currentMember.dailyLimit)}. Остаток обновится завтра.`,
          time: '2 ч',
          tab: 'card' as Tab,
        },
        {
          icon: <Target size={18} />,
          title: 'Твой вклад в «Ноутбук»',
          text: 'Ты уже накопил 11 000 ₽. Ещё немного — и цель станет реальностью.',
          time: 'вчера',
          tab: 'goals' as Tab,
        },
      ].filter(Boolean) as {
        icon: React.ReactNode;
        title: string;
        text: string;
        time: string;
        tab: Tab;
      }[];
    }

    return [
      firstMission
        ? {
            icon: <Sparkles size={18} />,
            title: `Новый квест: «${firstMission.title}»`,
            text: `+${firstMission.rewardXp} искр и ${formatMoney(firstMission.rewardMoney)} на карту. Начни прямо сейчас!`,
            time: 'сейчас',
            tab: 'missions' as Tab,
          }
        : null,
      reviewTasks[0]
        ? {
            icon: <ClipboardCheck size={18} />,
            title: 'Мама уже проверяет задание',
            text: `«${reviewTasks[0].title}» на проверке. Как только мама подтвердит — награда придёт на карту.`,
            time: '20 мин',
            tab: 'home' as Tab,
          }
        : null,
      {
        icon: <Flame size={18} />,
        title: 'Серия 6 дней подряд',
        text: 'Загляни завтра, чтобы получить 7-й день и бонусные искры.',
        time: 'сегодня',
        tab: 'achievements' as Tab,
      },
    ].filter(Boolean) as {
      icon: React.ReactNode;
      title: string;
      text: string;
      time: string;
      tab: Tab;
    }[];
  }, [currentMember, reviewTasks, activeTasks, firstMission, vacation]);

  return (
    <Sheet open={open} onClose={onClose} title="Уведомления" subtitle="Только то, что действительно важно">
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} />}
          title="Пока тихо"
          text="Здесь появятся новости семьи, задания и напоминания."
        />
      ) : (
        <div className="notifications-list">
          {notifications.map((notification, index) => (
            <button
              key={`${notification.title}-${index}`}
              className="notification"
              onClick={() => {
                onNavigate(notification.tab);
                onClose();
              }}
            >
              <span className="notification__icon">{notification.icon}</span>
              <span className="notification__text">
                <strong>{notification.title}</strong>
                <span>{notification.text}</span>
              </span>
              <span className="notification__time">{notification.time}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Transfer                                                           */
/* ------------------------------------------------------------------ */

export function TransferSheet({
  open,
  onClose,
  initialMember = 'timur',
}: {
  open: boolean;
  onClose: () => void;
  initialMember?: ProfileId;
}) {
  const { state, dispatch, notify } = useApp();
  const targets = state.members.filter((member) => member.role !== 'parent');
  const [memberId, setMemberId] = useState<ProfileId>(initialMember);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMemberId(initialMember);
      setAmount('');
      setError('');
    }
  }, [open, initialMember]);

  const target = state.members.find((member) => member.id === memberId) ?? targets[0];
  const parsed = parseAmount(amount);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!parsed || parsed < 100) {
      setError('Минимальная сумма перевода — 100 ₽');
      return;
    }
    if (parsed > state.familyBalance) {
      setError('На семейном бюджете недостаточно средств');
      return;
    }
    dispatch({ type: 'transfer', memberId, amount: parsed });
    notify(`${formatMoney(parsed)} зачислено на карту`, `${target.firstName} · ${target.cardLast4}`);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Пополнить карту"
      subtitle={`Доступно на семейном бюджете: ${formatMoney(state.familyBalance)}`}
      footer={
        <Button type="submit" form="transfer-form" size="lg" full>
          Перевести {parsed > 0 ? formatMoney(parsed) : ''}
        </Button>
      }
    >
      <form id="transfer-form" className="stack" onSubmit={submit}>
        <div className="field">
          <span className="field__label">Кому</span>
          <div className="quick-amounts">
            {targets.map((member) => (
              <button
                type="button"
                key={member.id}
                className={`profile-option ${member.id === memberId ? 'is-active' : ''}`}
                style={{ width: 'auto', padding: '5px 9px 5px 5px', flex: 1 }}
                onClick={() => {
                  setMemberId(member.id as ProfileId);
                  setError('');
                }}
              >
                <Avatar member={member} size={30} />
                <span className="profile-option__text">
                  <strong style={{ fontSize: 12 }}>{member.firstName}</strong>
                  <span style={{ fontSize: 9.5 }}>{formatMoney(member.balance)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="transfer-amount">Сумма</label>
          <div className="amount-input">
            <input
              id="transfer-amount"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value.replace(/[^\d\s]/g, ''));
                setError('');
              }}
            />
            <span>₽</span>
          </div>
          <div className="quick-amounts">
            {[500, 1_000, 3_000, 5_000].map((value) => (
              <button type="button" key={value} onClick={() => setAmount(String(value))}>
                {formatMoney(value)}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="hidden-note">
          <ShieldCheck size={13} />
          Перевод внутри семьи без комиссии. Деньги придут на карту мгновенно.
        </div>
      </form>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Goal detail & create                                               */
/* ------------------------------------------------------------------ */

export function GoalDetailSheet({
  goal,
  open,
  onClose,
}: {
  goal: Goal | null;
  open: boolean;
  onClose: () => void;
}) {
  const { state, currentMember, dispatch, notify } = useApp();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const parsed = parseAmount(amount);
  const isParent = currentMember.role === 'parent';
  const source = isParent ? 'family' : currentMember.id;
  const available = isParent ? state.familyBalance : currentMember.balance;
  const done = goal ? goal.saved >= goal.target : false;

  useEffect(() => {
    if (open) {
      setAmount('');
      setError('');
    }
  }, [open, goal?.id]);

  if (!goal) return null;

  const progress = percent(goal.saved, goal.target);
  const quickAmounts = isParent ? [1_000, 3_000, 5_000] : [100, 300, 500];

  const contribute = (event: React.FormEvent) => {
    event.preventDefault();
    if (!parsed || parsed < 50) {
      setError('Минимальный вклад — 50 ₽');
      return;
    }
    if (parsed > available) {
      setError(isParent ? 'На семейном бюджете недостаточно средств' : 'На карте недостаточно средств');
      return;
    }
    dispatch({ type: 'contribute', goalId: goal.id, amount: parsed, from: source });
    const reached = goal.saved + parsed >= goal.target;
    notify(
      reached ? 'Цель достигнута!' : 'Вклад добавлен',
      reached ? `«${goal.title}» — можно планировать!` : `${formatMoney(parsed)} приблизили «${goal.title}»`,
    );
    setAmount('');
    setError('');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Семейная цель"
      subtitle={deadlineLabel(goal.deadline)}
      footer={
        done ? (
          <Button variant="soft" size="lg" full onClick={onClose}>
            Цель уже достигнута
          </Button>
        ) : (
          <Button type="submit" form="goal-contribute-form" size="lg" full>
            {isParent ? 'Пополнить из семейного бюджета' : 'Внести со своей карты'}
          </Button>
        )
      }
    >
      <div className="goal-detail__hero">
        <GoalImage image={goal.image} />
        <div>
          <strong>{goal.title}</strong>
          <p>{goal.subtitle}</p>
          <div style={{ marginTop: 8 }}>{done ? <GoalCelebration goal={goal} /> : <Chip tone="accent">{Math.round(progress)}% собрано</Chip>}</div>
        </div>
      </div>

      <div className="goal-detail__stats">
        <div className="goal-detail__stat">
          <span>Накоплено</span>
          <strong>{formatMoney(goal.saved)}</strong>
        </div>
        <div className="goal-detail__stat">
          <span>Цель</span>
          <strong>{formatMoney(goal.target)}</strong>
        </div>
        <div className="goal-detail__stat">
          <span>Осталось</span>
          <strong>{formatMoney(Math.max(0, goal.target - goal.saved))}</strong>
        </div>
      </div>

      <Progress value={progress} color="var(--accent)" height={10} track="var(--chart-track)" />
      <div className="row row--between" style={{ marginTop: 6, fontSize: 10.5, color: 'var(--muted)' }}>
        <span>{formatMoney(goal.saved)}</span>
        <span>{formatMoney(goal.target)}</span>
      </div>

      {!done && (
        <form id="goal-contribute-form" className="stack" style={{ marginTop: 18 }} onSubmit={contribute}>
          <div className="field">
            <label htmlFor="goal-amount">Сумма вклада</label>
            <div className="amount-input">
              <input
                id="goal-amount"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value.replace(/[^\d\s]/g, ''));
                  setError('');
                }}
              />
              <span>₽</span>
            </div>
            <div className="quick-amounts">
              {quickAmounts.map((value) => (
                <button type="button" key={value} onClick={() => setAmount(String(value))}>
                  {formatMoney(value)}
                </button>
              ))}
            </div>
            <span className="field-hint">
              Доступно: {formatMoney(available)} · {isParent ? 'семейный бюджет' : 'твоя карта'}
            </span>
          </div>
          {error && <div className="form-error">{error}</div>}
        </form>
      )}

      <div className="section-head" style={{ marginTop: 20 }}>
        <div>
          <h2>Кто уже вложился</h2>
          <p>{goal.contributions.length} {goal.contributions.length === 1 ? 'вклад' : 'вкладов'}</p>
        </div>
      </div>
      <div className="contribution-list">
        {goal.contributions.map((contribution) => {
          const member = state.members.find((item) => item.id === contribution.memberId);
          const isYou = contribution.memberId === currentMember.id;
          return (
            <div className="contribution" key={contribution.id}>
              {contribution.memberId === 'family' ? (
                <ActorAvatar actor="family" members={state.members} size={32} />
              ) : (
                <Avatar member={member ?? currentMember} size={32} />
              )}
              <span className="contribution__text">
                <strong>{contribution.memberId === 'family' ? 'Семейный бюджет' : isYou ? 'Ты' : member?.firstName ?? 'Участник'}</strong>
                <span>{relativeDay(contribution.date)}</span>
              </span>
              <span className="contribution__amount">{formatMoney(contribution.amount)}</span>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

export function GoalCreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch, notify } = useApp();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState(deadlineInput(180));
  const [image, setImage] = useState<Goal['image']>('spark');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setSubtitle('');
      setTarget('');
      setDeadline(deadlineInput(180));
      setImage('spark');
      setError('');
    }
  }, [open]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseAmount(target);
    if (title.trim().length < 3) {
      setError('Назовите цель понятно — минимум 3 символа');
      return;
    }
    if (amount < 1_000) {
      setError('Минимальная сумма цели — 1 000 ₽');
      return;
    }
    if (!deadline) {
      setError('Укажите дату, к которой хотите накопить');
      return;
    }
    dispatch({
      type: 'create-goal',
      title: title.trim(),
      subtitle: subtitle.trim() || 'Новая цель нашей семьи',
      target: amount,
      deadline: new Date(`${deadline}T12:00:00`).toISOString(),
      image,
    });
    notify('Новая семейная цель создана', `«${title.trim()}» · ${formatMoney(amount)}`);
    onClose();
  };

  const images: { value: Goal['image']; label: string }[] = [
    { value: 'spark', label: 'Мечта' },
    { value: 'vacation', label: 'Отпуск' },
    { value: 'bike', label: 'Спорт' },
    { value: 'laptop', label: 'Техника' },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Новая цель"
      subtitle="Копите вместе — видеть прогресс гораздо приятнее"
      footer={
        <Button type="submit" form="goal-create-form" size="lg" full>
          Создать цель
        </Button>
      }
    >
      <form id="goal-create-form" className="stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="goal-title">Название</label>
          <input
            id="goal-title"
            placeholder="Например, поездка в Сочи"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={40}
          />
        </div>
        <div className="field">
          <label htmlFor="goal-subtitle">Зачем вам это</label>
          <input
            id="goal-subtitle"
            placeholder="Море, горы и вся семья вместе"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            maxLength={70}
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="goal-target">Сумма</label>
            <div className="amount-input">
              <input
                id="goal-target"
                inputMode="numeric"
                placeholder="180 000"
                value={target}
                onChange={(event) => {
                  setTarget(event.target.value.replace(/[^\d\s]/g, ''));
                  setError('');
                }}
              />
              <span>₽</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="goal-deadline">К дате</label>
            <input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <span className="field__label">Обложка</span>
          <div className="quick-amounts">
            {images.map((item) => (
              <button
                type="button"
                key={item.value}
                className={image === item.value ? 'is-active' : ''}
                onClick={() => setImage(item.value)}
                style={
                  image === item.value
                    ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent-strong)' }
                    : undefined
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="form-error">{error}</div>}
      </form>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Tasks                                                              */
/* ------------------------------------------------------------------ */

export function TaskCreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch, notify } = useApp();
  const children = state.members.filter((member) => member.role !== 'parent');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [assignee, setAssignee] = useState<ProfileId>('timur');
  const [reward, setReward] = useState('150');
  const [due, setDue] = useState(deadlineInput(1));
  const [kind, setKind] = useState<TaskKind>('chores');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setNote('');
      setAssignee('timur');
      setReward('150');
      setDue(deadlineInput(1));
      setKind('chores');
      setError('');
    }
  }, [open]);

  const kinds: { value: TaskKind; label: string }[] = [
    { value: 'chores', label: 'Домашние дела' },
    { value: 'study', label: 'Учёба' },
    { value: 'care', label: 'Забота' },
    { value: 'sport', label: 'Спорт' },
  ];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseAmount(reward);
    if (title.trim().length < 3) {
      setError('Опишите задание — минимум 3 символа');
      return;
    }
    if (amount < 50) {
      setError('Минимальная награда — 50 ₽');
      return;
    }
    if (amount > 5_000) {
      setError('Максимальная награда в демо — 5 000 ₽');
      return;
    }
    const dueDate = new Date(`${due}T20:00:00`);
    if (!due || Number.isNaN(dueDate.getTime())) {
      setError('Укажите срок выполнения');
      return;
    }
    dispatch({
      type: 'create-task',
      title: title.trim(),
      note: note.trim() || 'Без дополнительных условий',
      assignee,
      reward: amount,
      due: dueDate.toISOString(),
      kind,
    });
    notify('Задание создано', `${children.find((child) => child.id === assignee)?.firstName}: «${title.trim()}»`);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Новое задание"
      subtitle="Ребёнок выполняет — семья платит за результат"
      footer={
        <Button type="submit" form="task-create-form" size="lg" full>
          Создать задание
        </Button>
      }
    >
      <form id="task-create-form" className="stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="task-title">Что сделать</label>
          <input
            id="task-title"
            placeholder="Например, помыть посуду"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={60}
          />
        </div>
        <div className="field">
          <label htmlFor="task-note">Уточнение</label>
          <input
            id="task-note"
            placeholder="После ужина, без напоминаний"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={90}
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="task-assignee">Кому</label>
            <select
              id="task-assignee"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value as ProfileId)}
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.firstName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="task-reward">Награда</label>
            <div className="amount-input">
              <input
                id="task-reward"
                inputMode="numeric"
                value={reward}
                onChange={(event) => {
                  setReward(event.target.value.replace(/[^\d\s]/g, ''));
                  setError('');
                }}
              />
              <span>₽</span>
            </div>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="task-due">Срок</label>
            <input id="task-due" type="date" value={due} onChange={(event) => setDue(event.target.value)} />
          </div>
          <div className="field">
            <label>Тип</label>
            <select value={kind} onChange={(event) => setKind(event.target.value as TaskKind)}>
              {kinds.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <span className="field__label">Быстрая награда</span>
          <div className="quick-amounts">
            {[100, 200, 500].map((value) => (
              <button type="button" key={value} onClick={() => setReward(String(value))}>
                {formatMoney(value)}
              </button>
            ))}
          </div>
          <span className="field-hint">Ребёнок получит награду после вашего подтверждения.</span>
        </div>
        {error && <div className="form-error">{error}</div>}
      </form>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Category limit                                                     */
/* ------------------------------------------------------------------ */

export function CategoryLimitSheet({
  categoryId,
  spent,
  open,
  onClose,
}: {
  categoryId: string | null;
  spent?: number;
  open: boolean;
  onClose: () => void;
}) {
  const { state, dispatch, notify } = useApp();
  const category = state.categories.find((item) => item.id === categoryId);
  const [limit, setLimit] = useState(0);

  useEffect(() => {
    if (open && category) setLimit(category.limit);
  }, [open, category]);

  if (!category) return null;

  const used = typeof spent === 'number' ? spent : category.spent;
  const max = Math.max(60_000, Math.ceil(used / 10_000) * 10_000 + 10_000);

  const save = () => {
    dispatch({ type: 'set-limit', categoryId: category.id, limit });
    notify('Лимит обновлён', `${category.label}: ${formatMoney(limit)} в месяц`);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Лимит: ${category.label}`}
      subtitle="Мягкое ограничение с напоминанием, когда останется 20%"
      footer={
        <Button size="lg" full onClick={save}>
          Сохранить лимит
        </Button>
      }
    >
      <div className="row" style={{ gap: 12, padding: 14, borderRadius: 15, background: 'var(--surface-soft)' }}>
        <span
          className="category-row__icon"
          style={{ background: `color-mix(in srgb, ${category.color} 14%, white)`, color: category.color }}
        >
          <CategoryIcon name={category.icon} size={20} />
        </span>
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: 13, display: 'block' }}>{category.label}</strong>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            Потрачено {formatMoney(used)} из {formatMoney(limit)}
          </span>
        </div>
        {used > limit ? <Chip tone="danger">Превышен</Chip> : <Chip tone="success">В норме</Chip>}
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="row row--between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)' }}>Лимит на месяц</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.04em' }}>
            {formatMoney(limit)}
          </span>
        </div>
        <input
          type="range"
          className="range"
          min={0}
          max={max}
          step={500}
          value={limit}
          aria-label="Лимит на категорию"
          style={{ '--fill': `${(limit / max) * 100}%` } as CSSProperties}
          onChange={(event) => setLimit(Number(event.target.value))}
        />
        <div className="row row--between" style={{ fontSize: 10, color: 'var(--muted)' }}>
          <span>0 ₽</span>
          <span>{formatMoney(max)}</span>
        </div>
        <div className="quick-amounts" style={{ marginTop: 12 }}>
          {[5_000, 10_000, 20_000, 40_000].filter((value) => value <= max).map((value) => (
            <button type="button" key={value} onClick={() => setLimit(value)}>
              {formatMoney(value)}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden-note" style={{ marginTop: 18 }}>
        <Sparkles size={13} />
        Когда останется 20% лимита, AI предложит альтернативы и предупредит в семейном чате.
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Family member                                                      */
/* ------------------------------------------------------------------ */

export function MemberSheet({
  memberId,
  open,
  onClose,
}: {
  memberId: Member['id'] | null;
  open: boolean;
  onClose: () => void;
}) {
  const { state, dispatch, notify } = useApp();
  const member = state.members.find((item) => item.id === memberId);
  const [daily, setDaily] = useState(500);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (open && member) {
      setDaily(member.dailyLimit);
      setBlocked(member.blockedCategories);
    }
  }, [open, member?.id]);

  if (!member) return null;

  const isChild = member.role !== 'parent';
  const transactions = state.transactions
    .filter((transaction) => transaction.memberId === member.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const blockedOptions = state.categories.filter((category) =>
    ['subscriptions', 'cafes', 'entertainment', 'clothes'].includes(category.id),
  );

  const toggleBlocked = (categoryId: string) => {
    setBlocked((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  };

  const save = () => {
    dispatch({ type: 'set-daily-limit', memberId: member.id, limit: daily });
    const all = blockedOptions.map((category) => category.id);
    for (const categoryId of all) {
      const was = member.blockedCategories.includes(categoryId);
      const will = blocked.includes(categoryId);
      if (was !== will) {
        dispatch({ type: 'toggle-blocked-category', memberId: member.id, categoryId });
      }
    }
    notify('Настройки карты сохранены', `${member.firstName} · лимит ${formatMoney(daily)} в день`);
    onClose();
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title="Участник семьи"
        subtitle="Карта, лимиты и безопасность"
        footer={
          isChild ? (
            <Button size="lg" full onClick={save}>
              Сохранить изменения
            </Button>
          ) : undefined
        }
      >
        <div className="member-detail">
          <Avatar member={member} size={54} />
          <div className="member-detail__text">
            <strong>{member.name}</strong>
            <span>{roleLabel(member)} · карта •• {member.cardLast4}</span>
          </div>
          <Chip tone={member.frozen ? 'danger' : 'success'}>
            {member.frozen ? 'Заморожена' : 'Активна'}
          </Chip>
        </div>

        <div className="row row--between" style={{ marginTop: 16 }}>
          <div>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Баланс карты</span>
            <strong style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.04em' }}>
              {formatMoney(member.balance)}
            </strong>
          </div>
          <div className="row" style={{ gap: 7 }}>
            <Button variant="secondary" size="sm" icon={<CreditCard size={14} />} onClick={() => setDetailsOpen(true)}>
              Реквизиты
            </Button>
            {isChild && (
              <Button variant="soft" size="sm" icon={<Plus size={14} />} onClick={() => setTransferOpen(true)}>
                Пополнить
              </Button>
            )}
          </div>
        </div>

        <div className="switch-row" style={{ marginTop: 8 }}>
          <span className="switch-row__text">
            <strong>Заморозить карту</strong>
            <span>Покупки и списания станут недоступны до разморозки</span>
          </span>
          <Switch
            checked={member.frozen}
            onChange={(value) => {
              dispatch({ type: 'freeze-card', memberId: member.id, frozen: value });
              notify(value ? 'Карта заморожена' : 'Карта снова активна', `${member.firstName} · •• ${member.cardLast4}`);
            }}
            label="Заморозить карту"
          />
        </div>

        <div className="switch-row">
          <span className="switch-row__text">
            <strong>Показывать траты в семейной ленте</strong>
            <span>Если выключить, операции ребёнка скроются от родителей</span>
          </span>
          <Switch
            checked={!member.privateSpending}
            onChange={(value) => {
              dispatch({ type: 'set-private', memberId: member.id, value: !value });
              notify(
                value ? 'Траты снова видны семье' : 'Траты скрыты',
                value ? 'Операции появятся в ленте' : 'Приватность включена',
                'info',
              );
            }}
            label="Показывать траты в семейной ленте"
          />
        </div>

        {isChild && (
          <>
            <div className="limit-block">
              <div className="limit-block__head">
                <strong>Дневной лимит</strong>
                <span>{formatMoney(daily)}</span>
              </div>
              <input
                type="range"
                className="range"
                min={100}
                max={5_000}
                step={100}
                value={daily}
                aria-label="Дневной лимит"
                style={{ '--fill': `${(daily / 5_000) * 100}%` } as CSSProperties}
                onChange={(event) => setDaily(Number(event.target.value))}
              />
              <div className="limit-presets">
                {[300, 500, 1_000, 1_500].map((value) => (
                  <button
                    key={value}
                    className={daily === value ? 'is-active' : ''}
                    onClick={() => setDaily(value)}
                    type="button"
                  >
                    {formatMoney(value)}
                  </button>
                ))}
              </div>
            </div>

            <div className="limit-block">
              <div className="limit-block__head">
                <strong>Категории</strong>
                <span style={{ fontFamily: 'inherit', fontSize: 10.5, color: 'var(--muted)' }}>
                  {blocked.length ? `Заблокировано: ${blocked.length}` : 'Всё разрешено'}
                </span>
              </div>
              {blockedOptions.map((category) => {
                const isBlocked = blocked.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    className="row row--between"
                    style={{ width: '100%', padding: '9px 0', border: 0, background: 'none' }}
                    onClick={() => toggleBlocked(category.id)}
                  >
                    <span className="row" style={{ gap: 9 }}>
                      <span
                        className="task-emoji"
                        style={{
                          width: 32,
                          height: 32,
                          background: `color-mix(in srgb, ${category.color} 12%, white)`,
                          color: category.color,
                        }}
                      >
                        <CategoryIcon name={category.icon} size={15} />
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{category.label}</span>
                    </span>
                    <span className={`permission-chip ${isBlocked ? 'is-blocked' : ''}`}>
                      {isBlocked ? <><Lock size={11} /> Заблокировано</> : <><Check size={11} /> Разрешено</>}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="section-head" style={{ marginTop: 20 }}>
          <div>
            <h2>Последние операции</h2>
            <p>По карте •• {member.cardLast4}</p>
          </div>
        </div>
        {transactions.length ? (
          <TransactionList transactions={transactions} limit={4} compact showActor={false} />
        ) : (
          <EmptyState
            icon={<CreditCard size={20} />}
            title="Пока нет операций"
            text="Первая покупка появится здесь сразу после оплаты."
          />
        )}

        {isChild && (
          <div className="hidden-note" style={{ marginTop: 14 }}>
            <ShieldCheck size={13} />
            Поведенческий anti-fraud следит за нетипичными списаниями и блокирует подозрительные операции.
          </div>
        )}
      </Sheet>

      <TransferSheet
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        initialMember={member.id as ProfileId}
      />
      <CardDetailsSheet memberId={member.id} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Card details                                                       */
/* ------------------------------------------------------------------ */

export function CardDetailsSheet({
  memberId,
  open,
  onClose,
}: {
  memberId: Member['id'] | null;
  open: boolean;
  onClose: () => void;
}) {
  const { state, dispatch, notify } = useApp();
  const member = state.members.find((item) => item.id === memberId);
  if (!member) return null;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(`2200 2400 1234 ${member.cardLast4}`);
      notify('Номер карты скопирован', `•• ${member.cardLast4}`, 'info');
    } catch {
      notify('Не удалось скопировать', 'Выделите номер карты вручную', 'error');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Реквизиты карты"
      subtitle="Демо-карта для прототипа. Реальные данные не используются."
      footer={
        <Button size="lg" full icon={<Copy size={16} />} onClick={copyNumber}>
          Скопировать номер
        </Button>
      }
    >
      <BankCard member={member} fullNumber />
      <div className="stack" style={{ marginTop: 18 }}>
        <div className="switch-row">
          <span className="switch-row__text">
            <strong>Срок действия</strong>
            <span>09/29</span>
          </span>
        </div>
        <div className="switch-row">
          <span className="switch-row__text">
            <strong>Владелец</strong>
            <span>{member.name}</span>
          </span>
        </div>
        <div className="switch-row">
          <span className="switch-row__text">
            <strong>Статус</strong>
            <span>{member.frozen ? 'Заморожена' : 'Активна'}</span>
          </span>
          <Switch
            checked={!member.frozen}
            onChange={(value) =>
              dispatch({ type: 'freeze-card', memberId: member.id, frozen: !value })
            }
            label="Статус карты"
          />
        </div>
      </div>
      <div className="hidden-note" style={{ marginTop: 14 }}>
        <Lock size={13} />
        Реквизиты защищены. Никому не сообщайте CVV и коды из СМС.
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Invite & reset                                                     */
/* ------------------------------------------------------------------ */

export function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, notify } = useApp();
  const inviteLink = 'https://semya.plus/invite/SEMYA-4821';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      notify('Ссылка скопирована', 'Отправьте её члену семьи', 'info');
    } catch {
      notify('Не удалось скопировать', 'Скопируйте ссылку вручную', 'error');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Пригласить в семью"
      subtitle="Один семейный профиль для всех"
      footer={
        <Button size="lg" full icon={<Copy size={16} />} onClick={copy}>
          Скопировать ссылку
        </Button>
      }
    >
      <div className="family-hero__avatars" style={{ marginBottom: 18 }}>
        {state.members.map((member) => (
          <Avatar key={member.id} member={member} size={48} />
        ))}
        <span
          className="avatar"
          style={{
            width: 48,
            height: 48,
            marginLeft: -10,
            background: 'var(--surface-strong)',
            color: 'var(--accent)',
            borderColor: 'var(--surface)',
          }}
        >
          <UserPlus size={18} />
        </span>
      </div>
      <div className="field">
        <span className="field__label">Ссылка-приглашение</span>
        <input readOnly value={inviteLink} onFocus={(event) => event.target.select()} />
      </div>
      <div className="hidden-note" style={{ marginTop: 12 }}>
        <ShieldCheck size={13} />
        Приглашение действует 7 дней. Доступ к бюджету настраивается отдельно для каждого участника.
      </div>
      <div className="settings-list" style={{ marginTop: 14 }}>
        <div className="notification" style={{ cursor: 'default' }}>
          <span className="notification__icon"><Users size={18} /></span>
          <span className="notification__text">
            <strong>{state.members.length} участника уже в семье</strong>
            <span>Милана, Руслан, Карина и Тимур</span>
          </span>
        </div>
      </div>
    </Sheet>
  );
}

export function ResetSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { dispatch, notify } = useApp();
  const reset = () => {
    dispatch({ type: 'reset' });
    notify('Демо-данные восстановлены', 'Все изменения сброшены', 'info');
    onClose();
    onDone?.();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Сбросить демо?"
      subtitle="Это вернёт исходные балансы, задания, цели и миссии"
      footer={
        <div className="row" style={{ gap: 8 }}>
          <Button variant="secondary" size="lg" full onClick={onClose}>
            Отмена
          </Button>
          <Button variant="danger" size="lg" full onClick={reset}>
            Сбросить
          </Button>
        </div>
      }
    >
      <div className="security-card" style={{ background: 'var(--red-soft)', borderColor: '#ffd3db' }}>
        <span className="security-card__icon" style={{ background: '#ffe0e6', color: 'var(--red)' }}>
          <RotateCcw size={18} />
        </span>
        <div>
          <strong>Данные хранятся только в этом браузере</strong>
          <p>Сброс затронет балансы, задания, цели, миссии и настройки. Демо вернётся к исходному состоянию.</p>
        </div>
      </div>
    </Sheet>
  );
}
