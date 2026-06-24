import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type UserProfile,
  type ExerciseInPlan,
  type WorkoutPlan,
  type WorkoutFeedback,
  generateWorkout,
  calculateFitnessLevel,
  getAdaptiveMultiplier,
  applyAdaptiveLoad,
} from './workout-engine';
import {
  type PeriodizationPhase,
  getScientificAdaptiveMultiplier,
  getCurrentPhaseInfo,
} from './training-science';
import type { EquipmentType, FitnessLevel, ExerciseConfig } from './exercises';
export type { WorkoutFeedback } from './workout-engine';
import {
  ACHIEVEMENTS,
  getLevelInfo,
  calculateStreak,
  type AchievementDef,
} from './achievements';

// --- Screen types ---

export type AppScreen =
  | 'onboarding'
  | 'dashboard'
  | 'workout_preview'
  | 'workout'
  | 'feedback'
  | 'profile'
  | 'nutrition'
  | 'exercise_guide'
  | 'lab_tests'
  | 'body_metrics'
  | 'progress'
  | 'achievements'
  | 'knowledge'
  | 'admin'
  | 'inventory_edit';

// --- Workout session state ---

export interface ExerciseTiming {
  exerciseConfigId: string;
  startedAt: number;   // timestamp when exercise began
  finishedAt: number;  // timestamp when last set completed / skipped
  totalRepsDone: number;
  totalSeconds: number;
}

export interface WorkoutSession {
  currentExerciseIndex: number;
  currentSet: number;
  isResting: boolean;
  restSecondsLeft: number;
  restDuration: number;  // NEW: total rest duration for current exercise
  startTime: number;
  exerciseTimings: ExerciseTiming[];
}

// --- History entry ---

export interface ExerciseHistoryRecord {
  exerciseConfigId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  completed: boolean;
  totalSeconds: number;  // time spent on this exercise
  totalRepsDone: number; // actual reps performed (not target)
  repsPerMinute: number; // calculated speed metric
}

export interface HistoryEntry {
  id: string;
  date: string;
  planId: string;
  feedback: WorkoutFeedback | null;
  exercises: ExerciseHistoryRecord[];
  durationMin: number;
}

// --- Lab test entry ---

export interface LabTestEntry {
  id: string;
  date: string;
  results: Record<string, number>; // biomarkerId -> value
}

// --- Body metrics ---

export interface BodyMetricEntry {
  id: string;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm?: number | null;
  hipsCm?: number | null;
  bicepsCm?: number | null;
  thighCm?: number | null;
}

// --- Store interface ---

interface AppState {
  // Navigation
  screen: AppScreen;
  setScreen: (s: AppScreen) => void;

  // Exercise guide
  selectedExerciseId: string | null;
  openExerciseGuide: (id: string) => void;

  // Onboarding
  onboardingStep: number;
  setOnboardingStep: (s: number) => void;
  isOnboarded: boolean;

  // Profile (partial during onboarding)
  profile: UserProfile | null;

  // Onboarding field setters (for gradual collection)
  setProfileField: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void;

  // Complete onboarding
  completeOnboarding: () => void;

  // Workout plan
  currentPlan: WorkoutPlan | null;
  generateNewPlan: () => void;

  // Active workout session
  workoutSession: WorkoutSession | null;
  startWorkout: () => void;
  beginWorkout: () => void;
  completeSet: (reps: number, rpe?: number) => void;
  skipSet: () => void;
  startRest: () => void;
  tickRest: () => void;
  nextExercise: () => void;
  finishWorkout: () => void;

  // Feedback
  lastFeedback: WorkoutFeedback | null;
  workoutNotCounted: boolean;
  setFeedback: (f: WorkoutFeedback) => void;
  consecutiveHardCount: number;

  // History
  history: HistoryEntry[];
  missedDays: number;

  // --- PERIODIZATION ---
  periodizationWeek: number;

  // --- GAMIFICATION ---
  totalXp: number;
  unlockedAchievements: string[]; // achievement IDs
  recentlyUnlocked: string[]; // IDs to show as notifications
  awardXp: (amount: number, reason: string) => void;
  checkAchievements: () => string[]; // returns newly unlocked IDs
  clearRecentUnlocks: () => void;

  // --- LAB TESTS ---
  labTestEntries: LabTestEntry[];
  addLabTestEntry: (results: Record<string, number>) => void;
  removeLabTestEntry: (id: string) => void;

  // --- BODY METRICS ---
  bodyMetrics: BodyMetricEntry[];
  addBodyMetric: (m: Omit<BodyMetricEntry, 'id' | 'date'>) => void;
  removeBodyMetric: (id: string) => void;

  // --- ADMIN ---
  customExercises: ExerciseConfig[];
  addCustomExercise: (ex: ExerciseConfig) => void;
  updateCustomExercise: (id: string, ex: Partial<ExerciseConfig>) => void;
  removeCustomExercise: (id: string) => void;

  resetAll: () => void;
}

const defaultSession = (restDuration?: number): WorkoutSession => ({
  currentExerciseIndex: 0,
  currentSet: 0,
  isResting: false,
  restSecondsLeft: 0,
  restDuration: restDuration ?? 60,
  startTime: Date.now(),
  exerciseTimings: [],
});

// Fallback rest duration for backward compatibility with old plans
const FALLBACK_REST = 60;

function makeDefaultProfile(): UserProfile {
  return {
    gender: 'male' as const,
    age: 25,
    height: 170,
    weight: 70,
    medicalRestrictions: false,
    goal: 'maintain' as const,
    inventory: [] as EquipmentType[],
    rpeSquat: 5,
    rpePushUp: 5,
    rpePlank: 5,
    comfortableMinutes: 15,
    fitnessLevel: 'beginner' as FitnessLevel,
  };
}

/** Get rest duration for current exercise (backward compatible) */
function getRestForExercise(exercise: ExerciseInPlan | undefined): number {
  // New plans have scientific rest
  if (exercise?.restSeconds && exercise.restSeconds > 0) {
    return exercise.restSeconds;
  }
  return FALLBACK_REST;
}

/** Get recent exercise IDs from history for rotation */
function getRecentExerciseIds(history: HistoryEntry[], lastN: number = 3): string[] {
  return history.slice(-lastN).flatMap((h) => h.exercises.map((e) => e.exerciseConfigId));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      screen: 'onboarding' as AppScreen,
      setScreen: (s) => set({ screen: s }),
      selectedExerciseId: null,
      openExerciseGuide: (id) => set({ selectedExerciseId: id, screen: 'exercise_guide' }),

      // Onboarding
      onboardingStep: 0,
      setOnboardingStep: (s) => set({ onboardingStep: s }),
      isOnboarded: false,

      // Profile
      profile: makeDefaultProfile() as UserProfile,
      setProfileField: (key, value) =>
        set((state) => ({
          profile: {
            ...(state.profile ?? makeDefaultProfile()),
            [key]: value,
          } as UserProfile,
        })),

      completeOnboarding: () => {
        const state = get();
        if (!state.profile) return;
        const level = calculateFitnessLevel(state.profile, state.history.length);
        const updatedProfile = { ...state.profile, fitnessLevel: level };
        set({ isOnboarded: true, profile: updatedProfile, screen: 'dashboard' });
        // Auto-generate first plan with scientific periodization
        try {
          const recentIds = getRecentExerciseIds(state.history);
          const plan = generateWorkout(updatedProfile, state.customExercises, state.periodizationWeek, recentIds);
          set({ currentPlan: plan });
        } catch (err) {
          console.error('Failed to generate workout on onboarding:', err);
          // Don't block onboarding — user can generate plan manually from dashboard
        }
      },

      // Workout plan
      currentPlan: null,
      generateNewPlan: () => {
        const state = get();
        if (!state.profile) return;

        let plan: ReturnType<typeof generateWorkout>;

        if (state.currentPlan && state.lastFeedback && state.history.length > 0) {
          // ADAPTIVE PATH: use scientific adaptive multiplier with phase context
          const phase = (state.currentPlan as WorkoutPlan & { periodizationPhase?: PeriodizationPhase }).periodizationPhase ?? 'accumulation';
          const multiplier = getScientificAdaptiveMultiplier(
            state.lastFeedback,
            state.missedDays,
            state.consecutiveHardCount,
            phase,
          );
          const adapted = applyAdaptiveLoad(state.currentPlan.exercises, multiplier);
          plan = {
            ...state.currentPlan,
            id: `plan_${Date.now()}`,
            exercises: adapted,
            createdAt: Date.now(),
          };
        } else {
          // FRESH PATH: generate with periodization and exercise rotation
          const recentIds = getRecentExerciseIds(state.history);
          plan = generateWorkout(state.profile, state.customExercises, state.periodizationWeek, recentIds);
        }

        set({ currentPlan: plan });
      },

      // Active workout
      workoutSession: null,
      startWorkout: () => {
        set({ screen: 'workout_preview' });
      },
      beginWorkout: () => {
        const state = get();
        if (!state.currentPlan) return;

        // Reset completion state but KEEP scientifically calculated sets
        const newExercises = state.currentPlan.exercises.map((ex) => ({
          ...ex,
          completedSets: 0,
          setResults: [] as { reps: number; rpe?: number }[],
        }));

        // Set rest duration from first exercise
        const firstRest = getRestForExercise(newExercises[0]);

        // Record start time for first exercise
        const firstTiming: ExerciseTiming = {
          exerciseConfigId: newExercises[0]?.exerciseConfigId ?? '',
          startedAt: Date.now(),
          finishedAt: Date.now(),
          totalRepsDone: 0,
          totalSeconds: 0,
        };

        set({
          screen: 'workout',
          workoutSession: {
            ...defaultSession(firstRest),
            exerciseTimings: [firstTiming],
          },
          currentPlan: { ...state.currentPlan, exercises: newExercises },
        });
      },
      completeSet: (reps, rpe) =>
        set((state) => {
          if (!state.workoutSession || !state.currentPlan) return state;
          const { currentExerciseIndex, currentSet } = state.workoutSession;
          const exercises = [...state.currentPlan.exercises];
          const exercise = { ...exercises[currentExerciseIndex] };
          exercise.completedSets += 1;
          exercise.setResults = [...exercise.setResults, { reps, rpe }];
          exercises[currentExerciseIndex] = exercise;

          const isLastSet = exercise.completedSets >= exercise.targetSets;
          const isLastExercise = currentExerciseIndex >= exercises.length - 1;

          // Scientific rest: use exercise's rest duration
          const currentRest = getRestForExercise(exercise);
          const shouldRest = !(isLastSet && isLastExercise);

          return {
            currentPlan: { ...state.currentPlan, exercises },
            workoutSession: {
              ...state.workoutSession,
              isResting: shouldRest,
              restSecondsLeft: shouldRest ? currentRest : 0,
              restDuration: currentRest,
              currentSet: isLastSet ? 0 : currentSet + 1,
            },
          };
        }),
      skipSet: () =>
        set((state) => {
          if (!state.workoutSession || !state.currentPlan) return state;
          const { currentExerciseIndex, currentSet } = state.workoutSession;
          const exercises = [...state.currentPlan.exercises];
          const exercise = { ...exercises[currentExerciseIndex] };
          exercise.setResults = [...exercise.setResults, { reps: 0 }];
          exercises[currentExerciseIndex] = exercise;

          const isLastSet = currentSet + 1 >= exercise.targetSets;
          const isLastExercise = currentExerciseIndex >= exercises.length - 1;

          const currentRest = getRestForExercise(exercise);
          const shouldRest = !(isLastSet && isLastExercise);

          return {
            currentPlan: { ...state.currentPlan, exercises },
            workoutSession: {
              ...state.workoutSession,
              isResting: shouldRest,
              restSecondsLeft: shouldRest ? currentRest : 0,
              restDuration: currentRest,
              currentSet: isLastSet ? 0 : currentSet + 1,
            },
          };
        }),
      startRest: () =>
        set((state) => {
          if (!state.workoutSession || !state.currentPlan) return state;
          const exercise = state.currentPlan.exercises[state.workoutSession.currentExerciseIndex];
          const currentRest = getRestForExercise(exercise);
          return {
            workoutSession: state.workoutSession
              ? { ...state.workoutSession, isResting: true, restSecondsLeft: currentRest, restDuration: currentRest }
              : null,
          };
        }),
      tickRest: () =>
        set((state) => {
          if (!state.workoutSession || !state.workoutSession.isResting) return state;
          const left = state.workoutSession.restSecondsLeft - 1;
          if (left <= 0) {
            const { currentExerciseIndex } = state.workoutSession;
            const plan = state.currentPlan!;
            const exercise = plan.exercises[currentExerciseIndex];
            const allSetsDone = exercise.completedSets >= exercise.targetSets;

            if (allSetsDone && currentExerciseIndex < plan.exercises.length - 1) {
              // All sets done → move to next exercise
              const nextIdx = currentExerciseIndex + 1;
              const nextEx = plan.exercises[nextIdx];
              const nextRest = getRestForExercise(nextEx);

              return {
                workoutSession: {
                  ...state.workoutSession,
                  isResting: false,
                  currentExerciseIndex: nextIdx,
                  currentSet: 0,
                  restDuration: nextRest,
                },
              };
            }
            // More sets remain (or last exercise) → just stop resting, stay on same set
            return {
              workoutSession: { ...state.workoutSession, isResting: false, restSecondsLeft: 0 },
            };
          }
          return {
            workoutSession: { ...state.workoutSession, restSecondsLeft: left },
          };
        }),
      nextExercise: () =>
        set((state) => {
          if (!state.workoutSession || !state.currentPlan) return state;
          const nextIdx = state.workoutSession.currentExerciseIndex + 1;

          // Finalize timing for current exercise
          const timings = [...state.workoutSession.exerciseTimings];
          const curEx = state.currentPlan.exercises[state.workoutSession.currentExerciseIndex];
          if (curEx) {
            const tIdx = timings.findIndex((t) => t.exerciseConfigId === curEx.exerciseConfigId);
            if (tIdx >= 0) {
              timings[tIdx] = {
                ...timings[tIdx],
                finishedAt: Date.now(),
                totalRepsDone: curEx.setResults.reduce((s, r) => s + r.reps, 0),
                totalSeconds: Math.round((Date.now() - timings[tIdx].startedAt) / 1000),
              };
            }
          }

          if (nextIdx >= state.currentPlan.exercises.length) {
            const duration = Math.round((Date.now() - state.workoutSession.startTime) / 60000);
            const entry: HistoryEntry = {
              id: `hist_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              planId: state.currentPlan.id,
              feedback: null,
              exercises: state.currentPlan.exercises.map((ex) => {
                const timing = timings.find((t) => t.exerciseConfigId === ex.exerciseConfigId);
                const totalRepsDone = ex.setResults.reduce((s, r) => s + r.reps, 0);
                const totalSeconds = timing ? Math.round((timing.finishedAt - timing.startedAt) / 1000) : 0;
                const repsPerMin = totalSeconds > 0 ? Math.round((totalRepsDone / totalSeconds) * 60) : 0;
                return {
                  exerciseConfigId: ex.exerciseConfigId,
                  exerciseName: ex.exerciseName,
                  sets: ex.targetSets,
                  reps: ex.targetReps,
                  completed: ex.completedSets >= ex.targetSets,
                  totalSeconds,
                  totalRepsDone,
                  repsPerMinute: repsPerMin,
                };
              }),
              durationMin: duration,
            };
            return {
              screen: 'feedback',
              workoutSession: null,
              history: [...state.history, entry],
            };
          }

          // Start timing for next exercise
          const nextEx = state.currentPlan.exercises[nextIdx];
          const nextRest = getRestForExercise(nextEx);
          const newTiming: ExerciseTiming = {
            exerciseConfigId: nextEx.exerciseConfigId,
            startedAt: Date.now(),
            finishedAt: Date.now(),
            totalRepsDone: 0,
            totalSeconds: 0,
          };

          return {
            workoutSession: {
              ...state.workoutSession,
              currentExerciseIndex: nextIdx,
              currentSet: 0,
              isResting: false,
              restDuration: nextRest,
              exerciseTimings: [...timings, newTiming],
            },
          };
        }),
      finishWorkout: () =>
        set((state) => {
          const duration = state.workoutSession
            ? Math.round((Date.now() - state.workoutSession.startTime) / 60000)
            : 0;
          const exercises = state.currentPlan?.exercises ?? [];
          // Finalize timing for the last active exercise
          const timings = (state.workoutSession?.exerciseTimings ?? []).map((t) => {
            if (t.finishedAt <= t.startedAt) {
              const curIdx = state.workoutSession?.currentExerciseIndex;
              const curEx = curIdx !== undefined ? exercises[curIdx] : undefined;
              if (curEx && t.exerciseConfigId === curEx.exerciseConfigId) {
                const totalRepsDone = curEx.setResults.reduce((s, r) => s + r.reps, 0);
                const totalSeconds = Math.round((Date.now() - t.startedAt) / 1000);
                return { ...t, finishedAt: Date.now(), totalRepsDone, totalSeconds };
              }
            }
            return t;
          });

          // Calculate completion: only sets with reps > 0 count
          const totalTargetSets = exercises.reduce((s, ex) => s + ex.targetSets, 0);
          const completedSets = exercises.reduce(
            (s, ex) => s + ex.setResults.filter((r) => r.reps > 0).length,
            0,
          );
          const completionPct = totalTargetSets > 0 ? completedSets / totalTargetSets : 0;

          // Less than 10% = not counted
          if (completionPct < 0.1) {
            return {
              screen: 'feedback',
              workoutSession: null,
              workoutNotCounted: true,
            };
          }

          const entry: HistoryEntry = {
            id: `hist_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            planId: state.currentPlan?.id ?? '',
            feedback: null,
            exercises: exercises.map((ex) => {
              const timing = timings.find((t) => t.exerciseConfigId === ex.exerciseConfigId);
              const totalRepsDone = ex.setResults.reduce((s, r) => s + r.reps, 0);
              const totalSeconds = timing ? Math.round((timing.finishedAt - timing.startedAt) / 1000) : 0;
              const repsPerMin = totalSeconds > 0 ? Math.round((totalRepsDone / totalSeconds) * 60) : 0;
              return {
                exerciseConfigId: ex.exerciseConfigId,
                exerciseName: ex.exerciseName,
                sets: ex.targetSets,
                reps: ex.targetReps,
                completed: ex.completedSets >= ex.targetSets,
                totalSeconds,
                totalRepsDone,
                repsPerMinute: repsPerMin,
              };
            }),
            durationMin: duration,
          };

          // Proportional XP: base 100 * completion ratio
          const baseXp = Math.round(100 * completionPct);
          const allDone = completionPct >= 1;
          const bonusXp = allDone ? 25 : 0;
          const newXp = state.totalXp + baseXp + bonusXp;

          return {
            screen: 'feedback',
            workoutSession: null,
            workoutNotCounted: false,
            history: [...state.history, entry],
            totalXp: newXp,
            recentlyUnlocked: [],
          };
        }),

      // Feedback
      lastFeedback: null,
      workoutNotCounted: false,
      setFeedback: (f) => {
        const state = get();
        if (state.workoutNotCounted) {
          set({ screen: 'dashboard', workoutNotCounted: false });
          return;
        }
        const newConsecutive =
          f === 'very_hard' ? state.consecutiveHardCount + 1 : 0;

        // Update last history entry
        const history = [...state.history];
        if (history.length > 0) {
          history[history.length - 1] = {
            ...history[history.length - 1],
            feedback: f,
          };
        }

        // Advance periodization week after each completed workout
        const newWeek = state.periodizationWeek + 1;

        // Re-evaluate fitness level (Benson: reassess every 6 weeks)
        if (newWeek % 6 === 0 && state.profile) {
          const newLevel = calculateFitnessLevel(state.profile, history.length);
          if (newLevel !== state.profile.fitnessLevel) {
            set((s) => ({
              profile: s.profile ? { ...s.profile, fitnessLevel: newLevel } : s.profile,
            }));
          }
        }

        set({
          lastFeedback: f,
          consecutiveHardCount: newConsecutive,
          history,
          periodizationWeek: newWeek,
          screen: 'dashboard',
          workoutNotCounted: false,
        });

        // Check achievements after a tick
        setTimeout(() => {
          get().checkAchievements();
        }, 50);
      },
      consecutiveHardCount: 0,

      // History
      history: [],
      missedDays: 0,

      // --- PERIODIZATION ---
      periodizationWeek: 0,

      // --- GAMIFICATION ---
      totalXp: 0,
      unlockedAchievements: [] as string[],
      recentlyUnlocked: [] as string[],

      awardXp: (amount: number, _reason: string) =>
        set((state) => ({ totalXp: state.totalXp + amount })),

      checkAchievements: () => {
        const state = get();
        const unlocked = new Set(state.unlockedAchievements);
        const newUnlocks: string[] = [];

        const history = state.history;
        const totalWorkouts = history.length;
        const streak = calculateStreak(history.map((h) => h.date));
        const levelInfo = getLevelInfo(state.totalXp);
        const totalMinutes = history.reduce((s, h) => s + h.durationMin, 0);

        const normalFeedbacks = history.filter((h) => h.feedback === 'normal').length;

        const lastEntry = history.length > 0 ? history[history.length - 1] : null;
        const hadCardio = lastEntry
          ? state.currentPlan?.exercises.some(
              (ex) =>
                ex.category === 'cardio' &&
                lastEntry.exercises.some(
                  (e) => e.exerciseName === ex.exerciseName && e.completed,
                ),
            ) ?? false
          : false;
        const allExercisesCompleted = lastEntry
          ? lastEntry.exercises.every((e) => e.completed)
          : false;

        const checks: Record<string, boolean> = {
          first_workout: totalWorkouts >= 1,
          cardio_done: hadCardio,
          all_exercises_done: allExercisesCompleted,
          streak_3: streak.current >= 3,
          streak_7: streak.current >= 7,
          streak_14: streak.current >= 14,
          streak_30: streak.current >= 30,
          workouts_5: totalWorkouts >= 5,
          workouts_10: totalWorkouts >= 10,
          workouts_25: totalWorkouts >= 25,
          workouts_50: totalWorkouts >= 50,
          workouts_100: totalWorkouts >= 100,
          level_5: levelInfo.level >= 5,
          level_10: levelInfo.level >= 10,
          minutes_60_total: totalMinutes >= 60,
          minutes_300_total: totalMinutes >= 300,
          first_feedback: history.some((h) => h.feedback !== null),
          feedback_normal_5: normalFeedbacks >= 5,
          intermediate_fitness: state.profile?.fitnessLevel === 'intermediate',
          advanced_fitness: state.profile?.fitnessLevel === 'advanced',
        };

        let bonusXp = 0;
        for (const [id, condition] of Object.entries(checks)) {
          if (condition && !unlocked.has(id)) {
            unlocked.add(id);
            newUnlocks.push(id);
            const def = ACHIEVEMENTS.find((a) => a.id === id);
            if (def) bonusXp += def.xpReward;
          }
        }

        if (newUnlocks.length > 0) {
          set({
            unlockedAchievements: [...unlocked],
            totalXp: state.totalXp + bonusXp,
            recentlyUnlocked: newUnlocks,
          });
        }
        return newUnlocks;
      },

      clearRecentUnlocks: () => set({ recentlyUnlocked: [] }),

      // --- LAB TESTS ---
      labTestEntries: [] as LabTestEntry[],
      addLabTestEntry: (results: Record<string, number>) =>
        set((state) => ({
          labTestEntries: [
            ...state.labTestEntries,
            {
              id: `lab_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              results,
            },
          ],
        })),
      removeLabTestEntry: (id: string) =>
        set((state) => ({
          labTestEntries: state.labTestEntries.filter((e) => e.id !== id),
        })),

      // --- BODY METRICS ---
      bodyMetrics: [] as BodyMetricEntry[],
      addBodyMetric: (m) =>
        set((state) => ({
          bodyMetrics: [
            ...state.bodyMetrics,
            {
              ...m,
              id: `metric_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
            },
          ],
        })),
      removeBodyMetric: (id: string) =>
        set((state) => ({
          bodyMetrics: state.bodyMetrics.filter((e) => e.id !== id),
        })),

      // --- ADMIN ---
      customExercises: [] as ExerciseConfig[],
      addCustomExercise: (ex) =>
        set((s) => ({ customExercises: [...s.customExercises, ex] })),
      updateCustomExercise: (id, patch) =>
        set((s) => ({
          customExercises: s.customExercises.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),
      removeCustomExercise: (id) =>
        set((s) => ({
          customExercises: s.customExercises.filter((e) => e.id !== id),
        })),

      // Reset
      resetAll: () =>
        set({
          screen: 'onboarding',
          onboardingStep: 0,
          isOnboarded: false,
          profile: makeDefaultProfile() as UserProfile,
          currentPlan: null,
          workoutSession: null,
          lastFeedback: null,
          workoutNotCounted: false,
          consecutiveHardCount: 0,
          history: [],
          missedDays: 0,
          periodizationWeek: 0,
          totalXp: 0,
          unlockedAchievements: [],
          recentlyUnlocked: [],
          labTestEntries: [],
          bodyMetrics: [],
          customExercises: [],
        }),
    }),
    {
      name: 'fitcoach-storage',
      partialize: (state) => ({
        screen: state.isOnboarded ? state.screen : 'onboarding',
        onboardingStep: state.onboardingStep,
        isOnboarded: state.isOnboarded,
        profile: state.profile,
        currentPlan: state.currentPlan,
        lastFeedback: state.lastFeedback,
        consecutiveHardCount: state.consecutiveHardCount,
        history: state.history,
        missedDays: state.missedDays,
        periodizationWeek: state.periodizationWeek,
        totalXp: state.totalXp,
        unlockedAchievements: state.unlockedAchievements,
        labTestEntries: state.labTestEntries,
        bodyMetrics: state.bodyMetrics,
        customExercises: state.customExercises,
      }),
    },
  ),
);