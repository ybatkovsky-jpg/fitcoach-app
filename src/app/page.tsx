'use client';

import { useAppStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { DashboardScreen } from '@/components/screens/dashboard-screen';
import { WorkoutScreen } from '@/components/screens/workout-screen';
import { WorkoutPreviewScreen } from '@/components/screens/workout-preview-screen';
import { FeedbackScreen } from '@/components/screens/feedback-screen';
import { ProfileScreen } from '@/components/screens/profile-screen';
import { NutritionScreen } from '@/components/screens/nutrition-screen';
import { ExerciseGuideScreen } from '@/components/screens/exercise-guide-screen';
import { LabTestsScreen } from '@/components/screens/lab-tests-screen';
import { BodyMetricsScreen } from '@/components/screens/body-metrics-screen';
import { ProgressScreen } from '@/components/screens/progress-screen';
import { AchievementsScreen } from '@/components/screens/achievements-screen';
import { AdminScreen } from '@/components/screens/admin-screen';
import { KnowledgeScreen } from '@/components/screens/knowledge-screen';
import { InventoryEditScreen } from '@/components/screens/inventory-edit-screen';
import { BottomNav } from '@/components/screens/bottom-nav';
import { Dumbbell } from 'lucide-react';

const screenVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function Home() {
  const { screen } = useAppStore();

  const effectiveScreen = screen;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 via-background to-muted/30 p-4">
      {/* Phone frame */}
      <div className="relative w-full max-w-[400px] h-[780px] bg-background rounded-[2.5rem] shadow-2xl border border-muted/50 overflow-hidden flex flex-col">
        {/* Status bar */}
        <div className="flex items-center justify-between px-8 pt-3 pb-1 shrink-0">
          <span className="text-xs font-semibold tabular-nums">
            {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="w-24 h-6 bg-black rounded-full" />
          <div className="flex items-center gap-1">
            <div className="w-4 h-2.5 border border-foreground/60 rounded-sm relative">
              <div className="absolute inset-0.5 bg-foreground/60 rounded-[1px]" style={{ width: '60%' }} />
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {effectiveScreen === 'onboarding' && (
              <motion.div
                key="onboarding"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <div className="px-6 pt-4 pb-2 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-bold text-sm">FitCoach</span>
                </div>
                <OnboardingScreen />
              </motion.div>
            )}

            {effectiveScreen === 'dashboard' && (
              <motion.div
                key="dashboard"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <DashboardScreen />
              </motion.div>
            )}

            {effectiveScreen === 'workout_preview' && (
              <motion.div
                key="workout_preview"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <WorkoutPreviewScreen />
              </motion.div>
            )}

            {effectiveScreen === 'workout' && (
              <motion.div
                key="workout"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <WorkoutScreen />
              </motion.div>
            )}

            {effectiveScreen === 'feedback' && (
              <motion.div
                key="feedback"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <FeedbackScreen />
              </motion.div>
            )}

            {effectiveScreen === 'profile' && (
              <motion.div
                key="profile"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <ProfileScreen />
              </motion.div>
            )}

            {effectiveScreen === 'nutrition' && (
              <motion.div
                key="nutrition"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <NutritionScreen />
              </motion.div>
            )}

            {effectiveScreen === 'exercise_guide' && (
              <motion.div
                key="exercise_guide"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <ExerciseGuideScreen />
              </motion.div>
            )}

            {effectiveScreen === 'lab_tests' && (
              <motion.div
                key="lab_tests"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <LabTestsScreen />
              </motion.div>
            )}

            {effectiveScreen === 'body_metrics' && (
              <motion.div
                key="body_metrics"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <BodyMetricsScreen />
              </motion.div>
            )}

            {effectiveScreen === 'progress' && (
              <motion.div
                key="progress"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <ProgressScreen />
              </motion.div>
            )}

            {effectiveScreen === 'admin' && (
              <motion.div
                key="admin"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <AdminScreen />
              </motion.div>
            )}

            {effectiveScreen === 'achievements' && (
              <motion.div
                key="achievements"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <AchievementsScreen />
              </motion.div>
            )}

            {effectiveScreen === 'knowledge' && (
              <motion.div
                key="knowledge"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <KnowledgeScreen />
              </motion.div>
            )}

            {effectiveScreen === 'inventory_edit' && (
              <motion.div
                key="inventory_edit"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <InventoryEditScreen />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom nav (inside phone) */}
        <BottomNav />
      </div>
    </div>
  );
}