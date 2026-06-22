// Adaptive workout generation engine
// Implements the adaptive algorithm from the spec

import {
  EXERCISE_CATALOG,
  EQUIPMENT_PRIORITY,
  FULL_BODY_TARGETS,
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
  primaryMuscleGroups: string[];
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

  // Pick variant with highest equipment priority
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

  // 60% of estimated 1RM based on RPE assumption
  const base = userWeight * (variant.adjustments.defaultWeightPercent / 100);
  const modifier = level === 'beginner' ? 0.6 : level === 'intermediate' ? 0.75 : 0.85;
  return Math.round(base * modifier * 10) / 10;
}

function calculateReps(
  variant: ExerciseVariant,
  level: FitnessLevel,
): number {
  const { min, max } = variant.adjustments.repRange;
  // Beginners: lower end, advanced: higher end
  switch (level) {
    case 'beginner': return min;
    case 'intermediate': return Math.round((min + max) / 2);
    case 'advanced': return max;
  }
}

export function generateWorkout(profile: UserProfile): WorkoutPlan {
  const availableSet = new Set(profile.inventory);
  const selectedExercises: ExerciseInPlan[] = [];
  const coveredMuscles = new Set<string>();
  const sets = calculateSets(profile.fitnessLevel);

  // First pass: pick exercises for each target muscle group
  for (const target of FULL_BODY_TARGETS) {
    if (coveredMuscles.has(target)) continue;

    // Find exercises that target this muscle
    const candidates = EXERCISE_CATALOG.filter(
      (ex) => ex.primaryMuscleGroups.includes(target),
    );

    // Try to find one with a matching variant
    for (const candidate of candidates) {
      const variant = resolveBestVariant(candidate, availableSet);
      if (!variant) continue;

      const alreadyAdded = selectedExercises.some(
        (e) => e.exerciseConfigId === candidate.id,
      );
      if (alreadyAdded) continue;

      const reps = calculateReps(variant, profile.fitnessLevel);
      const weight = calculateWeight(variant, profile.weight, profile.fitnessLevel);

      selectedExercises.push({
        exerciseConfigId: candidate.id,
        exerciseName: candidate.name,
        variantId: variant.variantId,
        variantName: variant.variantName,
        requiredEquipment: variant.requiredEquipment,
        alternativeHint: variant.alternativeEquipmentHint,
        targetSets: sets,
        targetReps: reps,
        weightKg: weight,
        primaryMuscleGroups: candidate.primaryMuscleGroups,
        completedSets: 0,
        setResults: [],
      });

      candidate.primaryMuscleGroups.forEach((m) => coveredMuscles.add(m));
      candidate.secondaryMuscleGroups.forEach((m) => coveredMuscles.add(m));
      break;
    }
  }

  // Estimate duration: ~2 min per set + 1 min rest
  const totalSets = selectedExercises.reduce((sum, ex) => sum + ex.targetSets, 0);
  const estimatedDurationMin = Math.round(totalSets * 2.5 + selectedExercises.length * 1.5);

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
  // Deload week
  if (consecutiveHardCount >= 2) return 0.7;

  // Missed >3 days
  if (missedDays > 3) return 0.8;

  // Very hard or missed 1-2 days
  if (feedback === 'very_hard' || missedDays > 0) return 1.0;

  // Harder than expected
  if (feedback === 'harder') return 1.0;

  // Normal — progressive overload 5-10%
  if (feedback === 'normal') return 1.05;

  // Easier — can push more 10%
  return 1.1;
}

export function applyAdaptiveLoad(
  plan: ExerciseInPlan[],
  multiplier: number,
): ExerciseInPlan[] {
  return plan.map((ex) => ({
    ...ex,
    targetReps: Math.max(1, Math.round(ex.targetReps * multiplier)),
    weightKg: ex.weightKg
      ? Math.round(ex.weightKg * multiplier * 10) / 10
      : null,
    completedSets: 0,
    setResults: [],
  }));
}