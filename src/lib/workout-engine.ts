// =============================================================================
// SCIENTIFIC WORKOUT GENERATION ENGINE
// Implements principles from:
//   Brown: 4 training methods, exercise hierarchy, antagonist pairing
//   Graham: 7 training principles, work/rest ratios, energy system targeting
//   Benson: HR zones, zone-based intensity, recovery management
// =============================================================================

import {
  EXERCISE_CATALOG,
  EQUIPMENT_PRIORITY,
  FULL_BODY_TARGETS,
  ANTAGONIST_PAIRS,
  type ExerciseConfig,
  type ExerciseVariant,
  type EquipmentType,
} from './exercises';
import type { FitnessLevel } from './exercises';

import {
  type TrainingMethod,
  type PeriodizationPhase,
  TRAINING_METHODS,
  PHASE_CONFIG,
  TOTAL_CYCLE_WEEKS,
  getPhaseForWeek,
  getCurrentPhaseInfo,
  getScientificRest,
  calculateScientificReps,
  calculateScientificSets,
  calculateScientificFitnessLevel,
  getScientificAdaptiveMultiplier,
  getCardioWorkRestRatio,
  getWorkoutTypeLabel,
} from './training-science';

// --- Types ---

export interface ExerciseInPlan {
  exerciseConfigId: string;
  exerciseName: string;
  variantId: string;
  variantName: string;
  requiredEquipment: EquipmentType;
  alternativeHint?: string;
  targetSets: number;
  targetReps: number;
  weightKg: number | null;
  durationSeconds?: number | null;
  isTimed?: boolean;
  primaryMuscleGroups: string[];
  category: 'strength' | 'cardio' | 'flexibility';
  completedSets: number;
  setResults: { reps: number; rpe?: number }[];
  // --- NEW: Scientific fields ---
  restSeconds: number;            // Scientific rest period for this exercise
  trainingMethod: TrainingMethod; // Which training method this follows
}

export interface WorkoutPlan {
  id: string;
  exercises: ExerciseInPlan[];
  createdAt: number;
  estimatedDurationMin: number;
  // --- NEW: Scientific metadata ---
  workoutType: string;               // e.g. "Накопление · Повторный метод"
  workoutTypeDescription: string;    // Human-readable description
  periodizationPhase: PeriodizationPhase;
  blockNumber: number;
  weekInBlock: number;
  totalCycleWeeks: number;           // 10
}

export type UserProfile = {
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  weight: number;
  medicalRestrictions: boolean;
  goal: 'maintain' | 'lose_weight' | 'muscle_tone' | 'flexibility';
  inventory: EquipmentType[];
  rpeSquat: number;
  rpePushUp: number;
  rpePlank: number;
  comfortableMinutes: number;
  fitnessLevel: FitnessLevel;
};

// --- Variant Resolution (unchanged — works well) ---

export function resolveBestVariant(
  config: ExerciseConfig,
  availableEquipment: Set<EquipmentType>,
): ExerciseVariant | null {
  const availableVariants = config.variants.filter(
    (v) =>
      v.requiredEquipment === 'none' ||
      availableEquipment.has(v.requiredEquipment),
  );

  if (availableVariants.length === 0) return null;

  return availableVariants.reduce((best, current) => {
    const currentPriority = EQUIPMENT_PRIORITY[current.requiredEquipment] ?? 0;
    const bestPriority = EQUIPMENT_PRIORITY[best.requiredEquipment] ?? 0;
    return currentPriority >= bestPriority ? current : best;
  });
}

// --- Fitness Level (FIXED — original had unreachable 'advanced') ---

export function calculateFitnessLevel(
  profile: Omit<UserProfile, 'fitnessLevel'>,
  totalWorkouts: number = 0,
): FitnessLevel {
  const avgRPE = (profile.rpeSquat + profile.rpePushUp + profile.rpePlank) / 3;
  return calculateScientificFitnessLevel(avgRPE, profile.comfortableMinutes, totalWorkouts);
}

// --- Legacy export for backward compatibility ---
export function calculateSets(level: FitnessLevel): number {
  return calculateScientificSets('repeated_effort', level, false, 'strength', 'maintain');
}

// --- Weight Calculation (unchanged) ---

function calculateWeight(
  variant: ExerciseVariant,
  userWeight: number,
  level: FitnessLevel,
): number | null {
  if (variant.adjustments.defaultWeightPercent === 0) return null;

  const base = userWeight * (variant.adjustments.defaultWeightPercent / 100);
  const modifier =
    level === 'beginner' ? 0.6 : level === 'intermediate' ? 0.75 : 0.85;
  return Math.round(base * modifier * 10) / 10;
}

// --- Build Exercise In Plan (scientific version) ---

function buildExerciseInPlan(
  config: ExerciseConfig,
  variant: ExerciseVariant,
  profile: UserProfile,
  method: TrainingMethod,
  isDeload: boolean,
  setsOverride?: number,
): ExerciseInPlan {
  const level = profile.fitnessLevel;
  const category = config.category as 'strength' | 'cardio' | 'flexibility';

  // Scientific sets based on training method
  const targetSets =
    setsOverride ??
    calculateScientificSets(method, level, isDeload, category, profile.goal);

  // Scientific reps: intersect variant range with method range
  const targetReps = calculateScientificReps(
    variant.adjustments.repRange,
    method,
    level,
    isDeload,
  );

  // For timed exercises, use duration
  const dur = variant.adjustments.durationSeconds ?? null;

  // Scientific rest period
  const restSeconds = getScientificRest(method, category, level);

  // Weight
  const weight = calculateWeight(variant, profile.weight, level);

  return {
    exerciseConfigId: config.id,
    exerciseName: config.name,
    variantId: variant.variantId,
    variantName: variant.variantName,
    requiredEquipment: variant.requiredEquipment,
    alternativeHint: variant.alternativeEquipmentHint,
    targetSets,
    targetReps: config.isTimed && dur ? dur : targetReps,
    weightKg: weight,
    durationSeconds: dur,
    isTimed: config.isTimed,
    primaryMuscleGroups: config.primaryMuscleGroups,
    category,
    completedSets: 0,
    setResults: [],
    restSeconds,
    trainingMethod: method,
  };
}

// --- Exercise Rotation ---
// Prevents accommodation (Brown: "biological law of accommodation")
// Deprioritizes exercises from recent plans

function sortCandidatesByRecency(
  candidates: ExerciseConfig[],
  recentIds: Set<string>,
): ExerciseConfig[] {
  return [...candidates].sort((a, b) => {
    const aRecent = recentIds.has(a.id) ? 1 : 0;
    const bRecent = recentIds.has(b.id) ? 1 : 0;
    return aRecent - bRecent; // non-recent first
  });
}

// --- MAIN WORKOUT GENERATION (Scientific) ---

export function generateWorkout(
  profile: UserProfile,
  extraExercises?: ExerciseConfig[],
  periodizationWeek: number = 0,
  recentExerciseIds: string[] = [],
): WorkoutPlan {
  const availableSet = new Set(profile.inventory);
  const allCatalog = [...EXERCISE_CATALOG, ...(extraExercises ?? [])];
  const selectedExercises: ExerciseInPlan[] = [];
  const coveredIds = new Set<string>();

  // --- 1. Determine periodization phase and training method ---
  const phaseInfo = getCurrentPhaseInfo(periodizationWeek);
  const { method, isDeload, weekInPhase, blockNumber } = phaseInfo;
  const recentIdSet = new Set(recentExerciseIds);

  // --- 2. Select strength exercises for each target muscle group ---
  const strengthCatalog = allCatalog.filter((e) => e.category === 'strength');

  for (const target of FULL_BODY_TARGETS) {
    // Find candidates for this muscle group
    let candidates = strengthCatalog.filter((ex) =>
      ex.primaryMuscleGroups.includes(target),
    );

    // Remove already-selected exercises
    candidates = candidates.filter((c) => !coveredIds.has(c.id));

    // Sort by recency (prefer exercises NOT recently used — prevents accommodation)
    candidates = sortCandidatesByRecency(candidates, recentIdSet);

    // Pick first available with a valid variant
    for (const candidate of candidates) {
      const variant = resolveBestVariant(candidate, availableSet);
      if (!variant) continue;

      selectedExercises.push(
        buildExerciseInPlan(candidate, variant, profile, method, isDeload),
      );
      coveredIds.add(candidate.id);
      break;
    }
  }

  // --- 3. Add cardio exercises ---
  const cardioCatalog = allCatalog.filter((e) => e.category === 'cardio');
  const cardioCount = profile.goal === 'lose_weight' ? 2 : 1;
  let added = 0;

  // Sort cardio by recency too
  const cardioCandidates = sortCandidatesByRecency(
    cardioCatalog.filter((c) => !coveredIds.has(c.id)),
    recentIdSet,
  );

  for (const candidate of cardioCandidates) {
    if (added >= cardioCount) break;
    const variant = resolveBestVariant(candidate, availableSet);
    if (!variant) continue;

    // Cardio gets 1 set with scientific rest (shorter than strength)
    selectedExercises.push(
      buildExerciseInPlan(candidate, variant, profile, method, isDeload, 1),
    );
    coveredIds.add(candidate.id);
    added++;
  }

  // --- 4. Flexibility ---
  const needsFlexibility =
    profile.goal === 'flexibility' || profile.goal === 'maintain';

  if (needsFlexibility) {
    const flexCatalog = allCatalog.filter((e) => e.category === 'flexibility');
    const flexCandidates = sortCandidatesByRecency(
      flexCatalog.filter((c) => !coveredIds.has(c.id)),
      recentIdSet,
    );

    for (const candidate of flexCandidates) {
      const variant = resolveBestVariant(candidate, availableSet);
      if (!variant) continue;

      selectedExercises.push(
        buildExerciseInPlan(candidate, variant, profile, method, isDeload, 1),
      );
      coveredIds.add(candidate.id);
      break;
    }
  }

  // --- 5. Order exercises scientifically ---

  const strengthExercises = selectedExercises.filter(
    (e) => e.category === 'strength',
  );
  const cardioExercises = selectedExercises.filter(
    (e) => e.category === 'cardio',
  );
  const flexExercises = selectedExercises.filter(
    (e) => e.category === 'flexibility',
  );

  // Antagonist sorting for strength (Brown Ch.1: alternate agonist/antagonist)
  const sorted = antagonistSort(strengthExercises);

  // Exercise ordering principle (Graham Ch.7):
  // Speed before strength, technical before gross motor, large before small
  // For metabolic goal: interleave cardio between strength (pod system)
  // For other goals: cardio at end

  let finalExercises: ExerciseInPlan[];

  if (profile.goal === 'lose_weight' && cardioExercises.length > 0) {
    // Metabolic pod system: interleave cardio between strength blocks
    // Graham: strength → cardio → strength → cardio → strength
    finalExercises = interleaveCardio(sorted, cardioExercises, flexExercises);
  } else {
    // Standard: strength (antagonist-ordered) → cardio → flexibility
    finalExercises = [...sorted, ...cardioExercises, ...flexExercises];
  }

  // --- 6. Cap to comfortable minutes ---
  finalExercises = capToTimeLimit(finalExercises, profile.comfortableMinutes);

  // --- 7. Estimate duration (scientific: includes actual rest times) ---
  const estimatedDurationMin = estimateDuration(finalExercises);

  // --- 8. Build result ---
  return {
    id: `plan_${Date.now()}`,
    exercises: finalExercises,
    createdAt: Date.now(),
    estimatedDurationMin,
    workoutType: getWorkoutTypeLabel(phaseInfo.name as PeriodizationPhase),
    workoutTypeDescription: `${phaseInfo.description}. ${TRAINING_METHODS[method].repRange.min}-${TRAINING_METHODS[method].repRange.max} повторений, отдых ${getScientificRest(method, 'strength', profile.fitnessLevel)} сек.`,
    periodizationPhase: phaseInfo.name as PeriodizationPhase,
    blockNumber,
    weekInBlock: weekInPhase,
    totalCycleWeeks: TOTAL_CYCLE_WEEKS,
  };
}

// --- Antagonist Sorting (improved: uses all primary muscles, not just [0]) ---

function antagonistSort(exercises: ExerciseInPlan[]): ExerciseInPlan[] {
  if (exercises.length <= 1) return exercises;

  const sorted: ExerciseInPlan[] = [];
  const used = new Set<number>();

  // Build map: each primary muscle → exercise indices
  const muscleToIdx = new Map<string, number[]>();
  exercises.forEach((ex, i) => {
    for (const mg of ex.primaryMuscleGroups) {
      if (!muscleToIdx.has(mg)) muscleToIdx.set(mg, []);
      muscleToIdx.get(mg)!.push(i);
    }
  });

  while (used.size < exercises.length) {
    const lastPrimary =
      sorted.length > 0 ? sorted[sorted.length - 1].primaryMuscleGroups : [];

    // Try to find an antagonist of ANY of the last exercise's primary muscles
    let nextIdx = -1;

    for (const mg of lastPrimary) {
      const targetAntagonist = ANTAGONIST_PAIRS[mg];
      if (targetAntagonist) {
        const candidates = muscleToIdx.get(targetAntagonist) ?? [];
        for (const idx of candidates) {
          if (!used.has(idx)) {
            nextIdx = idx;
            break;
          }
        }
        if (nextIdx >= 0) break;
      }
    }

    // Fallback: first unused exercise
    if (nextIdx === -1) {
      for (let i = 0; i < exercises.length; i++) {
        if (!used.has(i)) {
          nextIdx = i;
          break;
        }
      }
    }

    if (nextIdx === -1) break;
    used.add(nextIdx);
    sorted.push(exercises[nextIdx]);
  }

  return sorted;
}

// --- Metabolic Pod System (Graham Ch.7) ---
// Interleave cardio between strength exercises for metabolic effect

function interleaveCardio(
  strength: ExerciseInPlan[],
  cardio: ExerciseInPlan[],
  flexibility: ExerciseInPlan[],
): ExerciseInPlan[] {
  if (cardio.length === 0) return [...strength, ...flexibility];

  const result: ExerciseInPlan[] = [];
  const cardioCopy = [...cardio];
  let cardioIdx = 0;

  // Split strength roughly in half
  const midPoint = Math.ceil(strength.length / 2);

  // First half of strength
  for (let i = 0; i < midPoint && i < strength.length; i++) {
    result.push(strength[i]);
  }

  // Interleave cardio
  while (cardioIdx < cardioCopy.length) {
    result.push(cardioCopy[cardioIdx]);
    cardioIdx++;
  }

  // Second half of strength
  for (let i = midPoint; i < strength.length; i++) {
    result.push(strength[i]);
  }

  // Flexibility at end
  result.push(...flexibility);

  return result;
}

// --- Time Cap ---
// Respect the user's comfortable session duration

function capToTimeLimit(
  exercises: ExerciseInPlan[],
  maxMinutes: number,
): ExerciseInPlan[] {
  const estimated = estimateDuration(exercises);
  if (estimated <= maxMinutes) return exercises;

  // Remove exercises from the end (flexibility first, then cardio, then isolation)
  const result = [...exercises];
  while (result.length > 3 && estimateDuration(result) > maxMinutes) {
    // Remove last non-strength exercise first
    const lastIdx = result.length - 1;
    const lastEx = result[lastIdx];
    if (lastEx.category !== 'strength') {
      result.pop();
    } else {
      // Remove last exercise
      result.pop();
    }
  }
  return result;
}

// --- Duration Estimation (scientific: includes rest times) ---

function estimateDuration(exercises: ExerciseInPlan[]): number {
  let totalSeconds = 0;

  for (const ex of exercises) {
    const sets = ex.targetSets;

    if (ex.isTimed && ex.durationSeconds) {
      // Timed exercise: each set = duration
      totalSeconds += sets * ex.durationSeconds;
    } else if (ex.category === 'cardio') {
      // Cardio: each set ~30-45 sec
      totalSeconds += sets * 35;
    } else {
      // Strength: ~3 sec per rep
      totalSeconds += sets * ex.targetReps * 3;
    }

    // Rest between sets (sets - 1 rest periods)
    totalSeconds += Math.max(0, sets - 1) * ex.restSeconds;

    // Transition time between exercises
    totalSeconds += 15;
  }

  return Math.round(totalSeconds / 60);
}

// --- Adaptive Load (scientific version) ---

export type WorkoutFeedback = 'easier' | 'normal' | 'harder' | 'very_hard';

export function getAdaptiveMultiplier(
  feedback: WorkoutFeedback,
  missedDays: number,
  consecutiveHardCount: number,
): number {
  // Default to accumulation phase for backward compatibility
  return getScientificAdaptiveMultiplier(feedback, missedDays, consecutiveHardCount, 'accumulation');
}

export function applyAdaptiveLoad(
  plan: ExerciseInPlan[],
  multiplier: number,
): ExerciseInPlan[] {
  return plan.map((ex) => ({
    ...ex,
    targetReps:
      ex.category === 'cardio'
        ? ex.targetReps // don't scale cardio reps
        : Math.max(1, Math.round(ex.targetReps * multiplier)),
    weightKg: ex.weightKg
      ? Math.round(ex.weightKg * multiplier * 10) / 10
      : null,
    completedSets: 0,
    setResults: [],
  }));
}