import { useState } from 'react';
import { ArrowUpRight, Plus, Sparkles, Target, Users } from 'lucide-react';
import { useApp } from '../../store';
import { deadlineLabel, formatMoney, percent } from '../../lib';
import type { Tab } from '../../types';
import { Button, Chip, PageTitle, Progress, RingProgress, SectionHead } from '../../components/ui';
import { GoalCelebration, GoalImage } from '../../components/common';
import { GoalCreateSheet, GoalDetailSheet } from '../../components/dialogs';

export function GoalsScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { state, currentMember } = useApp();
  const [goalId, setGoalId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const isParent = currentMember.role === 'parent';

  const saved = state.goals.reduce((sum, goal) => sum + goal.saved, 0);
  const target = state.goals.reduce((sum, goal) => sum + goal.target, 0);
  const progress = percent(saved, target);
  const ownTotal = state.goals.reduce(
    (sum, goal) =>
      sum +
      goal.contributions
        .filter((contribution) => contribution.memberId === currentMember.id)
        .reduce((value, contribution) => value + contribution.amount, 0),
    0,
  );
  const nearest = [...state.goals].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  )[0];
  const selectedGoal = state.goals.find((goal) => goal.id === goalId) ?? null;

  return (
    <div className="screen">
      <PageTitle
        eyebrow={isParent ? 'Общие мечты' : 'Копилка мечты'}
        title={isParent ? 'Семейные цели' : 'Наши цели'}
        subtitle={
          isParent
            ? 'Копите вместе: успехи детей ускоряют общую мечту'
            : 'Твои миссии и вклады приближают большие семейные планы'
        }
        action={
          isParent ? (
            <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              Новая цель
            </Button>
          ) : (
            <Chip tone="accent">
              <Sparkles size={12} /> твой вклад {formatMoney(ownTotal)}
            </Chip>
          )
        }
      />

      <div className="goals-summary">
        <div className="goals-summary__text">
          <span>Накоплено семьёй</span>
          <strong>{formatMoney(saved)}</strong>
          <p>
            из {formatMoney(target)} · {state.goals.length} {state.goals.length === 1 ? 'цель' : 'цели'} ·{' '}
            {nearest ? `ближайшая через ${deadlineLabel(nearest.deadline).replace(' до цели', '')}` : 'всё впереди'}
          </p>
        </div>
        <div className="goals-summary__ring">
          <RingProgress
            value={progress}
            size={94}
            stroke={9}
            color="#ffffff"
            track="rgba(255,255,255,.2)"
          >
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.04em' }}>
              {Math.round(progress)}%
            </strong>
            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,.7)' }}>к цели</span>
          </RingProgress>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 22 }}>
        <div>
          <h2>{isParent ? 'Все цели семьи' : 'Куда мы копим'}</h2>
          <p>
            {isParent
              ? 'Успехи детей автоматически добавляют деньги в общую копилку'
              : 'Нажми на цель, чтобы увидеть вклады и добавить свои'}
          </p>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <Chip tone="accent"><Users size={11} /> вместе</Chip>
          <Chip tone="success"><Target size={11} /> {state.goals.length} цели</Chip>
        </div>
      </div>

      <div className="goals-grid">
        {state.goals.map((goal) => {
          const goalProgress = percent(goal.saved, goal.target);
          const own = goal.contributions
            .filter((contribution) => contribution.memberId === currentMember.id)
            .reduce((sum, contribution) => sum + contribution.amount, 0);
          return (
            <button className="goal-tile" key={goal.id} onClick={() => setGoalId(goal.id)}>
              <div className="goal-tile__top">
                <div className="goal-tile__title">
                  <strong>{goal.title}</strong>
                  <span>{goal.subtitle}</span>
                </div>
                <span className="goal-tile__img">
                  <GoalImage image={goal.image} />
                </span>
              </div>
              <Progress
                value={goalProgress}
                color="var(--accent)"
                height={7}
                track="var(--chart-track)"
              />
              <div className="goal-tile__numbers">
                <strong>{formatMoney(goal.saved)}</strong>
                <span>из {formatMoney(goal.target)}</span>
              </div>
              <div className="goal-tile__foot">
                <span>{deadlineLabel(goal.deadline)}</span>
                {goal.saved >= goal.target ? (
                  <GoalCelebration goal={goal} />
                ) : (
                  <span className="row" style={{ gap: 3, color: 'var(--accent-strong)', fontWeight: 800 }}>
                    {Math.round(goalProgress)}% <ArrowUpRight size={12} />
                  </span>
                )}
              </div>
              {!isParent && own > 0 && (
                <div className="hidden-note" style={{ marginTop: 0, padding: '7px 9px' }}>
                  <Sparkles size={12} /> Ты уже вложил {formatMoney(own)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isParent ? (
        <div className="dashboard-grid" style={{ marginTop: 18 }}>
          <section className="span-7 card">
            <SectionHead
              title="Как ускоряются цели"
              subtitle="Связка заданий, миссий и общего бюджета"
            />
            <div className="info-steps">
              <div className="info-step">
                <span className="info-step__num">1</span>
                <div>
                  <strong>Ребёнок проходит миссию</strong>
                  <p>Часть награды автоматически уходит в копилку семейной цели.</p>
                </div>
              </div>
              <div className="info-step">
                <span className="info-step__num">2</span>
                <div>
                  <strong>Родитель пополняет в один клик</strong>
                  <p>Из семейного бюджета, без комиссии и отдельных переводов.</p>
                </div>
              </div>
              <div className="info-step">
                <span className="info-step__num">3</span>
                <div>
                  <strong>Прогресс виден каждому</strong>
                  <p>Общая шкала мотивирует продолжать — и детям, и взрослым.</p>
                </div>
              </div>
            </div>
          </section>
          <section className="span-5 card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
            <span className="empty__icon" style={{ margin: 0 }}>
              <Sparkles size={22} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: 14 }}>Дети уже добавили {formatMoney(
                state.goals.reduce(
                  (sum, goal) =>
                    sum +
                    goal.contributions
                      .filter((contribution) => contribution.memberId === 'timur' || contribution.memberId === 'karina')
                      .reduce((value, contribution) => value + contribution.amount, 0),
                  0,
                ),
              )}</strong>
              <p style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
                Это реальные деньги, заработанные заданиями и миссиями. Прогресс цели — общий, вклад каждого — виден.
              </p>
            </div>
            <div className="row" style={{ gap: 7 }}>
              <Button variant="soft" size="sm" onClick={() => onNavigate('tasks')}>
                Задания
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCreateOpen(true)}>
                Создать цель
              </Button>
            </div>
          </section>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="row" style={{ gap: 14 }}>
            <img
              src="./assets/spark-coin.webp"
              alt=""
              style={{ width: 64, height: 64, objectFit: 'contain', flex: 'none' }}
            />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: 14 }}>Каждая миссия добавляет деньги к цели</strong>
              <p style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
                Проходи квесты и выполняй задания — часть награды сразу летит в семейную копилку.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onNavigate(currentMember.role === 'kid' ? 'missions' : 'tasks')}
            >
              {currentMember.role === 'kid' ? 'К миссиям' : 'К заданиям'}
            </Button>
          </div>
        </div>
      )}

      <GoalDetailSheet goal={selectedGoal} open={Boolean(goalId)} onClose={() => setGoalId(null)} />
      <GoalCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
