import { ChevronRight, EyeOff, Sparkles } from 'lucide-react';
import { useApp } from '../store';
import { formatMoney, relativeDay } from '../lib';
import type { ActorId, AppState, Goal, Member, TaskKind, Transaction } from '../types';
import { ActorAvatar, CategoryIcon, TaskIcon, Chip } from './ui';

export const GOAL_IMAGES: Record<Goal['image'], string> = {
  vacation: './assets/goal-vacation.webp',
  bike: './assets/goal-bike.webp',
  laptop: './assets/goal-laptop.webp',
  spark: './assets/spark-coin.webp',
};

export function GoalImage({ image, className = '' }: { image: Goal['image']; className?: string }) {
  return <img src={GOAL_IMAGES[image]} alt="" className={className} loading="lazy" />;
}

export function memberName(members: Member[], id: ActorId): string {
  if (id === 'family') return 'Семейный бюджет';
  return members.find((member) => member.id === id)?.firstName ?? 'Участник';
}

export function roleLabel(member: Member): string {
  if (member.role === 'parent') return 'Родитель';
  if (member.role === 'teen') return `Подросток · ${member.age} лет`;
  return `Ребёнок · ${member.age} лет`;
}

export function visibleTransactions(state: AppState, viewer: Member): Transaction[] {
  return state.transactions
    .filter((transaction) => {
      if (transaction.memberId === 'family') return true;
      if (viewer.role === 'parent') {
        const owner = state.members.find((member) => member.id === transaction.memberId);
        return !owner?.privateSpending || owner.id === viewer.id;
      }
      return transaction.memberId === viewer.id;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function hiddenCount(state: AppState, viewer: Member): number {
  if (viewer.role !== 'parent') return 0;
  return state.transactions.filter((transaction) => {
    const owner = state.members.find((member) => member.id === transaction.memberId);
    return owner?.privateSpending && owner.id !== viewer.id;
  }).length;
}

export function TransactionList({
  transactions,
  limit,
  showActor = true,
  compact = false,
}: {
  transactions: Transaction[];
  limit?: number;
  showActor?: boolean;
  compact?: boolean;
}) {
  const { state } = useApp();
  const items = typeof limit === 'number' ? transactions.slice(0, limit) : transactions;

  return (
    <div className="tx-list">
      {items.map((transaction) => {
        const category =
          state.categories.find((item) => item.id === transaction.categoryId) ?? state.categories[0];
        const actor = memberName(state.members, transaction.memberId);
        return (
          <div className="tx-row" key={transaction.id}>
            <span
              className="tx-icon"
              style={{
                background: `color-mix(in srgb, ${category.color} 13%, white)`,
                color: category.color,
              }}
            >
              <CategoryIcon name={category.icon} size={compact ? 16 : 18} />
            </span>
            <span className="tx-row__text">
              <strong>{transaction.title}</strong>
              <span>
                {relativeDay(transaction.date)}
                {showActor ? ` · ${actor}` : ''}
                {!compact ? ` · ${category.label}` : ''}
              </span>
            </span>
            <span
              className={`tx-row__amount ${transaction.amount > 0 ? 'is-positive' : ''}`}
            >
              {formatMoney(transaction.amount, transaction.amount > 0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MemberLine({
  member,
  onClick,
  balance = true,
}: {
  member: Member;
  onClick?: () => void;
  balance?: boolean;
}) {
  const content = (
    <>
      <ActorAvatar actor={member.id} members={[member]} size={38} />
      <span className="member-row__text">
        <strong>{member.firstName}</strong>
        <span>{member.role === 'parent' ? 'Родитель' : member.role === 'teen' ? 'Подросток' : 'Ребёнок'}</span>
      </span>
      {balance && <span className="member-row__balance">{formatMoney(member.balance)}</span>}
      {onClick && <ChevronRight size={16} />}
    </>
  );

  if (!onClick) return <div className="member-row">{content}</div>;
  return (
    <button className="member-row" onClick={onClick}>
      {content}
    </button>
  );
}

export function TaskMini({
  title,
  note,
  kind,
  reward,
  onClick,
}: {
  title: string;
  note: string;
  kind: TaskKind;
  reward: number;
  onClick?: () => void;
}) {
  return (
    <button className="mini-task" onClick={onClick} style={{ width: '100%', border: 0, background: 'none', textAlign: 'left' }}>
      <span className={`task-emoji task-emoji--${kind}`}>
        <TaskIcon kind={kind} size={17} />
      </span>
      <span className="mini-task__text">
        <strong>{title}</strong>
        <span>{note}</span>
      </span>
      <span className="mini-task__reward">
        {formatMoney(reward)}
        <span>награда</span>
      </span>
    </button>
  );
}

export function PrivacyNote({ count }: { count: number }) {
  if (!count) return null;
  return (
    <div className="hidden-note">
      <EyeOff size={13} />
      {count} {count === 1 ? 'операция скрыта' : count < 5 ? 'операции скрыты' : 'операций скрыто'} настройками
      приватности
    </div>
  );
}

export function TaskStatusChip({ status }: { status: 'active' | 'review' | 'done' }) {
  if (status === 'review') return <Chip tone="warning">На проверке</Chip>;
  if (status === 'done') return <Chip tone="success">Выполнено</Chip>;
  return <Chip tone="accent">В процессе</Chip>;
}

export function DateBadge({ date }: { date: string }) {
  return <Chip>{relativeDay(date)}</Chip>;
}

export function GoalCelebration({ goal }: { goal: Goal }) {
  if (goal.saved < goal.target) return null;
  return (
    <Chip tone="success">
      <Sparkles size={12} /> Цель достигнута
    </Chip>
  );
}
