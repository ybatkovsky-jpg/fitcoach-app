// Adaptive workout generation engine
// Implements the adaptive algorithm from the spec

import {
  EXERCISE_CATALOG,
  EQUIPMENT_PRIORITY,
  FULL_BODY_TARGETS,
  CARDIO_TARGETS,
  type ExerciseConfig,
  type ExerciseVariant,
  type EquipmentType,
} from './exercises';

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
  durationSeconds?: number | null; // for timed exercises (cardio, plank)
  primaryMuscleGroups: string[];
  category: 'strength' | 'cardio' | 'flexibility';
  completedSets: number;
  setResults: { reps: number; rpe?: number }[];
}

export interface WorkoutPlan {
  id: string;
  exercises: ExerciseInPlan[];
  createdAt: number;
  estimatedDurationMin: number;
}

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
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
}

// --- Variant Resolution ---

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

// --- Fitness Level Calculation ---

export function calculateFitnessLevel(profile: Omit<UserProfile, 'fitnessLevel'>): FitnessLevel {
  const avgRPE = (profile.rpeSquat + profile.rpePushUp + profile.rpePlank) / 3;
  const time = profile.comfortableMinutes;

  if (avgRPE <= 3 && time >= 20) return 'intermediate';
  if (avgRPE <= 5 && time >= 30) return 'intermediate';
  if (avgRPE <= 2 && time >= 40) return 'advanced';
  return 'beginner';
}

// --- Workout Generation ---

export function calculateSets(level: FitnessLevel): number {
  switch (level) {
    case 'beginner': return 2;
    case 'intermediate': return 3;
    case 'advanced': return 4;
  }
}

function calculateWeight(
  variant: ExerciseVariant,
  userWeight: number,
  level: FitnessLevel,
): number | null {
  if (variant.adjustments.defaultWeightPercent === 0) return null;

  const base = userWeight * (variant.adjustments.defaultWeightPercent / 100);
  const modifier = level === 'beginner' ? 0.6 : level === 'intermediate' ? 0.75 : 0.85;
  return Math.round(base * modifier * 10) / 10;
}

function calculateReps(
  variant: ExerciseVariant,
  level: FitnessLevel,
): number {
  const { min, max } = variant.adjustments.repRange;
  switch (level) {
    case 'beginner': return min;
    case 'intermediate': return Math.round((min + max) / 2);
    case 'advanced': return max;
  }
}

function buildExerciseInPlan(
  config: ExerciseConfig,
  variant: ExerciseVariant,
  profile: UserProfile,
  sets: number,
): ExerciseInPlan {
  const reps = calculateReps(variant, profile.fitnessLevel);
  const weight = calculateWeight(variant, profile.weight, profile.fitnessLevel);

  return {
    exerciseConfigId: config.id,
    exerciseName: config.name,
    variantId: variant.variantId,
    variantName: variant.variantName,
    requiredEquipment: variant.requiredEquipment,
    alternativeHint: variant.alternativeEquipmentHint,
    targetSets: sets,
    targetReps: reps,
    weightKg: weight,
    durationSeconds: variant.adjustments.durationSeconds ?? null,
    primaryMuscleGroups: config.primaryMuscleGroups,
    category: config.category,
    completedSets: 0,
    setResults: [],
  };
}

export function generateWorkout(profile: UserProfile): WorkoutPlan {
  const availableSet = new Set(profile.inventory);
  const selectedExercises: ExerciseInPlan[] = [];
  const coveredIds = new Set<string>();
  const sets = calculateSets(profile.fitnessLevel);

  const needsCardio = profile.goal === 'lose_weight' || profile.goal === 'maintain';
  const needsFlexibility = profile.goal === 'flexibility' || profile.goal === 'maintain';

  // 1. Strength exercises for each target muscle group
  const strengthCatalog = EXERCISE_CATALOG.filter((e) => e.category === 'strength');
  for (const target of FULL_BODY_TARGETS) {
    const candidates = strengthCatalog.filter(
      (ex) => ex.primaryMuscleGroups.includes(target),
    );

    for (const candidate of candidates) {
      if (coveredIds.has(candidate.id)) continue;
      const variant = resolveBestVariant(candidate, availableSet);
      if (!variant) continue;

      selectedExercises.push(buildExerciseInPlan(candidate, variant, profile, sets));
      coveredIds.add(candidate.id);
      break;
    }
  }

  // 2. Add 1-2 cardio exercises (all goals benefit from cardio for cardiovascular health)
  {
    const cardioCatalog = EXERCISE_CATALOG.filter((e) => e.category === 'cardio');
    const cardioCount = profile.goal === 'lose_weight' ? 2 : 1;
    let added = 0;
    for (const candidate of cardioCatalog) {
      if (added >= cardioCount) break;
      if (coveredIds.has(candidate.id)) continue;
      const variant = resolveBestVariant(candidate, availableSet);
      if (!variant) continue;

      selectedExercises.push(buildExerciseInPlan(candidate, variant, profile, 1));
      coveredIds.add(candidate.id);
      added++;
    }
  }

  // 3. Add flexibility/stretching if goal matches
  if (needsFlexibility) {
    const flexCatalog = EXERCISE_CATALOG.filter((e) => e.category === 'flexibility');
    for (const candidate of flexCatalog) {
      if (coveredIds.has(candidate.id)) continue;
      const variant = resolveBestVariant(candidate, availableSet);
      if (!variant) continue;

      selectedExercises.push(buildExerciseInPlan(candidate, variant, profile, 1));
      coveredIds.add(candidate.id);
      break;
    }
  }

  // Estimate duration
  const totalSets = selectedExercises.reduce((sum, ex) => sum + ex.targetSets, 0);
  const cardioTime = selectedExercises
    .filter((ex) => ex.category === 'cardio' && ex.durationSeconds)
    .reduce((sum, ex) => sum + (ex.durationSeconds ?? 0), 0);
  const estimatedDurationMin = Math.round(
    (totalSets * 2.5 + selectedExercises.length * 1.5 + cardioTime / 60) / 1,
  );

  return {
    id: `plan_${Date.now()}`,
    exercises: selectedExercises,
    createdAt: Date.now(),
    estimatedDurationMin,
  };
}

// --- Adaptive Load Adjustment ---

export type WorkoutFeedback = 'easier' | 'normal' | 'harder' | 'very_hard';

export function getAdaptiveMultiplier(
  feedback: WorkoutFeedback,
  missedDays: number,
  consecutiveHardCount: number,
): number {
  if (consecutiveHardCount >= 2) return 0.7;
  if (missedDays > 3) return 0.8;
  if (feedback === 'very_hard' || missedDays > 0) return 1.0;
  if (feedback === 'harder') return 1.0;
  if (feedback === 'normal') return 1.05;
  return 1.1;
}

export function applyAdaptiveLoad(
  plan: ExerciseInPlan[],
  multiplier: number,
): ExerciseInPlan[] {
  return plan.map((ex) => ({
    ...ex,
    targetReps: ex.category === 'cardio'
      ? ex.targetReps // don't scale cardio reps by multiplier
      : Math.max(1, Math.round(ex.targetReps * multiplier)),
    weightKg: ex.weightKg
      ? Math.round(ex.weightKg * multiplier * 10) / 10
      : null,
    completedSets: 0,
    setResults: [],
  }));
}