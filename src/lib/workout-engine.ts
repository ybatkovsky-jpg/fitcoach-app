// =============================================================================
// SCIENTIFIC WORKOUT GENERATION ENGINE — Enhanced Edition
// Implements principles from 8 evidence-based sources:
//   Brown: 4 training methods, exercise hierarchy, antagonist pairing, Prilepin
//   Graham: 7 training principles, work/rest ratios, energy system targeting
//   Benson: HR zones, zone-based intensity, recovery management
//   Roberts: undulating periodization, movement patterns, exercise order
//   Bompa: 5-phase periodization, exercise count by phase, rest by %1RM
//   Signor: VBT zones, velocity loss protocols, CNS readiness
//   Zatsiorsky: fitness-fatigue model, residual effects, SSC
//   Schoenfeld: volume landmarks (10-20 sets/muscle/week)
// =============================================================================

import {
  EXERCISE_CATALOG,
  EQUIPMENT_PRIORITY,
  FULL_BODY_TARGETS,
  ANTAGONIST_PAIRS,
  type ExerciseConfig,
  type ExerciseVariant,
  type EquipmentType,
  type ExerciseTier,
  type MovementPattern,
  type WeightedEquipment,
  type WeightedEquipmentType,
  resolveWeightFromInventory,
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
  getWorkoutTypeLabel,
  getExerciseCountForPhase,
  validateWithPrilepin,
  EXERCISE_TIER_PRIORITY,
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
  recommendedWeightLabel?: string;  // e.g. "Гиря 16 кг" or "Гантели 2×10 кг"
  durationSeconds?: number | null;
  isTimed?: boolean;
  primaryMuscleGroups: string[];
  category: 'strength' | 'cardio' | 'flexibility';
  completedSets: number;
  setResults: { reps: number; rpe?: number }[];
  // --- Scientific fields ---
  restSeconds: number;            // Scientific rest period for this exercise
  trainingMethod: TrainingMethod; // Which training method this follows
  // --- NEW: Enhanced scientific fields ---
  movementPattern?: MovementPattern;
  tier?: ExerciseTier;
  prilepinValidated?: boolean;    // Whether total reps are within Prilepin range
  phaseRationale?: string;        // Why this exercise was selected for this phase
}

export interface WorkoutPlan {
  id: string;
  exercises: ExerciseInPlan[];
  createdAt: number;
  estimatedDurationMin: number;
  // --- Scientific metadata ---
  workoutType: string;               // e.g. "Накопление · Повторный метод"
  workoutTypeDescription: string;    // Human-readable description
  periodizationPhase: PeriodizationPhase;
  blockNumber: number;
  weekInBlock: number;
  totalCycleWeeks: number;           // 11 (new 5-phase cycle)
  // --- NEW: Science dashboard data ---
  coveredPatterns: MovementPattern[];
  volumePerMuscle: Record<string, number>;
  phaseRationale: string;            // Scientific explanation of this phase
  scienceNote?: string;              // Additional science note for the user
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

// --- Variant Resolution (weight-aware) ---

export function resolveBestVariant(
  config: ExerciseConfig,
  availableEquipment: Set<EquipmentType>,
  weightedEquipment?: WeightedEquipment,
  userWeight?: number,
  level?: FitnessLevel,
): ExerciseVariant | null {
  const availableVariants = config.variants.filter(
    (v) =>
      v.requiredEquipment === 'none' ||
      availableEquipment.has(v.requiredEquipment),
  );
  if (availableVariants.length === 0) return null;

  // If we have weight info, filter out variants whose required weight is unavailable
  const weightedTypes: WeightedEquipmentType[] = ['dumbbell', 'kettlebell', 'barbell'];
  let viableVariants = availableVariants;
  if (weightedEquipment && userWeight && level) {
    viableVariants = availableVariants.filter((v) => {
      const eqType = v.requiredEquipment as WeightedEquipmentType;
      if (!weightedTypes.includes(eqType)) return true;
      const base = userWeight * (v.adjustments.defaultWeightPercent / 100);
      const modifier = level === 'beginner' ? 0.6 : level === 'intermediate' ? 0.75 : 0.85;
      return resolveWeightFromInventory(eqType, base * modifier, weightedEquipment, level) !== null;
    });
    if (viableVariants.length === 0) {
      viableVariants = availableVariants.filter(
        (v) => !weightedTypes.includes(v.requiredEquipment as WeightedEquipmentType),
      );
    }
  }
  if (viableVariants.length === 0) return null;
  return viableVariants.reduce((best, current) => {
    const cp = EQUIPMENT_PRIORITY[current.requiredEquipment] ?? 0;
    const bp = EQUIPMENT_PRIORITY[best.requiredEquipment] ?? 0;
    return cp >= bp ? current : best;
  });
}

// --- Fitness Level ---

export function calculateFitnessLevel(
  profile: Omit<UserProfile, 'fitnessLevel'>,
  totalWorkouts: number = 0,
): FitnessLevel {
  const avgRPE = (profile.rpeSquat + profile.rpePushUp + profile.rpePlank) / 3;
  return calculateScientificFitnessLevel(avgRPE, profile.comfortableMinutes, totalWorkouts);
}

// Legacy export
export function calculateSets(level: FitnessLevel): number {
  return calculateScientificSets('repeated_effort', level, false, 'strength', 'maintain');
}

// --- Weight Calculation (enhanced: uses actual inventory) ---

interface WeightResult {
  weightKg: number | null;
  label?: string;
}

function calculateWeight(
  variant: ExerciseVariant,
  userWeight: number,
  level: FitnessLevel,
  weightedEquipment?: WeightedEquipment,
): WeightResult {
  if (variant.adjustments.defaultWeightPercent === 0) return { weightKg: null };

  const base = userWeight * (variant.adjustments.defaultWeightPercent / 100);
  const modifier =
    level === 'beginner' ? 0.6 : level === 'intermediate' ? 0.75 : 0.85;
  const targetWeight = Math.round(base * modifier * 10) / 10;

  // Try to resolve from user's actual inventory
  const eqType = variant.requiredEquipment as WeightedEquipmentType;
  const weightedTypes: WeightedEquipmentType[] = ['dumbbell', 'kettlebell', 'barbell'];
  
  if (weightedTypes.includes(eqType) && weightedEquipment) {
    const resolved = resolveWeightFromInventory(eqType, targetWeight, weightedEquipment, level);
    if (resolved) {
      return { weightKg: resolved.weightKg, label: resolved.label };
    }
    // No suitable weight found — return null (bodyweight fallback)
    return { weightKg: null };
  }

  // For non-discrete equipment (bands, machines, etc.) — use calculated %
  return { weightKg: targetWeight };
}

// --- Build Exercise In Plan (scientific version with Prilepin validation) ---

function buildExerciseInPlan(
  config: ExerciseConfig,
  variant: ExerciseVariant,
  profile: UserProfile,
  method: TrainingMethod,
  isDeload: boolean,
  setsOverride?: number,
  phaseRationale?: string,
): ExerciseInPlan {
  const level = profile.fitnessLevel;
  const category = config.category as 'strength' | 'cardio' | 'flexibility';

  // Scientific sets based on training method
  let targetSets =
    setsOverride ??
    calculateScientificSets(method, level, isDeload, category, profile.goal);

  // Scientific reps: intersect variant range with method range
  let targetReps = calculateScientificReps(
    variant.adjustments.repRange,
    method,
    level,
    isDeload,
  );

  // Prilepin validation for strength exercises
  let prilepinValidated = false;
  if (category === 'strength') {
    const intensityPercent = TRAINING_METHODS[method].intensityPercent;
    const validation = validateWithPrilepin(targetReps, targetSets, intensityPercent);
    if (!validation.isOptimal) {
      // Adjust sets to match Prilepin's optimal total reps
      targetSets = validation.adjustedSets;
    }
    prilepinValidated = true;
  }

  // For timed exercises, use duration
  const dur = variant.adjustments.durationSeconds ?? null;

  // Scientific rest period (Bompa: based on intensity and CNS demand)
  const restSeconds = getScientificRest(method, category, level);

  // Weight (enhanced: from actual inventory)
  const weightResult = calculateWeight(variant, profile.weight, level, profile.weightedEquipment);

  return {
    exerciseConfigId: config.id,
    exerciseName: config.name,
    variantId: variant.variantId,
    variantName: variant.variantName,
    requiredEquipment: variant.requiredEquipment,
    alternativeHint: variant.alternativeEquipmentHint,
    targetSets,
    targetReps: config.isTimed && dur ? dur : targetReps,
    weightKg: weightResult.weightKg,
    recommendedWeightLabel: weightResult.label,
    durationSeconds: dur,
    isTimed: config.isTimed,
    primaryMuscleGroups: config.primaryMuscleGroups,
    category,
    completedSets: 0,
    setResults: [],
    restSeconds,
    trainingMethod: method,
    movementPattern: config.movementPattern,
    tier: config.tier,
    prilepinValidated,
    phaseRationale,
  };
}

// --- Exercise Sorting by Tier Priority (Brown Ch.1-2; Bompa Ch.4) ---
// Bompa: exercise selection by phase — AA uses broad, MxS/Power uses specific

function sortCandidatesByTierAndRecency(
  candidates: ExerciseConfig[],
  recentIds: Set<string>,
  priorityTiers: ExerciseTier[],
): ExerciseConfig[] {
  return [...candidates].sort((a, b) => {
    // 1. Tier priority (lower number = higher priority)
    const aTier = a.tier ? (EXERCISE_TIER_PRIORITY[a.tier] ?? 99) : 99;
    const bTier = b.tier ? (EXERCISE_TIER_PRIORITY[b.tier] ?? 99) : 99;
    
    // If both tiers are in the priority list, sort by tier
    const aInPriority = priorityTiers.includes(a.tier as ExerciseTier);
    const bInPriority = priorityTiers.includes(b.tier as ExerciseTier);
    
    if (aInPriority && !bInPriority) return -1;
    if (!aInPriority && bInPriority) return 1;
    if (aInPriority && bInPriority) {
      const aTierIdx = priorityTiers.indexOf(a.tier as ExerciseTier);
      const bTierIdx = priorityTiers.indexOf(b.tier as ExerciseTier);
      if (aTierIdx !== bTierIdx) return aTierIdx - bTierIdx;
    }
    
    // 2. Recency: prefer exercises NOT recently used (Brown: accommodation)
    const aRecent = recentIds.has(a.id) ? 1 : 0;
    const bRecent = recentIds.has(b.id) ? 1 : 0;
    if (aRecent !== bRecent) return aRecent - bRecent;

    return 0;
  });
}

// --- Movement Pattern Coverage Check (Roberts Ch.9) ---

function getMissingPatterns(
  selectedExercises: ExerciseInPlan[],
): MovementPattern[] {
  const covered = new Set(
    selectedExercises
      .map((e) => e.movementPattern)
      .filter((p): p is MovementPattern => !!p && p !== 'cardio_metabolic' && p !== 'flexibility'),
  );
  
  const essentialPatterns: MovementPattern[] = [
    'squat_hinge', 'push', 'pull', 'core',
  ];
  
  return essentialPatterns.filter((p) => !covered.has(p));
}

// --- MAIN WORKOUT GENERATION (Scientific Enhanced) ---

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
  // Use the actual phase key (not the display name) for lookups
  const phaseKey = getPhaseForWeek(periodizationWeek).phase;
  const recentIdSet = new Set(recentExerciseIds);

  // Bompa: exercise count varies by phase (AA=6-8, Hyp=5-7, MxS=4-6, Power=3-5, Deload=4-6)
  const exerciseCount = getExerciseCountForPhase(
    phaseKey,
    profile.fitnessLevel,
    isDeload,
  );
  const maxStrengthExercises = exerciseCount.max;
  const priorityTiers = phaseInfo.priorityTiers;

  // --- 2. Select strength exercises with tier priority ---
  const strengthCatalog = allCatalog.filter((e) => e.category === 'strength');

  // Bompa: in AA and Hyp phases, beginners get more exercises for broader foundation
  // In MxS and Power phases, focus on prime movers (bilateral compound only)
  
  for (const target of FULL_BODY_TARGETS) {
    if (selectedExercises.filter((e) => e.category === 'strength').length >= maxStrengthExercises) {
      break; // Bompa: respect exercise count limit for this phase
    }

    // Find candidates for this muscle group
    let candidates = strengthCatalog.filter((ex) =>
      ex.primaryMuscleGroups.includes(target),
    );

    // Remove already-selected exercises
    candidates = candidates.filter((c) => !coveredIds.has(c.id));

    // Sort by tier priority + recency (Brown Ch.1-2 hierarchy + Bomba accommodation)
    candidates = sortCandidatesByTierAndRecency(candidates, recentIdSet, priorityTiers);

    // Pick first available with a valid variant (weight-aware)
    for (const candidate of candidates) {
      const variant = resolveBestVariant(candidate, availableSet, profile.weightedEquipment, profile.weight, profile.fitnessLevel);
      if (!variant) continue;

      const rationale = getPhaseRationale(phaseKey, candidate.tier);
      selectedExercises.push(
        buildExerciseInPlan(candidate, variant, profile, method, isDeload, undefined, rationale),
      );
      coveredIds.add(candidate.id);
      break;
    }
  }

  // --- 2b. Fill missing movement patterns if budget allows (Roberts Ch.9) ---
  const missingPatterns = getMissingPatterns(selectedExercises);
  const strengthCount = selectedExercises.filter((e) => e.category === 'strength').length;
  const remainingBudget = maxStrengthExercises - strengthCount;

  if (remainingBudget > 0 && missingPatterns.length > 0) {
    for (const pattern of missingPatterns) {
      if (strengthCount + selectedExercises.filter((e) => e.category === 'strength' && e.movementPattern === pattern).length >= maxStrengthExercises) break;

      const patternCandidates = strengthCatalog.filter(
        (ex) => ex.movementPattern === pattern && !coveredIds.has(ex.id),
      );
      const sorted = sortCandidatesByTierAndRecency(patternCandidates, recentIdSet, priorityTiers);

      for (const candidate of sorted) {
        const variant = resolveBestVariant(candidate, availableSet, profile.weightedEquipment, profile.weight, profile.fitnessLevel);
        if (!variant) continue;
        selectedExercises.push(
          buildExerciseInPlan(candidate, variant, profile, method, isDeload),
        );
        coveredIds.add(candidate.id);
        break;
      }
    }
  }

  // --- 3. Add cardio exercises ---
  const cardioCatalog = allCatalog.filter((e) => e.category === 'cardio');
  const cardioCount = profile.goal === 'lose_weight' ? 2 : 1;
  // Bompa: in Power phase, reduce cardio (focus on CNS freshness)
  const effectiveCardioCount = (phaseInfo.name === 'realization') ? Math.max(1, cardioCount - 1) : cardioCount;
  let added = 0;

  const cardioCandidates = sortCandidatesByTierAndRecency(
    cardioCatalog.filter((c) => !coveredIds.has(c.id)),
    recentIdSet,
    priorityTiers,
  );

  for (const candidate of cardioCandidates) {
    if (added >= effectiveCardioCount) break;
    const variant = resolveBestVariant(candidate, availableSet);
    if (!variant) continue;

    selectedExercises.push(
      buildExerciseInPlan(candidate, variant, profile, method, isDeload, 1),
    );
    coveredIds.add(candidate.id);
    added++;
  }

  // --- 4. Flexibility (conditional) ---
  const needsFlexibility =
    profile.goal === 'flexibility' || profile.goal === 'maintain';

  if (needsFlexibility) {
    const flexCatalog = allCatalog.filter((e) => e.category === 'flexibility');
    const flexCandidates = sortCandidatesByTierAndRecency(
      flexCatalog.filter((c) => !coveredIds.has(c.id)),
      recentIdSet,
      priorityTiers,
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

  // Bompa Ch.4: exercise order rules:
  // 1. Complex multi-joint first (prime movers, CNS fresh)
  // 2. Speed/power before strength (Signor)
  // 3. Large muscle groups before small
  // 4. Core/structural before limb exercises
  // 5. Alternate agonist/antagonist (Brown Ch.1)

  // Sort strength: bilateral compound first, then by antagonist alternation
  const tierSorted = [...strengthExercises].sort((a, b) => {
    const aTier = a.tier ? (EXERCISE_TIER_PRIORITY[a.tier] ?? 99) : 99;
    const bTier = b.tier ? (EXERCISE_TIER_PRIORITY[b.tier] ?? 99) : 99;
    return aTier - bTier;
  });

  const sorted = antagonistSort(tierSorted);

  let finalExercises: ExerciseInPlan[];

  if (profile.goal === 'lose_weight' && cardioExercises.length > 0) {
    // Roberts Ch.9: metabolic pod system
    finalExercises = interleaveCardio(sorted, cardioExercises, flexExercises);
  } else {
    // Bompa Ch.4: standard order — strength → cardio → flexibility
    // Signor: power exercises before strength (in realization phase)
    finalExercises = [...sorted, ...cardioExercises, ...flexExercises];
  }

  // --- 6. Cap to comfortable minutes ---
  finalExercises = capToTimeLimit(finalExercises, profile.comfortableMinutes);

  // --- 7. Estimate duration ---
  const estimatedDurationMin = estimateDuration(finalExercises);

  // --- 8. Calculate volume per muscle group (Schoenfeld landmarks) ---
  const volumePerMuscle = calculateVolumePerMuscle(finalExercises);

  // --- 9. Get covered movement patterns ---
  const coveredPatterns = [
    ...new Set(
      finalExercises
        .map((e) => e.movementPattern)
        .filter((p): p is MovementPattern => !!p),
    ),
  ];

  // --- 10. Build science note ---
  const scienceNote = getScienceNote(phaseInfo.name as PeriodizationPhase, weekInPhase, profile.fitnessLevel);

  // --- 11. Build result ---
  return {
    id: `plan_${Date.now()}`,
    exercises: finalExercises,
    createdAt: Date.now(),
    estimatedDurationMin,
    workoutType: getWorkoutTypeLabel(phaseKey),
    workoutTypeDescription: `${phaseInfo.description}. ${TRAINING_METHODS[method].repRange.min}-${TRAINING_METHODS[method].repRange.max} повторений, отдых ${getScientificRest(method, 'strength', profile.fitnessLevel)} сек.`,
    periodizationPhase: phaseKey,
    blockNumber,
    weekInBlock: weekInPhase,
    totalCycleWeeks: TOTAL_CYCLE_WEEKS,
    coveredPatterns,
    volumePerMuscle,
    phaseRationale: phaseInfo.rationale,
    scienceNote,
  };
}

// --- Helper: Phase rationale for exercise selection ---

function getPhaseRationale(phase: PeriodizationPhase, tier?: ExerciseTier): string {
  if (phase === 'anatomical_adaptation') {
    return 'Bompa: подготовка тканей перед нагрузкой. Широкий спектр упражнений.';
  }
  if (phase === 'realization' && tier === 'bilateral_compound') {
    return 'Signor: многосуставные упражнения для взрывной силы при 40-60% 1RM.';
  }
  if (phase === 'transmutation') {
    return 'Bompa: фокус на prime movers для максимальной силы.';
  }
  return '';
}

// --- Helper: Science note for the user ---

function getScienceNote(phase: PeriodizationPhase, weekInPhase: number, level: FitnessLevel): string {
  const notes: Record<PeriodizationPhase, string[]> = {
    anatomical_adaptation: [
      'Подготовительная фаза: укрепляем связки и суставы перед основными нагрузками.',
      'Высокий объём, низкая интенсивность — обучаемся правильной технике.',
    ],
    accumulation: [
      'Фаза гипертрофии: Schoenfeld рекомендует 10-20 сетов на мышечную группу в неделю.',
      'Множество повторений (8-15) с умеренным весом для максимального роста.',
    ],
    transmutation: [
      'Фаза максимальной силы: Bompa — фундамент для развития мощности.',
      'Высокая интенсивность (80-85% 1RM), длинный отдых (2-3 мин) для полного восстановления.',
      'Zatsiorsky: рекрутмент высокопороговых моторных единиц.',
    ],
    realization: [
      'Фаза мощности: Signor — скорость падения >10% означает остановку сета.',
      'Bompa: конверсия силы в мощность. Меньше упражнений, больше взрывной работы.',
    ],
    deload: [
      'Разгрузка: Zatsiorsky — модель фитнес-усталости. Усталость краткосрочна, адаптация долгосрочна.',
      'Снижение объёма для суперкомпенсации. Не пропускайте эту фазу!',
    ],
  };

  const phaseNotes = notes[phase] ?? [];
  // Cycle through notes based on week in phase
  return phaseNotes[(weekInPhase - 1) % phaseNotes.length] ?? '';
}

// --- Helper: Volume per muscle group ---

function calculateVolumePerMuscle(
  exercises: ExerciseInPlan[],
): Record<string, number> {
  const volume: Record<string, number> = {};
  for (const ex of exercises) {
    for (const mg of ex.primaryMuscleGroups) {
      volume[mg] = (volume[mg] ?? 0) + ex.targetSets;
    }
  }
  return volume;
}

// --- Antagonist Sorting ---

function antagonistSort(exercises: ExerciseInPlan[]): ExerciseInPlan[] {
  if (exercises.length <= 1) return exercises;

  const sorted: ExerciseInPlan[] = [];
  const used = new Set<number>();

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

// --- Metabolic Pod System (Roberts Ch.9 / Graham Ch.7) ---

function interleaveCardio(
  strength: ExerciseInPlan[],
  cardio: ExerciseInPlan[],
  flexibility: ExerciseInPlan[],
): ExerciseInPlan[] {
  if (cardio.length === 0) return [...strength, ...flexibility];

  const result: ExerciseInPlan[] = [];
  const cardioCopy = [...cardio];
  let cardioIdx = 0;

  const midPoint = Math.ceil(strength.length / 2);

  for (let i = 0; i < midPoint && i < strength.length; i++) {
    result.push(strength[i]);
  }

  while (cardioIdx < cardioCopy.length) {
    result.push(cardioCopy[cardioIdx]);
    cardioIdx++;
  }

  for (let i = midPoint; i < strength.length; i++) {
    result.push(strength[i]);
  }

  result.push(...flexibility);

  return result;
}

// --- Time Cap ---

function capToTimeLimit(
  exercises: ExerciseInPlan[],
  maxMinutes: number,
): ExerciseInPlan[] {
  const estimated = estimateDuration(exercises);
  if (estimated <= maxMinutes) return exercises;

  const result = [...exercises];
  while (result.length > 3 && estimateDuration(result) > maxMinutes) {
    const lastIdx = result.length - 1;
    const lastEx = result[lastIdx];
    if (lastEx.category !== 'strength') {
      result.pop();
    } else {
      result.pop();
    }
  }
  return result;
}

// --- Duration Estimation ---

function estimateDuration(exercises: ExerciseInPlan[]): number {
  let totalSeconds = 0;

  for (const ex of exercises) {
    const sets = ex.targetSets;

    if (ex.isTimed && ex.durationSeconds) {
      totalSeconds += sets * ex.durationSeconds;
    } else if (ex.category === 'cardio') {
      totalSeconds += sets * 35;
    } else {
      totalSeconds += sets * ex.targetReps * 3;
    }

    totalSeconds += Math.max(0, sets - 1) * ex.restSeconds;
    totalSeconds += 15;
  }

  return Math.round(totalSeconds / 60);
}

// --- Adaptive Load ---

export type WorkoutFeedback = 'easier' | 'normal' | 'harder' | 'very_hard';

export function getAdaptiveMultiplier(
  feedback: WorkoutFeedback,
  missedDays: number,
  consecutiveHardCount: number,
): number {
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
        ? ex.targetReps
        : Math.max(1, Math.round(ex.targetReps * multiplier)),
    weightKg: ex.weightKg
      ? Math.round(ex.weightKg * multiplier * 10) / 10
      : null,
    completedSets: 0,
    setResults: [],
  }));
}