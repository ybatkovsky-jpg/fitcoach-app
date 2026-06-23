'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MUSCLE_LABELS } from '@/lib/exercises';
import { ArrowLeft, Play, Clock, Dumbbell, Zap, Waves, Timer } from 'lucide-react';
import { motion } from 'framer-motion';

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

export function WorkoutPreviewScreen() {
  const { currentPlan, beginWorkout, setScreen } = useAppStore();

  if (!currentPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-muted-foreground">План тренировки не найден</p>
        <Button variant="outline" className="mt-4" onClick={() => setScreen('dashboard')}>
          На главную
        </Button>
      </div>
    );
  }

  const { exercises, estimatedDurationMin } = currentPlan;
  const strengthCount = exercises.filter((e) => e.category === 'strength').length;
  const cardioCount = exercises.filter((e) => e.category === 'cardio').length;
  const flexCount = exercises.filter((e) => e.category === 'flexibility').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setScreen('dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold">Тренировка</h1>
          <p className="text-xs text-muted-foreground">{exercises.length} упражнений</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 min-h-0">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-sm font-bold">{estimatedDurationMin} мин</div>
            <div className="text-[10px] text-muted-foreground">Время</div>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <Dumbbell className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-sm font-bold">{strengthCount}</div>
            <div className="text-[10px] text-muted-foreground">Силовые</div>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-sm font-bold">{cardioCount + flexCount}</div>
            <div className="text-[10px] text-muted-foreground">Кардио/Раст.</div>
          </div>
        </div>

        {/* Exercise list */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Упражнения</h3>
          <div className="space-y-2">
            {exercises.map((ex, i) => {
              const CatIcon = CATEGORY_ICONS[ex.category] ?? Dumbbell;
              return (
                <motion.div
                  key={ex.exerciseConfigId}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{ex.exerciseName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] gap-0.5 px-1.5 py-0">
                        <CatIcon className="w-2.5 h-2.5" />
                        {CATEGORY_LABELS[ex.category]}
                      </Badge>
                      {ex.primaryMuscleGroups.slice(0, 2).map((g) => (
                        <span key={g} className="text-[10px] text-muted-foreground">
                          {MUSCLE_LABELS[g] ?? g}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {ex.isTimed ? (
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <Timer className="w-3 h-3 text-muted-foreground" />
                        {ex.durationSeconds ?? ex.targetReps}с
                      </div>
                    ) : (
                      <div className="text-xs font-medium">
                        {ex.targetReps} реп.
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="px-5 pb-6 pt-3">
        <Button
          className="w-full h-12 text-base font-semibold gap-2"
          onClick={beginWorkout}
        >
          <Play className="w-5 h-5" />
          Старт
        </Button>
      </div>
    </div>
  );
}