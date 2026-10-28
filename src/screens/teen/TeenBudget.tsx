import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  CreditCard,
  EyeOff,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../store';
import { formatMoney, formatNumber, isInMonth, monthLabel, percent } from '../../lib';
import {
  CategoryIcon,
  Chip,
  PageTitle,
  Progress,
  RingProgress,
  SectionHead,
} from '../../components/ui';
import { Donut, WeeklyBars } from '../../components/charts';
import { TransactionList, visibleTransactions } from '../../components/common';

const DAYS_SHARE = [0.12, 0.1, 0.22, 0.08, 0.18, 0.19, 0.11];

export function TeenBudget() {
  const { state, currentMember } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const transactions = visibleTransactions(state, currentMember).filter((transaction) =>
    isInMonth(transaction.date, 0),
  );
  const expenses = transactions.filter((transaction) => transaction.amount < 0);
  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalSpent = expenses.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const groups = new Map<string, number>();
  expenses.forEach((transaction) => {
    groups.set(transaction.categoryId, (groups.get(transaction.categoryId) ?? 0) + Math.abs(transaction.amount));
  });
  const slices = [...groups.entries()]
    .map(([categoryId, value]) => {
      const category = state.categories.find((item) => item.id === categoryId);
      return {
        id: categoryId,
        label: category?.label ?? 'Другое',
        value,
        color: category?.color ?? '#8B8B9E',
        icon: category?.icon ?? 'shapes',
      };
    })
    .sort((a, b) => b.value - a.value);
  const selectedSlice = slices.find((slice) => slice.id === selected);
  const topSlice = slices[0];
  const free = Math.max(0, currentMember.monthlyLimit - currentMember.spentMonth);
  const subscriptions = state.categories.find((category) => category.id === 'subscriptions');
  const subscriptionSpent = groups.get('subscriptions') ?? 0;
  const weekly = DAYS_SHARE.map((share, index) => ({
    label: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index],
    value: Math.round((totalSpent / 4.2) * share),
    active: index === 5,
  }));

  return (
    <div className="screen">
      <PageTitle
        eyebrow="Личная аналитика"
        title="Мой бюджет"
        subtitle="Видно, куда уходят деньги, — без таблиц и подсчётов в заметках"
        action={<Chip tone="accent">{monthLabel(0)}</Chip>}
      />

      <div className="stat-row">
        <div className="stat-card">
          <span>Потрачено</span>
          <strong>{formatMoney(totalSpent)}</strong>
          <em className={totalSpent <= currentMember.spentMonth ? 'is-good' : 'is-neutral'}>
            <ArrowDownRight size={12} /> лимит {formatMoney(currentMember.monthlyLimit)}
          </em>
        </div>
        <div className="stat-card">
          <span>Пришло</span>
          <strong>{formatMoney(income)}</strong>
          <em className="is-good"><ArrowUpRight size={12} /> награды и переводы</em>
        </div>
        <div className="stat-card">
          <span>Свободно</span>
          <strong>{formatMoney(free)}</strong>
          <em className="is-neutral"><Clock3 size={12} /> до конца месяца</em>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 0 }}>
        <section className="span-7 card">
          <SectionHead
            title="Куда уходят деньги"
            subtitle="Группировка по категориям за месяц"
            action={<Chip tone="accent">{expenses.length} операций</Chip>}
          />
          <div className="budget-overview">
            <Donut
              data={slices.map((slice) => ({
                id: slice.id,
                label: slice.label,
                value: slice.value,
                color: slice.color,
              }))}
              selected={selected}
              onSelect={(id) => setSelected((current) => (current === id ? null : id))}
            >
              {selectedSlice ? (
                <>
                  <span>{selectedSlice.label}</span>
                  <strong>{formatNumber(selectedSlice.value)} ₽</strong>
                  <em>{Math.round(percent(selectedSlice.value, totalSpent))}% трат</em>
                </>
              ) : (
                <>
                  <span>Всего потрачено</span>
                  <strong>{formatNumber(totalSpent)} ₽</strong>
                  <em>{monthLabel(0, true)}</em>
                </>
              )}
            </Donut>
            <div className="budget-legend">
              {slices.map((slice) => (
                <button
                  key={slice.id}
                  className={`legend-row ${selected === slice.id ? 'is-active' : ''}`}
                  onClick={() => setSelected((current) => (current === slice.id ? null : slice.id))}
                >
                  <span className="legend-row__dot" style={{ background: slice.color }} />
                  <span className="legend-row__label">{slice.label}</span>
                  <span className="legend-row__value">{formatNumber(slice.value)} ₽</span>
                  <span className="legend-row__pct">{Math.round(percent(slice.value, totalSpent))}%</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="span-5 stack">
          <div className="card">
            <SectionHead title="Мой лимит" subtitle="Дневной и месячный" />
            <div className="limit-visual">
              <RingProgress
                value={percent(currentMember.spentMonth, currentMember.monthlyLimit)}
                size={84}
                stroke={8}
                color="var(--accent)"
              >
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>
                  {Math.round(percent(currentMember.spentMonth, currentMember.monthlyLimit))}%
                </strong>
              </RingProgress>
              <div className="limit-visual__text">
                <strong>{formatMoney(currentMember.spentMonth)} из {formatMoney(currentMember.monthlyLimit)}</strong>
                <span>месячный лимит · осталось {formatMoney(free)}</span>
                <div style={{ marginTop: 8 }}>
                  <Progress
                    value={percent(currentMember.spentMonth, currentMember.monthlyLimit)}
                    color="var(--accent)"
                    height={6}
                    track="var(--chart-track)"
                  />
                </div>
              </div>
            </div>
            <hr className="divider" />
            <div className="row row--between" style={{ fontSize: 11.5 }}>
              <span style={{ color: 'var(--muted)' }}>Сегодня</span>
              <strong>{formatMoney(currentMember.spentToday)} из {formatMoney(currentMember.dailyLimit)}</strong>
            </div>
            <Progress
              value={percent(currentMember.spentToday, currentMember.dailyLimit)}
              color="var(--blue)"
              height={6}
              track="var(--chart-track)"
            />
          </div>

          <div className="card" style={{ background: 'var(--surface-soft)' }}>
            <div className="row" style={{ gap: 11 }}>
              <span className="empty__icon" style={{ margin: 0, width: 40, height: 40 }}>
                <EyeOff size={18} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: 12.5 }}>Приватность под контролем</strong>
                <span style={{ fontSize: 10.5, lineHeight: 1.45, color: 'var(--muted)' }}>
                  Можно скрыть покупки из семейной ленты. Лимиты при этом продолжат работать.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="span-7 card">
          <SectionHead
            title="Мои операции"
            subtitle={`${monthLabel(0)} · только по моей карте`}
            action={<Chip tone="success"><CreditCard size={11} /> •• {currentMember.cardLast4}</Chip>}
          />
          <TransactionList transactions={transactions} showActor={false} />
        </section>

        <section className="span-5 stack">
          <div className="card">
            <SectionHead title="AI-разбор" subtitle="Один вывод — одно действие" />
            <div className="forecast__head">
              <span className="forecast__icon"><Sparkles size={18} /></span>
              <div>
                <strong>
                  {topSlice ? `${topSlice.label} — ${Math.round(percent(topSlice.value, totalSpent))}% трат` : 'Расходы под контролем'}
                </strong>
                <span>
                  {topSlice
                    ? `За месяц ушло ${formatMoney(topSlice.value)}. Если отложить одну покупку на 24 часа, можно сохранить до ${formatMoney(Math.round(topSlice.value * 0.18))} без потери качества жизни.`
                    : 'Добавь больше операций, и я покажу закономерности.'}
                </span>
              </div>
            </div>
            <div className="row row--between" style={{ marginTop: 12, fontSize: 10.5, color: 'var(--muted)' }}>
              <span>Средний чек</span>
              <strong style={{ color: 'var(--ink)' }}>{formatMoney(expenses.length ? totalSpent / expenses.length : 0)}</strong>
            </div>
            <div className="row row--between" style={{ marginTop: 6, fontSize: 10.5, color: 'var(--muted)' }}>
              <span>Самая крупная покупка</span>
              <strong style={{ color: 'var(--ink)' }}>
                {expenses.length
                  ? formatMoney(Math.max(...expenses.map((transaction) => Math.abs(transaction.amount))))
                  : '—'}
              </strong>
            </div>
          </div>

          {subscriptions && subscriptionSpent > 0 && (
            <div className="card">
              <SectionHead
                title="Подписки"
                subtitle="Регулярные списания"
                action={<Chip tone="warning"><TrendingUp size={11} /> {formatMoney(subscriptionSpent * 12)} в год</Chip>}
              />
              {expenses
                .filter((transaction) => transaction.categoryId === 'subscriptions')
                .map((transaction) => (
                  <div className="row row--between" key={transaction.id} style={{ padding: '7px 0' }}>
                    <span className="row" style={{ gap: 9 }}>
                      <span
                        className="task-emoji"
                        style={{
                          width: 32,
                          height: 32,
                          background: `color-mix(in srgb, ${subscriptions.color} 12%, white)`,
                          color: subscriptions.color,
                        }}
                      >
                        <CategoryIcon name={subscriptions.icon} size={15} />
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{transaction.title}</span>
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 800 }}>{formatMoney(transaction.amount)} / мес</span>
                  </div>
                ))}
              <div className="hidden-note" style={{ marginTop: 8 }}>
                <Sparkles size={13} />
                Подписка стоит {formatMoney(subscriptionSpent)} в месяц — это {formatMoney(subscriptionSpent * 12)} в год.
              </div>
            </div>
          )}

          <div className="card">
            <SectionHead title="Неделя" subtitle="Средний ритм трат" />
            <WeeklyBars data={weekly} />
          </div>
        </section>
      </div>
    </div>
  );
}
