'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, ChevronRight, Pause, Play, SkipForward, X, Timer,
  CheckCircle2, Circle, BookOpen, Zap,
} from 'lucide-react';
import { MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/lib/exercises';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const EXERCISE_IMAGES: Record<string, string> = {
  squat: '/exercises/squat.png',
  push_up: '/exercises/push_up.png',
  row: '/exercises/row.png',
  plank: '/exercises/plank.png',
  lunge: '/exercises/lunge.png',
  shoulder_press: '/exercises/shoulder_press.png',
  deadlift: '/exercises/deadlift.png',
  bridge: '/exercises/bridge.png',
  jumping_jacks: '/exercises/jumping_jacks.png',
  burpees: '/exercises/burpees.png',
  high_knees: '/exercises/high_knees.png',
  mountain_climbers: '/exercises/mountain_climbers.png',
  jump_rope: '/exercises/jump_rope.png',
  rowing_machine_ex: '/exercises/rowing_machine_ex.png',
  treadmill_run: '/exercises/treadmill_run.png',
  exercise_bike_ex: '/exercises/exercise_bike_ex.png',
  stretch_hamstrings: '/exercises/stretch_hamstrings.png',
  cat_cow: '/exercises/cat_cow.png',
};

export function WorkoutScreen() {
  const {
    currentPlan,
    workoutSession,
    completeSet,
    skipSet,
    tickRest,
    nextExercise,
    finishWorkout,
    openExerciseGuide,
  } = useAppStore();

  // Elapsed time
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  // Elapsed timer
  useEffect(() => {
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Rest timer
  useEffect(() => {
    if (!workoutSession?.isResting) return;
    const interval = setInterval(tickRest, 1000);
    return () => clearInterval(interval);
  }, [workoutSession?.isResting, tickRest]);

  if (!currentPlan || !workoutSession) return null;

  const { currentExerciseIndex, currentSet, isResting, restSecondsLeft } = workoutSession;
  const exercise = currentPlan.exercises[currentExerciseIndex];
  if (!exercise) return null;

  const totalExercises = currentPlan.exercises.length;
  const overallProgress = (() => {
    let done = 0;
    let total = 0;
    for (let i = 0; i < currentExerciseIndex; i++) {
      done += currentPlan.exercises[i].targetSets;
      total += currentPlan.exercises[i].targetSets;
    }
    total += exercise.targetSets;
    done += exercise.completedSets;
    return total > 0 ? (done / total) * 100 : 0;
  })();

  const isLastSet = currentSet + 1 >= exercise.targetSets;
  const isLastExercise = currentExerciseIndex >= totalExercises - 1;
  const allDone = exercise.completedSets >= exercise.targetSets;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={finishWorkout}>
            <X className="w-5 h-5" />
          </Button>
          <span className="text-sm font-semibold tabular-nums">
            {formatTime(elapsed)}
          </span>
          <span className="text-sm font-semibold">
            {currentExerciseIndex + 1} / {totalExercises}
          </span>
          <div className="w-9" />
        </div>
        <Progress value={overallProgress} className="h-1.5" />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0">
        {isResting ? (
          /* Rest screen */
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <p className="text-sm text-muted-foreground font-medium">Отдых</p>
            <div className="relative">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="54"
                  fill="none" stroke="currentColor"
                  className="text-muted/30"
                  strokeWidth="6"
                />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none" stroke="currentColor"
                  className="text-primary"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - restSecondsLeft / 60)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold tabular-nums">{restSecondsLeft}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={nextExercise}
            >
              Пропустить отдых <SkipForward className="w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground text-center max-w-[240px]">
              {isLastSet && isLastExercise
                ? 'Последний подход завершён!'
                : isLastSet
                ? `Далее: ${currentPlan.exercises[currentExerciseIndex + 1]?.exerciseName ?? 'Тренировка завершена'}`
                : `Следующий подход ${currentSet + 2}/${exercise.targetSets}`}
            </p>
          </div>
        ) : (
          /* Exercise screen */
          <div className="space-y-4 pt-2">
            {/* Exercise illustration */}
            <AnimatePresence mode="wait">
              <motion.div
                key={exercise.exerciseConfigId}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10"
              >
                {EXERCISE_IMAGES[exercise.exerciseConfigId] ? (
                  <Image
                    src={EXERCISE_IMAGES[exercise.exerciseConfigId]}
                    alt={exercise.exerciseName}
                    fill
                    className="object-contain p-2"
                    sizes="360px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/20">
                    <Zap className="w-14 h-14" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Exercise name and variant */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                {exercise.category === 'cardio' && <Zap className="w-4 h-4 text-orange-500" />}
                <h2 className="text-2xl font-bold">{exercise.exerciseName}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{exercise.variantName}</p>
              {exercise.alternativeHint && (
                <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg px-3 py-2 mt-2">
                  💡 {exercise.alternativeHint}
                </p>
              )}
              {/* How to perform button */}
              <button
                onClick={() => openExerciseGuide(exercise.exerciseConfigId)}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-medium mt-2 hover:underline"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Как выполнять?
              </button>
            </div>

            {/* Muscle groups */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {exercise.primaryMuscleGroups.map((g) => (
                <Badge key={g} variant="secondary" className="text-[10px]">
                  {MUSCLE_LABELS[g] ?? g}
                </Badge>
              ))}
            </div>

            {/* Weight display */}
            {exercise.weightKg && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {exercise.weightKg} <span className="text-base font-normal text-muted-foreground">кг</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Рабочий вес</div>
                </CardContent>
              </Card>
            )}

            {/* Sets progress */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Подходы</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.min(currentSet + 1, exercise.targetSets)}/{exercise.targetSets}
                  </span>
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: exercise.targetSets }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full ${
                        i < exercise.completedSets
                          ? 'bg-primary'
                          : i === currentSet
                          ? 'bg-primary/50'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-4xl font-bold">{exercise.targetReps}</span>
                  <span className="text-sm text-muted-foreground ml-1">повторений</span>
                </div>
              </CardContent>
            </Card>

            {/* Set history */}
            {exercise.setResults.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Выполненные подходы</span>
                {exercise.setResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">Подход {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.reps} реп.</span>
                      {r.rpe && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          RPE {r.rpe}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action buttons */}
      {!isResting && (
        <div className="px-5 pb-6 pt-3 flex gap-3">
          <Button
            variant="outline"
            className="h-12 px-4 shrink-0"
            onClick={skipSet}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          <Button
            className="flex-1 h-12 text-base font-semibold gap-2"
            onClick={() => completeSet(exercise.targetReps)}
          >
            <CheckCircle2 className="w-5 h-5" />
            {allDone
              ? isLastExercise
                ? 'Завершить тренировку'
                : 'Следующее упражнение'
              : `Выполнить подход ${currentSet + 1}`}
          </Button>
        </div>
      )}
    </div>
  );
}