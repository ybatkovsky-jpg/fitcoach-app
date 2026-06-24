// Exercise catalog matching the JSON schema from the spec
// All data is self-contained — no API calls needed

export type EquipmentType =
  | 'none'
  | 'dumbbell'
  | 'kettlebell'
  | 'barbell'
  | 'bench'
  | 'resistance_band'
  | 'pullup_bar'
  | 'mat'
  | 'rowing_machine'
  | 'treadmill'
  | 'exercise_bike'
  | 'jump_rope';

export interface RepRange {
  min: number;
  max: number;
}

export interface VariantAdjustments {
  defaultWeightPercent: number;
  discreteWeights?: number[]; // fixed weights in kg (e.g. kettlebells: [16, 24, 32])
  repRange: RepRange;
  durationSeconds?: number; // for timed exercises (plank, cardio)
}

export interface ExerciseVariant {
  variantId: string;
  variantName: string;
  requiredEquipment: EquipmentType;
  alternativeEquipmentHint?: string;
  adjustments: VariantAdjustments;
}

export type ExerciseTier = 'bilateral_compound' | 'unilateral_compound' | 'isolation' | 'plyometric';

export type MovementPattern =
  | 'squat_hinge'
  | 'lunge_single_leg'
  | 'push'
  | 'pull'
  | 'core'
  | 'cardio_metabolic'
  | 'flexibility';

export interface ExerciseConfig {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'flexibility';
  isTimed?: boolean; // isometric/cardio exercises measured in seconds
  variants: ExerciseVariant[];
  icon: string;
  instructions: string[];
  // Roberts Ch.9 / Bompa Ch.4: movement classification
  movementPattern?: MovementPattern;
  // Brown Ch.1-2 / Bompa Ch.4: exercise selection hierarchy
  tier?: ExerciseTier;
}

// Priority map for equipment selection
export const EQUIPMENT_PRIORITY: Record<EquipmentType, number> = {
  none: 0,
  jump_rope: 0,
  resistance_band: 1,
  mat: 1,
  dumbbell: 2,
  kettlebell: 2,
  pullup_bar: 2,
  rowing_machine: 2,
  treadmill: 2,
  exercise_bike: 2,
  bench: 3,
  barbell: 3,
};

// Equipment types that have discrete weights (user specifies exact weights available)export type WeightedEquipmentType = 'dumbbell' | 'kettlebell' | 'barbell';// A single weight item the user ownsexport interface WeightItem {  weightKg: number;  count: number; // how many of this weight (e.g. 2 dumbbells of 10kg)}// Per-equipment-type weight inventoryexport interface WeightedEquipment {  dumbbell: WeightItem[];  kettlebell: WeightItem[];  barbell: WeightItem[]; // barbell: usually 1 bar + plates, but we store the total weight}export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  none: 'Без инвентаря',
  dumbbell: 'Гантели',
  kettlebell: 'Гири',
  barbell: 'Штанга',
  bench: 'Скамья',
  resistance_band: 'Резиновые петли',
  pullup_bar: 'Турник',
  mat: 'Коврик',
  rowing_machine: 'Гребной тренажёр',
  treadmill: 'Беговая дорожка',
  exercise_bike: 'Велотренажёр',
  jump_rope: 'Скакалка',
};

export const INVENTORY_OPTIONS: { type: EquipmentType; label: string; icon: string }[] = [
  { type: 'mat', label: 'Коврик', icon: 'Square' },
  { type: 'dumbbell', label: 'Гантели', icon: 'Dumbbell' },
  { type: 'kettlebell', label: 'Гири', icon: 'CircleDot' },
  { type: 'barbell', label: 'Штанга', icon: 'Minus' },
  { type: 'pullup_bar', label: 'Турник', icon: 'GripHorizontal' },
  { type: 'resistance_band', label: 'Петли', icon: 'Link' },
  { type: 'bench', label: 'Скамья', icon: 'Armchair' },
  { type: 'rowing_machine', label: 'Гребной тренажёр', icon: 'Waves' },
  { type: 'treadmill', label: 'Беговая дорожка', icon: 'Activity' },
  { type: 'exercise_bike', label: 'Велотренажёр', icon: 'Bike' },
  { type: 'jump_rope', label: 'Скакалка', icon: 'RotateCw' },
];

// --- Weight Resolution: pick best available weight from user inventory ---

export function resolveWeightFromInventory(
  equipmentType: WeightedEquipmentType,
  targetWeightKg: number,
  weightedEquipment: WeightedEquipment | undefined,
  level: FitnessLevel,
): { weightKg: number; label: string } | null {
  const items = weightedEquipment?.[equipmentType];
  if (!items || items.length === 0) return null;
  const sorted = [...items].sort((a, b) => a.weightKg - b.weightKg);
  let best = null;
  for (const item of sorted) {
    if (item.weightKg <= targetWeightKg) { best = item; } else { break; }
  }
  if (!best) {
    if (level === 'beginner') return null;
    best = sorted[0];
  }
  const countLabel = equipmentType === 'barbell' ? '' : best.count >= 2 ? `${best.count}×` : '';
  const label = `${EQUIPMENT_LABELS[equipmentType]} ${countLabel}${best.weightKg} кг`;
  return { weightKg: best.weightKg, label };
}

// Full exercise catalog
export const EXERCISE_CATALOG: ExerciseConfig[] = [
  // ===== STRENGTH EXERCISES =====
  {
    id: 'squat',
    name: 'Приседания',
    movementPattern: 'squat_hinge',
    tier: 'bilateral_compound',
    primaryMuscleGroups: ['quads', 'glutes'],
    secondaryMuscleGroups: ['hamstrings', 'core'],
    difficultyLevel: 'beginner',
    category: 'strength',
    icon: 'ArrowDownToLine',
    instructions: [
      'Стопы на ширине плеч, носки слегка развернуты наружу',
      'Спина прямая, грудь раскрыта, взгляд вперёд',
      'Опускайтесь вниз, отводя таз назад, как бы садясь на стул',
      'Колени следуют за носками, не заворачивайтесь внутрь',
      'Опуститесь до параллели бёдер с полом или чуть ниже',
      'Поднимайтесь, напрягая ягодицы и квадрицепсы',
    ],
    variants: [
      {
        variantId: 'squat_bodyweight',
        variantName: 'Приседания с собственным весом',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 12, max: 20 } },
      },
      {
        variantId: 'squat_kettlebell',
        variantName: 'Кубковые приседания с гирей',
        requiredEquipment: 'kettlebell',
        alternativeEquipmentHint: 'Гирю можно заменить гантелью, удерживая вертикально',
        adjustments: { defaultWeightPercent: 35, repRange: { min: 8, max: 12 } },
      },
      {
        variantId: 'squat_dumbbell',
        variantName: 'Приседания с гантелями на плечах',
        requiredEquipment: 'dumbbell',
        adjustments: { defaultWeightPercent: 35, repRange: { min: 8, max: 12 } },
      },
      {
        variantId: 'squat_barbell',
        variantName: 'Приседания со штангой на спине',
        requiredEquipment: 'barbell',
        adjustments: { defaultWeightPercent: 50, repRange: { min: 6, max: 10 } },
      },
      {
        variantId: 'squat_band',
        variantName: 'Приседания с петлёй под стопами',
        requiredEquipment: 'resistance_band',
        adjustments: { defaultWeightPercent: 10, repRange: { min: 10, max: 15 } },
      },
    ],
  },
  {
    id: 'push_up',
    name: 'Отжимания',
    movementPattern: 'push',
    tier: 'bilateral_compound',
    primaryMuscleGroups: ['chest', 'triceps'],
    secondaryMuscleGroups: ['shoulders', 'core'],
    difficultyLevel: 'beginner',
    category: 'strength',
    icon: 'ArrowDown',
    instructions: [
      'Руки на ширине плеч, ладони под плечами',
      'Тело образует прямую линию от головы до пяток',
      'Опустите грудь к полу, сгибая локти под углом ~45°',
      'Не разводите локти в стороны (не более 90° от тела)',
      'Push up: вытолкните себя вверх, полностью выпрямив руки',
      'Держите корпус напряжённым на протяжении всего движения',
    ],
    variants: [
      {
        variantId: 'push_up_knee',
        variantName: 'Отжимания с колен',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 8, max: 15 } },
      },
      {
        variantId: 'push_up_classic',
        variantName: 'Классические отжимания',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 6, max: 12 } },
      },
      {
        variantId: 'push_up_band',
        variantName: 'Отжимания с резиновой петлёй',
        requiredEquipment: 'resistance_band',
        adjustments: { defaultWeightPercent: 10, repRange: { min: 6, max: 10 } },
      },
    ],
  },
  {
    id: 'row',
    name: 'Тяга к поясу',
    movementPattern: 'pull',
    tier: 'bilateral_compound',
    primaryMuscleGroups: ['back', 'biceps'],
    secondaryMuscleGroups: ['forearms'],
    difficultyLevel: 'beginner',
    category: 'strength',
    icon: 'ArrowUpFromLine',
    instructions: [
      'Наклоните корпус вперёд на ~45°, спина прямая',
      'Руки опущены вниз, удерживайте снаряд нейтральным хватом',
      'Тяните снаряд к нижней части груди / пупку',
      'Сводите лопатки вместе в верхней точке',
      'Медленно опустите вниз, контролируя движение',
      'Не.round спину — держите нейтральное положение позвоночника',
    ],
    variants: [
      {
        variantId: 'row_table',
        variantName: 'Австралийские подтягивания (стол)',
        requiredEquipment: 'none',
        alternativeEquipmentHint: 'Используйте прочный стол или две ручки на высоте пояса',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 8, max: 15 } },
      },
      {
        variantId: 'row_dumbbell',
        variantName: 'Тяга гантели в наклоне',
        requiredEquipment: 'dumbbell',
        adjustments: { defaultWeightPercent: 25, repRange: { min: 10, max: 14 } },
      },
      {
        variantId: 'row_kettlebell',
        variantName: 'Тяга гири одной рукой',
        requiredEquipment: 'kettlebell',
        adjustments: { defaultWeightPercent: 25, repRange: { min: 10, max: 14 } },
      },
      {
        variantId: 'row_band',
        variantName: 'Тяга резиновой петли стоя',
        requiredEquipment: 'resistance_band',
        adjustments: { defaultWeightPercent: 10, repRange: { min: 10, max: 15 } },
      },
    ],
  },
  {
    id: 'plank',
    name: 'Планка',
    movementPattern: 'core',
    tier: 'isolation',
    primaryMuscleGroups: ['core'],
    secondaryMuscleGroups: ['shoulders', 'glutes'],
    difficultyLevel: 'beginner',
    category: 'strength',
    isTimed: true,
    icon: 'Minus',
    instructions: [
      'Встаньте на предплечья и носки стоп',
      'Локти строго под плечами',
      'Тело — одна прямая линия от головы до пяток',
      'Напрягите пресс и ягодицы, не прогибайтесь',
      'Дышите ровно, не задерживайте дыхание',
      'Удерживайте позицию заданное время',
    ],
    variants: [
      {
        variantId: 'plank_knee',
        variantName: 'Планка с колен',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 20, max: 30 }, durationSeconds: 20 },
      },
      {
        variantId: 'plank_classic',
        variantName: 'Классическая планка',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 30, max: 60 }, durationSeconds: 30 },
      },
      {
        variantId: 'plank_band',
        variantName: 'Планка с петлёй (anti-extension)',
        requiredEquipment: 'resistance_band',
        adjustments: { defaultWeightPercent: 10, repRange: { min: 20, max: 40 }, durationSeconds: 20 },
      },
    ],
  },
  {
    id: 'lunge',
    name: 'Выпады',
    movementPattern: 'lunge_single_leg',
    tier: 'unilateral_compound',
    primaryMuscleGroups: ['quads', 'glutes'],
    secondaryMuscleGroups: ['hamstrings', 'core'],
    difficultyLevel: 'beginner',
    category: 'strength',
    icon: 'Footprints',
    instructions: [
      'Встаньте прямо, стопы на ширине бёдер',
      'Шагните вперёд одной ногой, опуская таз вниз',
      'Оба колена должны образовывать угол ~90°',
      'Переднее колено не выходит за носок',
      'Заднее колено опускается к полу (но не касается)',
      'Вернитесь в исходное положение, оттолкнувшись пяткой',
    ],
    variants: [
      {
        variantId: 'lunge_bodyweight',
        variantName: 'Выпады на месте',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 10, max: 16 } },
      },
      {
        variantId: 'lunge_dumbbell',
        variantName: 'Выпады с гантелями',
        requiredEquipment: 'dumbbell',
        adjustments: { defaultWeightPercent: 25, repRange: { min: 8, max: 12 } },
      },
      {
        variantId: 'lunge_kettlebell',
        variantName: 'Выпады с гирей (gorilla hold)',
        requiredEquipment: 'kettlebell',
        adjustments: { defaultWeightPercent: 30, repRange: { min: 8, max: 12 } },
      },
    ],
  },
  {
    id: 'shoulder_press',
    name: 'Жим над головой',
    movementPattern: 'push',
    tier: 'bilateral_compound',
    primaryMuscleGroups: ['shoulders', 'triceps'],
    secondaryMuscleGroups: ['core'],
    difficultyLevel: 'beginner',
    category: 'strength',
    icon: 'ArrowUp',
    instructions: [
      'Стойте прямо, снаряд на уровне плеч',
      'Ладони смотрят вперёд (или слегка внутрь)',
      'Жим вверх: вытолкните снаряд над головой',
      'Полностью выпрямите руки в верхней точке',
      'Голова слегка проходит между руками',
      'Контролируемо опустите в исходное положение',
    ],
    variants: [
      {
        variantId: 'shoulder_press_bodyweight',
        variantName: 'Пайк-отжимания (стена)',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 6, max: 12 } },
      },
      {
        variantId: 'shoulder_press_dumbbell',
        variantName: 'Жим гантелей стоя',
        requiredEquipment: 'dumbbell',
        adjustments: { defaultWeightPercent: 25, repRange: { min: 8, max: 12 } },
      },
      {
        variantId: 'shoulder_press_kettlebell',
        variantName: 'Жим гири одной рукой',
        requiredEquipment: 'kettlebell',
        adjustments: { defaultWeightPercent: 30, repRange: { min: 6, max: 10 } },
      },
      {
        variantId: 'shoulder_press_band',
        variantName: 'Жим с петлёй над головой',
        requiredEquipment: 'resistance_band',
        adjustments: { defaultWeightPercent: 10, repRange: { min: 10, max: 15 } },
      },
    ],
  },
  {
    id: 'deadlift',
    name: 'Становая тяга',
    movementPattern: 'squat_hinge',
    tier: 'bilateral_compound',
    primaryMuscleGroups: ['hamstrings', 'glutes', 'back'],
    secondaryMuscleGroups: ['core', 'forearms'],
    difficultyLevel: 'intermediate',
    category: 'strength',
    icon: 'ArrowUpFromLine',
    instructions: [
      'Снаряд на полу перед вами, стопы на ширине бёдер',
      'Наклонитесь вперёд с прямой спиной, согнув колени слегка',
      'Возьмитесь за снаряд сверху (или mixed grip)',
      'Поднимите, выпрямляя ноги и одновременно корпус',
      'Встаньте прямо, грудь вперёд, плечи отведены назад',
      'Опускайте, отводя таз назад — сначала сгибаются бёдра',
    ],
    variants: [
      {
        variantId: 'deadlift_bodyweight',
        variantName: 'Румынская тяга на одной ноге',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 8, max: 12 } },
      },
      {
        variantId: 'deadlift_dumbbell',
        variantName: 'Румынская тяга с гантелями',
        requiredEquipment: 'dumbbell',
        adjustments: { defaultWeightPercent: 40, repRange: { min: 8, max: 12 } },
      },
      {
        variantId: 'deadlift_kettlebell',
        variantName: 'Классическая тяга гири',
        requiredEquipment: 'kettlebell',
        adjustments: { defaultWeightPercent: 35, repRange: { min: 6, max: 10 } },
      },
      {
        variantId: 'deadlift_barbell',
        variantName: 'Становая тяга со штангой',
        requiredEquipment: 'barbell',
        adjustments: { defaultWeightPercent: 50, repRange: { min: 5, max: 8 } },
      },
    ],
  },
  {
    id: 'bridge',
    name: 'Ягодичный мостик',
    movementPattern: 'squat_hinge',
    tier: 'bilateral_compound',
    primaryMuscleGroups: ['glutes', 'hamstrings'],
    secondaryMuscleGroups: ['core'],
    difficultyLevel: 'beginner',
    category: 'strength',
    icon: 'TrendingUp',
    instructions: [
      'Лягте на спину, колени согнуты, стопы на полу',
      'Стопы на ширине бёдер, примерно на расстоянии вытянутой руки от таза',
      'Поднимите таз вверх, напрягая ягодичные мышцы',
      'В верхней точке тело от колен до плеч образует прямую линию',
      'Задержитесь на 1-2 секунды в верхнем положении',
      'Медленно опустите таз, не касаясь пола полностью',
    ],
    variants: [
      {
        variantId: 'bridge_bodyweight',
        variantName: 'Ягодичный мостик на полу',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 12, max: 20 } },
      },
      {
        variantId: 'bridge_band',
        variantName: 'Ягодичный мостик с петлёй',
        requiredEquipment: 'resistance_band',
        adjustments: { defaultWeightPercent: 10, repRange: { min: 10, max: 16 } },
      },
      {
        variantId: 'bridge_barbell',
        variantName: 'Ягодичный мостик со штангой',
        requiredEquipment: 'barbell',
        adjustments: { defaultWeightPercent: 45, repRange: { min: 8, max: 12 } },
      },
    ],
  },

  // ===== CARDIO EXERCISES =====
  {
    id: 'jumping_jacks',
    name: 'Прыжки с разведением рук',
    movementPattern: 'cardio_metabolic',
    tier: 'plyometric',
    primaryMuscleGroups: ['full_body'],
    secondaryMuscleGroups: ['shoulders', 'calves'],
    difficultyLevel: 'beginner',
    category: 'cardio',
    icon: 'Zap',
    instructions: [
      'Стойте прямо, руки по бокам, стопы вместе',
      'Прыжком разведите ноги в стороны и поднимите руки над головой',
      'Вернитесь в исходное положение прыжком',
      'Мягко приземляйтесь на носки, амортизируя коленями',
      'Держите ритм ~60 прыжков в минуту',
      'Дышите ровно: вверх — вдох, вниз — выдох',
    ],
    variants: [
      {
        variantId: 'jumping_jacks_bodyweight',
        variantName: 'Классические прыжки',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 20, max: 40 } },
      },
      {
        variantId: 'jumping_jacks_step',
        variantName: 'Шаги с разведением (без прыжков)',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 20, max: 40 } },
      },
    ],
  },
  {
    id: 'burpees',
    name: 'Бёрпи',
    movementPattern: 'cardio_metabolic',
    tier: 'plyometric',
    primaryMuscleGroups: ['full_body'],
    secondaryMuscleGroups: ['chest', 'quads', 'core'],
    difficultyLevel: 'intermediate',
    category: 'cardio',
    icon: 'Flame',
    instructions: [
      'Из стойки присядьте и положите ладони на пол',
      'Прыжком отбросьте ноги назад — позиция планки',
      'Выполните одно отжимание (опционально для новичков)',
      'Прыжком подтяните колени к груди',
      'Взрывным движением выпрямитесь и подпрыгните вверх',
      'Приземлитесь мягко и сразу переходите к следующему повторению',
    ],
    variants: [
      {
        variantId: 'burpees_bodyweight',
        variantName: 'Полные бёрпи с отжиманием',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 6, max: 12 } },
      },
      {
        variantId: 'burpees_no_pushup',
        variantName: 'Бёрпи без отжимания',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 8, max: 15 } },
      },
    ],
  },
  {
    id: 'high_knees',
    name: 'Бег на месте с высоким подъёмом колен',
    movementPattern: 'cardio_metabolic',
    tier: 'plyometric',
    primaryMuscleGroups: ['quads', 'calves'],
    secondaryMuscleGroups: ['core', 'hip_flexors'],
    difficultyLevel: 'beginner',
    category: 'cardio',
    icon: 'Activity',
    instructions: [
      'Стойте прямо, руки согнуты перед собой',
      'Поднимайте колени максимально высоко — до уровня таза',
      'Работайте руками в противоход: левое колено — правая рука',
      'Бегите на месте с максимальной частотой',
      'Держите корпус прямо, не наклоняйтесь вперёд',
      'Приземляйтесь на переднюю часть стопы',
    ],
    variants: [
      {
        variantId: 'high_knees_bodyweight',
        variantName: 'Бег с высоким подъёмом колен',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 20, max: 40 } },
      },
    ],
  },
  {
    id: 'mountain_climbers',
    name: 'Скалолаз',
    movementPattern: 'cardio_metabolic',
    tier: 'plyometric',
    primaryMuscleGroups: ['core', 'hip_flexors'],
    secondaryMuscleGroups: ['shoulders', 'quads'],
    difficultyLevel: 'beginner',
    category: 'cardio',
    icon: 'TrendingUp',
    instructions: [
      'Примите позицию планки на прямых руках',
      'Поочерёдно подтягивайте колени к груди',
      'Двигайтесь быстро, как будто бежите в позиции планки',
      'Держите таз стабильным, не поднимайте его высоко',
      'Спина прямая, не прогибайтесь в пояснице',
      'Работайте в ритме ~30 подтягиваний в минуту на каждую ногу',
    ],
    variants: [
      {
        variantId: 'mountain_climbers_bodyweight',
        variantName: 'Классический скалолаз',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 16, max: 30 } },
      },
    ],
  },
  {
    id: 'jump_rope',
    name: 'Прыжки на скакалке',
    movementPattern: 'cardio_metabolic',
    tier: 'plyometric',
    primaryMuscleGroups: ['calves', 'full_body'],
    secondaryMuscleGroups: ['shoulders', 'forearms'],
    difficultyLevel: 'beginner',
    category: 'cardio',
    icon: 'RotateCw',
    instructions: [
      'Скакалка за головой, рукоятки в руках',
      'Кисти рук у бёдер, локти прижаты к туловищу',
      'Вращайте скакалку запястьями, а не плечами',
      'Прыгайте на 2-3 см от пола, мягко на носках',
      'Отталкивайтесь подушечками стоп, колени слегка согнуты',
      'Держите ровный ритм и дыхание',
    ],
    variants: [
      {
        variantId: 'jump_rope_basic',
        variantName: 'Прыжки на двух ногах',
        requiredEquipment: 'jump_rope',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 50, max: 100 } },
      },
      {
        variantId: 'jump_rope_improvise',
        variantName: 'Прыжки без скакалки (имитация)',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 30, max: 60 } },
      },
    ],
  },
  {
    id: 'rowing_machine_ex',
    name: 'Гребной тренажёр',
    movementPattern: 'cardio_metabolic',
    tier: 'bilateral_compound',
    primaryMuscleGroups: ['back', 'legs'],
    secondaryMuscleGroups: ['arms', 'core'],
    difficultyLevel: 'beginner',
    category: 'cardio',
    icon: 'Waves',
    instructions: [
      'Сядьте на сиденье, закрепите ноги в упорах',
      'Возьмитесь за рукоятку прямым хватом, руки вытянуты',
      'Фаза 1 (захват): вытяните руки вперёд, наклоните корпус',
      'Фаза 2 (тяга): оттолкнитесь ногами, затем потяните рукоятку к животу',
      'Фаза 3 (финиш): корпус слегка отклонён назад, рукоятка у живота',
      'Фаза 4 (возврат): вытяните руки, затем согните колени, вернитесь в начало',
    ],
    variants: [
      {
        variantId: 'rowing_low',
        variantName: 'Гребля — низкая интенсивность',
        requiredEquipment: 'rowing_machine',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 10, max: 15 }, durationSeconds: 300 },
      },
      {
        variantId: 'rowing_hiit',
        variantName: 'Гребля — интервалы (30с работа / 30с отдых)',
        requiredEquipment: 'rowing_machine',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 8, max: 12 }, durationSeconds: 240 },
      },
    ],
  },
  {
    id: 'treadmill_run',
    name: 'Беговая дорожка',
    movementPattern: 'cardio_metabolic',
    tier: 'bilateral_compound',
    primaryMuscleGroups: ['legs', 'full_body'],
    secondaryMuscleGroups: ['calves', 'core'],
    difficultyLevel: 'beginner',
    category: 'cardio',
    icon: 'Activity',
    instructions: [
      'Встаньте на беговую дорожку, держитесь за поручни',
      'Начните с ходьбы, постепенно увеличивая скорость',
      'Для бега: мягко приземляйтесь на среднюю часть стопы',
      'Не бегайте «пяткой вперёд» — это создаёт ударную нагрузку',
      'Держите корпус прямо, руки согнуты под углом ~90°',
      'Дышите ритмично: 2 шага — вдох, 2 шага — выдох',
    ],
    variants: [
      {
        variantId: 'treadmill_walk',
        variantName: 'Быстрая ходьба',
        requiredEquipment: 'treadmill',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 1, max: 1 }, durationSeconds: 600 },
      },
      {
        variantId: 'treadmill_run',
        variantName: 'Лёгкий бег',
        requiredEquipment: 'treadmill',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 1, max: 1 }, durationSeconds: 300 },
      },
      {
        variantId: 'treadmill_hiit',
        variantName: 'Интервальный бег (1 мин бег / 1 мин ходьба)',
        requiredEquipment: 'treadmill',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 1, max: 1 }, durationSeconds: 360 },
      },
    ],
  },
  {
    id: 'exercise_bike_ex',
    name: 'Велотренажёр',
    movementPattern: 'cardio_metabolic',
    tier: 'bilateral_compound',
    primaryMuscleGroups: ['quads', 'hamstrings'],
    secondaryMuscleGroups: ['calves', 'glutes'],
    difficultyLevel: 'beginner',
    category: 'cardio',
    icon: 'Bike',
    instructions: [
      'Отрегулируйте высоту сиденья: нога почти выпрямлена в нижней точке',
      'Зацепите стопы в педали (или закрепите ремешки)',
      'Держите спину прямо, не горбитесь',
      'Крутите педали ровным круговым движением',
      'Не переносите весь вес на рукоятки',
      'Поддерживайте каденс 60-90 оборотов в минуту',
    ],
    variants: [
      {
        variantId: 'bike_easy',
        variantName: 'Велотренажёр — умеренный темп',
        requiredEquipment: 'exercise_bike',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 1, max: 1 }, durationSeconds: 600 },
      },
      {
        variantId: 'bike_hiit',
        variantName: 'Велотренажёр — интервалы',
        requiredEquipment: 'exercise_bike',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 1, max: 1 }, durationSeconds: 360 },
      },
    ],
  },

  // ===== FLEXIBILITY / MOBILITY =====
  {
    id: 'stretch_hamstrings',
    name: 'Растяжка задней поверхности бедра',
    movementPattern: 'flexibility',
    primaryMuscleGroups: ['hamstrings'],
    secondaryMuscleGroups: ['calves', 'lower_back'],
    difficultyLevel: 'beginner',
    category: 'flexibility',
    icon: 'StretchHorizontal',
    instructions: [
      'Сядьте на пол, ноги вытянуты перед вами',
      'Медленно наклоняйтесь вперёд к ногам',
      'Тянитесь кончиками пальцев к носочкам',
      'Держите спину прямой, не round плечи',
      'Удерживайте позицию 20-30 секунд',
      'Дышите глубоко, с каждым выдохом тянитесь чуть дальше',
    ],
    variants: [
      {
        variantId: 'stretch_hamstrings_floor',
        variantName: 'Наклон к ногам сидя',
        requiredEquipment: 'mat',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 3, max: 5 }, durationSeconds: 30 },
      },
      {
        variantId: 'stretch_hamstrings_standing',
        variantName: 'Наклон к ногам стоя',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 3, max: 5 }, durationSeconds: 20 },
      },
    ],
  },
  {
    id: 'cat_cow',
    name: 'Кошка-корова',
    movementPattern: 'flexibility',
    primaryMuscleGroups: ['core', 'spine'],
    secondaryMuscleGroups: ['neck', 'shoulders'],
    difficultyLevel: 'beginner',
    category: 'flexibility',
    icon: 'Move3D',
    instructions: [
      'Встаньте на четвереньки: руки под плечами, колени под тазом',
      'Вдох: прогните спину вниз, поднимите голову и копчик (корова)',
      'Выдох: round спину вверх, опустите голову (кошка)',
      'Двигайтесь плавно, синхронизируя движение с дыханием',
      'Выполняйте 10-15 циклов без пауз',
      'Не форсируйте амплитуду, работайте в комфортном диапазоне',
    ],
    variants: [
      {
        variantId: 'cat_cow_floor',
        variantName: 'Кошка-корова на полу',
        requiredEquipment: 'mat',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 10, max: 15 } },
      },
      {
        variantId: 'cat_cow_no_mat',
        variantName: 'Кошка-корова без коврика',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 10, max: 15 } },
      },
    ],
  },
];

// Muscle group display labels
export const MUSCLE_LABELS: Record<string, string> = {
  quads: 'Квадрицепсы',
  glutes: 'Ягодицы',
  hamstrings: 'Задняя поверхность бедра',
  core: 'Кор',
  chest: 'Грудь',
  triceps: 'Трицепс',
  shoulders: 'Плечи',
  back: 'Спина',
  biceps: 'Бицепс',
  forearms: 'Предплечья',
  calves: 'Икры',
  legs: 'Ноги',
  full_body: 'Всё тело',
  hip_flexors: 'Сгибатели бедра',
  spine: 'Позвоночник',
  neck: 'Шея',
  lower_back: 'Поясница',
  arms: 'Руки',
};

// Antagonist muscle pairs for workout ordering (agonist -> antagonist)
export const ANTAGONIST_PAIRS: Record<string, string> = {
  chest: 'back',
  back: 'chest',
  quads: 'hamstrings',
  hamstrings: 'quads',
  biceps: 'triceps',
  triceps: 'biceps',
  shoulders: 'back',
};

// Target muscle groups for a full-body workout
export const FULL_BODY_TARGETS = [
  'quads', 'chest', 'back', 'core', 'shoulders', 'hamstrings',
] as const;

// Cardio target groups
export const CARDIO_TARGETS = [
  'full_body', 'calves', 'legs',
] as const;