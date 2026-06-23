'use client';

import { useAppStore, type WorkoutFeedback } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Smile, Meh, Frown, Angry } from 'lucide-react';

const FEEDBACK_OPTIONS: {
  value: WorkoutFeedback;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}[] = [
  {
    value: 'easier',
    label: 'Легче ожидаемого',
    desc: 'Чувствую, что мог бы больше',
    icon: Smile,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    value: 'normal',
    label: 'Нормально',
    desc: 'То, что и планировалось',
    icon: Meh,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    value: 'harder',
    label: 'Тяжелее ожидаемого',
    desc: 'Пришлось попотеть',
    icon: Frown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    value: 'very_hard',
    label: 'Очень тяжело',
    desc: 'Не мог завершить всё',
    icon: Angry,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
];

export function FeedbackScreen() {
  const { setFeedback, history } = useAppStore();

  const lastSession = history.length > 0 ? history[history.length - 1] : null;
  const completedCount = lastSession?.exercises.filter((e) => e.completed).length ?? 0;
  const totalCount = lastSession?.exercises.length ?? 0;

  return (
    <div className="flex flex-col h-full px-5 pt-6 pb-6 overflow-y-auto min-h-0">
      <div className="text-center mb-6 pt-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
        >
          <span className="text-3xl">🏆</span>
        </motion.div>
        <h1 className="text-2xl font-bold">Тренировка завершена!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Выполнено {completedCount} из {totalCount} упражнений
        </p>
      </div>

      <div className="space-y-4 flex-1">
        <h2 className="text-center text-sm font-medium text-muted-foreground">
          Как прошла тренировка?
        </h2>
        <div className="space-y-3">
          {FEEDBACK_OPTIONS.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.value}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => setFeedback(opt.value)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-muted bg-background hover:border-primary/30 hover:shadow-sm transition-all text-left"
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${opt.bgColor}`}>
                  <Icon className={`w-5 h-5 ${opt.color}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}