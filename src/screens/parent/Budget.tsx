import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../store';
import {
  categorySpentForMonth,
  formatMoney,
  formatNumber,
  isInMonth,
  monthIncome,
  monthLabel,
  monthShort,
  percent,
} from '../../lib';
import { CategoryIcon, Chip, EmptyState, PageTitle, Progress, SectionHead } from '../../components/ui';
import { Donut, WeeklyBars } from '../../components/charts';
import { PrivacyNote, TransactionList, hiddenCount, visibleTransactions } from '../../components/common';
import { CategoryLimitSheet } from '../../components/dialogs';

const DAYS_SHARE = [0.11, 0.17, 0.1, 0.16, 0.14, 0.2, 0.12];

export function BudgetScreen() {
  const { state, currentMember } = useApp();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [limitCategoryId, setLimitCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(10);

  const expenseCategories = state.categories.filter((category) => category.kind === 'expense');
  const categories = useMemo(
    () =>
      expenseCategories.map((category) => ({
        ...category,
        monthSpent: categorySpentForMonth(category, monthOffset),
        previousSpent: categorySpentForMonth(category, monthOffset + 1),
      })),
    [expenseCategories, monthOffset],
  );
  const expenses = categories.reduce((sum, category) => sum + category.monthSpent, 0);
  const previousExpenses = categories.reduce((sum, category) => sum + category.previousSpent, 0);
  const income = monthIncome(state.income, monthOffset);
  const free = income - expenses;
  const expenseDelta = previousExpenses ? ((expenses - previousExpenses) / previousExpenses) * 100 : 0;
  const incomeDelta = monthOffset < 2 ? ((income - monthIncome(state.income, monthOffset + 1)) / monthIncome(state.income, monthOffset + 1)) * 100 : 0;
  const savingsRate = Math.round((free / income) * 100);
  const forecast = Math.round((expenses * 1.045) / 100) * 100;
  const topCategory = [...categories].sort(
    (a, b) => b.monthSpent / Math.max(b.limit, 1) - a.monthSpent / Math.max(a.limit, 1),
  )[0];
  const selected = categories.find((category) => category.id === selectedCategory) ?? null;
  const selectedShare = selected ? percent(selected.monthSpent, expenses) : 0;

  const transactions = visibleTransactions(state, currentMember)
    .filter((transaction) => isInMonth(transaction.date, monthOffset))
    .filter((transaction) => categoryFilter === 'all' || transaction.categoryId === categoryFilter)
    .filter((transaction) =>
      query.trim()
        ? transaction.title.toLowerCase().includes(query.trim().toLowerCase())
        : true,
    );
  const hidden = hiddenCount(state, currentMember);
  const weeklyTotal = expenses / 4.2;
  const bars = DAYS_SHARE.map((share, index) => ({
    label: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index],
    value: Math.round(weeklyTotal * share),
    active: index === 5,
  }));
  const limitCategory = state.categories.find((category) => category.id === limitCategoryId) ?? null;

  return (
    <div className="screen">
      <PageTitle
        eyebrow="Аналитика"
        title="Бюджет семьи"
        subtitle="Расходы, лимиты и прогноз — без таблиц и ручного учёта"
        action={
          <div className="month-switch">
            <button
              aria-label="Предыдущий месяц"
              onClick={() => {
                setMonthOffset((value) => Math.min(2, value + 1));
                setSelectedCategory(null);
                setVisibleCount(10);
              }}
              disabled={monthOffset === 2}
            >
              <ChevronLeft size={16} />
            </button>
            <span>{monthLabel(monthOffset)}</span>
            <button
              aria-label="Следующий месяц"
              onClick={() => {
                setMonthOffset((value) => Math.max(0, value - 1));
                setSelectedCategory(null);
                setVisibleCount(10);
              }}
              disabled={monthOffset === 0}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <div className="stat-row">
        <div className="stat-card">
          <span>Расходы</span>
          <strong>{formatMoney(expenses)}</strong>
          <em className={expenseDelta <= 0 ? 'is-good' : 'is-bad'}>
            {expenseDelta <= 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
            {Math.abs(Math.round(expenseDelta))}% к прошлому месяцу
          </em>
        </div>
        <div className="stat-card">
          <span>Доходы</span>
          <strong>{formatMoney(income)}</strong>
          <em className={incomeDelta >= 0 ? 'is-good' : 'is-neutral'}>
            {incomeDelta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(Math.round(incomeDelta))}% к прошлому месяцу
          </em>
        </div>
        <div className="stat-card">
          <span>Свободно</span>
          <strong>{formatMoney(free)}</strong>
          <em className="is-good">{savingsRate}% дохода остаётся</em>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 0 }}>
        <section className="span-7 card">
          <SectionHead
            title="Структура расходов"
            subtitle={monthOffset === 0 ? 'Обновляется в реальном времени' : 'Итоги закрытого месяца'}
            action={<Chip tone="accent">{formatNumber(expenses)} ₽</Chip>}
          />
          <div className="budget-overview">
            <Donut
              data={categories.map((category) => ({
                id: category.id,
                label: category.label,
                value: category.monthSpent,
                color: category.color,
              }))}
              selected={selectedCategory}
              onSelect={(id) => setSelectedCategory((current) => (current === id ? null : id))}
            >
              {selected ? (
                <>
                  <span>{selected.label}</span>
                  <strong>{formatNumber(selected.monthSpent)} ₽</strong>
                  <em>{Math.round(selectedShare)}% расходов</em>
                </>
              ) : (
                <>
                  <span>Всего расходов</span>
                  <strong>{formatNumber(expenses)} ₽</strong>
                  <em>{monthShort(monthOffset)} · семья</em>
                </>
              )}
            </Donut>
            <div className="budget-legend">
              {categories
                .slice()
                .sort((a, b) => b.monthSpent - a.monthSpent)
                .map((category) => (
                  <button
                    key={category.id}
                    className={`legend-row ${selectedCategory === category.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedCategory((current) => (current === category.id ? null : category.id))}
                  >
                    <span className="legend-row__dot" style={{ background: category.color }} />
                    <span className="legend-row__label">{category.label}</span>
                    <span className="legend-row__value">{formatNumber(category.monthSpent)} ₽</span>
                    <span className="legend-row__pct">{Math.round(percent(category.monthSpent, expenses))}%</span>
                  </button>
                ))}
              <div style={{ padding: '8px 7px 0', fontSize: 10, color: 'var(--muted)' }}>
                Нажмите на категорию, чтобы рассмотреть детали
              </div>
            </div>
          </div>
        </section>

        <section className="span-5 card forecast">
          <div className="forecast__head">
            <span className="forecast__icon"><Sparkles size={18} /></span>
            <div>
              <strong>{monthOffset === 0 ? 'AI-прогноз до конца месяца' : 'Итог месяца'}</strong>
              <span>
                {monthOffset === 0
                  ? `С учётом текущего темпа семья потратит ${formatMoney(forecast)}.`
                  : `Фактические расходы за ${monthLabel(monthOffset).toLowerCase()}.`}
              </span>
            </div>
          </div>
          <div className="forecast__number">
            <strong>{formatMoney(monthOffset === 0 ? forecast : expenses)}</strong>
            <span className={monthOffset === 0 ? 'money-positive' : 'muted'}>
              {monthOffset === 0 ? 'прогноз' : 'факт'}
            </span>
          </div>
          <Progress
            value={percent(expenses, monthOffset === 0 ? forecast : expenses)}
            color="var(--accent)"
            height={7}
            track="var(--chart-track)"
          />
          <div className="row row--between" style={{ fontSize: 10, color: 'var(--muted)' }}>
            <span>Потрачено {formatMoney(expenses)}</span>
            <span>{Math.round(percent(expenses, monthOffset === 0 ? forecast : expenses))}%</span>
          </div>

          <div style={{ marginTop: 4 }}>
            <div className="row row--between" style={{ marginBottom: 4 }}>
              <strong style={{ fontSize: 12 }}>Расходы по дням недели</strong>
              <span style={{ fontSize: 9.5, color: 'var(--muted)' }}>среднее за месяц</span>
            </div>
            <WeeklyBars data={bars} />
          </div>

          <div
            style={{
              marginTop: 4,
              padding: 12,
              borderRadius: 13,
              background: 'var(--surface-soft)',
              fontSize: 11,
              lineHeight: 1.5,
              color: 'var(--muted)',
            }}
          >
            <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 3, fontSize: 11.5 }}>
              {topCategory ? `Лимит «${topCategory.label}» — ${Math.round(percent(topCategory.monthSpent, topCategory.limit))}%` : 'Всё в норме'}
            </strong>
            {topCategory && topCategory.monthSpent > topCategory.limit
              ? `Перерасход ${formatMoney(topCategory.monthSpent - topCategory.limit)}. AI предлагает снизить траты на 10% — без отказа от привычек.`
              : topCategory
                ? `До лимита осталось ${formatMoney(Math.max(0, topCategory.limit - topCategory.monthSpent))}. AI следит за темпом и предупредит заранее.`
                : 'AI проанализирует траты и предложит план.'}
          </div>
        </section>

        <section className="span-12 card">
          <SectionHead
            title="Категории и лимиты"
            subtitle="Мягкие лимиты помогают планировать, а не запрещают"
            action={
              <span className="row" style={{ gap: 5, fontSize: 10.5, color: 'var(--muted)' }}>
                <Pencil size={12} /> нажмите «изменить»
              </span>
            }
          />
          <div className="category-list">
            {categories.map((category) => {
              const used = percent(category.monthSpent, category.limit || 1);
              const over = category.monthSpent > category.limit;
              const delta = category.previousSpent
                ? ((category.monthSpent - category.previousSpent) / category.previousSpent) * 100
                : 0;
              return (
                <div className="category-row" key={category.id}>
                  <span
                    className="category-row__icon"
                    style={{ background: `color-mix(in srgb, ${category.color} 13%, white)`, color: category.color }}
                  >
                    <CategoryIcon name={category.icon} size={19} />
                  </span>
                  <div className="category-row__body">
                    <div className="category-row__top">
                      <strong>{category.label}</strong>
                      <span>
                        <b>{formatMoney(category.monthSpent)}</b> из {formatMoney(category.limit)}
                      </span>
                    </div>
                    <Progress
                      value={used}
                      color={over ? 'var(--red)' : category.color}
                      height={6}
                      track="var(--chart-track)"
                    />
                  </div>
                  <div className="category-row__edit">
                    <span className={`category-row__pct ${over ? 'is-over' : ''}`}>{Math.round(used)}%</span>
                    <span style={{ fontSize: 9, color: delta <= 0 ? 'var(--green)' : 'var(--muted)' }}>
                      {Math.abs(delta) < 0.5 ? '0%' : `${delta <= 0 ? '−' : '+'}${Math.abs(Math.round(delta))}%`}
                    </span>
                    <button onClick={() => setLimitCategoryId(category.id)} aria-label={`Изменить лимит ${category.label}`}>
                      <Pencil size={10} /> изменить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="span-12 card">
          <SectionHead
            title="Операции"
            subtitle={`${transactions.length} ${transactions.length === 1 ? 'операция' : transactions.length < 5 ? 'операции' : 'операций'} за ${monthLabel(monthOffset).toLowerCase()}`}
            action={
              monthOffset === 0 ? (
                <span className="chip chip--success">
                  <TrendingUp size={11} /> лента в реальном времени
                </span>
              ) : undefined
            }
          />
          <div className="tx-toolbar">
            <label className="search">
              <Search size={15} />
              <input
                placeholder="Найти операцию"
                value={query}
                onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(10);
              }}
                aria-label="Поиск операций"
              />
            </label>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setVisibleCount(10);
              }}
              aria-label="Фильтр по категории"
            >
              <option value="all">Все категории</option>
              {state.categories
                .filter((category) => category.kind === 'expense')
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
            </select>
          </div>
          {transactions.length ? (
            <>
              <TransactionList transactions={transactions.slice(0, visibleCount)} />
              {transactions.length > visibleCount && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                    Показано {visibleCount} из {transactions.length}
                  </span>
                  <button className="btn btn--secondary btn--sm" onClick={() => setVisibleCount((value) => value + 10)}>
                    Показать ещё
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<Search size={20} />}
              title="Ничего не найдено"
              text="Попробуйте изменить запрос или выбрать другую категорию."
            />
          )}
          <PrivacyNote count={hidden} />
        </section>
      </div>

      <CategoryLimitSheet
        categoryId={limitCategoryId}
        spent={limitCategory ? categorySpentForMonth(limitCategory, monthOffset) : undefined}
        open={Boolean(limitCategory)}
        onClose={() => setLimitCategoryId(null)}
      />
    </div>
  );
}
