'use client';

import { useAppStore, type AppScreen } from '@/lib/store';
import { Home, Dumbbell, BarChart3, User, Apple, Trophy } from 'lucide-react';

const NAV_ITEMS: {
  screen: AppScreen;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { screen: 'dashboard', label: 'Главная', icon: Home },
  { screen: 'workout', label: 'Тренировка', icon: Dumbbell },
  { screen: 'nutrition', label: 'Питание', icon: Apple },
  { screen: 'achievements', label: 'Достижения', icon: Trophy },
  { screen: 'profile', label: 'Профиль', icon: User },
];

export function BottomNav() {
  const { screen, setScreen, workoutSession, isOnboarded, startWorkout } = useAppStore();

  // Hide nav during onboarding, active workout, feedback, exercise guide, lab tests
  const hasActiveWorkout = screen === 'workout' && !!workoutSession;
  if (!isOnboarded || screen === 'onboarding' || hasActiveWorkout || screen === 'workout_preview' || screen === 'feedback' || screen === 'exercise_guide' || screen === 'lab_tests' || screen === 'body_metrics' || screen === 'progress') {
    return null;
  }

  const handleNavClick = (itemScreen: AppScreen) => {
    if (itemScreen === 'workout') {
      startWorkout();
    } else {
      setScreen(itemScreen);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-around h-16 bg-background/95 backdrop-blur-sm border-t">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = screen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => handleNavClick(item.screen)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}