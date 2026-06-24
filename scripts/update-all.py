# -*- coding: utf-8 -*-
"""Apply ALL changes for weighted equipment + dashboard fix."""

BASE = '/home/z/my-project/src'

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  OK: {path}')

# ============================================================
# 1. exercises.ts
# ============================================================
print('1. exercises.ts ...')
ex_path = f'{BASE}/lib/exercises.ts'
ex = read(ex_path)

old_fitness = "export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';"
new_fitness = '''// Equipment types that have discrete weights
export type WeightedEquipmentType = 'dumbbell' | 'kettlebell' | 'barbell';

export interface WeightItem {
  weightKg: number;
  count: number;
}

export interface WeightedEquipment {
  dumbbell: WeightItem[];
  kettlebell: WeightItem[];
  barbell: WeightItem[];
}

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';'''

if old_fitness in ex:
    ex = ex.replace(old_fitness, new_fitness)
    write(ex_path, ex)
else:
    print('  SKIP: already updated')

# ============================================================
# 2. workout-engine.ts
# ============================================================
print('2. workout-engine.ts ...')
we_path = f'{BASE}/lib/workout-engine.ts'
we = read(we_path)

# 2a
old_import = "import type { FitnessLevel } from './exercises';"
new_import = "import type { FitnessLevel, WeightedEquipment, WeightedEquipmentType, WeightItem } from './exercises';"
if old_import in we:
    we = we.replace(old_import, new_import)

# 2b
old_inv = '  inventory: EquipmentType[];\n  rpeSquat: number;'
new_inv = '  inventory: EquipmentType[];\n  weightedEquipment: WeightedEquipment;\n  rpeSquat: number;'
if old_inv in we:
    we = we.replace(old_inv, new_inv)

# 2c
old_phase = '  phaseRationale?: string;        // Why this exercise was selected for this phase\n}'
new_phase = '  phaseRationale?: string;\n  recommendedWeightLabel?: string;\n}'
if old_phase in we:
    we = we.replace(old_phase, new_phase)

# 2d
old_calc = '''function calculateWeight(
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

new_calc = '''function getAvailableWeights(
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
  return [...new Set(items.map(i => i.weightKg))].sort((a, b) => a - b);
}

function getIntensityModifier(level: FitnessLevel): number {
  switch (level) {
    case 'beginner': return 0.55;
    case 'intermediate': return 0.70;
    case 'advanced': return 0.80;
  }
}

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
    const targetWeight = userWeight * (variant.adjustments.defaultWeightPercent / 100);
    const modifier = getIntensityModifier(level);
    const desiredWeight = targetWeight * modifier;

    let bestWeight = available[0];
    let bestDiff = Math.abs(available[0] - desiredWeight);
    for (const w of available) {
      const diff = Math.abs(w - desiredWeight);
      if (diff < bestDiff) { bestDiff = diff; bestWeight = w; }
    }

    const eqLabels: Record<string, string> = {
      dumbbell: '\u0413\u0430\u043d\u0442\u0435\u043b\u044c',
      kettlebell: '\u0413\u0438\u0440\u044f',
      barbell: '\u0428\u0442\u0430\u043d\u0433\u0430',
    };
    const eqLabel = eqLabels[equipmentType] ?? equipmentType;
    const isBilateralDb = variant.variantId.includes('squat') || variant.variantId.includes('lunge');

    let label: string;
    if (equipmentType === 'dumbbell' && isBilateralDb) {
      const wItem = weightedEquipment.dumbbell.find(d => d.weightKg === bestWeight);
      const cnt = wItem ? wItem.count : 1;
      label = cnt >= 2 ? `2 \u00d7 ${eqLabel} ${bestWeight} \u043a\u0433` : `${eqLabel} ${bestWeight} \u043a\u0433`;
    } else {
      label = `${eqLabel} ${bestWeight} \u043a\u0433`;
    }
    return { weightKg: bestWeight, label };
  }

  const base = userWeight * (variant.adjustments.defaultWeightPercent / 100);
  const modifier = level === 'beginner' ? 0.6 : level === 'intermediate' ? 0.75 : 0.85;
  return { weightKg: Math.round(base * modifier * 10) / 10 };
}'''

if old_calc in we:
    we = we.replace(old_calc, new_calc)

# 2e
old_w = '  // Weight\n  const weight = calculateWeight(variant, profile.weight, level);'
new_w = '  // Weight (smart: uses actual inventory)\n  const { weightKg, label: weightLabel } = calculateWeight(\n    variant, profile.weight, level, profile.weightedEquipment,\n  );'
if old_w in we:
    we = we.replace(old_w, new_w)

# 2f
old_ret = '    weightKg: weight,\n    durationSeconds: dur,'
new_ret = '    weightKg: weightKg,\n    recommendedWeightLabel: weightLabel,\n    durationSeconds: dur,'
if old_ret in we:
    we = we.replace(old_ret, new_ret)

write(we_path, we)

# ============================================================
# 3. store.ts
# ============================================================
print('3. store.ts ...')
st_path = f'{BASE}/lib/store.ts'
st = read(st_path)

st = st.replace(
    "import type { EquipmentType, FitnessLevel, ExerciseConfig } from './exercises';",
    "import type { EquipmentType, FitnessLevel, ExerciseConfig, WeightedEquipment } from './exercises';"
)

st = st.replace(
    '    inventory: [] as EquipmentType[],\n    rpeSquat: 5,',
    '    inventory: [] as EquipmentType[],\n    weightedEquipment: { dumbbell: [], kettlebell: [], barbell: [] } as WeightedEquipment,\n    rpeSquat: 5,'
)

old_co = '''      completeOnboarding: () => {
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
new_co = '''      completeOnboarding: () => {
        const state = get();
        if (!state.profile) return;
        const level = calculateFitnessLevel(state.profile, state.history.length);
        const updatedProfile = { ...state.profile, fitnessLevel: level };
        set({ isOnboarded: true, profile: updatedProfile, screen: 'dashboard' });
        try {
          const recentIds = getRecentExerciseIds(state.history);
          const plan = generateWorkout(updatedProfile, state.customExercises, state.periodizationWeek, recentIds);
          if (plan && plan.exercises.length > 0) {
            set({ currentPlan: plan });
          }
        } catch (err) {
          console.error('generateWorkout failed:', err);
        }
      },'''

if old_co in st:
    st = st.replace(old_co, new_co)

write(st_path, st)

# ============================================================
# 4. dashboard-screen.tsx
# ============================================================
print('4. dashboard-screen.tsx ...')
db_path = f'{BASE}/components/screens/dashboard-screen.tsx'
db = read(db_path)

db = db.replace(
    '  ChevronRight, Zap, Calendar, BookOpen, Trophy, Star,\n}',
    '  ChevronRight, Zap, Calendar, BookOpen, Trophy, Star, Sparkles,\n}'
)

db = db.replace(
    '  if (!profile || !currentPlan) return null;',
    '''  if (!profile) return null;

  if (!currentPlan || currentPlan.exercises.length === 0) {
    return (
      <div className="flex flex-col gap-5 px-5 pt-6 pb-24 overflow-y-auto h-full min-h-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">\u041f\u0440\u0438\u0432\u0435\u0442!</h1>
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
            <h2 className="text-lg font-bold">\u041d\u0435\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0433\u043e \u043f\u043b\u0430\u043d\u0430</h2>
            <p className="text-sm text-muted-foreground">\u0421\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u0443\u0439\u0442\u0435 \u043f\u0435\u0440\u0432\u0443\u044e \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0443.</p>
            <Button
              className="w-full h-12 text-base font-semibold gap-2"
              onClick={() => { generateNewPlan(); }}
            >
              <Sparkles className="w-4 h-4" />
              \u0421\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u043b\u0430\u043d
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }'''
)

write(db_path, db)

print('\nDone!')