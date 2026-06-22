'use client';

import { useAppStore, type AppScreen } from '@/lib/store';
import { Home, Dumbbell, BarChart3, User, Apple } from 'lucide-react';

const NAV_ITEMS: {
  screen: AppScreen;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { screen: 'dashboard', label: 'Главная', icon: Home },
  { screen: 'workout', label: 'Тренировка', icon: Dumbbell },
  { screen: 'nutrition', label: 'Питание', icon: Apple },
  { screen: 'profile', label: 'Профиль', icon: User },
];

export function BottomNav() {
  const { screen, setScreen, workoutSession, isOnboarded } = useAppStore();

  if (!isOnboarded || screen === 'onboarding' || screen === 'workout' || screen === 'feedback' || screen === 'exercise_guide') {
    return null;
  }

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
                onClick={() => setScreen(item.screen)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
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