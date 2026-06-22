// Exercise catalog matching the JSON schema from the spec
// All data is self-contained — no API calls needed

export type EquipmentType = 'none' | 'dumbbell' | 'kettlebell' | 'barbell' | 'bench' | 'resistance_band' | 'pullup_bar' | 'mat';

export interface RepRange {
  min: number;
  max: number;
}

export interface VariantAdjustments {
  defaultWeightPercent: number;
  repRange: RepRange;
}

export interface ExerciseVariant {
  variantId: string;
  variantName: string;
  requiredEquipment: EquipmentType;
  alternativeEquipmentHint?: string;
  adjustments: VariantAdjustments;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  variants: ExerciseVariant[];
  icon: string; // Lucide icon name
}

// Priority map for equipment selection
export const EQUIPMENT_PRIORITY: Record<EquipmentType, number> = {
  none: 0,
  resistance_band: 1,
  mat: 1,
  dumbbell: 2,
  kettlebell: 2,
  pullup_bar: 2,
  bench: 3,
  barbell: 3,
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  none: 'Без инвентаря',
  dumbbell: 'Гантели',
  kettlebell: 'Гири',
  barbell: 'Штанга',
  bench: 'Скамья',
  resistance_band: 'Резиновые петли',
  pullup_bar: 'Турник',
  mat: 'Коврик',
};

export const INVENTORY_OPTIONS: { type: EquipmentType; label: string; icon: string }[] = [
  { type: 'mat', label: 'Коврик', icon: 'Square' },
  { type: 'dumbbell', label: 'Гантели', icon: 'Dumbbell' },
  { type: 'kettlebell', label: 'Гири', icon: 'CircleDot' },
  { type: 'barbell', label: 'Штанга', icon: 'Minus' },
  { type: 'pullup_bar', label: 'Турник', icon: 'GripHorizontal' },
  { type: 'resistance_band', label: 'Петли', icon: 'Link' },
  { type: 'bench', label: 'Скамья', icon: 'Armchair' },
];

// Full exercise catalog
export const EXERCISE_CATALOG: ExerciseConfig[] = [
  {
    id: 'squat',
    name: 'Приседания',
    primaryMuscleGroups: ['quads', 'glutes'],
    secondaryMuscleGroups: ['hamstrings', 'core'],
    difficultyLevel: 'beginner',
    icon: 'ArrowDownToLine',
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
    primaryMuscleGroups: ['chest', 'triceps'],
    secondaryMuscleGroups: ['shoulders', 'core'],
    difficultyLevel: 'beginner',
    icon: 'ArrowDown',
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
    primaryMuscleGroups: ['back', 'biceps'],
    secondaryMuscleGroups: ['forearms'],
    difficultyLevel: 'beginner',
    icon: 'ArrowUpFromLine',
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
    primaryMuscleGroups: ['core'],
    secondaryMuscleGroups: ['shoulders', 'glutes'],
    difficultyLevel: 'beginner',
    icon: 'Minus',
    variants: [
      {
        variantId: 'plank_knee',
        variantName: 'Планка с колен',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 20, max: 30 } },
      },
      {
        variantId: 'plank_classic',
        variantName: 'Классическая планка',
        requiredEquipment: 'none',
        adjustments: { defaultWeightPercent: 0, repRange: { min: 30, max: 60 } },
      },
      {
        variantId: 'plank_band',
        variantName: 'Планка с петлёй (anti-extension)',
        requiredEquipment: 'resistance_band',
        adjustments: { defaultWeightPercent: 10, repRange: { min: 20, max: 40 } },
      },
    ],
  },
  {
    id: 'lunge',
    name: 'Выпады',
    primaryMuscleGroups: ['quads', 'glutes'],
    secondaryMuscleGroups: ['hamstrings', 'core'],
    difficultyLevel: 'beginner',
    icon: 'Footprints',
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
    primaryMuscleGroups: ['shoulders', 'triceps'],
    secondaryMuscleGroups: ['core'],
    difficultyLevel: 'beginner',
    icon: 'ArrowUp',
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
    primaryMuscleGroups: ['hamstrings', 'glutes', 'back'],
    secondaryMuscleGroups: ['core', 'forearms'],
    difficultyLevel: 'intermediate',
    icon: 'ArrowUpFromLine',
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
    primaryMuscleGroups: ['glutes', 'hamstrings'],
    secondaryMuscleGroups: ['core'],
    difficultyLevel: 'beginner',
    icon: 'TrendingUp',
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
};

// Target muscle groups for a full-body workout
export const FULL_BODY_TARGETS = [
  'quads', 'glutes', 'chest', 'back', 'core', 'shoulders',
] as const;