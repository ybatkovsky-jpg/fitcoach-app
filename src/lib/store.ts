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

// --- Screen types ---

export type AppScreen =
  | 'onboarding'
  | 'dashboard'
  | 'workout'
  | 'feedback'
  | 'profile'
  | 'nutrition'
  | 'exercise_guide';

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
      profile: {
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
      } as UserProfile,
      setProfileField: (key, value) =>
        set((state) => ({
          profile: {
            ...(state.profile ?? {
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
            }),
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
            // Auto-advance: if last set of exercise, go to next exercise
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
            // Workout complete
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
          return {
            screen: 'feedback',
            workoutSession: null,
            history: [...state.history, entry],
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
        set({
          lastFeedback: f,
          consecutiveHardCount: newConsecutive,
          history,
          screen: 'dashboard',
        });
      },
      consecutiveHardCount: 0,

      // History
      history: [],
      missedDays: 0,

      // Reset
      resetAll: () =>
        set({
          screen: 'onboarding',
          onboardingStep: 0,
          isOnboarded: false,
          profile: {
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
          } as UserProfile,
          currentPlan: null,
          workoutSession: null,
          lastFeedback: null,
          consecutiveHardCount: 0,
          history: [],
          missedDays: 0,
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
      }),
    },
  ),
);