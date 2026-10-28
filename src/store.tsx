import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createInitialState } from './data';
import { clamp, uid } from './lib';
import type {
  AppState,
  FamilyTask,
  Member,
  ProfileId,
  Settings,
  TaskKind,
} from './types';

const STORAGE_KEY = 'semya-plus-state-v3';

export interface Toast {
  id: string;
  message: string;
  detail?: string;
  kind: 'success' | 'info' | 'error';
}

export type Action =
  | { type: 'switch-profile'; id: ProfileId }
  | { type: 'transfer'; memberId: ProfileId; amount: number }
  | { type: 'set-limit'; categoryId: string; limit: number }
  | { type: 'freeze-card'; memberId: Member['id']; frozen: boolean }
  | { type: 'set-daily-limit'; memberId: Member['id']; limit: number }
  | { type: 'set-private'; memberId: Member['id']; value: boolean }
  | { type: 'toggle-blocked-category'; memberId: Member['id']; categoryId: string }
  | {
      type: 'create-task';
      title: string;
      note: string;
      assignee: ProfileId;
      reward: number;
      due: string;
      kind: TaskKind;
    }
  | { type: 'submit-task'; id: string }
  | { type: 'approve-task'; id: string }
  | { type: 'reject-task'; id: string }
  | {
      type: 'create-goal';
      title: string;
      subtitle: string;
      target: number;
      deadline: string;
      image: 'vacation' | 'bike' | 'laptop' | 'spark';
    }
  | { type: 'contribute'; goalId: string; amount: number; from: Member['id'] | 'family' }
  | { type: 'complete-mission'; id: string }
  | { type: 'update-settings'; patch: Partial<Settings> }
  | { type: 'reset' };

function addTransaction(
  state: AppState,
  title: string,
  categoryId: string,
  amount: number,
  memberId: AppState['transactions'][number]['memberId'],
): AppState['transactions'] {
  return [
    {
      id: uid(),
      title,
      categoryId,
      amount,
      memberId,
      date: new Date().toISOString(),
    },
    ...state.transactions,
  ];
}

function updateMember(state: AppState, id: Member['id'], patch: Partial<Member>): Member[] {
  return state.members.map((member) => (member.id === id ? { ...member, ...patch } : member));
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'switch-profile':
      return { ...state, profile: action.id };

    case 'transfer': {
      const amount = Math.round(action.amount);
      if (amount <= 0 || amount > state.familyBalance) return state;
      return {
        ...state,
        familyBalance: state.familyBalance - amount,
        members: updateMember(state, action.memberId, {
          balance:
            (state.members.find((member) => member.id === action.memberId)?.balance ?? 0) + amount,
        }),
        transactions: addTransaction(state, 'Пополнение от семьи', 'income', amount, action.memberId),
      };
    }

    case 'set-limit':
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.categoryId
            ? { ...category, limit: clamp(Math.round(action.limit), 0, 200_000) }
            : category,
        ),
      };

    case 'freeze-card':
      return { ...state, members: updateMember(state, action.memberId, { frozen: action.frozen }) };

    case 'set-daily-limit':
      return {
        ...state,
        members: updateMember(state, action.memberId, {
          dailyLimit: clamp(Math.round(action.limit), 100, 20_000),
        }),
      };

    case 'set-private':
      return {
        ...state,
        members: updateMember(state, action.memberId, { privateSpending: action.value }),
      };

    case 'toggle-blocked-category': {
      const member = state.members.find((item) => item.id === action.memberId);
      if (!member) return state;
      const blocked = member.blockedCategories.includes(action.categoryId)
        ? member.blockedCategories.filter((id) => id !== action.categoryId)
        : [...member.blockedCategories, action.categoryId];
      return {
        ...state,
        members: updateMember(state, action.memberId, { blockedCategories: blocked }),
      };
    }

    case 'create-task': {
      const task: FamilyTask = {
        id: uid(),
        title: action.title,
        note: action.note,
        assignee: action.assignee,
        reward: Math.round(action.reward),
        xp: Math.max(10, Math.round(action.reward / 6)),
        due: action.due,
        status: 'active',
        kind: action.kind,
      };
      return { ...state, tasks: [task, ...state.tasks] };
    }

    case 'submit-task':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id && task.status === 'active' ? { ...task, status: 'review' } : task,
        ),
      };

    case 'approve-task': {
      const task = state.tasks.find((item) => item.id === action.id);
      if (!task || task.status !== 'review') return state;
      const member = state.members.find((item) => item.id === task.assignee);
      if (!member || task.reward > state.familyBalance) return state;
      return {
        ...state,
        familyBalance: state.familyBalance - task.reward,
        tasks: state.tasks.map((item) =>
          item.id === action.id ? { ...item, status: 'done' as const } : item,
        ),
        members: updateMember(state, task.assignee, {
          balance: member.balance + task.reward,
          xp: member.xp + task.xp,
        }),
        transactions: addTransaction(
          state,
          `Награда: ${task.title}`,
          'income',
          task.reward,
          task.assignee,
        ),
      };
    }

    case 'reject-task':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id && task.status === 'review' ? { ...task, status: 'active' } : task,
        ),
      };

    case 'create-goal':
      return {
        ...state,
        goals: [
          {
            id: uid(),
            title: action.title,
            subtitle: action.subtitle,
            target: Math.round(action.target),
            saved: 0,
            deadline: action.deadline,
            image: action.image,
            contributions: [],
          },
          ...state.goals,
        ],
      };

    case 'contribute': {
      const goal = state.goals.find((item) => item.id === action.goalId);
      const amount = Math.round(action.amount);
      if (!goal || amount <= 0) return state;
      const fromFamily = action.from === 'family';
      const member = state.members.find((item) => item.id === action.from);
      const available = fromFamily ? state.familyBalance : member?.balance ?? 0;
      if (amount > available) return state;
      const newGoal = {
        ...goal,
        saved: goal.saved + amount,
        contributions: [
          { id: uid(), memberId: action.from, amount, date: new Date().toISOString() },
          ...goal.contributions,
        ],
      };
      return {
        ...state,
        familyBalance: fromFamily ? state.familyBalance - amount : state.familyBalance,
        members: fromFamily
          ? state.members
          : updateMember(state, action.from as Member['id'], {
              balance: (member?.balance ?? 0) - amount,
            }),
        goals: state.goals.map((item) => (item.id === action.goalId ? newGoal : item)),
        transactions: addTransaction(
          state,
          `В копилку «${goal.title}»`,
          'other',
          -amount,
          fromFamily ? 'family' : action.from,
        ),
      };
    }

    case 'complete-mission': {
      const mission = state.missions.find((item) => item.id === action.id);
      if (!mission || mission.completed) return state;
      const member = state.members.find((item) => item.id === 'timur');
      if (!member) return state;
      const goal = state.goals.find((item) => item.id === 'goal-vacation');
      const nextGoals = goal
        ? state.goals.map((item) =>
            item.id === goal.id
              ? {
                  ...item,
                  saved: item.saved + mission.goalBoost,
                  contributions: [
                    {
                      id: uid(),
                      memberId: 'timur' as const,
                      amount: mission.goalBoost,
                      date: new Date().toISOString(),
                    },
                    ...item.contributions,
                  ],
                }
              : item,
          )
        : state.goals;
      const completedCount = state.missions.filter((item) => item.completed).length + 1;
      return {
        ...state,
        familyBalance: state.familyBalance - mission.rewardMoney - mission.goalBoost,
        missions: state.missions.map((item) =>
          item.id === action.id ? { ...item, completed: true } : item,
        ),
        members: updateMember(state, 'timur', {
          balance: member.balance + mission.rewardMoney,
          xp: member.xp + mission.rewardXp,
        }),
        goals: nextGoals,
        achievements: state.achievements.map((achievement) => {
          if (achievement.id === 'first-step') {
            return { ...achievement, unlocked: true, progress: 1 };
          }
          if (achievement.id === 'detective') {
            return {
              ...achievement,
              progress: Math.min(completedCount, achievement.target),
              unlocked: completedCount >= achievement.target,
            };
          }
          if (achievement.id === 'guardian' && action.id === 'safe-shopping') {
            return { ...achievement, progress: 1, unlocked: true };
          }
          return achievement;
        }),
        transactions: addTransaction(
          state,
          `Награда за миссию «${mission.title}»`,
          'income',
          mission.rewardMoney,
          'timur',
        ),
      };
    }

    case 'update-settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'reset':
      return createInitialState();

    default:
      return state;
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 3 || !Array.isArray(parsed.members)) return createInitialState();
    return parsed;
  } catch {
    return createInitialState();
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentMember: Member;
  hidden: boolean;
  toggleHidden: () => void;
  toasts: Toast[];
  notify: (message: string, detail?: string, kind?: Toast['kind']) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [hidden, setHidden] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be unavailable in private mode; the demo still works in memory.
    }
  }, [state]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, detail?: string, kind: Toast['kind'] = 'success') => {
      const id = uid();
      setToasts((current) => [...current.slice(-2), { id, message, detail, kind }]);
      const timer = window.setTimeout(() => dismissToast(id), 4_600);
      timers.current.push(timer);
    },
    [dismissToast],
  );

  const toggleHidden = useCallback(() => setHidden((value) => !value), []);

  const currentMember = useMemo(
    () => state.members.find((member) => member.id === state.profile) ?? state.members[0],
    [state.members, state.profile],
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      currentMember,
      hidden,
      toggleHidden,
      toasts,
      notify,
      dismissToast,
    }),
    [state, currentMember, hidden, toggleHidden, toasts, notify, dismissToast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
