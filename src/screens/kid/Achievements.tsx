import {
  ArrowRight,
  Flame,
  Gift,
  Sparkles,
  Star,
  Target,
  Trophy,
} from 'lucide-react';
import { useApp } from '../../store';
import { formatMoney, getLevel, percent } from '../../lib';
import type { Tab } from '../../types';
import {
  AchievementIcon,
  Button,
  Chip,
  PageTitle,
  Progress,
  RingProgress,
  SectionHead,
} from '../../components/ui';

export function AchievementsScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { state, currentMember } = useApp();
  const level = getLevel(currentMember.xp);
  const unlocked = state.achievements.filter((achievement) => achievement.unlocked).length;
  const progress = unlocked / state.achievements.length;
  const xpProgress = level.nextMin
    ? Math.round(((currentMember.xp - level.min) / (level.nextMin - level.min)) * 100)
    : 100;
  const missionEarned = state.missions
    .filter((mission) => mission.completed)
    .reduce((sum, mission) => sum + mission.rewardMoney, 0);
  const taskEarned = state.tasks
    .filter((task) => task.assignee === currentMember.id && task.status === 'done')
    .reduce((sum, task) => sum + task.reward, 0);

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const label = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date).slice(0, 2);
    const isDone = index >= 7 - currentMember.streak;
    return { label, isDone, isToday: index === 6, date: date.getDate() };
  });

  return (
    <div className="screen">
      <PageTitle
        eyebrow="Коллекция"
        title="Достижения"
        subtitle="Твой путь от новичка до финансового детектива"
        action={<Chip tone="warning"><Trophy size={12} /> {unlocked} из {state.achievements.length}</Chip>}
      />

      <div className="level-hero">
        <div className="level-hero__badge">
          <span>{level.level}</span>
          <small>уровень</small>
        </div>
        <div className="level-hero__text">
          <h2>{level.title}</h2>
          <p>{currentMember.xp} искр · до следующего уровня {level.nextMin ? `${Math.max(0, level.nextMin - currentMember.xp)} искр` : 'ты на максимуме'}</p>
          <div className="level-hero__labels">
            <span>{level.nextTitle ? `Следующий: ${level.nextTitle}` : 'Максимальный уровень'}</span>
            <span>{xpProgress}%</span>
          </div>
        </div>
        <div className="level-hero__progress">
          <Progress value={xpProgress} color="var(--accent)" height={8} track="var(--chart-track)" />
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <section className="span-6 card">
          <div className="streak-card">
            <span className="streak-card__flame"><Flame size={24} /></span>
            <div className="streak-card__text">
              <strong>Серия {currentMember.streak} дней</strong>
              <span>Заходи каждый день — на 7-й день бонусные искры</span>
              <div className="streak-days">
                {days.map((day) => (
                  <span
                    key={`${day.label}-${day.date}`}
                    className={`streak-day ${day.isDone ? 'is-done' : ''} ${day.isToday ? 'is-today' : ''}`}
                    title={`${day.date}`}
                  >
                    {day.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="span-6 card">
          <div className="row" style={{ gap: 16 }}>
            <RingProgress value={Math.round(progress * 100)} size={72} stroke={7} color="var(--accent)">
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
                {unlocked}/{state.achievements.length}
              </strong>
            </RingProgress>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: 13.5 }}>Коллекция достижений</strong>
              <p style={{ marginTop: 3, fontSize: 10.5, lineHeight: 1.5, color: 'var(--muted)' }}>
                Открывай бейджи за миссии, задания и серии. Каждый бейдж — новая история.
              </p>
              <div className="row" style={{ gap: 6, marginTop: 8 }}>
                <Chip tone="accent"><Sparkles size={11} /> {currentMember.xp} искр</Chip>
                <Chip tone="success"><Gift size={11} /> {formatMoney(missionEarned + taskEarned)}</Chip>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="section-head" style={{ marginTop: 22 }}>
        <div>
          <h2>Бейджи</h2>
          <p>Открыто {unlocked} из {state.achievements.length} — продолжай в том же духе</p>
        </div>
        <button className="link-btn" onClick={() => onNavigate('missions')}>
          К миссиям <ArrowRight size={14} />
        </button>
      </div>
      <div className="achievement-grid">
        {state.achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`achievement-card ${achievement.unlocked ? '' : 'is-locked'}`}
          >
            <span className="achievement-card__icon">
              <AchievementIcon name={achievement.icon} />
            </span>
            <strong>{achievement.title}</strong>
            <p>{achievement.description}</p>
            <div className="achievement-card__progress">
              <Progress
                value={percent(achievement.progress, achievement.target)}
                color={achievement.unlocked ? 'var(--green)' : 'var(--accent)'}
                height={5}
                track="var(--chart-track)"
              />
              <span>
                {achievement.unlocked ? 'Открыто' : `${achievement.progress} из ${achievement.target}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <SectionHead
          title="Как зарабатывать искры"
          subtitle="Простое правило: учишься — растёшь"
        />
        <div className="info-steps">
          <div className="info-step">
            <span className="info-step__num"><Sparkles size={12} /></span>
            <div>
              <strong>Проходи миссии</strong>
              <p>+50–120 искр за квест и деньги на карту</p>
            </div>
            <Chip tone="accent">основной источник</Chip>
          </div>
          <div className="info-step">
            <span className="info-step__num"><Star size={12} /></span>
            <div>
              <strong>Выполняй задания мамы</strong>
              <p>+10–50 искр и награда после подтверждения</p>
            </div>
          </div>
          <div className="info-step">
            <span className="info-step__num"><Target size={12} /></span>
            <div>
              <strong>Поддерживай семейные цели</strong>
              <p>Каждый вклад ускоряет общую мечту</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('goals')}>
              К целям
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
