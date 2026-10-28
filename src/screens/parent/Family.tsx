import { useState } from 'react';
import {
  ArrowRight,
  CreditCard,
  Fingerprint,
  Gift,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../../store';
import { formatMoney, percent, plural } from '../../lib';
import type { Member } from '../../types';
import { Avatar, Button, Chip, PageTitle, Progress, SectionHead, Switch } from '../../components/ui';
import { MemberSheet, InviteSheet, ResetSheet } from '../../components/dialogs';

export function FamilyScreen() {
  const { state, dispatch, notify } = useApp();
  const [memberId, setMemberId] = useState<Member['id'] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const children = state.members.filter((member) => member.role !== 'parent');
  const totalGoals = state.goals.reduce((sum, goal) => sum + goal.saved, 0);

  const updateSetting = (key: 'antiFraud' | 'weeklyReport' | 'kidNotifications', value: boolean) => {
    dispatch({ type: 'update-settings', patch: { [key]: value } });
    notify(value ? 'Настройка включена' : 'Настройка выключена', undefined, 'info');
  };

  return (
    <div className="screen">
      <PageTitle
        eyebrow="Семейный профиль"
        title="Наша семья"
        subtitle="Роли, доступы и безопасность в одном месте"
        action={
          <Button icon={<UserPlus size={16} />} onClick={() => setInviteOpen(true)}>
            Пригласить
          </Button>
        }
      />

      <div className="family-hero">
        <div className="family-hero__avatars">
          {state.members.map((member) => (
            <Avatar key={member.id} member={member} size={52} />
          ))}
        </div>
        <div className="family-hero__text">
          <h2>{state.familyName}</h2>
          <p>Семейный профиль в ВТБ Онлайн · с марта 2024</p>
          <div className="family-hero__stats">
            <div>
              <span>Участники</span>
              <strong>{state.members.length}</strong>
            </div>
            <div>
              <span>Детские карты</span>
              <strong>{children.length}</strong>
            </div>
            <div>
              <span>Накоплено</span>
              <strong>{formatMoney(totalGoals)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="span-7 card">
          <SectionHead
            title="Участники"
            subtitle="Нажмите, чтобы настроить карту и доступы"
            action={<Chip tone="accent"><Users size={11} /> {state.members.length}</Chip>}
          />
          <div className="member-cards">
            {state.members.map((member) => (
              <button className="member-card" key={member.id} onClick={() => setMemberId(member.id)}>
                <Avatar member={member} size={42} />
                <span className="member-card__text">
                  <strong>{member.firstName}</strong>
                  <span>
                    {member.role === 'parent'
                      ? 'Родитель · полный доступ'
                      : `${member.role === 'teen' ? 'Подросток' : 'Ребёнок'} · •• ${member.cardLast4}`}
                  </span>
                </span>
                <span className="member-card__balance">{formatMoney(member.balance)}</span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>

          <div className="section-head" style={{ marginTop: 22 }}>
            <div>
              <h2>Лимиты детей</h2>
              <p>Дневные ограничения и заблокированные категории</p>
            </div>
          </div>
          <div className="stack">
            {children.map((child) => (
              <div key={child.id} className="row" style={{ gap: 12 }}>
                <Avatar member={child} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row row--between" style={{ marginBottom: 5 }}>
                    <strong style={{ fontSize: 12 }}>{child.firstName}</strong>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                      {formatMoney(child.spentToday)} из {formatMoney(child.dailyLimit)} сегодня
                    </span>
                  </div>
                  <Progress
                    value={percent(child.spentToday, child.dailyLimit)}
                    color={child.spentToday > child.dailyLimit * 0.8 ? 'var(--amber)' : 'var(--accent)'}
                    height={6}
                    track="var(--chart-track)"
                  />
                  <div className="category-permissions">
                    <span className={`permission-chip ${child.blockedCategories.length ? 'is-blocked' : ''}`}>
                      {child.blockedCategories.length ? <Lock size={11} /> : <CheckMini />}
                      {child.blockedCategories.length
                        ? `${child.blockedCategories.length} ${plural(child.blockedCategories.length, 'категория заблокирована', 'категории заблокированы', 'категорий заблокировано')}`
                        : 'все категории'}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMemberId(child.id)}>
                  Настроить
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="span-5 stack">
          <div className="card">
            <SectionHead title="Безопасность" subtitle="Защита денег каждого участника" />
            <div className="security-card">
              <span className="security-card__icon"><ShieldCheck size={20} /></span>
              <div>
                <strong>Поведенческий anti-fraud включён</strong>
                <p>ML-модель проверяет нетипичные списания по детским картам и блокирует подозрительные операции.</p>
              </div>
            </div>
            <div className="switch-row" style={{ marginTop: 4 }}>
              <span className="switch-row__text">
                <strong>Защита от мошенников</strong>
                <span>Уведомления о нетипичных операциях</span>
              </span>
              <Switch
                checked={state.settings.antiFraud}
                onChange={(value) => updateSetting('antiFraud', value)}
                label="Защита от мошенников"
              />
            </div>
            <div className="switch-row">
              <span className="switch-row__text">
                <strong>Уведомления ребёнку</strong>
                <span>Задания, миссии и подтверждённые награды</span>
              </span>
              <Switch
                checked={state.settings.kidNotifications}
                onChange={(value) => updateSetting('kidNotifications', value)}
                label="Уведомления ребёнку"
              />
            </div>
            <div className="switch-row">
              <span className="switch-row__text">
                <strong>Еженедельный отчёт</strong>
                <span>Расходы, цели и прогресс детей — по воскресеньям</span>
              </span>
              <Switch
                checked={state.settings.weeklyReport}
                onChange={(value) => updateSetting('weeklyReport', value)}
                label="Еженедельный отчёт"
              />
            </div>
            <div className="hidden-note" style={{ marginTop: 8 }}>
              <Fingerprint size={13} />
              Данные хранятся в защищённом контуре банка · 152-ФЗ и 115-ФЗ
            </div>
          </div>

          <div className="card">
            <SectionHead title="Подключено" subtitle="Семейные продукты ВТБ" />
            <div className="info-steps">
              <div className="info-step">
                <span className="info-step__num"><CreditCard size={12} /></span>
                <div>
                  <strong>Семейная карта</strong>
                  <p>Общий бюджет и мгновенные переводы внутри семьи</p>
                </div>
                <Chip tone="success">активна</Chip>
              </div>
              <div className="info-step">
                <span className="info-step__num"><Gift size={12} /></span>
                <div>
                  <strong>Детские карты</strong>
                  <p>Лимиты, категории и награды за задания</p>
                </div>
                <Chip tone="success">{children.length}</Chip>
              </div>
              <div className="info-step">
                <span className="info-step__num"><Target size={12} /></span>
                <div>
                  <strong>Совместные цели</strong>
                  <p>Поездки, техника и крупные покупки</p>
                </div>
                <Chip tone="accent">{state.goals.length}</Chip>
              </div>
              <div className="info-step">
                <span className="info-step__num"><Sparkles size={12} /></span>
                <div>
                  <strong>AI-аналитика</strong>
                  <p>Прогноз расходов и персональные миссии</p>
                </div>
                <Chip tone="accent">включена</Chip>
              </div>
            </div>
          </div>
        </section>

        <section className="span-12 card">
          <div className="row row--between row--wrap" style={{ gap: 16 }}>
            <div className="row" style={{ gap: 12 }}>
              <span className="empty__icon" style={{ margin: 0, width: 44, height: 44 }}>
                <Mail size={20} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>Пригласите второго родителя</strong>
                <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
                  Общий доступ к бюджету, заданиям и целям — без отдельных приложений.
                </span>
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Button variant="soft" size="sm" icon={<UserPlus size={14} />} onClick={() => setInviteOpen(true)}>
                Пригласить
              </Button>
              <button
                className="icon-btn"
                aria-label="Сбросить демо"
                title="Сбросить демо"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>

      <MemberSheet memberId={memberId} open={Boolean(memberId)} onClose={() => setMemberId(null)} />
      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ResetSheet open={resetOpen} onClose={() => setResetOpen(false)} />
    </div>
  );
}

function CheckMini() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6.2 4.6 9 10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
