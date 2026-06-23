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
  calculateSets,
} from './workout-engine';
import type { EquipmentType, FitnessLevel, ExerciseConfig } from './exercises';
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
  | 'admin';

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

const defaultSession = (): WorkoutSession => ({
  currentExerciseIndex: 0,
  currentSet: 0,
  isResting: false,
  restSecondsLeft: 0,
  startTime: Date.now(),
  exerciseTimings: [],
});

const REST_DURATION = 60; // seconds between sets

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
        const level = calculateFitnessLevel(state.profile);
        const updatedProfile = { ...state.profile, fitnessLevel: level };
        set({ isOnboarded: true, profile: updatedProfile, screen: 'dashboard' });
        // Auto-generate first plan
        const plan = generateWorkout(updatedProfile, state.customExercises);
        set({ currentPlan: plan });
      },

      // Workout plan
      currentPlan: null,
      generateNewPlan: () => {
        const state = get();
        if (!state.profile) return;

        let plan: ReturnType<typeof generateWorkout>;

        if (state.currentPlan && state.lastFeedback && state.history.length > 0) {
          const multiplier = getAdaptiveMultiplier(
            state.lastFeedback,
            state.missedDays,
            state.consecutiveHardCount,
          );
          const adapted = applyAdaptiveLoad(state.currentPlan.exercises, multiplier);
          plan = {
            ...state.currentPlan,
            id: `plan_${Date.now()}`,
            exercises: adapted,
            createdAt: Date.now(),
          };
        } else {
          plan = generateWorkout(state.profile, state.customExercises);
        }

        set({ currentPlan: plan });
      },

      // Active workout
      workoutSession: null,
      startWorkout: () => {
        // Just navigate to preview — actual start happens via beginWorkout
        set({ screen: 'workout_preview' });
      },
      beginWorkout: () => {
        const state = get();
        if (!state.currentPlan) return;
        const profile = state.profile;
        const sets = profile ? calculateSets(profile.fitnessLevel) : 3;
        const newSets = state.currentPlan.exercises.map((ex) => ({
          ...ex,
          targetSets: sets,
          completedSets: 0,
          setResults: [] as { reps: number; rpe?: number }[],
        }));
        // Record start time for first exercise
        const firstTiming: ExerciseTiming = {
          exerciseConfigId: state.currentPlan.exercises[0]?.exerciseConfigId ?? '',
          startedAt: Date.now(),
          finishedAt: Date.now(),
          totalRepsDone: 0,
          totalSeconds: 0,
        };
        set({
          screen: 'workout',
          workoutSession: { ...defaultSession(), exerciseTimings: [firstTiming] },
          currentPlan: { ...state.currentPlan, exercises: newSets },
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

          return {
            currentPlan: { ...state.currentPlan, exercises },
            workoutSession: {
              ...state.workoutSession,
              isResting: !(isLastSet && isLastExercise),
              restSecondsLeft: isLastSet && isLastExercise ? 0 : REST_DURATION,
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

          return {
            currentPlan: { ...state.currentPlan, exercises },
            workoutSession: {
              ...state.workoutSession,
              isResting: !(isLastSet && isLastExercise),
              restSecondsLeft: isLastSet && isLastExercise ? 0 : REST_DURATION,
              currentSet: isLastSet ? 0 : currentSet + 1,
            },
          };
        }),
      startRest: () =>
        set((state) => ({
          workoutSession: state.workoutSession
            ? { ...state.workoutSession, isResting: true, restSecondsLeft: REST_DURATION }
            : null,
        })),
      tickRest: () =>
        set((state) => {
          if (!state.workoutSession || !state.workoutSession.isResting) return state;
          const left = state.workoutSession.restSecondsLeft - 1;
          if (left <= 0) {
            const { currentExerciseIndex, currentSet } = state.workoutSession;
            const plan = state.currentPlan!;
            const exercise = plan.exercises[currentExerciseIndex];
            const isLastSet = currentSet >= exercise.targetSets;
            if (isLastSet && currentExerciseIndex < plan.exercises.length - 1) {
              return {
                workoutSession: {
                  ...state.workoutSession,
                  isResting: false,
                  currentExerciseIndex: currentExerciseIndex + 1,
                  currentSet: 0,
                },
              };
            }
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
                  repsPerMinute,
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
              // This timing was never finalized — do it now
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
            (s, ex) => s + ex.setResults.filter((r) => r.reps > 0).length, 0,
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
                repsPerMinute,
              };
            }),
            durationMin: duration,
          };

          // Proportional XP: base 100 * completion ratio
          const baseXp = Math.round(100 * completionPct);
          // Bonus for 100% completion
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
          // Don't process feedback for uncounted workouts
          set({ screen: 'dashboard', workoutNotCounted: false });
          return;
        }
        const newConsecutive = f === 'very_hard'
          ? state.consecutiveHardCount + 1
          : 0;
        // Update last history entry
        const history = [...state.history];
        if (history.length > 0) {
          history[history.length - 1] = { ...history[history.length - 1], feedback: f };
        }

        set({
          lastFeedback: f,
          consecutiveHardCount: newConsecutive,
          history,
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

        // Count normal feedbacks
        const normalFeedbacks = history.filter((h) => h.feedback === 'normal').length;

        // Check last workout for cardio and all-completed
        const lastEntry = history.length > 0 ? history[history.length - 1] : null;
        const hadCardio = lastEntry
          ? state.currentPlan?.exercises.some(
              (ex) => ex.category === 'cardio' && lastEntry.exercises.some((e) => e.name === ex.exerciseName && e.completed),
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
            { ...m, id: `metric_${Date.now()}`, date: new Date().toISOString().split('T')[0] },
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
        set((s) => ({ customExercises: s.customExercises.filter((e) => e.id !== id) })),

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
        totalXp: state.totalXp,
        unlockedAchievements: state.unlockedAchievements,
        labTestEntries: state.labTestEntries,
        bodyMetrics: state.bodyMetrics,
        customExercises: state.customExercises,
      }),
    },
  ),
);