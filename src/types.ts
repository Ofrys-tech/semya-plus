export type Role = 'parent' | 'teen' | 'kid';
export type ProfileId = 'milana' | 'karina' | 'timur';
export type MemberId = 'milana' | 'ruslan' | 'karina' | 'timur';
export type ActorId = MemberId | 'family';

export type Tab =
  | 'home'
  | 'budget'
  | 'tasks'
  | 'goals'
  | 'family'
  | 'card'
  | 'missions'
  | 'achievements';

export interface Member {
  id: MemberId;
  name: string;
  firstName: string;
  role: Role;
  age: number | null;
  initials: string;
  gradient: [string, string];
  balance: number;
  cardLast4: string;
  frozen: boolean;
  dailyLimit: number;
  spentToday: number;
  monthlyLimit: number;
  spentMonth: number;
  xp: number;
  streak: number;
  privateSpending: boolean;
  blockedCategories: string[];
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  lastMonth: number;
  kind: 'expense' | 'income';
}

export interface Transaction {
  id: string;
  title: string;
  categoryId: string;
  amount: number;
  memberId: ActorId;
  date: string;
}

export interface Contribution {
  id: string;
  memberId: ActorId;
  amount: number;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  subtitle: string;
  target: number;
  saved: number;
  deadline: string;
  image: 'vacation' | 'bike' | 'laptop' | 'spark';
  contributions: Contribution[];
}

export type TaskStatus = 'active' | 'review' | 'done';
export type TaskKind = 'chores' | 'study' | 'care' | 'sport';

export interface FamilyTask {
  id: string;
  title: string;
  note: string;
  assignee: MemberId;
  reward: number;
  xp: number;
  due: string;
  status: TaskStatus;
  kind: TaskKind;
}

export interface Question {
  question: string;
  options: string[];
  correct: number;
  hint: string;
}

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  topic: string;
  difficulty: 'Легко' | 'Средне' | 'Сложно';
  minutes: number;
  rewardXp: number;
  rewardMoney: number;
  goalBoost: number;
  questions: Question[];
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface Settings {
  push: boolean;
  weeklyReport: boolean;
  antiFraud: boolean;
  kidNotifications: boolean;
}

export interface AppState {
  version: number;
  profile: ProfileId;
  familyName: string;
  familyBalance: number;
  income: number;
  members: Member[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  tasks: FamilyTask[];
  missions: Mission[];
  achievements: Achievement[];
  settings: Settings;
}
