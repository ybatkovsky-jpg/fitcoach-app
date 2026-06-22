// Achievement definitions and XP/level system for FitCoach gamification

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'workout' | 'streak' | 'milestone' | 'special';
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // === WORKOUT ===
  {
    id: 'first_workout',
    name: 'Первая тренировка',
    description: 'Завершите свою первую тренировку',
    icon: '🏋️',
    category: 'workout',
    xpReward: 50,
  },
  {
    id: 'cardio_done',
    name: 'Кардио-мастер',
    description: 'Выполните кардио-упражнение в тренировке',
    icon: '❤️',
    category: 'workout',
    xpReward: 50,
  },
  {
    id: 'all_exercises_done',
    name: 'Без пропусков',
    description: 'Выполните все упражнения за тренировку',
    icon: '💯',
    category: 'workout',
    xpReward: 100,
  },

  // === STREAK ===
  {
    id: 'streak_3',
    name: 'Три дня подряд',
    description: 'Тренируйтесь 3 дня подряд',
    icon: '🔥',
    category: 'streak',
    xpReward: 75,
  },
  {
    id: 'streak_7',
    name: 'Неделя без пропусков',
    description: 'Тренируйтесь 7 дней подряд',
    icon: '⚡',
    category: 'streak',
    xpReward: 150,
  },
  {
    id: 'streak_14',
    name: 'Две недели стрик',
    description: '14 дней тренировок подряд',
    icon: '🌟',
    category: 'streak',
    xpReward: 300,
  },
  {
    id: 'streak_30',
    name: 'Месяц силы',
    description: '30 дней тренировок подряд',
    icon: '💪',
    category: 'streak',
    xpReward: 500,
  },

  // === MILESTONE ===
  {
    id: 'workouts_5',
    name: 'Пятёрка',
    description: 'Завершите 5 тренировок',
    icon: '✋',
    category: 'milestone',
    xpReward: 50,
  },
  {
    id: 'workouts_10',
    name: 'Десятка',
    description: 'Завершите 10 тренировок',
    icon: '🎯',
    category: 'milestone',
    xpReward: 100,
  },
  {
    id: 'workouts_25',
    name: 'Четверть века',
    description: 'Завершите 25 тренировок',
    icon: '🏆',
    category: 'milestone',
    xpReward: 200,
  },
  {
    id: 'workouts_50',
    name: 'Полвека тренировок',
    description: 'Завершите 50 тренировок',
    icon: '⭐',
    category: 'milestone',
    xpReward: 400,
  },
  {
    id: 'workouts_100',
    name: 'Клуб 100',
    description: 'Завершите 100 тренировок',
    icon: '💎',
    category: 'milestone',
    xpReward: 1000,
  },
  {
    id: 'level_5',
    name: 'Растущая сила',
    description: 'Достигните 5-го уровня',
    icon: '🎖️',
    category: 'milestone',
    xpReward: 0,
  },
  {
    id: 'level_10',
    name: 'Опытный атлет',
    description: 'Достигните 10-го уровня',
    icon: '🥇',
    category: 'milestone',
    xpReward: 0,
  },
  {
    id: 'minutes_60_total',
    name: 'Часовой',
    description: 'Наберите 60 минут тренировок суммарно',
    icon: '🕐',
    category: 'milestone',
    xpReward: 75,
  },
  {
    id: 'minutes_300_total',
    name: 'Марафонец',
    description: 'Наберите 300 минут тренировок (5 часов)',
    icon: '🏃',
    category: 'milestone',
    xpReward: 300,
  },

  // === SPECIAL ===
  {
    id: 'first_feedback',
    name: 'Первый отзыв',
    description: 'Оцените свою первую тренировку',
    icon: '💬',
    category: 'special',
    xpReward: 25,
  },
  {
    id: 'feedback_normal_5',
    name: 'Стабильность',
    description: '5 тренировок с оценкой "Нормально"',
    icon: '📈',
    category: 'special',
    xpReward: 150,
  },
  {
    id: 'intermediate_fitness',
    name: 'Продолжающий',
    description: 'Достигните уровня фитнеса "Продолжающий"',
    icon: '🎮',
    category: 'special',
    xpReward: 200,
  },
  {
    id: 'advanced_fitness',
    name: 'Эксперт',
    description: 'Достигните уровня фитнеса "Продвинутый"',
    icon: '🏅',
    category: 'special',
    xpReward: 500,
  },
];

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'workout', label: 'Тренировки' },
  { id: 'streak', label: 'Серии' },
  { id: 'milestone', label: 'Вехи' },
  { id: 'special', label: 'Особые' },
] as const;

// --- XP System ---

/** Cumulative XP needed to reach a given level */
export function xpForLevel(level: number): number {
  return Math.round(100 * level * (level - 1) / 2);
}

/** Compute level info from total XP */
export function getLevelInfo(totalXp: number): {
  level: number;
  currentXp: number;
  xpForNext: number;
  progress: number;
} {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp && level < 99) {
    level++;
  }
  const currentLevelBase = xpForLevel(level);
  const nextLevelBase = xpForLevel(level + 1);
  const currentXp = totalXp - currentLevelBase;
  const xpForNext = nextLevelBase - currentLevelBase;
  const progress = xpForNext > 0 ? Math.min(currentXp / xpForNext, 1) : 1;
  return { level, currentXp, xpForNext, progress };
}

export function getLevelTitle(level: number): string {
  if (level <= 2) return 'Новичок';
  if (level <= 4) return 'Любитель';
  if (level <= 6) return 'Спортсмен';
  if (level <= 8) return 'Атлет';
  if (level <= 10) return 'Мастер';
  return 'Легенда';
}

// --- Streak calculation ---

export function calculateStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const uniqueDays = [...new Set(dates)]
    .map((d) => new Date(d + 'T00:00:00').getTime())
    .sort((a, b) => b - a); // newest first

  if (uniqueDays.length === 0) return { current: 0, longest: 0 };

  // Check if streak is still alive (today or yesterday)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;

  if (uniqueDays[0] < yesterdayStart) return { current: 0, longest: 0 };

  let current = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = uniqueDays[i - 1] - uniqueDays[i];
    if (Math.abs(diff - 86_400_000) < 1000) {
      current++;
    } else {
      break;
    }
  }

  // Calculate longest streak from all dates (oldest first)
  const sorted = [...uniqueDays].sort((a, b) => a - b);
  let longest = 1;
  let temp = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i] - sorted[i - 1];
    if (Math.abs(diff - 86_400_000) < 1000) {
      temp++;
    } else {
      longest = Math.max(longest, temp);
      temp = 1;
    }
  }
  longest = Math.max(longest, temp);

  return { current, longest };
}