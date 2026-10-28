import { useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../store';
import {
  formatMoney,
  greeting,
  monthLabel,
  relativeDay,
  plural,
  deadlineLabel,
} from '../../lib';
import type { Member, Tab } from '../../types';
import {
  GoalImage,
  MemberLine,
  PrivacyNote,
  TaskMini,
  TransactionList,
  hiddenCount,
  memberName,
  visibleTransactions,
} from '../../components/common';
import { Button, Money, Progress, SectionHead } from '../../components/ui';
import { Sparkline } from '../../components/charts';
import { GoalDetailSheet, MemberSheet, TransferSheet } from '../../components/dialogs';

export function ParentHome({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { state, currentMember, hidden, toggleHidden } = useApp();
  const [transferOpen, setTransferOpen] = useState(false);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<Member['id'] | null>(null);
  const goalsRef = useRef<HTMLDivElement>(null);

  const expenses = state.categories
    .filter((category) => category.kind === 'expense')
    .reduce((sum, category) => sum + category.spent, 0);
  const freeToSpend = state.income - expenses;
  const cafe = state.categories.find((category) => category.id === 'cafes');
  const goalsSaved = state.goals.reduce((sum, goal) => sum + goal.saved, 0);
  const reviewTasks = state.tasks.filter((task) => task.status === 'review');
  const previewTasks = [...state.tasks]
    .filter((task) => task.status !== 'done')
    .sort((a, b) => {
      const order = { review: 0, active: 1, done: 2 };
      return order[a.status] - order[b.status];
    })
    .slice(0, 3);
  const transactions = visibleTransactions(state, currentMember);
  const hiddenTransactions = hiddenCount(state, currentMember);
  const selectedGoal = state.goals.find((goal) => goal.id === goalId) ?? null;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const kidsGoalBoost = state.goals.reduce(
    (sum, goal) =>
      sum +
      goal.contributions
        .filter((contribution) => contribution.memberId === 'timur' || contribution.memberId === 'karina')
        .reduce((value, contribution) => value + contribution.amount, 0),
    0,
  );

  return (
    <div className="screen">
      <div className="home-greeting">
        <div>
          <span className="eyebrow">{state.familyName} · {monthLabel().split(' ')[0]}</span>
          <h1>
            {greeting()}, <span>{currentMember.firstName}</span>
          </h1>
          <p>Семейный бюджет под контролем. Вот главное на сегодня.</p>
        </div>
        <div className="home-greeting__aside">
          <span className="demo-chip">
            {daysLeft === 0
              ? 'Последний день месяца'
              : `${daysLeft} ${plural(daysLeft, 'день', 'дня', 'дней')} до конца месяца`}
          </span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="span-8">
          <div className="balance-card">
            <Sparkles size={22} className="balance-card__spark balance-card__spark--one" />
            <Sparkles size={15} className="balance-card__spark balance-card__spark--two" />
            <div className="balance-card__top">
              <span className="balance-card__label">
                <span className="status-dot" /> Семейный бюджет
              </span>
              <div className="row" style={{ gap: 7 }}>
                <span className="chip chip--glass">{monthLabel().split(' ')[0]}</span>
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
              <Money value={state.familyBalance} hidden={hidden} />
            </div>
            <div className="balance-card__meta">
              <span>Доходы <strong>{formatMoney(state.income)}</strong></span>
              <span>Расходы <strong>{formatMoney(expenses)}</strong></span>
            </div>
            <div className="balance-card__bottom">
              <div className="balance-card__left">
                <span>Свободно до конца месяца</span>
                <strong>{hidden ? '•• ••• ₽' : formatMoney(freeToSpend)}</strong>
              </div>
              <div className="balance-card__chart">
                <Sparkline
                  values={[52, 55, 53, 60, 58, 64, 61, 68, 66, 73, 70, 77]}
                  color="rgba(255,255,255,.95)"
                />
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <button className="quick-action" onClick={() => setTransferOpen(true)}>
              <span className="quick-action__icon"><Plus size={18} /></span>
              Пополнить
            </button>
            <button className="quick-action" onClick={() => onNavigate('tasks')}>
              <span className="quick-action__icon"><ClipboardCheck size={18} /></span>
              Задания
            </button>
            <button className="quick-action" onClick={() => onNavigate('family')}>
              <span className="quick-action__icon"><SlidersHorizontal size={18} /></span>
              Лимиты
            </button>
            <button className="quick-action" onClick={() => onNavigate('goals')}>
              <span className="quick-action__icon"><Target size={18} /></span>
              Цели
            </button>
          </div>
        </section>

        <section className="span-4">
          <div className="card ai-card">
            <div className="ai-card__top">
              <span className="ai-badge">
                <span className="ai-badge__pulse" /> AI-наблюдение
              </span>
              <span className="muted" style={{ fontSize: 10 }}>сегодня</span>
            </div>
            <h3>
              {cafe ? (
                <>Кафе и доставка съедают <em>{formatMoney(cafe.spent)}</em> за месяц</>
              ) : (
                <>Расходы в норме, но есть <em>точки роста</em></>
              )}
            </h3>
            <p>
              {cafe
                ? `Это ${Math.round((cafe.spent / cafe.limit) * 100)}% лимита. Если заменить два заказа доставки в неделю домашней едой, семья сэкономит ≈ 4 200 ₽ и приблизит «Сочи» на три недели.`
                : 'AI проанализировал траты семьи за месяц и готов предложить план экономии.'}
            </p>
            <div className="ai-card__chart">
              <div className="ai-card__chart-head">
                <span>Динамика недели</span>
                <strong>−6% к прошлой</strong>
              </div>
              <Sparkline
                values={[48, 55, 51, 60, 57, 66, 63, 70, 67, 74]}
                color="var(--accent)"
                height={54}
              />
            </div>
            <div className="ai-card__metric">
              <span className="empty__icon" style={{ width: 34, height: 34, margin: 0, borderRadius: 10 }}>
                <TrendingUp size={17} />
              </span>
              <div>
                <strong>{formatMoney(Math.round((expenses * 1.045) / 100) * 100)}</strong>
                <span>прогноз расходов до конца месяца</span>
              </div>
            </div>
            <button className="link-btn" onClick={() => onNavigate('budget')}>
              Разобрать с AI <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <section className="span-7 card">
          <SectionHead
            title="Семейные цели"
            subtitle={`Накоплено ${formatMoney(goalsSaved)}`}
            action={
              <div className="row" style={{ gap: 6 }}>
                <button
                  className="icon-btn goal-arrows"
                  style={{ width: 30, height: 30 }}
                  aria-label="Предыдущие цели"
                  onClick={() => goalsRef.current?.scrollBy({ left: -270, behavior: 'smooth' })}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  className="icon-btn goal-arrows"
                  style={{ width: 30, height: 30 }}
                  aria-label="Следующие цели"
                  onClick={() => goalsRef.current?.scrollBy({ left: 270, behavior: 'smooth' })}
                >
                  <ChevronRight size={15} />
                </button>
                <button className="link-btn" onClick={() => onNavigate('goals')}>
                  Все цели <ArrowRight size={14} />
                </button>
              </div>
            }
          />
          <div className="goal-carousel">
            <div className="goal-strip" ref={goalsRef}>
            {state.goals.map((goal) => (
              <button className="goal-card" key={goal.id} onClick={() => setGoalId(goal.id)}>
                <div className="goal-card__top">
                  <span className="goal-illustration">
                    <GoalImage image={goal.image} />
                  </span>
                  <span className="goal-card__title">
                    <strong>{goal.title}</strong>
                    <span>{deadlineLabel(goal.deadline)}</span>
                  </span>
                </div>
                <Progress value={(goal.saved / goal.target) * 100} color="var(--accent)" height={7} track="var(--chart-track)" />
                <div className="goal-card__amounts">
                  <strong>{formatMoney(goal.saved)}</strong>
                  <span>из {formatMoney(goal.target)}</span>
                </div>
                <div className="goal-card__action">
                  <span>{Math.round((goal.saved / goal.target) * 100)}% собрано</span>
                  <ArrowUpRight size={14} />
                </div>
              </button>
            ))}
            <button
              className="goal-card"
              onClick={() => onNavigate('goals')}
              style={{ alignItems: 'center', justifyContent: 'center', minHeight: 152, borderStyle: 'dashed' }}
            >
              <span className="empty__icon" style={{ margin: 0, width: 42, height: 42 }}>
                <Plus size={20} />
              </span>
              <strong style={{ fontSize: 12.5 }}>Новая цель</strong>
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Создать вместе</span>
            </button>
            </div>
          </div>
          <div className="goal-boost-note">
            <Sparkles size={14} />
            <span>
              Дети уже добавили <strong>{formatMoney(kidsGoalBoost)}</strong> к семейным целям — миссии и задания работают.
            </span>
          </div>
        </section>

        <section className="span-5 card">
          <SectionHead
            title="Задания"
            subtitle={reviewTasks.length ? `${reviewTasks.length} ${reviewTasks.length === 1 ? 'ждёт' : 'ждут'} проверки` : 'Всё проверено'}
            action={
              <button className="link-btn" onClick={() => onNavigate('tasks')}>
                Открыть <ArrowRight size={14} />
              </button>
            }
          />
          <div>
            {previewTasks.map((task) => (
              <TaskMini
                key={task.id}
                title={task.title}
                note={`${memberName(state.members, task.assignee)} · ${relativeDay(task.due)}`}
                kind={task.kind}
                reward={task.reward}
                onClick={() => onNavigate('tasks')}
              />
            ))}
          </div>
          {reviewTasks.length > 0 && (
            <div className="task-review-note">
              <Bell size={14} />
              {reviewTasks[0].assignee === 'timur' ? 'Тимур' : 'Карина'} ждёт подтверждения: «{reviewTasks[0].title}»
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Button variant="soft" size="sm" full icon={<ClipboardCheck size={14} />} onClick={() => onNavigate('tasks')}>
              Проверить задания
            </Button>
          </div>
        </section>

        <section className="span-7 card">
          <SectionHead
            title="Последние операции"
            subtitle="Общая лента покупок семьи"
            action={
              <button className="link-btn" onClick={() => onNavigate('budget')}>
                Все операции <ArrowRight size={14} />
              </button>
            }
          />
          <TransactionList transactions={transactions} limit={5} />
          <PrivacyNote count={hiddenTransactions} />
        </section>

        <section className="span-5 card">
          <SectionHead
            title="Наша семья"
            subtitle="4 участника · 2 детские карты"
            action={
              <button className="link-btn" onClick={() => onNavigate('family')}>
                Управлять <ArrowRight size={14} />
              </button>
            }
          />
          <div className="member-list">
            {state.members.map((member) => (
              <MemberLine key={member.id} member={member} onClick={() => setMemberId(member.id)} />
            ))}
          </div>
          <div className="hidden-note" style={{ marginTop: 12 }}>
            <Sparkles size={13} />
            Тимур уже добавил 18 000 ₽ к «Сочи» своими миссиями.
          </div>
        </section>
      </div>

      <TransferSheet open={transferOpen} onClose={() => setTransferOpen(false)} />
      <GoalDetailSheet goal={selectedGoal} open={Boolean(goalId)} onClose={() => setGoalId(null)} />
      <MemberSheet memberId={memberId} open={Boolean(memberId)} onClose={() => setMemberId(null)} />
    </div>
  );
}
