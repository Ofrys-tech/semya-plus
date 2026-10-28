import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Banknote,
  BookOpen,
  CheckCircle2,
  Clapperboard,
  Coffee,
  Dumbbell,
  Flame,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  House,
  Info,
  PiggyBank,
  Search,
  Shapes,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Target,
  TrainFront,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ActorId, Member, TaskKind } from '../types';
import { formatMoney, percent } from '../lib';
import type { Toast } from '../store';

const categoryIcons: Record<string, LucideIcon> = {
  basket: ShoppingBasket,
  home: House,
  train: TrainFront,
  coffee: Coffee,
  cinema: Clapperboard,
  education: GraduationCap,
  health: HeartPulse,
  shirt: Shirt,
  phone: Smartphone,
  shapes: Shapes,
  income: Banknote,
};

const taskIcons: Record<TaskKind, LucideIcon> = {
  chores: Utensils,
  study: BookOpen,
  care: HeartHandshake,
  sport: Dumbbell,
};

const achievementIcons: Record<string, LucideIcon> = {
  spark: Sparkles,
  piggy: PiggyBank,
  flame: Flame,
  search: Search,
  target: Target,
  shield: ShieldCheck,
};

export const CategoryIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const Icon = categoryIcons[name] ?? Shapes;
  return <Icon size={size} strokeWidth={2} />;
};

export const TaskIcon = ({ kind, size = 18 }: { kind: TaskKind; size?: number }) => {
  const Icon = taskIcons[kind] ?? Sparkles;
  return <Icon size={size} strokeWidth={2} />;
};

export const AchievementIcon = ({ name, size = 22 }: { name: string; size?: number }) => {
  const Icon = achievementIcons[name] ?? Sparkles;
  return <Icon size={size} strokeWidth={2} />;
};

export function Logo({ compact = false }: { compact?: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <div className={`logo ${compact ? 'logo--compact' : ''}`}>
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="30" height="30">
          <defs>
            <linearGradient id={`logo-${id}`} x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F4E9FF" />
              <stop offset=".45" stopColor="#C4A5FF" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <path
            d="M16 1.2c.75 7.65 4.4 11.3 12.05 12.05C20.4 14.05 16.75 17.7 16 25.35 15.25 17.7 11.6 14.05 3.95 13.25 11.6 12.5 15.25 8.85 16 1.2Z"
            fill={`url(#logo-${id})`}
          />
          <circle cx="25.4" cy="5.1" r="2.25" fill="#F4E9FF" opacity=".92" />
        </svg>
      </span>
      <span className="logo__text">
        <strong>Семья<span>+</span></strong>
        {!compact && <small>в ВТБ Онлайн</small>}
      </span>
    </div>
  );
}

export function Avatar({
  member,
  size = 44,
  muted = false,
}: {
  member: Pick<Member, 'initials' | 'gradient'>;
  size?: number;
  muted?: boolean;
}) {
  return (
    <span
      className={`avatar ${muted ? 'avatar--muted' : ''}`}
      style={
        {
          width: size,
          height: size,
          fontSize: Math.max(11, size * 0.31),
          background: `linear-gradient(140deg, ${member.gradient[0]}, ${member.gradient[1]})`,
        } as CSSProperties
      }
    >
      {member.initials}
    </span>
  );
}

export function ActorAvatar({
  actor,
  members,
  size = 36,
}: {
  actor: ActorId;
  members: Member[];
  size?: number;
}) {
  if (actor === 'family') {
    return (
      <span className="avatar avatar--family" style={{ width: size, height: size }}>
        <Sparkles size={Math.round(size * 0.45)} />
      </span>
    );
  }
  const member = members.find((item) => item.id === actor) ?? members[0];
  return <Avatar member={member} size={size} />;
}

export function Money({
  value,
  hidden = false,
  className = '',
  withSign = false,
}: {
  value: number;
  hidden?: boolean;
  className?: string;
  withSign?: boolean;
}) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || from === value) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (time: number) => {
      const progressValue = Math.min(1, (time - start) / 600);
      const eased = 1 - Math.pow(1 - progressValue, 3);
      setDisplay(from + (value - from) * eased);
      if (progressValue < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (hidden) return <span className={className}>•• ••• ₽</span>;
  return <span className={className}>{formatMoney(display, withSign)}</span>;
}

export function Progress({
  value,
  color,
  height = 8,
  track = 'rgba(255,255,255,.22)',
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  return (
    <span className="progress" style={{ height, background: track }} aria-hidden="true">
      <span
        className="progress__fill"
        style={{ width: `${percent(value, 100)}%`, background: color }}
      />
    </span>
  );
}

export function RingProgress({
  value,
  size = 88,
  stroke = 8,
  color = 'var(--accent)',
  track = 'rgba(120,100,170,.14)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          className="ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring__content">{children}</span>
    </span>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  full?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  full,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${full ? 'btn--full' : ''} ${className}`}
      {...rest}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch__thumb" />
    </button>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !ref.current) return;
      const nodes = Array.from(
        ref.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => node.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === ref.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => {
      const field = ref.current?.querySelector<HTMLElement>(
        'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), select, textarea',
      );
      if (field) field.focus();
      else ref.current?.focus();
    }, 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={`sheet-layer ${wide ? 'sheet-layer--wide' : ''}`}>
      <button className="sheet-backdrop" aria-label="Закрыть" onClick={onClose} tabIndex={-1} />
      <div
        ref={ref}
        className={`sheet ${wide ? 'sheet--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="sheet__handle" aria-hidden="true" />
        <header className="sheet__head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton label="Закрыть" onClick={onClose} className="sheet__close">
            <X size={20} />
          </IconButton>
        </header>
        <div className="sheet__body">{children}</div>
        {footer && <footer className="sheet__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; badge?: number }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={option.value === value}
          className={`segmented__item ${option.value === value ? 'is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {typeof option.badge === 'number' && option.badge > 0 && (
            <span className="segmented__badge">{option.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon = toast.kind === 'error' ? AlertCircle : toast.kind === 'info' ? Info : CheckCircle2;
        return (
          <button key={toast.id} className={`toast toast--${toast.kind}`} onClick={() => onDismiss(toast.id)}>
            <span className="toast__icon">
              <Icon size={19} />
            </span>
            <span className="toast__text">
              <strong>{toast.message}</strong>
              {toast.detail && <span>{toast.detail}</span>}
            </span>
            <X size={15} className="toast__close" />
          </button>
        );
      })}
    </div>
  );
}

export function SectionHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}

