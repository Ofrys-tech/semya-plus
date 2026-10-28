import { useEffect, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  Check,
  Lightbulb,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useApp } from '../store';
import { formatMoney } from '../lib';
import { Button, Sheet } from './ui';

const CONFETTI_COLORS = ['#FFD166', '#FF5CA8', '#7C3AED', '#52D6A3', '#5B8DEF', '#FF9F68'];

export function QuestModal({
  missionId,
  open,
  onClose,
}: {
  missionId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { state, dispatch, notify } = useApp();
  const mission = state.missions.find((item) => item.id === missionId) ?? null;
  const [stage, setStage] = useState<'intro' | 'question' | 'result'>('intro');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (open) {
      setStage(mission?.completed ? 'result' : 'intro');
      setIndex(0);
      setSelected(null);
      setAnswered(false);
      setCorrect(0);
    }
  }, [open, missionId, mission?.completed]);

  if (!mission) return null;

  const question = mission.questions[index];
  const isLast = index === mission.questions.length - 1;

  const choose = (option: number) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === question.correct) setCorrect((value) => value + 1);
  };

  const next = () => {
    if (!answered) return;
    if (isLast) {
      if (!mission.completed) {
        dispatch({ type: 'complete-mission', id: mission.id });
        notify(
          'Квест пройден!',
          `+${mission.rewardXp} искр · ${formatMoney(mission.rewardMoney)} на карту · ${formatMoney(mission.goalBoost)} в цель`,
        );
      }
      setStage('result');
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setAnswered(false);
  };

  const footer =
    stage === 'intro' ? (
      <Button size="lg" full icon={<Play size={16} />} onClick={() => setStage('question')}>
        Начать квест
      </Button>
    ) : stage === 'question' ? (
      <Button size="lg" full onClick={next} disabled={!answered} icon={<ArrowRight size={16} />}>
        {isLast ? 'Забрать награду' : 'Дальше'}
      </Button>
    ) : (
      <Button size="lg" full onClick={onClose}>
        Отлично!
      </Button>
    );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Игровая миссия"
      subtitle={`${mission.topic} · ${mission.minutes} минут`}
      footer={footer}
      wide
    >
      <div className="quest">
        <div className="quest__hero">
          <img src="./assets/mascot-star.webp" alt="" />
          <div className="quest__hero-text">
            <span>{mission.difficulty} · квест</span>
            <strong>{mission.title}</strong>
            <p>{mission.subtitle}</p>
            <div className="quest__rewards">
              <span><Sparkles size={12} /> +{mission.rewardXp} искр</span>
              <span><Star size={12} /> {formatMoney(mission.rewardMoney)}</span>
            </div>
          </div>
        </div>

        {stage === 'intro' && (
          <div className="quest__intro">
            <p>
              Тебе предстоит {mission.questions.length} {mission.questions.length === 1 ? 'вопрос' : 'вопроса'}. За каждый
              правильный ответ — искры, за весь квест — деньги на карту и вклад в семейную цель.
            </p>
            <div className="quest__rules">
              <div className="quest__rule">
                <ShieldCheck size={15} /> Ошибаться можно: после ответа мы объясним, как правильно.
              </div>
              <div className="quest__rule">
                <Sparkles size={15} /> Награда начисляется сразу после последнего вопроса.
              </div>
              <div className="quest__rule">
                <Star size={15} /> {formatMoney(mission.goalBoost)} автоматически уйдут в цель «Поездка в Сочи».
              </div>
            </div>
            <div className="hidden-note">
              <Lightbulb size={13} />
              Совет: проходи квест вместе с родителем — так веселее и понятнее.
            </div>
          </div>
        )}

        {stage === 'question' && (
          <div>
            <div className="quest__progress">
              {mission.questions.map((item, itemIndex) => (
                <span key={item.question} className={itemIndex <= index ? 'is-done' : ''} />
              ))}
            </div>
            <span className="quest__counter">
              Вопрос {index + 1} из {mission.questions.length}
            </span>
            <h3 className="quest__question">{question.question}</h3>
            <div className="quest__options">
              {question.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === question.correct;
                const isChosen = optionIndex === selected;
                const stateClass = answered && isCorrect
                  ? 'is-correct'
                  : answered && isChosen && !isCorrect
                    ? 'is-wrong'
                    : '';
                return (
                  <button
                    key={option}
                    className={`quest-option ${stateClass}`}
                    onClick={() => choose(optionIndex)}
                    disabled={answered}
                  >
                    <span className="quest-option__letter">
                      {answered && isCorrect ? <Check size={13} /> : answered && isChosen ? <X size={13} /> : ['А', 'Б', 'В', 'Г'][optionIndex] ?? optionIndex + 1}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div className="quest__hint">
                <Lightbulb size={15} />
                <span>
                  <strong>{selected === question.correct ? 'Верно! ' : 'Почти! '}</strong>
                  {question.hint}
                </span>
              </div>
            )}
          </div>
        )}

        {stage === 'result' && (
          <div className="quest__result" style={{ position: 'relative' }}>
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 22 }).map((_, item) => (
                <span
                  key={item}
                  style={
                    {
                      '--x': `${(item * 37) % 96}%`,
                      '--delay': `${1.8 + (item % 5) * 0.5}s`,
                      '--wait': `${(item % 7) * 0.22}s`,
                      '--color': CONFETTI_COLORS[item % CONFETTI_COLORS.length],
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <img src="./assets/mascot-star.webp" alt="" />
            <h3>{mission.completed ? 'Квест пройден!' : 'Награда получена!'}</h3>
            <p>
              {mission.completed
                ? 'Ты уже прошёл эту миссию. Награда зачислена на карту и в семейную копилку.'
                : 'Отличная работа! Ты стал чуть ближе к званию «Финансовый детектив».'}
            </p>
            <div className="quest__score">
              Правильных ответов: <strong>{answered ? correct : mission.questions.length} из {mission.questions.length}</strong>
            </div>
            <div className="quest__result-rewards">
              <div className="quest-result-reward">
                <img src="./assets/spark-coin.webp" alt="" />
                <strong>+{mission.rewardXp}</strong>
                <span>искр</span>
              </div>
              <div className="quest-result-reward">
                <span style={{ fontSize: 20, margin: '2px 0 4px' }}>₽</span>
                <strong>+{formatMoney(mission.rewardMoney)}</strong>
                <span>на карту</span>
              </div>
              <div className="quest-result-reward">
                <TargetIcon />
                <strong>+{formatMoney(mission.goalBoost)}</strong>
                <span>в цель «Сочи»</span>
              </div>
            </div>
            <div className="hidden-note" style={{ textAlign: 'left' }}>
              <Sparkles size={13} />
              Проверь достижения — там мог открыться новый бейдж.
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function TargetIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ margin: '2px 0 4px' }}>
      <circle cx="12" cy="12" r="8" stroke="#7C3AED" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.5" fill="#7C3AED" />
    </svg>
  );
}
