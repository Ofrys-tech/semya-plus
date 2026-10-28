import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  Gift,
  ListChecks,
  Plus,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { useApp } from '../../store';
import { formatMoney, relativeDay } from '../../lib';
import type { FamilyTask, Member } from '../../types';
import {
  Avatar,
  Button,
  Chip,
  EmptyState,
  PageTitle,
  Segmented,
  TaskIcon,
} from '../../components/ui';
import { TaskCreateSheet } from '../../components/dialogs';

type TaskTab = 'all' | 'review' | 'active' | 'done';

export function TasksScreen() {
  const { state, currentMember, dispatch, notify } = useApp();
  const isParent = currentMember.role === 'parent';
  const [tab, setTab] = useState<TaskTab>(isParent ? 'review' : 'active');
  const [assignee, setAssignee] = useState<'all' | 'timur' | 'karina'>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const relevant = isParent
    ? state.tasks
    : state.tasks.filter((task) => task.assignee === currentMember.id);
  const filtered = useMemo(
    () =>
      relevant.filter((task) => {
        const matchesTab = tab === 'all' || task.status === tab;
        const matchesAssignee = assignee === 'all' || task.assignee === assignee;
        return matchesTab && matchesAssignee;
      }),
    [relevant, tab, assignee],
  );

  const counts = {
    review: relevant.filter((task) => task.status === 'review').length,
    active: relevant.filter((task) => task.status === 'active').length,
    done: relevant.filter((task) => task.status === 'done').length,
  };
  const paid = relevant
    .filter((task) => task.status === 'done')
    .reduce((sum, task) => sum + task.reward, 0);
  const earned = state.tasks
    .filter((task) => task.assignee === currentMember.id && task.status === 'done')
    .reduce((sum, task) => sum + task.reward, 0);

  const approve = (task: FamilyTask) => {
    if (task.reward > state.familyBalance) {
      notify('Недостаточно средств', 'Пополните семейный бюджет', 'error');
      return;
    }
    dispatch({ type: 'approve-task', id: task.id });
    notify('Награда отправлена', `${task.assignee === 'timur' ? 'Тимуру' : 'Карине'} · ${formatMoney(task.reward)}`);
  };

  const reject = (task: FamilyTask) => {
    dispatch({ type: 'reject-task', id: task.id });
    notify('Задание возвращено', `«${task.title}» снова в работе`, 'info');
  };

  const submit = (task: FamilyTask) => {
    dispatch({ type: 'submit-task', id: task.id });
    notify('Отправлено на проверку', `«${task.title}» · ждём подтверждения родителя`, 'success');
  };

  return (
    <div className="screen">
      <PageTitle
        eyebrow={isParent ? 'Мотивация и практика' : 'Твои поручения'}
        title={isParent ? 'Задания и награды' : 'Мои задания'}
        subtitle={
          isParent
            ? 'Ребёнок выполняет — вы подтверждаете — деньги сразу на карте'
            : 'Выполняй задания, получай деньги на карту и искры для уровня'
        }
        action={
          isParent ? (
            <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              Новое задание
            </Button>
          ) : (
            <Chip tone="accent">
              <Sparkles size={12} /> {formatMoney(earned)} заработано
            </Chip>
          )
        }
      />

      <div className="task-stats">
        <div className="stat-card">
          <span>{isParent ? 'На проверке' : 'Ждут проверки'}</span>
          <strong>{counts.review}</strong>
          <em className="is-neutral">{counts.review ? 'нужно ваше решение' : 'всё проверено'}</em>
        </div>
        <div className="stat-card">
          <span>Активные</span>
          <strong>{counts.active}</strong>
          <em className="is-good">{counts.active ? 'в работе сейчас' : 'нет активных'}</em>
        </div>
        <div className="stat-card">
          <span>{isParent ? 'Выплачено' : 'Заработано'}</span>
          <strong>{formatMoney(isParent ? paid : earned)}</strong>
          <em className="is-neutral">{counts.done} выполнено</em>
        </div>
      </div>

      <div className="task-toolbar">
        <Segmented<TaskTab>
          ariaLabel="Фильтр заданий"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'review', label: 'На проверке', badge: counts.review },
            { value: 'active', label: 'Активные', badge: counts.active },
            { value: 'done', label: 'Выполненные', badge: counts.done },
            { value: 'all', label: 'Все' },
          ]}
        />
        {isParent && (
          <div className="row" style={{ gap: 6 }}>
            {([
              ['all', 'Все дети'],
              ['timur', 'Тимур'],
              ['karina', 'Карина'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                className={`chip ${assignee === value ? 'chip--accent' : ''}`}
                onClick={() => setAssignee(value)}
                style={{ border: 0 }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length ? (
        <div className="task-list">
          {filtered.map((task) => {
            const member = state.members.find((item) => item.id === task.assignee);
            return (
              <TaskCard
                key={task.id}
                task={task}
                member={member}
                isParent={isParent}
                onApprove={() => approve(task)}
                onReject={() => reject(task)}
                onSubmit={() => submit(task)}
              />
            );
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<ListChecks size={22} />}
            title="Здесь пока пусто"
            text={
              tab === 'review'
                ? 'Как только ребёнок отметит задание выполненным, оно появится здесь.'
                : tab === 'done'
                  ? 'Выполненные задания и выплаченные награды будут здесь.'
                  : 'Создайте первое задание — и мотивация заработает.'
            }
            action={
              isParent && tab !== 'done' ? (
                <Button variant="soft" size="sm" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
                  Создать задание
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {isParent && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="row row--between row--wrap" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 12 }}>
              <span className="task-emoji task-emoji--care" style={{ width: 46, height: 46 }}>
                <Gift size={20} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: 13.5 }}>Как это работает</strong>
                <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Ребёнок отмечает выполнение → вы подтверждаете → награда мгновенно на карте и в копилке цели.
                </span>
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <Chip tone="accent"><Sparkles size={11} /> +искры за каждое</Chip>
              <Chip tone="success"><CheckCircle2 size={11} /> без комиссии</Chip>
            </div>
          </div>
        </div>
      )}

      <TaskCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function TaskCard({
  task,
  member,
  isParent,
  onApprove,
  onReject,
  onSubmit,
}: {
  task: FamilyTask;
  member: Member | undefined;
  isParent: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSubmit: () => void;
}) {
  const { state } = useApp();
  const progress =
    task.status === 'done'
      ? 100
      : state.missions.filter((mission) => mission.completed).length * 10 + (task.status === 'review' ? 70 : 20);

  return (
    <article className={`task-card ${task.status === 'review' ? 'is-review' : ''} ${task.status === 'done' ? 'is-done' : ''}`}>
      <span className={`task-emoji task-emoji--${task.kind}`} style={{ width: 46, height: 46 }}>
        <TaskIcon kind={task.kind} size={20} />
      </span>
      <div className="task-card__body">
        <div className="task-card__top">
          <div className="task-card__title">
            <strong>{task.title}</strong>
            <span>{task.note}</span>
          </div>
          <Chip tone={task.status === 'review' ? 'warning' : task.status === 'done' ? 'success' : 'accent'}>
            {task.status === 'review' ? <Clock3 size={11} /> : task.status === 'done' ? <Check size={11} /> : <Sparkles size={11} />}
            {task.status === 'review' ? 'На проверке' : task.status === 'done' ? 'Выполнено' : 'В работе'}
          </Chip>
        </div>
        <div className="task-card__meta">
          {member && (
            <span className="row" style={{ gap: 6 }}>
              <Avatar member={member} size={22} />
              <span style={{ fontSize: 10.5, fontWeight: 700 }}>{member.firstName}</span>
            </span>
          )}
          <Chip>{relativeDay(task.due)}</Chip>
          <span className="task-reward"><Gift size={13} /> {formatMoney(task.reward)}</span>
          <span className="task-xp"><Sparkles size={12} /> +{task.xp} искр</span>
          {!isParent && task.status !== 'done' && (
            <span style={{ fontSize: 9.5, color: 'var(--muted)' }}>{Math.round(progress)}% пути</span>
          )}
        </div>
        {isParent && task.status === 'review' && (
          <div className="review-actions">
            <Button size="sm" icon={<Check size={14} />} onClick={onApprove}>
              Одобрить {formatMoney(task.reward)}
            </Button>
            <Button size="sm" variant="secondary" icon={<Undo2 size={14} />} onClick={onReject}>
              Вернуть
            </Button>
          </div>
        )}
        {!isParent && task.status === 'active' && (
          <div className="review-actions">
            <Button size="sm" icon={<Check size={14} />} onClick={onSubmit}>
              Я выполнил
            </Button>
          </div>
        )}
        {!isParent && task.status === 'review' && (
          <div className="task-review-note" style={{ marginTop: 8 }}>
            <Clock3 size={13} /> Мама проверит задание и отправит награду
          </div>
        )}
        {!isParent && task.status === 'done' && (
          <div className="task-review-note" style={{ marginTop: 8, background: 'var(--green-soft)', color: 'var(--green)' }}>
            <CheckCircle2 size={13} /> Награда {formatMoney(task.reward)} уже на твоей карте
          </div>
        )}
      </div>
    </article>
  );
}
