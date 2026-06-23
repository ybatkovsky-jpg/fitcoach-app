'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EXERCISE_CATALOG, MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/lib/exercises';
import { ArrowLeft, Dumbbell, Zap, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Map exercise IDs to generated illustration images (3 phases)
const EXERCISE_IMAGES: Record<string, { start: string; mid: string; finish: string }> = {
  squat: { start: '/exercises/squat_start.png', mid: '/exercises/squat.png', finish: '/exercises/squat_finish.png' },
  push_up: { start: '/exercises/push_up_start.png', mid: '/exercises/push_up.png', finish: '/exercises/push_up_finish.png' },
  row: { start: '/exercises/row_start.png', mid: '/exercises/row.png', finish: '/exercises/row_finish.png' },
  plank: { start: '/exercises/plank_start.png', mid: '/exercises/plank.png', finish: '/exercises/plank_finish.png' },
  lunge: { start: '/exercises/lunge_start.png', mid: '/exercises/lunge.png', finish: '/exercises/lunge_finish.png' },
  shoulder_press: { start: '/exercises/shoulder_press_start.png', mid: '/exercises/shoulder_press.png', finish: '/exercises/shoulder_press_finish.png' },
  deadlift: { start: '/exercises/deadlift_start.png', mid: '/exercises/deadlift.png', finish: '/exercises/deadlift_finish.png' },
  bridge: { start: '/exercises/bridge_start.png', mid: '/exercises/bridge.png', finish: '/exercises/bridge_finish.png' },
  jumping_jacks: { start: '/exercises/jumping_jacks_start.png', mid: '/exercises/jumping_jacks.png', finish: '/exercises/jumping_jacks_finish.png' },
  burpees: { start: '/exercises/burpees_start.png', mid: '/exercises/burpees.png', finish: '/exercises/burpees_finish.png' },
  high_knees: { start: '/exercises/high_knees_start.png', mid: '/exercises/high_knees.png', finish: '/exercises/high_knees_finish.png' },
  mountain_climbers: { start: '/exercises/mountain_climbers_start.png', mid: '/exercises/mountain_climbers.png', finish: '/exercises/mountain_climbers_finish.png' },
  jump_rope: { start: '/exercises/jump_rope_start.png', mid: '/exercises/jump_rope.png', finish: '/exercises/jump_rope_finish.png' },
  rowing_machine_ex: { start: '/exercises/rowing_machine_ex_start.png', mid: '/exercises/rowing_machine_ex.png', finish: '/exercises/rowing_machine_ex_finish.png' },
  treadmill_run: { start: '/exercises/treadmill_run_start.png', mid: '/exercises/treadmill_run.png', finish: '/exercises/treadmill_run_finish.png' },
  exercise_bike_ex: { start: '/exercises/exercise_bike_ex_start.png', mid: '/exercises/exercise_bike_ex.png', finish: '/exercises/exercise_bike_ex_finish.png' },
  stretch_hamstrings: { start: '/exercises/stretch_hamstrings_start.png', mid: '/exercises/stretch_hamstrings.png', finish: '/exercises/stretch_hamstrings_finish.png' },
  cat_cow: { start: '/exercises/cat_cow_start.png', mid: '/exercises/cat_cow.png', finish: '/exercises/cat_cow_finish.png' },
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  strength: Dumbbell,
  cardio: Zap,
  flexibility: Waves,
};

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Силовые',
  cardio: 'Кардио',
  flexibility: 'Гибкость',
};

export function ExerciseGuideScreen() {
  const { selectedExerciseId, setScreen } = useAppStore();
  const exercise = EXERCISE_CATALOG.find((e) => e.id === selectedExerciseId);

  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-muted-foreground">Упражнение не найдено</p>
        <Button variant="outline" className="mt-4" onClick={() => setScreen('dashboard')}>
          Назад
        </Button>
      </div>
    );
  }

  const exerciseImage = EXERCISE_IMAGES[exercise.id];
  const CategoryIcon = CATEGORY_ICONS[exercise.category] ?? Dumbbell;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setScreen('dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{exercise.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-[10px] gap-1">
              <CategoryIcon className="w-3 h-3" />
              {CATEGORY_LABELS[exercise.category]}
            </Badge>
            <span className="text-xs text-muted-foreground">{exercise.difficultyLevel === 'beginner' ? 'Новичок' : exercise.difficultyLevel === 'intermediate' ? 'Средний' : 'Продвинутый'}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 min-h-0">
        {/* 3-phase illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-3">
              {exerciseImage ? (
                <div className="grid grid-cols-3 gap-2">
                  {([['start', 'Старт'], ['mid', 'Фаза'], ['finish', 'Финиш']] as const).map(([phase, label], i) => (
                    <motion.div
                      key={phase}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                    >
                      <div className="relative h-28 rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
                        <Image
                          src={exerciseImage[phase]}
                          alt={`${exercise.name} ${label}`}
                          fill
                          className="object-contain p-1.5"
                          sizes="120px"
                        />
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground mt-1 font-medium">{label}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
                  <Dumbbell className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Muscle groups */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Работающие мышцы</h3>
          <div className="flex flex-wrap gap-1.5">
            {exercise.primaryMuscleGroups.map((g) => (
              <Badge key={g} className="text-xs">{MUSCLE_LABELS[g] ?? g}</Badge>
            ))}
            {exercise.secondaryMuscleGroups.map((g) => (
              <Badge key={g} variant="outline" className="text-xs text-muted-foreground">{MUSCLE_LABELS[g] ?? g}</Badge>
            ))}
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Как выполнять</h3>
          <div className="space-y-2.5">
            {exercise.instructions.map((step, i) => (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3 items-start"
              >
                <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Available variants */}
        {exercise.variants.length > 1 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Варианты выполнения</h3>
            <div className="space-y-2">
              {exercise.variants.map((v) => (
                <div key={v.variantId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate">{v.variantName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {EQUIPMENT_LABELS[v.requiredEquipment]} · {v.adjustments.repRange.min}–{v.adjustments.repRange.max} повт.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}