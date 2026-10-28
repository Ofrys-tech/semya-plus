import { useState } from 'react';
import {
  ArrowRight,
  Clock3,
  Flame,
  Gift,
  Play,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useApp } from '../../store';
import { formatDateLong, formatMoney, getLevel, percent } from '../../lib';
import type { Tab } from '../../types';
import {
  Button,
  Chip,
  Progress,
  RingProgress,
  SectionHead,
} from '../../components/ui';
import {
  AchievementIcon,
  TaskIcon,
} from '../../components/ui';
import { GoalImage, TransactionList, visibleTransactions } from '../../components/common';
import { GoalDetailSheet } from '../../components/dialogs';
import { QuestModal } from '../../components/QuestModal';

export function KidHome({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { state, currentMember, dispatch, notify } = useApp();
  const [questId, setQuestId] = useState<string | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);

  const level = getLevel(currentMember.xp);
  const completedMissions = state.missions.filter((mission) => mission.completed).length;
  const nextMission = state.missions.find((mission) => !mission.completed);
  const tasks = state.tasks.filter((task) => task.assignee === currentMember.id);
  const activeTasks = tasks.filter((task) => task.status !== 'done');
  const vacation = state.goals.find((goal) => goal.id === 'goal-vacation') ?? state.goals[0];
  const ownVacation = vacation
    ? vacation.contributions
        .filter((contribution) => contribution.memberId === currentMember.id)
        .reduce((sum, contribution) => sum + contribution.amount, 0)
    : 0;
  const unlocked = state.achievements.filter((achievement) => achievement.unlocked).length;
  const transactions = visibleTransactions(state, currentMember);
  const selectedGoal = state.goals.find((goal) => goal.id === goalId) ?? null;
  const progressToNext = level.nextMin
    ? Math.round(((currentMember.xp - level.min) / (level.nextMin - level.min)) * 100)
    : 100;

  const submitTask = (id: string, title: string, reward: number) => {
    dispatch({ type: 'submit-task', id });
    notify('Задание отправлено маме', `«${title}» · награда ${formatMoney(reward)}`, 'success');
  };

  return (
    <div className="screen">
      <div className="kid-hero">
        <span className="kid-hero__orbit kid-hero__orbit--one" />
        <span className="kid-hero__orbit kid-hero__orbit--two" />
        <img className="kid-hero__mascot" src="./assets/mascot-star.webp" alt="Искра — талисман Семьи+" />
        <div className="kid-hero__content">
          <span className="kid-hero__hello">
            <Star size={13} fill="currentColor" /> {formatDateLong()}
          </span>
          <h1>
            Привет,
            <br />
            {currentMember.firstName}!
          </h1>
          <span className="kid-hero__level">
            <Zap size={13} fill="currentColor" /> {level.level} уровень · {level.title}
          </span>
          <div className="kid-balance">
            <span className="kid-balance__label">
              На моей карте
              <strong>{formatMoney(currentMember.balance)}</strong>
            </span>
            <span className="kid-balance__coins">
              <img src="./assets/spark-coin.webp" alt="" /> {currentMember.xp}
            </span>
          </div>
        </div>
      </div>

      <div className="kid-stats">
        <div className="kid-stat">
          <span className="kid-stat__icon"><Flame size={17} /></span>
          <div>
            <span>Серия</span>
            <strong>{currentMember.streak} дней</strong>
          </div>
        </div>
        <div className="kid-stat">
          <span className="kid-stat__icon"><Trophy size={17} /></span>
          <div>
            <span>Миссии</span>
            <strong>{completedMissions} из {state.missions.length}</strong>
          </div>
        </div>
        <div className="kid-stat">
          <span className="kid-stat__icon"><Sparkles size={17} /></span>
          <div>
            <span>Искры</span>
            <strong>{currentMember.xp}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="span-8">
          {nextMission ? (
            <div className="quest-feature">
              <div className="quest-feature__content">
                <span className="quest-feature__label">
                  <Star size={11} fill="currentColor" /> Квест дня
                </span>
                <h3>{nextMission.title}</h3>
                <p>{nextMission.subtitle}</p>
                <div className="quest-feature__rewards">
                  <span><Sparkles size={11} /> +{nextMission.rewardXp} искр</span>
                  <span><Gift size={11} /> {formatMoney(nextMission.rewardMoney)}</span>
                  <span><Clock3 size={11} /> {nextMission.minutes} мин</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Play size={14} />}
                    onClick={() => setQuestId(nextMission.id)}
                    style={{ background: 'rgba(255,255,255,.95)', borderColor: 'transparent' }}
                  >
                    Начать квест
                  </Button>
                </div>
              </div>
              <img className="quest-feature__mascot" src="./assets/mascot-star.webp" alt="" />
            </div>
          ) : (
            <div className="quest-feature">
              <div className="quest-feature__content">
                <span className="quest-feature__label"><Trophy size={11} /> Все квесты недели</span>
                <h3>Ты прошёл всё!</h3>
                <p>Новые миссии появятся в понедельник. Пока загляни в достижения — там есть чем гордиться.</p>
                <div style={{ marginTop: 12 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Trophy size={14} />}
                    onClick={() => onNavigate('achievements')}
                  >
                    Мои достижения
                  </Button>
                </div>
              </div>
              <img className="quest-feature__mascot" src="./assets/spark-coin.webp" alt="" />
            </div>
          )}

          <div className="card" style={{ marginTop: 14 }}>
            <SectionHead
              title="Задания от мамы"
              subtitle={activeTasks.length ? `${activeTasks.length} в работе` : 'Всё выполнено — ты супер!'}
              action={<Chip tone="accent"><Gift size={11} /> {formatMoney(tasks.filter((task) => task.status === 'done').reduce((sum, task) => sum + task.reward, 0))} заработано</Chip>}
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
                      <span>{task.status === 'review' ? 'Мама проверяет' : task.note}</span>
                    </span>
                    <span className="kid-task__reward">
                      <Gift size={11} /> {formatMoney(task.reward)}
                    </span>
                    {task.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => submitTask(task.id, task.title, task.reward)}
                      >
                        Выполнил
                      </Button>
                    ) : (
                      <Chip tone="warning">На проверке</Chip>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="hidden-note" style={{ marginTop: 4 }}>
                <Star size={13} /> Новые задания появятся здесь. Загляни позже!
              </div>
            )}
          </div>
        </section>

        <aside className="span-4 stack">
          <div className="card level-card">
            <div className="row" style={{ gap: 12 }}>
              <RingProgress value={progressToNext} size={62} stroke={7} color="var(--accent)">
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>{level.level}</strong>
              </RingProgress>
              <div style={{ flex: 1 }}>
                <div className="level-top">
                  <strong>{level.title}</strong>
                  <span>{currentMember.xp} искр</span>
                </div>
                <div className="level-progress__labels">
                  <span>{level.nextTitle ? `До «${level.nextTitle}»` : 'Максимальный уровень'}</span>
                  <span>{level.nextMin ? `${level.nextMin - currentMember.xp} искр` : '100%'}</span>
                </div>
                <div style={{ marginTop: 7 }}>
                  <Progress value={progressToNext} color="var(--accent)" height={7} track="var(--chart-track)" />
                </div>
              </div>
            </div>
            <div className="row row--between" style={{ marginTop: 4 }}>
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{completedMissions} миссий пройдено</span>
              <button className="link-btn" onClick={() => onNavigate('achievements')}>
                Достижения <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {vacation && (
            <div className="card">
              <SectionHead
                title="Наша общая цель"
                subtitle="Ты тоже её приближаешь"
              />
              <button className="family-goal-kid" onClick={() => setGoalId(vacation.id)}>
                <GoalImage image={vacation.image} />
                <span className="family-goal-kid__text">
                  <strong>{vacation.title}</strong>
                  <span>{formatMoney(vacation.saved)} из {formatMoney(vacation.target)}</span>
                  <span style={{ color: 'var(--accent-strong)', fontWeight: 800 }}>
                    Твой вклад: {formatMoney(ownVacation)}
                  </span>
                  <span className="family-goal-kid__bar">
                    <Progress
                      value={percent(vacation.saved, vacation.target)}
                      color="var(--accent)"
                      height={6}
                      track="var(--chart-track)"
                    />
                  </span>
                </span>
              </button>
              <div className="hidden-note" style={{ marginTop: 10 }}>
                <Target size={13} />
                Осталось {formatMoney(Math.max(0, vacation.target - vacation.saved))} — копим всей семьёй.
              </div>
            </div>
          )}
        </aside>

        <section className="span-7 card">
          <SectionHead
            title="Мои достижения"
            subtitle={`${unlocked} из ${state.achievements.length} открыто`}
            action={
              <button className="link-btn" onClick={() => onNavigate('achievements')}>
                Все <ArrowRight size={13} />
              </button>
            }
          />
          <div className="badge-strip">
            {state.achievements.slice(0, 4).map((achievement) => (
              <div
                key={achievement.id}
                className={`badge-mini ${achievement.unlocked ? '' : 'is-locked'}`}
                title={achievement.description}
              >
                <span className="badge-mini__icon">
                  <AchievementIcon name={achievement.icon} size={18} />
                </span>
                <span>{achievement.title}</span>
              </div>
            ))}
          </div>
          <div className="row row--between" style={{ marginTop: 13 }}>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              До следующего бейджа: {Math.max(0, 5 - completedMissions)} миссий
            </span>
            <Chip tone="warning"><Flame size={11} /> серия {currentMember.streak} дней</Chip>
          </div>
        </section>

        <section className="span-5 card">
          <SectionHead
            title="Мои траты"
            subtitle="Последние операции по карте"
            action={
              <button className="link-btn" onClick={() => onNavigate('card')}>
                Карта <ArrowRight size={13} />
              </button>
            }
          />
          <TransactionList transactions={transactions} limit={4} showActor={false} compact />
          <div className="hidden-note" style={{ marginTop: 10 }}>
            <Sparkles size={13} />
            AI подсказывает миссии под твои реальные траты.
          </div>
        </section>
      </div>

      <QuestModal missionId={questId} open={Boolean(questId)} onClose={() => setQuestId(null)} />
      <GoalDetailSheet goal={selectedGoal} open={Boolean(goalId)} onClose={() => setGoalId(null)} />
    </div>
  );
}
