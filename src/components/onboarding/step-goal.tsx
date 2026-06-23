'use client';

import { useAppStore } from '@/lib/store';
import { Target, Heart, Dumbbell, StretchHorizontal } from 'lucide-react';
import type { FitnessLevel } from '@/lib/exercises';

const GOALS = [
  {
    value: 'maintain' as const,
    label: 'Поддержание формы',
    desc: 'Сохранить текущий уровень и укрепить здоровье',
    icon: Heart,
  },
  {
    value: 'lose_weight' as const,
    label: 'Снижение веса',
    desc: 'Активные тренировки для похудения и жиросжигания',
    icon: Target,
  },
  {
    value: 'muscle_tone' as const,
    label: 'Тонус мышц',
    desc: 'Укрепление и увеличение мышечной массы',
    icon: Dumbbell,
  },
  {
    value: 'flexibility' as const,
    label: 'Гибкость',
    desc: 'Растяжка, мобильность суставов и баланс',
    icon: StretchHorizontal,
  },
];

export function StepGoal() {
  const { profile, setProfileField } = useAppStore();

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Выберите цель</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Мы подберём программу под ваш фокус
        </p>
      </div>

      <div className="space-y-3">
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          const selected = profile?.goal === goal.value;
          return (
            <button
              key={goal.value}
              onClick={() => setProfileField('goal', goal.value)}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                selected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-muted bg-background hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{goal.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{goal.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}