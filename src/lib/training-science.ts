// =============================================================================
// SCIENTIFIC TRAINING PRINCIPLES
// Based on:
//   1. Jason Brown "Lower Body Training" — 4 training methods, Prilepin's chart,
//      exercise selection hierarchy, progressive overload
//   2. John Graham "Metabolic Training" — 7 training principles, work/rest ratios,
//      energy system targeting, block periodization
//   3. Roy Benson "Heart Rate Training" — 4 HR zones, zone-based training,
//      Karvonen formula, recovery principles
// =============================================================================

// ===== TRAINING METHODS (Brown, Ch.3) =====

export type TrainingMethod =
  | 'repeated_effort'   // Hypertrophy / endurance — highest volume
  | 'submaximal'        // Strength — high intensity, moderate volume
  | 'dynamic_effort'    // Power / speed — submaximal load, max velocity
  | 'maximal_effort';   // Absolute strength — only for advanced

export interface TrainingMethodParams {
  name: string;
  nameRu: string;
  description: string;
  repRange: { min: number; max: number };
  setsRange: { min: number; max: number };
  restSeconds: { min: number; max: number };
  intensityPercent: number;   // target % of 1RM
  cnsDemand: 'low' | 'medium' | 'high' | 'very_high';
  purpose: string;
  source: string;
}

export const TRAINING_METHODS: Record<TrainingMethod, TrainingMethodParams> = {
  repeated_effort: {
    name: 'Repeated Effort',
    nameRu: 'Повторный метод',
    description: 'Гипертрофия и мышечная выносливость. Высокий объём, умеренная интенсивность.',
    repRange: { min: 8, max: 15 },
    setsRange: { min: 3, max: 4 },
    restSeconds: { min: 60, max: 90 },
    intensityPercent: 65,
    cnsDemand: 'low',
    purpose: 'Гипертрофия, время под нагрузкой, слабые точки',
    source: 'Brown Ch.3 — Repeated Effort Method',
  },
  submaximal: {
    name: 'Submaximal Effort',
    nameRu: 'Субмаксимальный метод',
    description: 'Развитие максимальной силы. Высокая интенсивность, умеренный объём.',
    repRange: { min: 3, max: 8 },
    setsRange: { min: 3, max: 5 },
    restSeconds: { min: 120, max: 180 },
    intensityPercent: 82,
    cnsDemand: 'high',
    purpose: 'Максимальная сила, набор высокопороговых моторных единиц',
    source: 'Brown Ch.3 — Submaximal Effort Method',
  },
  dynamic_effort: {
    name: 'Dynamic Effort',
    nameRu: 'Динамический метод',
    description: 'Взрывная сила и скорость. Субмаксимальный вес с максимальной скоростью.',
    repRange: { min: 2, max: 6 },
    setsRange: { min: 4, max: 6 },
    restSeconds: { min: 45, max: 75 },
    intensityPercent: 55,
    cnsDemand: 'medium',
    purpose: 'RFD, взрывная сила, поддержание тип II волокон',
    source: 'Brown Ch.3 — Dynamic Effort Method',
  },
  maximal_effort: {
    name: 'Maximal Effort',
    nameRu: 'Максимальный метод',
    description: 'Абсолютная сила. Максимальный рекрутмент моторных единиц.',
    repRange: { min: 1, max: 3 },
    setsRange: { min: 3, max: 5 },
    restSeconds: { min: 180, max: 240 },
    intensityPercent: 95,
    cnsDemand: 'very_high',
    purpose: 'Абсолютная сила, 1RM рекрутмент',
    source: 'Brown Ch.3 — Maximal Effort Method',
  },
};

// ===== BLOCK PERIODIZATION (Graham Ch.12; Benson) =====

export type PeriodizationPhase =
  | 'accumulation'    // Hypertrophy / endurance base
  | 'transmutation'   // Strength conversion
  | 'realization'     // Power / speed peaking
  | 'deload';         // Recovery

export interface PhaseConfig {
  name: string;
  nameRu: string;
  weeksDuration: number;
  method: TrainingMethod;
  volumePercent: number;     // % of max training volume
  intensityPercent: number;  // target intensity scaling
  description: string;
  color: string;             // Tailwind bg color for UI badges
  badgeClass: string;        // Full badge styling
}

export const PERIODIZATION_PHASES: PeriodizationPhase[] = [
  'accumulation',
  'transmutation',
  'realization',
  'deload',
];

export const PHASE_CONFIG: Record<PeriodizationPhase, PhaseConfig> = {
  accumulation: {
    name: 'Accumulation',
    nameRu: 'Накопление',
    weeksDuration: 3,
    method: 'repeated_effort',
    volumePercent: 100,
    intensityPercent: 65,
    description: 'Гипертрофия и базовая выносливость',
    color: 'bg-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  transmutation: {
    name: 'Transmutation',
    nameRu: 'Сила',
    weeksDuration: 3,
    method: 'submaximal',
    volumePercent: 80,
    intensityPercent: 80,
    description: 'Развитие максимальной силы',
    color: 'bg-blue-500',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  realization: {
    name: 'Realization',
    nameRu: 'Мощность',
    weeksDuration: 3,
    method: 'dynamic_effort',
    volumePercent: 70,
    intensityPercent: 85,
    description: 'Взрывная сила и скорость',
    color: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  deload: {
    name: 'Deload',
    nameRu: 'Разгрузка',
    weeksDuration: 1,
    method: 'repeated_effort',
    volumePercent: 50,
    intensityPercent: 55,
    description: 'Восстановление и суперкомпенсация',
    color: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400',
  },
};

// Total cycle = 3 + 3 + 3 + 1 = 10 weeks
export const TOTAL_CYCLE_WEEKS = PERIODIZATION_PHASES.reduce(
  (sum, phase) => sum + PHASE_CONFIG[phase].weeksDuration,
  0,
);

// ===== HEART RATE ZONES (Benson) =====

export interface HRZone {
  zone: number;
  name: string;
  nameRu: string;
  minPercentMHR: number;
  maxPercentMHR: number;
  purpose: string;
  talkTest: string;
  breathing: string;
}

export const HR_ZONES: HRZone[] = [
  {
    zone: 1,
    name: 'Endurance',
    nameRu: 'Выносливость',
    minPercentMHR: 60,
    maxPercentMHR: 75,
    purpose: 'Базовая аэробная выносливость, жиросжигание, капилляризация',
    talkTest: 'Свободная беседа',
    breathing: 'Ровное дыхание через нос',
  },
  {
    zone: 2,
    name: 'Stamina',
    nameRu: 'Стамина',
    minPercentMHR: 75,
    maxPercentMHR: 85,
    purpose: 'Анаэробный порог, экономия гликогена, подготовка',
    talkTest: 'Короткие фразы',
    breathing: 'Глубокое, ритмичное',
  },
  {
    zone: 3,
    name: 'Economy',
    nameRu: 'Экономика',
    minPercentMHR: 85,
    maxPercentMHR: 95,
    purpose: 'Толерантность к лактату, гоночная форма',
    talkTest: 'Отдельные слова',
    breathing: 'Тяжёлое, быстрое',
  },
  {
    zone: 4,
    name: 'Speed',
    nameRu: 'Скорость',
    minPercentMHR: 95,
    maxPercentMHR: 100,
    purpose: 'Максимальная мощность, нейромышечная координация',
    talkTest: 'Невозможно говорить',
    breathing: 'Максимальная одышка',
  },
];

// ===== REST PERIOD SCIENCE (Brown Ch.3; Graham Ch.4-6) =====

export function getScientificRest(
  method: TrainingMethod,
  category: 'strength' | 'cardio' | 'flexibility',
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
): number {
  if (category === 'flexibility') return 15;

  if (category === 'cardio') {
    // Metabolic training: shorter rest for higher fitness
    // Graham: beginner 15-20s, intermediate 15s, advanced 15s
    return fitnessLevel === 'beginner' ? 30 : 20;
  }

  const params = TRAINING_METHODS[method];
  // Beginners get maximum rest (more recovery), advanced get minimum
  if (fitnessLevel === 'beginner') return params.restSeconds.max;
  if (fitnessLevel === 'advanced') return params.restSeconds.min;
  return Math.round((params.restSeconds.min + params.restSeconds.max) / 2);
}

// ===== PRILEPIN'S CHART (Brown Ch.3) =====

export function getPrilepinRange(percent1RM: number): {
  repsPerSet: number;
  optimalTotal: number;
  range: [number, number];
} {
  if (percent1RM <= 50) return { repsPerSet: 6, optimalTotal: 36, range: [30, 50] };
  if (percent1RM <= 60) return { repsPerSet: 5, optimalTotal: 30, range: [18, 30] };
  if (percent1RM <= 70) return { repsPerSet: 4, optimalTotal: 24, range: [18, 30] };
  if (percent1RM <= 80) return { repsPerSet: 3, optimalTotal: 18, range: [12, 24] };
  if (percent1RM <= 90) return { repsPerSet: 2, optimalTotal: 10, range: [6, 20] };
  return { repsPerSet: 1, optimalTotal: 4, range: [1, 10] };
}

// ===== PERIODIZATION HELPERS =====

export function getPhaseForWeek(weekNumber: number): {
  phase: PeriodizationPhase;
  weekInPhase: number;
  blockNumber: number;
} {
  const blockNumber = Math.floor(weekNumber / TOTAL_CYCLE_WEEKS) + 1;
  const weekInCycle = weekNumber % TOTAL_CYCLE_WEEKS;

  let remaining = weekInCycle;
  for (const phase of PERIODIZATION_PHASES) {
    const duration = PHASE_CONFIG[phase].weeksDuration;
    if (remaining < duration) {
      return { phase, weekInPhase: remaining + 1, blockNumber };
    }
    remaining -= duration;
  }
  return { phase: 'deload', weekInPhase: 1, blockNumber };
}

export function getCurrentPhaseInfo(weekNumber: number): PhaseConfig & {
  method: TrainingMethod;
  weekInPhase: number;
  blockNumber: number;
  isDeload: boolean;
} {
  const { phase, weekInPhase, blockNumber } = getPhaseForWeek(weekNumber);
  const config = PHASE_CONFIG[phase];
  return {
    ...config,
    method: config.method,
    weekInPhase,
    blockNumber,
    isDeload: phase === 'deload',
  };
}

// ===== METABOLIC TRAINING PARAMS (Graham Ch.4-6) =====

export function getCardioWorkRestRatio(
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
): { workSeconds: number; restSeconds: number; ratio: string } {
  switch (fitnessLevel) {
    case 'beginner':
      return { workSeconds: 20, restSeconds: 10, ratio: '2:1' };
    case 'intermediate':
      return { workSeconds: 40, restSeconds: 15, ratio: '2.7:1' };
    case 'advanced':
      return { workSeconds: 50, restSeconds: 15, ratio: '3.3:1' };
  }
}

// ===== SCIENTIFIC FITNESS LEVEL (Fixed — original was unreachable for 'advanced') =====

export function calculateScientificFitnessLevel(
  avgRPE: number,
  comfortableMinutes: number,
  totalWorkouts: number,
): 'beginner' | 'intermediate' | 'advanced' {
  // Advanced: very easy RPE + long sessions + significant experience
  if (avgRPE <= 2 && comfortableMinutes >= 40 && totalWorkouts >= 20) return 'advanced';
  // Intermediate: comfortable + decent session length
  if (avgRPE <= 4 && comfortableMinutes >= 25 && totalWorkouts >= 5) return 'intermediate';
  if (avgRPE <= 3 && comfortableMinutes >= 15 && totalWorkouts >= 8) return 'intermediate';
  // Beginner: default
  return 'beginner';
}

// ===== SCIENTIFIC ADAPTIVE LOAD (Improved from original) =====
// Graham Ch.2: Overload + Individuality + Progression principles
// Benson: Reversibility (detraining begins within days)

export function getScientificAdaptiveMultiplier(
  feedback: 'easier' | 'normal' | 'harder' | 'very_hard',
  missedDays: number,
  consecutiveHardCount: number,
  phase: PeriodizationPhase,
): number {
  // Deload phase: always reduce volume
  if (phase === 'deload') return 0.85;

  // Severe overreaching: significant regression
  if (consecutiveHardCount >= 3) return 0.65;
  if (consecutiveHardCount >= 2) return 0.75;

  // Very hard: moderate reduction
  if (feedback === 'very_hard') return 0.85;

  // Hard: slight reduction or maintenance
  if (feedback === 'harder') return 0.92;

  // Detraining: regression based on days missed (Benson: reversibility)
  if (missedDays > 14) return 0.70;
  if (missedDays > 7) return 0.80;
  if (missedDays > 3) return 0.88;
  if (missedDays > 0) return 0.95;

  // Normal: slight progressive overload (Graham: 2-10% increase)
  if (feedback === 'normal') return 1.05;

  // Easier: larger progression
  if (feedback === 'easier') return 1.12;

  return 1.0;
}

// ===== REP CALCULATION: Scientific Method Intersection =====
// Intersect variant's natural rep range with the training method's target range

export function calculateScientificReps(
  variantRepRange: { min: number; max: number },
  method: TrainingMethod,
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  isDeload: boolean,
): number {
  const methodRange = TRAINING_METHODS[method].repRange;

  // Intersect the ranges
  const intersectMin = Math.max(variantRepRange.min, methodRange.min);
  const intersectMax = Math.min(variantRepRange.max, methodRange.max);

  let reps: number;

  if (intersectMin > intersectMax) {
    // No overlap: use closest endpoint of variant range to method range
    const distToMin = Math.abs(variantRepRange.min - methodRange.max);
    const distToMax = Math.abs(variantRepRange.max - methodRange.min);
    reps = distToMin <= distToMax ? variantRepRange.min : variantRepRange.max;
  } else {
    // Pick within intersection based on fitness level
    const range = intersectMax - intersectMin;
    switch (fitnessLevel) {
      case 'beginner':
        reps = intersectMin;
        break;
      case 'advanced':
        reps = intersectMax;
        break;
      default:
        reps = Math.round((intersectMin + intersectMax) / 2);
        break;
    }
  }

  // Deload: reduce 1-2 reps (but minimum 1)
  if (isDeload) reps = Math.max(1, reps - 2);

  return reps;
}

// ===== SET CALCULATION: Scientific Method-Based =====

export function calculateScientificSets(
  method: TrainingMethod,
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  isDeload: boolean,
  category: 'strength' | 'cardio' | 'flexibility',
  goal: 'maintain' | 'lose_weight' | 'muscle_tone' | 'flexibility',
): number {
  if (category === 'flexibility') return 1;

  if (category === 'cardio') {
    // Cardio: 1-2 sets depending on goal
    const base = goal === 'lose_weight' ? 2 : 1;
    return isDeload ? 1 : base;
  }

  const methodRange = TRAINING_METHODS[method].setsRange;
  let sets: number;
  switch (fitnessLevel) {
    case 'beginner':
      sets = methodRange.min;
      break;
    case 'advanced':
      sets = methodRange.max;
      break;
    default:
      sets = Math.round((methodRange.min + methodRange.max) / 2);
      break;
  }

  // Deload: reduce to 60%, minimum 2 sets
  if (isDeload) {
    sets = Math.max(2, Math.round(sets * 0.6));
  }

  return sets;
}

// ===== EXERCISE SELECTION PRIORITY (Brown Ch.1-2) =====
// Exercise hierarchy: bilateral compound → unilateral → isolation → plyometric
// This determines which exercise to pick when multiple candidates exist for a muscle group

export type ExerciseTier =
  | 'bilateral_compound'
  | 'unilateral_compound'
  | 'isolation'
  | 'plyometric';

export const EXERCISE_TIER_PRIORITY: Record<ExerciseTier, number> = {
  bilateral_compound: 0,
  unilateral_compound: 1,
  isolation: 2,
  plyometric: 3,
};

// ===== ENERGY SYSTEM DOMAINS (Graham Ch.3) =====

export interface EnergySystem {
  name: string;
  nameRu: string;
  duration: string;
  primary: string;
  purpose: string;
}

export const ENERGY_SYSTEMS: EnergySystem[] = [
  {
    name: 'Alactic (ATP-PC)',
    nameRu: 'Алактатная (АТФ-КФ)',
    duration: '0-10 сек',
    primary: 'Максимальная мощность/скорость',
    purpose: 'Взрывная сила, спринт',
  },
  {
    name: 'Lactic (Anaerobic Glycolysis)',
    nameRu: 'Лактатная (анаэробный гликолиз)',
    duration: '10 сек - 2 мин',
    primary: 'Силовая выносливость',
    purpose: 'Гипертрофия, силовая работа',
  },
  {
    name: 'Aerobic (Oxidative)',
    nameRu: 'Аэробная (окислительная)',
    duration: '2+ мин',
    primary: 'Жиросжигание / выносливость',
    purpose: 'Восстановление, базовая форма',
  },
];

// ===== WORKOUT TYPE LABELS =====

export function getWorkoutTypeLabel(phase: PeriodizationPhase): string {
  const method = PHASE_CONFIG[phase].method;
  const methodName = TRAINING_METHODS[method].nameRu;
  return `${PHASE_CONFIG[phase].nameRu} · ${methodName}`;
}

export function getWorkoutTypeDescription(phase: PeriodizationPhase): string {
  const config = PHASE_CONFIG[phase];
  const method = TRAINING_METHODS[config.method];
  return `${config.description}. ${method.repRange.min}-${method.repRange.max} повторений, ${method.restSeconds.min}-${method.restSeconds.max} сек отдых.`;
}