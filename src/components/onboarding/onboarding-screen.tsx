'use client';

import { useAppStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles } from 'lucide-react';
import { StepProfile } from './step-profile';
import { StepGoal } from './step-goal';
import { StepInventory } from './step-inventory';
import { StepLevel } from './step-level';
import { motion, AnimatePresence } from 'framer-motion';

const TOTAL_STEPS = 4;

const STEP_TITLES = ['Ваш профиль', 'Ваша цель', 'Инвентарь', 'Исходный уровень'];

export function OnboardingScreen() {
  const { onboardingStep, setOnboardingStep, completeOnboarding, profile } = useAppStore();
  const progress = ((onboardingStep + 1) / TOTAL_STEPS) * 100;
  const isLastStep = onboardingStep === TOTAL_STEPS - 1;
  const isFirstStep = onboardingStep === 0;

  function canProceed(): boolean {
    switch (onboardingStep) {
      case 0:
        return !!(
          profile?.gender &&
          profile?.age > 0 &&
          profile?.height > 0 &&
          profile?.weight > 0
        );
      case 1:
        return !!profile?.goal;
      case 2:
        return true; // inventory can be empty
      case 3:
        return profile?.comfortableMinutes !== undefined && profile?.comfortableMinutes > 0;
      default:
        return false;
    }
  }

  function handleNext() {
    if (isLastStep) {
      completeOnboarding();
    } else {
      setOnboardingStep(onboardingStep + 1);
    }
  }

  function handleBack() {
    if (!isFirstStep) {
      setOnboardingStep(onboardingStep - 1);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-muted-foreground">
            Шаг {onboardingStep + 1} из {TOTAL_STEPS}
          </h2>
          <span className="text-xs text-muted-foreground">{STEP_TITLES[onboardingStep]}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={onboardingStep}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-full overflow-y-auto px-6 pb-4"
          >
            {onboardingStep === 0 && <StepProfile />}
            {onboardingStep === 1 && <StepGoal />}
            {onboardingStep === 2 && <StepInventory />}
            {onboardingStep === 3 && <StepLevel />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-6 pt-3 flex gap-3">
        {!isFirstStep && (
          <Button
            variant="outline"
            className="flex-1 h-12 text-base"
            onClick={handleBack}
          >
            Назад
          </Button>
        )}
        <Button
          className="flex-1 h-12 text-base font-semibold"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {isLastStep ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Начать
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Далее
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}