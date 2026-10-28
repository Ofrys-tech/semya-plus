import { useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Flame,
  Gift,
  PiggyBank,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useApp } from '../../store';
import { formatMoney, getLevel } from '../../lib';
import { Chip, PageTitle, Progress, Segmented } from '../../components/ui';
import { QuestModal } from '../../components/QuestModal';

type MissionFilter = 'all' | 'active' | 'done';

const missionIcons: Record<string, typeof Sparkles> = {
  'impulse-detector': Sparkles,
  'first-piggy': PiggyBank,
  'subscription-world': Smartphone,
  'safe-shopping': ShieldCheck,
  'family-contribution': Users,
};

export function MissionsScreen() {
  const { state, currentMember } = useApp();
  const [filter, setFilter] = useState<MissionFilter>('all');
  const [questId, setQuestId] = useState<string | null>(null);
  const level = getLevel(currentMember.xp);
  const completed = state.missions.filter((mission) => mission.completed).length;
  const filtered = state.missions.filter((mission) =>
    filter === 'all' ? true : filter === 'done' ? mission.completed : !mission.completed,
  );
  const progress = Math.round((completed / state.missions.length) * 100);

  return (
    <div className="screen">
      <PageTitle
        eyebrow="Игровой режим"
        title="Миссии"
        subtitle="Короткие квесты о деньгах — на реальных примерах, без скучных лекций"
        action={<Chip tone="warning"><Flame size={12} /> серия {currentMember.streak} дней</Chip>}
      />

      <div className="mission-hero">
        <img src="./assets/mascot-star.webp" alt="" />
        <div className="mission-hero__text">
          <strong>{level.level} уровень · {level.title}</strong>
          <p>Пройдено {completed} из {state.missions.length} миссий. Каждая миссия — искры, деньги на карту и вклад в семейную цель.</p>
          <div className="mission-hero__stats">
            <span><Sparkles size={12} /> {currentMember.xp} искр</span>
            <span><Gift size={12} /> {formatMoney(state.missions.filter((mission) => mission.completed).reduce((sum, mission) => sum + mission.rewardMoney, 0))} заработано</span>
          </div>
          <div style={{ marginTop: 9 }}>
            <Progress value={progress} color="var(--accent)" height={6} track="var(--chart-track)" />
            <div className="row row--between" style={{ marginTop: 4, fontSize: 9.5, color: 'var(--muted)' }}>
              <span>Прогресс недели</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="task-toolbar" style={{ marginTop: 18 }}>
        <Segmented<MissionFilter>
          ariaLabel="Фильтр миссий"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Все', badge: state.missions.length },
            { value: 'active', label: 'Доступные', badge: state.missions.length - completed },
            { value: 'done', label: 'Пройденные', badge: completed },
          ]}
        />
        <span className="row" style={{ gap: 5, fontSize: 10.5, color: 'var(--muted)' }}>
          <Star size={12} /> новые миссии в понедельник
        </span>
      </div>

      <div className="mission-list">
        {filtered.map((mission) => {
          const Icon = missionIcons[mission.id] ?? Sparkles;
          return (
            <button
              key={mission.id}
              className={`mission-card ${mission.completed ? 'is-done' : ''}`}
              onClick={() => setQuestId(mission.id)}
            >
              <div className="mission-card__top">
                <span className="mission-card__icon">
                  <Icon size={20} />
                </span>
                <Chip tone={mission.completed ? 'success' : mission.difficulty === 'Сложно' ? 'warning' : 'accent'}>
                  {mission.completed ? <CheckCircle2 size={11} /> : <Star size={11} />}
                  {mission.completed ? 'Пройдено' : mission.difficulty}
                </Chip>
              </div>
              <h3>{mission.title}</h3>
              <p>{mission.subtitle}</p>
              <div className="mission-card__meta">
                <span><Clock3 size={11} /> {mission.minutes} мин</span>
                <span><Star size={11} /> {mission.questions.length} вопроса</span>
                <span>{mission.topic}</span>
              </div>
              <div className="mission-card__foot">
                <div className="mission-card__rewards">
                  <span className="mission-reward"><Sparkles size={11} /> +{mission.rewardXp}</span>
                  <span className="mission-reward"><Gift size={11} /> {formatMoney(mission.rewardMoney)}</span>
                </div>
                {mission.completed ? (
                  <span className="mission-done-label"><CheckCircle2 size={12} /> награда получена</span>
                ) : (
                  <span className="btn btn--soft btn--sm">
                    <span className="btn__icon"><Play size={12} /></span>
                    Начать
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ gap: 13 }}>
          <img src="./assets/spark-coin.webp" alt="" style={{ width: 58, height: 58, objectFit: 'contain', flex: 'none' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: 13.5 }}>Зачем нужны искры?</strong>
            <p style={{ marginTop: 3, fontSize: 11, lineHeight: 1.5, color: 'var(--muted)' }}>
              Искры — это опыт. Они повышают уровень, открывают достижения и показывают, сколько ты уже знаешь о деньгах.
              А рубли с миссий сразу приходят на карту и в семейную копилку.
            </p>
          </div>
        </div>
      </div>

      <QuestModal missionId={questId} open={Boolean(questId)} onClose={() => setQuestId(null)} />
    </div>
  );
}
