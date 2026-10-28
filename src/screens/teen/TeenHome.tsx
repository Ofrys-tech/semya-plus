import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  Eye,
  EyeOff,
  Gift,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../store';
import {
  formatDateLong,
  formatMoney,
  isInMonth,
  getLevel,
  greeting,
  percent,
  relativeDay,
} from '../../lib';
import type { Tab } from '../../types';
import {
  Avatar,
  Button,
  Chip,
  Money,
  Progress,
  RingProgress,
  SectionHead,
  Switch,
  TaskIcon,
} from '../../components/ui';
import { Sparkline } from '../../components/charts';
import {
  GoalImage,
  TransactionList,
  visibleTransactions,
} from '../../components/common';
import { GoalDetailSheet } from '../../components/dialogs';

export function TeenHome({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { state, currentMember, hidden, toggleHidden, dispatch, notify } = useApp();
  const [goalId, setGoalId] = useState<string | null>(null);
  const level = getLevel(currentMember.xp);
  const tasks = state.tasks.filter((task) => task.assignee === currentMember.id);
  const activeTasks = tasks.filter((task) => task.status !== 'done');
  const laptop = state.goals.find((goal) => goal.image === 'laptop') ?? state.goals[0];
  const ownLaptop = laptop
    ? laptop.contributions
        .filter((contribution) => contribution.memberId === currentMember.id)
        .reduce((sum, contribution) => sum + contribution.amount, 0)
    : 0;
  const transactions = visibleTransactions(state, currentMember);
  const selectedGoal = state.goals.find((goal) => goal.id === goalId) ?? null;
  const categorySpend = new Map<string, number>();
  transactions
    .filter((transaction) => transaction.amount < 0 && isInMonth(transaction.date, 0))
    .forEach((transaction) => {
      categorySpend.set(
        transaction.categoryId,
        (categorySpend.get(transaction.categoryId) ?? 0) + Math.abs(transaction.amount),
      );
    });
  const topCategory = [...categorySpend.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCategoryInfo = topCategory
    ? state.categories.find((category) => category.id === topCategory[0])
    : undefined;

  const submitTask = (id: string, title: string) => {
    dispatch({ type: 'submit-task', id });
    notify('Отправлено маме', `«${title}» ждёт подтверждения`, 'success');
  };

  return (
    <div className="screen">
      <div className="home-greeting">
        <div>
          <span className="eyebrow">{formatDateLong()} · {level.title}</span>
          <h1>
            {greeting()}, <span>{currentMember.firstName}</span>
          </h1>
          <p>Твой личный бюджет, задания и цели — в одном месте.</p>
        </div>
        <div className="home-greeting__aside">
          <Chip tone="accent"><Sparkles size={11} /> {level.level} уровень</Chip>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 0 }}>
        <section className="span-8">
          <div className="balance-card">
            <Sparkles size={20} className="balance-card__spark balance-card__spark--one" />
            <Sparkles size={14} className="balance-card__spark balance-card__spark--two" />
            <div className="balance-card__top">
              <span className="balance-card__label">
                <span className="status-dot" /> Моя карта · •• {currentMember.cardLast4}
              </span>
              <div className="row" style={{ gap: 7 }}>
                <span className="chip chip--glass">{currentMember.frozen ? 'заморожена' : 'активна'}</span>
                <button
                  className="icon-btn icon-btn--plain icon-btn--on-dark"
                  onClick={toggleHidden}
                  aria-label={hidden ? 'Показать баланс' : 'Скрыть баланс'}
                  style={{ width: 32, height: 32 }}
                >
                  {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="balance-card__amount">
              <Money value={currentMember.balance} hidden={hidden} />
            </div>
            <div className="balance-card__meta">
              <span>Потрачено сегодня <strong>{formatMoney(currentMember.spentToday)}</strong></span>
              <span>Лимит <strong>{formatMoney(currentMember.dailyLimit)}</strong></span>
            </div>
            <div className="balance-card__bottom">
              <div className="balance-card__left">
                <span>Осталось на сегодня</span>
                <strong>{hidden ? '••• ₽' : formatMoney(Math.max(0, currentMember.dailyLimit - currentMember.spentToday))}</strong>
              </div>
              <div className="balance-card__chart">
                <Sparkline
                  values={[26, 31, 28, 35, 30, 38, 33, 42, 39, 46, 41, 48]}
                  color="rgba(255,255,255,.95)"
                />
              </div>
            </div>
          </div>
          <div className="quick-actions">
            <button className="quick-action" onClick={() => onNavigate('card')}>
              <span className="quick-action__icon"><CreditCard size={18} /></span>
              Карта
            </button>
            <button className="quick-action" onClick={() => onNavigate('goals')}>
              <span className="quick-action__icon"><Target size={18} /></span>
              Цели
            </button>
            <button className="quick-action" onClick={() => onNavigate('tasks')}>
              <span className="quick-action__icon"><Gift size={18} /></span>
              Задания
            </button>
            <button className="quick-action" onClick={() => onNavigate('card')}>
              <span className="quick-action__icon"><Lock size={18} /></span>
              Приватность
            </button>
          </div>
        </section>

        <aside className="span-4">
          <div className="card ai-card" style={{ height: '100%' }}>
            <div className="ai-card__top">
              <span className="ai-badge"><span className="ai-badge__pulse" /> Мой месяц</span>
              <span className="muted" style={{ fontSize: 10 }}>{state.members.find((member) => member.id === currentMember.id)?.spentMonth ? 'обновлено' : ''}</span>
            </div>
            <div className="row" style={{ gap: 14 }}>
              <RingProgress
                value={percent(currentMember.spentMonth, currentMember.monthlyLimit)}
                size={74}
                stroke={7}
                color="var(--accent)"
              >
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>
                  {Math.round(percent(currentMember.spentMonth, currentMember.monthlyLimit))}%
                </strong>
              </RingProgress>
              <div>
                <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>месячный лимит</span>
                <strong style={{ display: 'block', marginTop: 2, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em' }}>
                  {formatMoney(currentMember.spentMonth)}
                </strong>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>из {formatMoney(currentMember.monthlyLimit)}</span>
              </div>
            </div>
            <div className="ai-card__metric" style={{ marginTop: 2 }}>
              <span className="empty__icon" style={{ width: 34, height: 34, margin: 0, borderRadius: 10 }}>
                <TrendingUp size={16} />
              </span>
              <div>
                <strong style={{ fontSize: 12 }}>
                  {topCategoryInfo ? `${topCategoryInfo.label} — ${formatMoney(topCategory?.[1] ?? 0)}` : 'Пока мало трат'}
                </strong>
                <span>самая крупная категория за месяц</span>
              </div>
            </div>
            <button className="link-btn" onClick={() => onNavigate('card')}>
              Открыть карту <ArrowRight size={14} />
            </button>
          </div>
        </aside>

        <section className="span-7 card">
          <SectionHead
            title="Задания от мамы"
            subtitle={activeTasks.length ? `${activeTasks.length} в работе` : 'Все задания выполнены'}
            action={
              <button className="link-btn" onClick={() => onNavigate('tasks')}>
                Все <ArrowRight size={13} />
              </button>
            }
          />
          {activeTasks.length ? (
            <div className="kid-task-list">
              {activeTasks.slice(0, 4).map((task) => (
                <div className="kid-task" key={task.id}>
                  <span className={`task-emoji task-emoji--${task.kind}`} style={{ width: 36, height: 36 }}>
                    <TaskIcon kind={task.kind} size={16} />
                  </span>
                  <span className="kid-task__text">
                    <strong>{task.title}</strong>
                    <span>{task.status === 'review' ? 'На проверке' : `${relativeDay(task.due)} · ${task.note}`}</span>
                  </span>
                  <span className="kid-task__reward"><Gift size={11} /> {formatMoney(task.reward)}</span>
                  {task.status === 'active' ? (
                    <Button size="sm" variant="soft" onClick={() => submitTask(task.id, task.title)}>
                      Выполнил
                    </Button>
                  ) : (
                    <Chip tone="warning">Ждёт маму</Chip>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="hidden-note">
              <Sparkles size={13} />
              Новые задания появятся здесь. А пока загляни в цели.
            </div>
          )}
        </section>

        <aside className="span-5">
          {laptop && (
            <div className="card" style={{ height: '100%' }}>
              <SectionHead title="Моя цель" subtitle="Копишь вместе с семьёй" />
              <button className="family-goal-kid" onClick={() => setGoalId(laptop.id)}>
                <GoalImage image={laptop.image} />
                <span className="family-goal-kid__text">
                  <strong>{laptop.title}</strong>
                  <span>{formatMoney(laptop.saved)} из {formatMoney(laptop.target)}</span>
                  <span style={{ color: 'var(--accent-strong)', fontWeight: 800 }}>
                    Твой вклад: {formatMoney(ownLaptop)}
                  </span>
                  <span className="family-goal-kid__bar">
                    <Progress
                      value={percent(laptop.saved, laptop.target)}
                      color="var(--accent)"
                      height={6}
                      track="var(--chart-track)"
                    />
                  </span>
                </span>
              </button>
              <div className="switch-row" style={{ marginTop: 8 }}>
                <span className="switch-row__text">
                  <strong>Приватность трат</strong>
                  <span>{currentMember.privateSpending ? 'Покупки скрыты от семьи' : 'Семья видит мои покупки'}</span>
                </span>
                <Switch
                  checked={currentMember.privateSpending}
                  onChange={(value) => {
                    dispatch({ type: 'set-private', memberId: currentMember.id, value });
                    notify(value ? 'Покупки скрыты' : 'Покупки снова видны семье', undefined, 'info');
                  }}
                  label="Приватность трат"
                />
              </div>
            </div>
          )}
        </aside>

        <section className="span-7 card">
          <SectionHead
            title="Мои операции"
            subtitle="Только по моей карте"
            action={
              <button className="link-btn" onClick={() => onNavigate('card')}>
                Карта <ArrowRight size={13} />
              </button>
            }
          />
          <TransactionList transactions={transactions} limit={5} showActor={false} />
        </section>

        <section className="span-5 stack">
          <div className="security-card">
            <span className="security-card__icon"><ShieldCheck size={20} /></span>
            <div>
              <strong>Защита включена</strong>
              <p>Мы проверяем каждую операцию. Если что-то покажется странным — сразу пришлём уведомление.</p>
            </div>
          </div>
          <div className="card" style={{ background: 'var(--surface-soft)' }}>
            <div className="row" style={{ gap: 12 }}>
              <Avatar member={state.members.find((member) => member.id === 'timur') ?? currentMember} size={40} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: 12.5 }}>Тимур прошёл новую миссию</strong>
                <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>+150 ₽ в общую цель «Сочи»</span>
              </div>
              <Wallet size={18} style={{ color: 'var(--muted)' }} />
            </div>
            <button className="link-btn" style={{ marginTop: 10 }} onClick={() => setGoalId(state.goals[0]?.id ?? null)}>
              Посмотреть цель <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
      </div>

      <GoalDetailSheet goal={selectedGoal} open={Boolean(goalId)} onClose={() => setGoalId(null)} />
    </div>
  );
}
