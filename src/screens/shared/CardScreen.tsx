import { useState } from 'react';
import {
  ArrowRight,
  CreditCard,
  Eye,
  EyeOff,
  Fingerprint,
  Gift,
  Lock,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Target,
} from 'lucide-react';
import { useApp } from '../../store';
import { formatMoney, percent } from '../../lib';
import type { Tab } from '../../types';
import {
  CategoryIcon,
  Chip,
  Money,
  PageTitle,
  Progress,
  RingProgress,
  SectionHead,
  Switch,
} from '../../components/ui';
import { BankCard } from '../../components/BankCard';
import { CardDetailsSheet } from '../../components/dialogs';
import { TransactionList, visibleTransactions } from '../../components/common';

export function CardScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { state, currentMember, hidden, toggleHidden, dispatch, notify } = useApp();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isTeen = currentMember.role === 'teen';
  const transactions = visibleTransactions(state, currentMember);
  const blocked = state.categories.filter((category) =>
    currentMember.blockedCategories.includes(category.id),
  );
  const allowed = state.categories.filter(
    (category) =>
      category.kind === 'expense' && !currentMember.blockedCategories.includes(category.id),
  );

  const freeze = (frozen: boolean) => {
    dispatch({ type: 'freeze-card', memberId: currentMember.id, frozen });
    notify(
      frozen ? 'Карта заморожена' : 'Карта снова активна',
      frozen ? 'Покупки временно недоступны' : 'Можно снова платить',
    );
  };

  return (
    <div className="screen">
      <PageTitle
        eyebrow={isTeen ? 'Личные финансы' : 'Детская карта'}
        title={isTeen ? 'Карта и лимиты' : 'Моя карта'}
        subtitle={
          isTeen
            ? 'Твой личный бюджет, приватность и безопасность'
            : 'Карманные деньги, лимиты и подарки от семьи — всё здесь'
        }
        action={
          <Chip tone={currentMember.frozen ? 'danger' : 'success'}>
            {currentMember.frozen ? <Snowflake size={12} /> : <span className="status-dot" />}
            {currentMember.frozen ? 'Заморожена' : 'Активна'}
          </Chip>
        }
      />

      <div className="dashboard-grid" style={{ marginTop: 0 }}>
        <section className="span-6">
          <BankCard member={currentMember} />
          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-balance">
              <div>
                <span>Доступно на карте · •• {currentMember.cardLast4}</span>
                <strong>
                  <Money value={currentMember.balance} hidden={hidden} />
                </strong>
              </div>
              <button
                className="icon-btn icon-btn--plain"
                onClick={toggleHidden}
                aria-label={hidden ? 'Показать баланс' : 'Скрыть баланс'}
              >
                {hidden ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div className="card-actions" style={{ marginTop: 14 }}>
              <button className="chip" onClick={() => setDetailsOpen(true)} style={{ border: 0, minHeight: 34, padding: '0 11px' }}>
                <CreditCard size={13} /> Реквизиты
              </button>
              <button
                className={`chip ${currentMember.frozen ? 'chip--danger' : ''}`}
                onClick={() => freeze(!currentMember.frozen)}
                style={{ border: 0, minHeight: 34, padding: '0 11px' }}
              >
                <Snowflake size={13} /> {currentMember.frozen ? 'Разморозить' : 'Заморозить'}
              </button>
              <button
                className="chip"
                onClick={() => onNavigate('goals')}
                style={{ border: 0, minHeight: 34, padding: '0 11px' }}
              >
                <Target size={13} /> К целям
              </button>
            </div>
          </div>
        </section>

        <section className="span-6 stack">
          <div className="card">
            <SectionHead
              title={isTeen ? 'Твои лимиты' : 'Лимиты от мамы'}
              subtitle={isTeen ? 'Можно попросить изменить в любой момент' : 'Безопасные карманные расходы'}
            />
            <div className="limit-visual">
              <RingProgress
                value={percent(currentMember.spentToday, currentMember.dailyLimit)}
                size={88}
                stroke={8}
                color="var(--accent)"
              >
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>
                  {Math.round(percent(currentMember.spentToday, currentMember.dailyLimit))}%
                </strong>
                <span style={{ fontSize: 8, color: 'var(--muted)' }}>дня</span>
              </RingProgress>
              <div className="limit-visual__text">
                <strong>Дневной лимит</strong>
                <span>
                  Потрачено {formatMoney(currentMember.spentToday)} из {formatMoney(currentMember.dailyLimit)}
                </span>
                <div style={{ marginTop: 8 }}>
                  <Progress
                    value={percent(currentMember.spentToday, currentMember.dailyLimit)}
                    color="var(--accent)"
                    height={6}
                    track="var(--chart-track)"
                  />
                </div>
              </div>
            </div>
            <div className="switch-row" style={{ marginTop: 6 }}>
              <span className="switch-row__text">
                <strong>Месячный лимит</strong>
                <span>{formatMoney(currentMember.spentMonth)} из {formatMoney(currentMember.monthlyLimit)}</span>
              </span>
              <span style={{ fontSize: 11, fontWeight: 800 }}>
                {Math.round(percent(currentMember.spentMonth, currentMember.monthlyLimit))}%
              </span>
            </div>
            <Progress
              value={percent(currentMember.spentMonth, currentMember.monthlyLimit)}
              color="var(--blue)"
              height={6}
              track="var(--chart-track)"
            />
          </div>

          <div className="card">
            <SectionHead
              title={isTeen ? 'Приватность' : 'Что можно оплачивать'}
              subtitle={isTeen ? 'Ты сам решаешь, что видит семья' : 'Категории под контролем родителя'}
            />
            {isTeen ? (
              <div className="switch-row" style={{ paddingTop: 0 }}>
                <span className="switch-row__text">
                  <strong>Скрывать покупки от родителей</strong>
                  <span>Операции исчезнут из семейной ленты, но останутся у тебя</span>
                </span>
                <Switch
                  checked={currentMember.privateSpending}
                  onChange={(value) => {
                    dispatch({ type: 'set-private', memberId: currentMember.id, value });
                    notify(
                      value ? 'Покупки скрыты от семьи' : 'Покупки снова видны семье',
                      value ? 'Приватность включена' : 'Лента семьи обновлена',
                      'info',
                    );
                  }}
                  label="Скрывать покупки от родителей"
                />
              </div>
            ) : (
              <div className="category-permissions">
                {allowed.slice(0, 5).map((category) => (
                  <span className="permission-chip" key={category.id}>
                    <CategoryIcon name={category.icon} size={11} /> {category.label}
                  </span>
                ))}
                {blocked.map((category) => (
                  <span className="permission-chip is-blocked" key={category.id}>
                    <Lock size={11} /> {category.label}
                  </span>
                ))}
              </div>
            )}
            {!isTeen && (
              <div className="hidden-note" style={{ marginTop: 10 }}>
                <ShieldCheck size={13} />
                Изменить лимиты и категории может родитель в разделе «Семья».
              </div>
            )}
            {isTeen && (
              <div className="hidden-note" style={{ marginTop: 10 }}>
                <Fingerprint size={13} />
                Приватность не скрывает операции от банка и anti-fraud. Только от семейной ленты.
              </div>
            )}
          </div>
        </section>

        <section className="span-7 card">
          <SectionHead
            title="Мои операции"
            subtitle="Только по твоей карте"
            action={<Chip tone="accent"><Gift size={11} /> {formatMoney(transactions.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0))} пришло</Chip>}
          />
          <TransactionList transactions={transactions} limit={6} showActor={false} />
          <button className="link-btn" onClick={() => onNavigate('goals')} style={{ marginTop: 10 }}>
            Вложить в семейную цель <ArrowRight size={14} />
          </button>
        </section>

        <section className="span-5 stack">
          <div className="security-card">
            <span className="security-card__icon"><ShieldCheck size={20} /></span>
            <div>
              <strong>Карта под защитой</strong>
              <p>Поведенческий anti-fraud проверяет каждую операцию. Подозрительные покупки блокируются автоматически.</p>
            </div>
          </div>
          <div className="card" style={{ background: 'var(--surface-soft)' }}>
            <div className="row" style={{ gap: 11 }}>
              <span className="empty__icon" style={{ width: 38, height: 38, margin: 0, borderRadius: 11 }}>
                <Snowflake size={17} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: 12.5 }}>Потеряли карту?</strong>
                <span style={{ fontSize: 10.5, lineHeight: 1.45, color: 'var(--muted)' }}>
                  Заморозьте её здесь за секунду — деньги останутся в безопасности.
                </span>
              </div>
            </div>
          </div>
          {!isTeen && (
            <div className="hidden-note">
              <Sparkles size={13} />
              Мама может пополнить карту из семейного бюджета — попроси её, если нужны деньги.
            </div>
          )}
        </section>
      </div>

      <CardDetailsSheet
        memberId={currentMember.id}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
