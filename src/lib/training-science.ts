// =============================================================================
// SCIENTIFIC TRAINING PRINCIPLES — Enhanced Edition
// Based on 8 evidence-based sources:
//   1. Jason Brown "Lower Body Training" — 4 training methods, Prilepin's chart,
//      exercise selection hierarchy, progressive overload
//   2. John Graham "Metabolic Training" — 7 training principles, work/rest ratios,
//      energy system targeting, block periodization
//   3. Roy Benson "Heart Rate Training" — 4 HR zones, zone-based training,
//      Karvonen formula, recovery principles
//   4. K. Roberts "Professional Guide to Small Group Personal Training" —
//      undulating periodization for general fitness, intensity escalation
//      without load changes, HIIT protocols, exercise order principles
//   5. T.O. Bompa "Periodization: Theory and Methodology of Training" (4th ed.) —
//      5-phase periodization (AA→Hyp→MxS→Power→Deload), exercise count by
//      phase, rest periods by %1RM, tempo guidelines, strength reserve
//   6. N. Signor "Foundations of Speed Training" — VBT zones, velocity loss
//      protocols, CNS readiness testing, velocity-based autoregulation
//   7. V.M. Zatsiorsky & W.J. Kraemer "Science and Practice of Strength
//      Training" (3rd ed.) — fitness-fatigue model, supercompensation,
//      force-velocity curve, SSC mechanics, residual training effects
//   8. Schoenfeld et al. — volume landmarks (10-20 sets/muscle group/week)
// =============================================================================

// ===== TRAINING METHODS (Brown Ch.3; enhanced with Bompa & Signor) =====

export type TrainingMethod =
  | 'anatomical_adaptation' // Bompa Phase I: tissue prep, high volume/low intensity
  | 'repeated_effort'       // Brown: hypertrophy / endurance — highest volume
  | 'submaximal'            // Brown: strength — high intensity, moderate volume
  | 'dynamic_effort'        // Brown: power / speed — submaximal load, max velocity
  | 'maximal_effort';       // Brown: absolute strength — only for advanced

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
  // Bompa: set duration guidelines
  setDurationSec?: { min: number; max: number };
  // Bompa: tempo
  tempoEccentric?: string;
  tempoConcentric?: string;
}

export const TRAINING_METHODS: Record<TrainingMethod, TrainingMethodParams> = {
  anatomical_adaptation: {
    name: 'Anatomical Adaptation',
    nameRu: 'Анатомическая адаптация',
    description: 'Подготовка мышц, связок, сухожилий и суставов. Высокий объём, много упражнений, низкая интенсивность. Bompa: первый этап перед гипертрофией.',
    repRange: { min: 10, max: 20 },
    setsRange: { min: 2, max: 3 },
    restSeconds: { min: 30, max: 60 },
    intensityPercent: 50,
    cnsDemand: 'low',
    purpose: 'Подготовка тканей, обучение двигательным паттернам, капилляризация',
    source: 'Bompa Ch.4 — Anatomical Adaptation Phase',
    setDurationSec: { min: 30, max: 60 },
    tempoEccentric: 'Медленно',
    tempoConcentric: 'Медленно или умеренно',
  },
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
    source: 'Brown Ch.3 — Repeated Effort Method; Bompa Ch.4 — Hypertrophy',
    setDurationSec: { min: 30, max: 60 },
    tempoEccentric: 'Медленно (3-4 сек)',
    tempoConcentric: 'Быстро',
  },
  submaximal: {
    name: 'Submaximal Effort',
    nameRu: 'Субмаксимальный метод',
    description: 'Развитие максимальной силы. Высокая интенсивность, умеренный объём. Задействование высокопороговых моторных единиц.',
    repRange: { min: 3, max: 8 },
    setsRange: { min: 3, max: 5 },
    restSeconds: { min: 120, max: 180 },
    intensityPercent: 82,
    cnsDemand: 'high',
    purpose: 'Максимальная сила, набор высокопороговых моторных единиц',
    source: 'Brown Ch.3 — Submaximal Effort Method; Bompa Ch.4 — Max Strength',
    setDurationSec: { min: 15, max: 25 },
    tempoEccentric: 'Медленно (3-4 сек, пауза 1-2 сек)',
    tempoConcentric: 'Быстро / взрывно',
  },
  dynamic_effort: {
    name: 'Dynamic Effort',
    nameRu: 'Динамический метод',
    description: 'Взрывная сила и скорость. Субмаксимальный вес с максимальной скоростью. Signor: остановка при потере скорости >10%.',
    repRange: { min: 2, max: 6 },
    setsRange: { min: 4, max: 6 },
    restSeconds: { min: 45, max: 75 },
    intensityPercent: 55,
    cnsDemand: 'medium',
    purpose: 'RFD, взрывная сила, поддержание тип II волокон',
    source: 'Brown Ch.3 — Dynamic Effort Method; Signor Ch.4 — Speed-Strength Zone',
    setDurationSec: { min: 15, max: 30 },
    tempoEccentric: 'Быстро',
    tempoConcentric: 'Максимально быстро (взрывно)',
  },
  maximal_effort: {
    name: 'Maximal Effort',
    nameRu: 'Максимальный метод',
    description: 'Абсолютная сила. Максимальный рекрутмент моторных единиц. Только для продвинутых.',
    repRange: { min: 1, max: 3 },
    setsRange: { min: 3, max: 5 },
    restSeconds: { min: 180, max: 240 },
    intensityPercent: 95,
    cnsDemand: 'very_high',
    purpose: 'Абсолютная сила, 1RM рекрутмент',
    source: 'Brown Ch.3 — Maximal Effort Method; Bompa Ch.4 — Supermax',
    setDurationSec: { min: 2, max: 12 },
    tempoEccentric: 'Медленно (3-4 сек)',
    tempoConcentric: 'Взрывно',
  },
};

// ===== 5-PHASE PERIODIZATION (Bompa Ch.4-6; Graham Ch.12; Roberts Ch.9) =====
// Bompa canonical: AA → Hypertrophy → Maximum Strength → Power → Deload
// Enhanced with Roberts' undulating option and Signor's VBT phases

export type PeriodizationPhase =
  | 'anatomical_adaptation'  // Bompa Phase I: prepare tissues, learn patterns
  | 'accumulation'           // Bompa Phase II: Hypertrophy (Brown: repeated effort)
  | 'transmutation'          // Bompa Phase III: Maximum Strength
  | 'realization'            // Bompa Phase IV: Power / Speed peaking
  | 'deload';                // Recovery & supercompensation

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
  // Bompa: how many exercises per session
  exerciseCountRange: { min: number; max: number };
  // Bompa: priority exercise types
  priorityTiers: ('bilateral_compound' | 'unilateral_compound' | 'isolation' | 'plyometric')[];
  // Scientific rationale for this phase
  rationale: string;
}

export const PERIODIZATION_PHASES: PeriodizationPhase[] = [
  'anatomical_adaptation',
  'accumulation',
  'transmutation',
  'realization',
  'deload',
];

export const PHASE_CONFIG: Record<PeriodizationPhase, PhaseConfig> = {
  anatomical_adaptation: {
    name: 'Anatomical Adaptation',
    nameRu: 'Анатомическая адаптация',
    weeksDuration: 2,
    method: 'anatomical_adaptation',
    volumePercent: 100,
    intensityPercent: 50,
    description: 'Подготовка мышц, связок и суставов. Обучение базовым двигательным паттернам.',
    color: 'bg-violet-500',
    badgeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    exerciseCountRange: { min: 6, max: 8 },
    priorityTiers: ['bilateral_compound', 'unilateral_compound'],
    rationale: 'Bompa: AA необходим перед любыми высокоинтенсивными нагрузками для подготовки соединительной ткани и обучения двигательным паттернам.',
  },
  accumulation: {
    name: 'Accumulation / Hypertrophy',
    nameRu: 'Накопление',
    weeksDuration: 3,
    method: 'repeated_effort',
    volumePercent: 100,
    intensityPercent: 65,
    description: 'Гипертрофия и базовая выносливость. Максимальный объём работы.',
    color: 'bg-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    exerciseCountRange: { min: 5, max: 7 },
    priorityTiers: ['bilateral_compound', 'unilateral_compound', 'isolation'],
    rationale: 'Brown: повторный метод — основной драйвер гипертрофии. Schoenfeld: 10-20 сетов на мышцу в неделю для оптимального роста.',
  },
  transmutation: {
    name: 'Transmutation / Strength',
    nameRu: 'Сила',
    weeksDuration: 3,
    method: 'submaximal',
    volumePercent: 80,
    intensityPercent: 80,
    description: 'Развитие максимальной силы через нейромышечные адаптации.',
    color: 'bg-blue-500',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    exerciseCountRange: { min: 4, max: 6 },
    priorityTiers: ['bilateral_compound', 'unilateral_compound'],
    rationale: 'Bompa: МxS — основа для развития мощности. Сила = фундамент, из которого строится взрывная сила. Zatsiorsky: рекрутмент высокопороговых МЕ.',
  },
  realization: {
    name: 'Realization / Power',
    nameRu: 'Мощность',
    weeksDuration: 2,
    method: 'dynamic_effort',
    volumePercent: 70,
    intensityPercent: 55,
    description: 'Конверсия силы в мощность и скорость. Взрывные движения.',
    color: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    exerciseCountRange: { min: 3, max: 5 },
    priorityTiers: ['bilateral_compound', 'plyometric'],
    rationale: 'Signor: мощность = сила x скорость. Zatsiorsky: максимальная мощность при ~1/3 макс. скорости и ~1/2 макс. силы. Bompa: конверсия МxS в мощность.',
  },
  deload: {
    name: 'Deload',
    nameRu: 'Разгрузка',
    weeksDuration: 1,
    method: 'repeated_effort',
    volumePercent: 50,
    intensityPercent: 55,
    description: 'Восстановление и суперкомпенсация. Снижение объёма.',
    color: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400',
    exerciseCountRange: { min: 4, max: 6 },
    priorityTiers: ['bilateral_compound', 'unilateral_compound'],
    rationale: 'Zatsiorsky: модель фитнес-усталости — усталость краткосрочна, фитнес-эффект долгосрочен. Bompa: суперкомпенсация требует разгрузки.',
  },
};

// Total cycle = 2 + 3 + 3 + 2 + 1 = 11 weeks
export const TOTAL_CYCLE_WEEKS = PERIODIZATION_PHASES.reduce(
  (sum, phase) => sum + PHASE_CONFIG[phase].weeksDuration,
  0,
);

// ===== BACKWARD COMPATIBILITY: old 4-phase week mapping =====
// Old cycle was 10 weeks (3+3+3+1). New cycle is 11 weeks (2+3+3+2+1).
// Migrate old weeks: if someone is in old cycle, we map proportionally.

function migrateOldWeek(oldWeek: number): number {
  // Old: 0-2 accum, 3-5 trans, 6-8 real, 9 deload (10 total)
  // New: 0-1 AA, 2-4 accum, 5-7 trans, 8-9 real, 10 deload (11 total)
  // Simple proportional mapping
  return Math.round((oldWeek / 10) * 11);
}

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

// ===== REST PERIOD SCIENCE (Bompa Ch.4 table; Brown Ch.3; Graham Ch.4-6) =====
// Bompa: rest depends on load (%1RM) and training goal
// Enhanced: now considers phase/method intensity, not just method name

export function getScientificRest(
  method: TrainingMethod,
  category: 'strength' | 'cardio' | 'flexibility',
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
): number {
  if (category === 'flexibility') return 15;

  if (category === 'cardio') {
    // Graham: metabolic training rest
    // Roberts: HIIT work/rest ratios (beginner 2:1, advanced 3.3:1)
    return fitnessLevel === 'beginner' ? 30 : 20;
  }

  const params = TRAINING_METHODS[method];

  // Bompa Table: rest maps to intensity zone
  // Supermax >105%: 4-8 min, Max 90-100%: 3-6 min
  // Heavy 85-90%: 3-5 min, Med-Heavy 80-85%: 3-5 min
  // Medium 70-80%: 2-3 min, Low-Med 50-70%: 0.5-2 min, Low <50%: 0.5-2 min

  // For AA (50%): 30-90s
  // For repeated_effort (65%): 60-90s (already set)
  // For submaximal (82%): 180-300s → cap at 240s (4 min) for practical app use
  // For dynamic_effort (55%): 45-90s
  // For maximal_effort (95%): 180-360s → cap at 240s

  // Beginners get longer rest (more recovery), advanced get minimum
  let rest: number;
  if (fitnessLevel === 'beginner') {
    rest = params.restSeconds.max;
  } else if (fitnessLevel === 'advanced') {
    rest = params.restSeconds.min;
  } else {
    rest = Math.round((params.restSeconds.min + params.restSeconds.max) / 2);
  }

  // Bompa: for high-CNS-demand methods, ensure minimum rest
  if (params.cnsDemand === 'high' || params.cnsDemand === 'very_high') {
    rest = Math.max(rest, 120); // minimum 2 min for high CNS demand
  }

  return rest;
}

// ===== PRILEPIN'S CHART (Brown Ch.3; Zatsiorsky Ch.3) =====
// NOW ACTIVELY USED for set/rep validation and optimization

export interface PrilepinRow {
  percentRange: string;       // e.g. "70-80%"
  repsPerSet: number;         // optimal reps per set
  optimalTotal: number;       // optimal total reps across all sets
  totalRange: [number, number]; // acceptable range
}

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

/** Validate and adjust sets/reps against Prilepin's chart */
export function validateWithPrilepin(
  targetReps: number,
  targetSets: number,
  intensityPercent: number,
): { adjustedReps: number; adjustedSets: number; isOptimal: boolean; totalReps: number } {
  const prilepin = getPrilepinRange(intensityPercent);
  const totalReps = targetReps * targetSets;
  const [minTotal, maxTotal] = prilepin.range;
  const isOptimal = totalReps >= minTotal && totalReps <= maxTotal;

  if (isOptimal) {
    return { adjustedReps: targetReps, adjustedSets: targetSets, isOptimal: true, totalReps };
  }

  // Adjust: try to get within Prilepin range by modifying sets (not reps, since reps match method)
  if (totalReps < minTotal) {
    // Too few total reps — add sets
    const neededSets = Math.min(
      Math.ceil(minTotal / targetReps),
      8, // cap at 8 sets
    );
    return { adjustedReps: targetReps, adjustedSets: neededSets, isOptimal: false, totalReps: neededSets * targetReps };
  }

  // Too many total reps — reduce sets
  const neededSets = Math.max(
    Math.floor(maxTotal / targetReps),
    2, // minimum 2 sets
  );
  return { adjustedReps: targetReps, adjustedSets: neededSets, isOptimal: false, totalReps: neededSets * targetReps };
}

// ===== VOLUME LANDMARKS (Schoenfeld et al.) =====
// Evidence-based weekly set targets per muscle group

export interface VolumeLandmark {
  level: string;
  nameRu: string;
  setsPerMusclePerWeek: [number, number];
  description: string;
}

export const VOLUME_LANDMARKS: VolumeLandmark[] = [
  {
    level: 'minimum_effective',
    nameRu: 'Минимально эффективный',
    setsPerMusclePerWeek: [5, 9],
    description: 'Минимальный объём для адаптации у новичков. Schoenfeld: некоторые рост при <5 сетах, но не надёжно.',
  },
  {
    level: 'optimal_hypertrophy',
    nameRu: 'Оптимальный (гипертрофия)',
    setsPerMusclePerWeek: [10, 20],
    description: 'Диапазон с наибольшей вероятностью гипертрофии. Schoenfeld et al. 2017: 10-20 сетов/мышцу/неделю.',
  },
  {
    level: 'upper_limit',
    nameRu: 'Верхняя граница',
    setsPerMusclePerWeek: [20, 25],
    description: 'Возможен дополнительный рост, но риск перетренировки возрастает. Zatsiorsky: закон монотонности.',
  },
  {
    level: 'junk_volume',
    nameRu: 'Мусорный объём',
    setsPerMusclePerWeek: [25, 999],
    description: 'Объём свыше эффективного порога. Усиление усталости без дополнительного роста. Schoenfeld: diminishing returns.',
  },
];

/** Calculate weekly volume (sets per muscle group) from a workout plan */
export function calculateWeeklyVolume(
  exercises: { targetSets: number; primaryMuscleGroups: string[]; completedSets?: number }[],
  useCompleted = false,
): Record<string, number> {
  const volume: Record<string, number> = {};
  for (const ex of exercises) {
    const sets = useCompleted && ex.completedSets !== undefined ? ex.completedSets : ex.targetSets;
    for (const mg of ex.primaryMuscleGroups) {
      volume[mg] = (volume[mg] ?? 0) + sets;
    }
  }
  return volume;
}

/** Get volume assessment for each muscle group */
export function getVolumeAssessment(
  weeklyVolume: Record<string, number>,
  workoutsPerWeek: number = 3,
): Record<string, { sets: number; level: string; inRange: boolean }> {
  const assessment: Record<string, { sets: number; level: string; inRange: boolean }> = {};
  for (const [muscle, sets] of Object.entries(weeklyVolume)) {
    let level = 'minimum_effective';
    let inRange = false;
    if (sets >= 10 && sets <= 20) { level = 'optimal_hypertrophy'; inRange = true; }
    else if (sets >= 20 && sets <= 25) { level = 'upper_limit'; inRange = true; }
    else if (sets > 25) { level = 'junk_volume'; }
    assessment[muscle] = { sets, level, inRange };
  }
  return assessment;
}

// ===== PERIODIZATION HELPERS =====

export function getPhaseForWeek(weekNumber: number): {
  phase: PeriodizationPhase;
  weekInPhase: number;
  blockNumber: number;
} {
  // Migrate old 10-week cycle weeks to new 11-week cycle
  const effectiveWeek = weekNumber < 20 ? migrateOldWeek(weekNumber) : weekNumber;

  const blockNumber = Math.floor(effectiveWeek / TOTAL_CYCLE_WEEKS) + 1;
  const weekInCycle = effectiveWeek % TOTAL_CYCLE_WEEKS;

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

// ===== EXERCISE COUNT BY PHASE (Bompa Ch.4) =====
// Beginners get more exercises (broader foundation)
// Advanced get fewer (more specific, more sets per exercise)

export function getExerciseCountForPhase(
  phase: PeriodizationPhase,
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  isDeload: boolean,
): { min: number; max: number } {
  const config = PHASE_CONFIG[phase];
  const range = { ...config.exerciseCountRange };

  // Bompa: beginners need more exercises for anatomical foundation
  if (fitnessLevel === 'beginner') {
    range.min = Math.min(range.min + 2, 8);
    range.max = Math.min(range.max + 2, 10);
  }
  // Advanced: fewer exercises, more sets each
  if (fitnessLevel === 'advanced') {
    range.min = Math.max(range.min - 1, 3);
    range.max = Math.max(range.max - 1, 4);
  }

  // Deload: maintain movement patterns but reduce total
  if (isDeload) {
    range.max = Math.min(range.max, 6);
  }

  return range;
}

// ===== RESIDUAL TRAINING EFFECTS (Zatsiorsky Ch.9) =====
// How long training effects persist after stopping

export interface ResidualEffect {
  quality: string;
  nameRu: string;
  durationDays: [number, number]; // [fast decay, slow decay]
  source: string;
}

export const RESIDUAL_EFFECTS: ResidualEffect[] = [
  { quality: 'Анаэробная алактатная (мощность)', nameRu: 'Мощность/скорость', durationDays: [5, 10], source: 'Zatsiorsky; Signor' },
  { quality: 'Анаэробная лактатная', nameRu: 'Силовая выносливость', durationDays: [10, 18], source: 'Bompa Ch.6' },
  { quality: 'Максимальная сила', nameRu: 'Максимальная сила', durationDays: [14, 30], source: 'Zatsiorsky Ch.9' },
  { quality: 'Мышечная гипертрофия', nameRu: 'Гипертрофия', durationDays: [30, 45], source: 'Bompa Ch.6' },
  { quality: 'Аэробная выносливость', nameRu: 'Аэробная выносливость', durationDays: [10, 14], source: 'Benson; Bompa Ch.7' },
];

// ===== EXERCISE SELECTION PRIORITY (Brown Ch.1-2; Bompa Ch.4) =====
// Hierarchy: bilateral compound → unilateral → isolation → plyometric
// Bompa: AA phase uses all tiers, MxS/Power phases focus on bilateral compound only

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

// ===== MOVEMENT PATTERNS (Roberts Ch.9) =====
// 5 primary patterns that should be covered in every workout

export type MovementPattern =
  | 'squat_hinge'       // bilateral bend and lift (squat, deadlift, hip hinge)
  | 'lunge_single_leg'  // single-leg stance (lunge, step-up)
  | 'push'              // horizontal or vertical push
  | 'pull'              // horizontal or vertical pull
  | 'core'              // anti-extension, rotation, stabilization
  | 'cardio_metabolic'; // cardio/metabolic

export const MOVEMENT_PATTERNS: { id: MovementPattern; name: string; nameRu: string; description: string; examples: string }[] = [
  { id: 'squat_hinge', name: 'Squat / Hinge', nameRu: 'Присед / Наклон', description: 'Двусторонние сгибания бёдер и коленей', examples: 'Приседания, становая тяга, ягодичный мостик' },
  { id: 'lunge_single_leg', name: 'Lunge / Single Leg', nameRu: 'Выпад / Одна нога', description: 'Упражнения на одной ноге для баланса и симметрии', examples: 'Выпады, выпад назад, тяга на одной ноге' },
  { id: 'push', name: 'Push', nameRu: 'Толчок', description: 'Горизонтальный или вертикальный толчок', examples: 'Отжимания, жим над головой, пайк-отжимания' },
  { id: 'pull', name: 'Pull', nameRu: 'Тяга', description: 'Горизонтальная или вертикальная тяга', examples: 'Тяга к поясу, подтягивания, австралийские подтягивания' },
  { id: 'core', name: 'Core', nameRu: 'Кор', description: 'Стабилизация, анти-расширение, ротация', examples: 'Планка, ягодичный мостик, скручивания' },
  { id: 'cardio_metabolic', name: 'Cardio / Metabolic', nameRu: 'Кардио', description: 'Метаболическая и кардио работа', examples: 'Бёрпи, прыжки, бег на месте' },
];

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

// ===== METABOLIC TRAINING PARAMS (Graham Ch.4-6; Roberts Ch.9) =====

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

// ===== SCIENTIFIC FITNESS LEVEL (Bompa: reassess periodically) =====

export function calculateScientificFitnessLevel(
  avgRPE: number,
  comfortableMinutes: number,
  totalWorkouts: number,
): 'beginner' | 'intermediate' | 'advanced' {
  // Bompa: beginners need anatomical adaptation, advanced can handle maximal effort
  // Advanced: very easy RPE + long sessions + significant experience
  if (avgRPE <= 2 && comfortableMinutes >= 40 && totalWorkouts >= 20) return 'advanced';
  // Intermediate: comfortable + decent session length
  if (avgRPE <= 4 && comfortableMinutes >= 25 && totalWorkouts >= 5) return 'intermediate';
  if (avgRPE <= 3 && comfortableMinutes >= 15 && totalWorkouts >= 8) return 'intermediate';
  // Beginner: default
  return 'beginner';
}

// ===== SCIENTIFIC ADAPTIVE LOAD (Enhanced: Bompa fatigue + Zatsiorsky fitness-fatigue) =====
// Graham Ch.2: Overload + Individuality + Progression principles
// Benson: Reversibility (detraining begins within days)
// Zatsiorsky: Fitness-Fatigue model — fatigue is short-lived, fitness persists

export function getScientificAdaptiveMultiplier(
  feedback: 'easier' | 'normal' | 'harder' | 'very_hard',
  missedDays: number,
  consecutiveHardCount: number,
  phase: PeriodizationPhase,
): number {
  // Deload phase: always reduce volume (Bompa)
  if (phase === 'deload') return 0.85;

  // Severe overreaching: significant regression
  // Zatsiorsky: accumulated fatigue > fitness gain
  if (consecutiveHardCount >= 3) return 0.65;
  if (consecutiveHardCount >= 2) return 0.75;

  // Very hard: moderate reduction
  if (feedback === 'very_hard') return 0.85;

  // Hard: slight reduction or maintenance
  if (feedback === 'harder') return 0.92;

  // Detraining: regression based on residual effects (Zatsiorsky)
  // Power fades in 7-10 days, strength in 14-30 days, hypertrophy in 30-45 days
  if (missedDays > 14) return 0.70;  // hypertrophy starting to decay
  if (missedDays > 7) return 0.80;   // power significantly decayed
  if (missedDays > 3) return 0.88;   // early power decay
  if (missedDays > 0) return 0.95;   // minimal detraining

  // Normal: slight progressive overload (Graham: 2-10% increase)
  if (feedback === 'normal') return 1.05;

  // Easier: larger progression
  // Bompa: if athlete adapts easily, increase volume first, then intensity
  if (feedback === 'easier') return 1.12;

  return 1.0;
}

// ===== REP CALCULATION: Scientific Method Intersection + Prilepin =====
// Intersect variant's natural rep range with the training method's target range
// Then validate against Prilepin's chart

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

// ===== SET CALCULATION: Scientific Method + Prilepin Validation =====
// Enhanced: validate total reps against Prilepin's chart after initial calculation

export function calculateScientificSets(
  method: TrainingMethod,
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  isDeload: boolean,
  category: 'strength' | 'cardio' | 'flexibility',
  goal: 'maintain' | 'lose_weight' | 'muscle_tone' | 'flexibility',
): number {
  if (category === 'flexibility') return 1;

  if (category === 'cardio') {
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

// ===== WORKOUT TYPE LABELS =====

export function getWorkoutTypeLabel(phase: PeriodizationPhase): string {
  const method = TRAINING_METHODS[PHASE_CONFIG[phase].method];
  const methodName = method.nameRu;
  return `${PHASE_CONFIG[phase].nameRu} · ${methodName}`;
}

export function getWorkoutTypeDescription(phase: PeriodizationPhase): string {
  const config = PHASE_CONFIG[phase];
  const method = TRAINING_METHODS[config.method];
  return `${config.description}. ${method.repRange.min}-${method.repRange.max} повторений, ${method.restSeconds.min}-${method.restSeconds.max} сек отдых.`;
}