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
import type { EquipmentType, FitnessLevel } from './exercises';
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
  | 'workout'
  | 'feedback'
  | 'profile'
  | 'nutrition'
  | 'exercise_guide'
  | 'lab_tests'
  | 'achievements';

// --- Workout session state ---

export interface WorkoutSession {
  currentExerciseIndex: number;
  currentSet: number;
  isResting: boolean;
  restSecondsLeft: number;
  startTime: number;
}

// --- History entry ---

export interface HistoryEntry {
  id: string;
  date: string;
  planId: string;
  feedback: WorkoutFeedback | null;
  exercises: { name: string; sets: number; reps: number; completed: boolean }[];
  durationMin: number;
}

// --- Lab test entry ---

export interface LabTestEntry {
  id: string;
  date: string;
  results: Record<string, number>; // biomarkerId -> value
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
  completeSet: (reps: number, rpe?: number) => void;
  skipSet: () => void;
  startRest: () => void;
  tickRest: () => void;
  nextExercise: () => void;
  finishWorkout: () => void;

  // Feedback
  lastFeedback: WorkoutFeedback | null;
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

  // Reset
  resetAll: () => void;
}

const defaultSession = (): WorkoutSession => ({
  currentExerciseIndex: 0,
  currentSet: 0,
  isResting: false,
  restSecondsLeft: 0,
  startTime: Date.now(),
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
        const plan = generateWorkout(updatedProfile);
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
          plan = generateWorkout(state.profile);
        }

        set({ currentPlan: plan });
      },

      // Active workout
      workoutSession: null,
      startWorkout: () => {
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
        set({
          screen: 'workout',
          workoutSession: defaultSession(),
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
          if (nextIdx >= state.currentPlan.exercises.length) {
            const duration = Math.round((Date.now() - state.workoutSession.startTime) / 60000);
            const entry: HistoryEntry = {
              id: `hist_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              planId: state.currentPlan.id,
              feedback: null,
              exercises: state.currentPlan.exercises.map((ex) => ({
                name: ex.exerciseName,
                sets: ex.targetSets,
                reps: ex.targetReps,
                completed: ex.completedSets >= ex.targetSets,
              })),
              durationMin: duration,
            };
            return {
              screen: 'feedback',
              workoutSession: null,
              history: [...state.history, entry],
            };
          }
          return {
            workoutSession: {
              ...state.workoutSession,
              currentExerciseIndex: nextIdx,
              currentSet: 0,
              isResting: false,
            },
          };
        }),
      finishWorkout: () =>
        set((state) => {
          const duration = state.workoutSession
            ? Math.round((Date.now() - state.workoutSession.startTime) / 60000)
            : 0;
          const entry: HistoryEntry = {
            id: `hist_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            planId: state.currentPlan?.id ?? '',
            feedback: null,
            exercises: state.currentPlan?.exercises.map((ex) => ({
              name: ex.exerciseName,
              sets: ex.targetSets,
              reps: ex.targetReps,
              completed: ex.completedSets >= ex.targetSets,
            })) ?? [],
            durationMin: duration,
          };

          // Award XP for workout completion
          let newXp = state.totalXp + 50; // base XP for completing a workout
          const newUnlocked = [...state.recentlyUnlocked];

          // Bonus for all exercises completed
          const allDone = entry.exercises.every((e) => e.completed);
          if (allDone) newXp += 25;

          // XP for each completed exercise
          const completedExCount = entry.exercises.filter((e) => e.completed).length;
          newXp += completedExCount * 5;

          return {
            screen: 'feedback',
            workoutSession: null,
            history: [...state.history, entry],
            totalXp: newXp,
            recentlyUnlocked: newUnlocked,
          };
        }),

      // Feedback
      lastFeedback: null,
      setFeedback: (f) => {
        const state = get();
        const newConsecutive = f === 'very_hard'
          ? state.consecutiveHardCount + 1
          : 0;
        // Update last history entry
        const history = [...state.history];
        if (history.length > 0) {
          history[history.length - 1] = { ...history[history.length - 1], feedback: f };
        }

        // Award XP for feedback
        let newXp = state.totalXp + 10;
        const newUnlocked = [...state.recentlyUnlocked];

        set({
          lastFeedback: f,
          consecutiveHardCount: newConsecutive,
          history,
          screen: 'dashboard',
          totalXp: newXp,
          recentlyUnlocked: newUnlocked,
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
          consecutiveHardCount: 0,
          history: [],
          missedDays: 0,
          totalXp: 0,
          unlockedAchievements: [],
          recentlyUnlocked: [],
          labTestEntries: [],
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
      }),
    },
  ),
);