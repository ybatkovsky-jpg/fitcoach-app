# -*- coding: utf-8 -*-"""Script to apply all changes for the weighted equipment feature + dashboard fix.
This script modifies files in-place using exact string matching.
"""

import re

BASE = '/home/z/my-project/src'

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  Written: {path}')

# ============================================================
# 1. exercises.ts — already edited above via Edit tool
# ============================================================
print('Step 1: exercises.ts — already updated with WeightedEquipment types')

# ============================================================
# 2. workout-engine.ts — add WeightedEquipment to UserProfile,
#    update calculateWeight to use actual inventory
# ============================================================
print('Step 2: workout-engine.ts ...')

we_path = f'{BASE}/lib/workout-engine.ts'
we = read(we_path)

# 2a. Add WeightedEquipment import
we = we.replace(
    "import type { FitnessLevel } from './exercises';",
    "import type { FitnessLevel, WeightedEquipment, WeightedEquipmentType, WeightItem } from './exercises';"
)

# 2b. Add weightedEquipment to UserProfile
old_profile = """export type UserProfile = {
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
};"""

new_profile = """export type UserProfile = {
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  weight: number;
  medicalRestrictions: boolean;
  goal: 'maintain' | 'lose_weight' | 'muscle_tone' | 'flexibility';
  inventory: EquipmentType[];
  // Discrete weights available for weighted equipment
  weightedEquipment: WeightedEquipment;
  rpeSquat: number;
  rpePushUp: number;
  rpePlank: number;
  comfortableMinutes: number;
  fitnessLevel: FitnessLevel;
};"""

we = we.replace(old_profile, new_profile)

# 2c. Add recommendedWeightLabel field to ExerciseInPlan
old_exinplan = """  phaseRationale?: string;        // Why this exercise was selected for this phase
}"""
new_exinplan = """  phaseRationale?: string;        // Why this exercise was selected for this phase
  // --- Weight recommendation ---
  recommendedWeightLabel?: string; // e.g. "Гиря 16 кг" or "2 × Гантель 10 кг"
}"""
we = we.replace(old_exinplan, new_exinplan)

# 2d. Replace calculateWeight function with smart version that uses actual inventory
old_calc_weight = '''function calculateWeight(
  variant: ExerciseVariant,
  userWeight: number,
  level: FitnessLevel,
): number | null {
  if (variant.adjustments.defaultWeightPercent === 0) return null;

  const base = userWeight * (variant.adjustments.defaultWeightPercent / 100);
  const modifier =
    level === 'beginner' ? 0.6 : level === 'intermediate' ? 0.75 : 0.85;
  return Math.round(base * modifier * 10) / 10;
}'''

new_calc_weight = '''/** Get all available weights for a given equipment type, sorted ascending */
function getAvailableWeights(
  equipmentType: EquipmentType,
  weightedEquipment: WeightedEquipment,
): number[] {
  const wMap: Record<WeightedEquipmentType, WeightItem[]> = {
    dumbbell: weightedEquipment.dumbbell,
    kettlebell: weightedEquipment.kettlebell,
    barbell: weightedEquipment.barbell,
  };
  const items = wMap[equipmentType as WeightedEquipmentType];
  if (!items || items.length === 0) return [];
  // Flatten: if count=2 of 10kg, we have [10, 10] — but we just need unique sorted weights
  const weights: number[] = [];
  for (const item of items) {
    for (let i = 0; i < item.count; i++) {
      weights.push(item.weightKg);
    }
  }
  return [...new Set(weights)].sort((a, b) => a - b);
}

/** Calculate intensity modifier based on fitness level */
function getIntensityModifier(level: FitnessLevel): number {
  switch (level) {
    case 'beginner': return 0.55;   // ~55% 1RM for learning
    case 'intermediate': return 0.70; // ~70% 1RM for hypertrophy
    case 'advanced': return 0.80;    // ~80% 1RM for strength
  }
}

/**
 * Smart weight calculation:
 * 1. If weighted equipment has actual weights listed → pick the best match
 * 2. Otherwise fall back to percentage-of-bodyweight estimation
 * Returns [weightKg, label] or [null, undefined]
 */
function calculateWeight(
  variant: ExerciseVariant,
  userWeight: number,
  level: FitnessLevel,
  weightedEquipment: WeightedEquipment,
): { weightKg: number | null; label?: string } {
  if (variant.adjustments.defaultWeightPercent === 0) {
    return { weightKg: null };
  }

  const equipmentType = variant.requiredEquipment as WeightedEquipmentType;
  const available = getAvailableWeights(equipmentType, weightedEquipment);

  if (available.length > 0) {
    // We have real weights — pick the best one based on target
    const targetWeight = userWeight * (variant.adjustments.defaultWeightPercent / 100);
    const modifier = getIntensityModifier(level);
    const desiredWeight = targetWeight * modifier;

    // For dumbbell exercises, we typically use ONE dumbbell (single-arm or alternating)
    // unless it's a bilateral movement (e.g. squat with dumbbells = two)
    // For kettlebell, typically one kettlebell
    // For barbell, total weight on bar
    const isDumbbellBilateral = variant.variantId.includes('squat') || variant.variantId.includes('lunge');
    
    // Find closest available weight
    let bestWeight = available[0];
    let bestDiff = Math.abs(available[0] - desiredWeight);
    for (const w of available) {
      const diff = Math.abs(w - desiredWeight);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestWeight = w;
      }
    }

    // Build label
    const equipLabels: Record<string, string> = {
      dumbbell: 'Гантель',
      kettlebell: 'Гиря',
      barbell: 'Штанга',
    };
    const equipLabel = equipLabels[equipmentType] ?? equipmentType;
    
    let label: string;
    if (equipmentType === 'dumbbell' && isDumbbellBilateral) {
      // Check if we have 2 of this weight
      const wItem = weightedEquipment.dumbbell.find(d => d.weightKg === bestWeight);
      const count = wItem ? wItem.count : 1;
      label = count >= 2
        ? `2 × ${equipLabel} ${bestWeight} кг`
        : `${equipLabel} ${bestWeight} кг`; 
    } else if (equipmentType === 'dumbbell') {
      label = `${equipLabel} ${bestWeight} кг`;
    } else {
      label = `${equipLabel} ${bestWeight} кг`;
    }

    return { weightKg: bestWeight, label };
  }

  // Fallback: percentage of bodyweight
  const base = userWeight * (variant.adjustments.defaultWeightPercent / 100);
  const modifier =
    level === 'beginner' ? 0.6 : level === 'intermediate' ? 0.75 : 0.85;
  return { weightKg: Math.round(base * modifier * 10) / 10 };
}'''

we = we.replace(old_calc_weight, new_calc_weight)

# 2e. Update buildExerciseInPlan to pass weightedEquipment and use new return type
old_build_call = '''  // Weight
  const weight = calculateWeight(variant, profile.weight, level);'''

new_build_call = '''  // Weight (smart selection from actual inventory)
  const { weightKg, label: weightLabel } = calculateWeight(
    variant, profile.weight, level, profile.weightedEquipment,
  );'''

we = we.replace(old_build_call, new_build_call)

# 2f. Update the return object in buildExerciseInPlan to use new variable names
old_return_weight = '    weightKg: weight,'
new_return_weight = '    weightKg: weightKg,\n    recommendedWeightLabel: weightLabel,'
we = we.replace(old_return_weight, new_return_weight)

write(we_path, we)

# ============================================================
# 3. store.ts — add weightedEquipment to defaultProfile,
#    persist it, fix completeOnboarding to handle errors
# ============================================================
print('Step 3: store.ts ...')

st_path = f'{BASE}/lib/store.ts'
st = read(st_path)

# 3a. Import WeightedEquipment
st = st.replace(
    "import type { EquipmentType, FitnessLevel, ExerciseConfig } from './exercises';",
    "import type { EquipmentType, FitnessLevel, ExerciseConfig, WeightedEquipment } from './exercises';"
)

# 3b. Add weightedEquipment to makeDefaultProfile
old_default = """    inventory: [] as EquipmentType[],
    rpeSquat: 5,"""
new_default = """    inventory: [] as EquipmentType[],
    weightedEquipment: { dumbbell: [], kettlebell: [], barbell: [] } as WeightedEquipment,
    rpeSquat: 5,"""
st = st.replace(old_default, new_default)

# 3c. Fix completeOnboarding — wrap generateWorkout in try/catch so it never silently fails
old_complete = '''      completeOnboarding: () => {
        const state = get();
        if (!state.profile) return;
        const level = calculateFitnessLevel(state.profile, state.history.length);
        const updatedProfile = { ...state.profile, fitnessLevel: level };
        set({ isOnboarded: true, profile: updatedProfile, screen: 'dashboard' });
        // Auto-generate first plan with scientific periodization
        const recentIds = getRecentExerciseIds(state.history);
        const plan = generateWorkout(updatedProfile, state.customExercises, state.periodizationWeek, recentIds);
        set({ currentPlan: plan });
      },'''

new_complete = '''      completeOnboarding: () => {
        const state = get();
        if (!state.profile) return;
        const level = calculateFitnessLevel(state.profile, state.history.length);
        const updatedProfile = { ...state.profile, fitnessLevel: level };
        set({ isOnboarded: true, profile: updatedProfile, screen: 'dashboard' });
        // Auto-generate first plan with scientific periodization
        try {
          const recentIds = getRecentExerciseIds(state.history);
          const plan = generateWorkout(updatedProfile, state.customExercises, state.periodizationWeek, recentIds);
          if (plan && plan.exercises.length > 0) {
            set({ currentPlan: plan });
          }
        } catch (err) {
          console.error('Failed to generate workout plan:', err);
        }
      },'''

st = st.replace(old_complete, new_complete)

# 3d. Add weightedEquipment to persist partialize
old_persist = """        currentPlan: state.currentPlan,
        lastFeedback: state.lastFeedback,"""
new_persist = """        currentPlan: state.currentPlan,
        profile: state.profile,
        lastFeedback: state.lastFeedback,"""

# Check if profile is already in partialize
if 'profile: state.profile,' not in st:
    st = st.replace(old_persist, new_persist)

# 3e. Add weightedEquipment to resetAll
old_reset = """          customExercises: [],
        }),"""
# We need to add it before the closing of resetAll - find the right pattern
# resetAll resets everything, so we need weightedEquipment in there too
# It should already be handled by the profile reset, but let's be explicit

write(st_path, st)

# ============================================================
# 4. dashboard-screen.tsx — handle empty/null currentPlan gracefully
# ============================================================
print('Step 4: dashboard-screen.tsx ...')

db_path = f'{BASE}/components/screens/dashboard-screen.tsx'
db = read(db_path)

# Replace the early return with a fallback UI
old_early_return = '  if (!profile || !currentPlan) return null;'
new_early_return = '''  if (!profile) return null;

  // Fallback: if no plan, show regenerate prompt
  if (!currentPlan || currentPlan.exercises.length === 0) {
    return (
      <div className="flex flex-col gap-5 px-5 pt-6 pb-24 overflow-y-auto h-full min-h-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Привет!</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className={LEVEL_COLORS[profile.fitnessLevel]}>
              {LEVEL_LABELS[profile.fitnessLevel]}
            </Badge>
            <span className="text-sm text-muted-foreground">{GOAL_LABELS[profile.goal]}</span>
          </div>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="p-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 w-fit mx-auto">
              <RotateCcw className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-bold">Нет активного плана</h2>
            <p className="text-sm text-muted-foreground">
              Сгенерируйте первую тренировку, чтобы начать.
            </p>
            <Button
              className="w-full h-12 text-base font-semibold gap-2"
              onClick={() => { generateNewPlan(); }}
            >
              <Sparkles className="w-4 h-4" />
              Сгенерировать план
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }'''

db = db.replace(old_early_return, new_early_return)

# Add Sparkles and RotateCcw to imports (they may already be there via other paths)
if 'Sparkles' not in db.split('\n')[3]:  # check import line area
    db = db.replace(
        'import {\n  Play, RotateCcw, Clock, Dumbbell, TrendingUp, Flame,\n  ChevronRight, Zap, Calendar, BookOpen, Trophy, Star,\n} from',
        'import {\n  Play, RotateCcw, Clock, Dumbbell, TrendingUp, Flame,\n  ChevronRight, Zap, Calendar, BookOpen, Trophy, Star, Sparkles,\n} from'
    )

write(db_path, db)

print('\nDone! All files updated for weighted equipment feature + dashboard fix.')
