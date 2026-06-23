'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EXERCISE_CATALOG, MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/lib/exercises';
import { ArrowLeft, Dumbbell, Zap, Waves } from 'lucide-react';
import { motion } from 'framer-motion';

// Simple SVG stick-figure illustrations for key exercises
const EXERCISE_ILLUSTRATIONS: Record<string, React.ReactNode> = {
  squat: (
    <svg viewBox="0 0 120 140" className="w-full h-full" fill="none">
      {/* Stick figure squatting */}
      <circle cx="60" cy="22" r="10" className="fill-primary/20 stroke-primary" strokeWidth="2.5"/>
      <line x1="60" y1="32" x2="60" y2="70" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Arms forward */}
      <line x1="60" y1="45" x2="38" y2="55" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="45" x2="82" y2="55" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Legs bent */}
      <line x1="60" y1="70" x2="40" y2="85" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="40" y1="85" x2="30" y2="115" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="70" x2="80" y2="85" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="80" y1="85" x2="90" y2="115" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Floor line */}
      <line x1="15" y1="118" x2="105" y2="118" className="stroke-muted" strokeWidth="1" strokeDasharray="4 3"/>
      {/* Direction arrow */}
      <path d="M25 100 L25 80" className="stroke-amber-500" strokeWidth="2" markerEnd="url(#arrowhead)"/>
      <path d="M95 100 L95 80" className="stroke-amber-500" strokeWidth="2" markerEnd="url(#arrowhead)"/>
      <defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" className="fill-amber-500"/></marker></defs>
    </svg>
  ),
  push_up: (
    <svg viewBox="0 0 120 100" className="w-full h-full" fill="none">
      <circle cx="90" cy="35" r="8" className="fill-primary/20 stroke-primary" strokeWidth="2.5"/>
      <line x1="90" y1="43" x2="60" y2="55" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="55" x2="30" y2="55" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="30" y1="55" x2="25" y2="75" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="55" x2="65" y2="75" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="78" x2="105" y2="78" className="stroke-muted" strokeWidth="1" strokeDasharray="4 3"/>
      <path d="M65 68 L65 50" className="stroke-amber-500" strokeWidth="2" markerEnd="url(#arrowup)"/>
      <defs><marker id="arrowup" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" className="fill-amber-500"/></marker></defs>
    </svg>
  ),
  row: (
    <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
      <circle cx="55" cy="25" r="8" className="fill-primary/20 stroke-primary" strokeWidth="2.5"/>
      <line x1="55" y1="33" x2="50" y2="55" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="50" y1="55" x2="60" y2="75" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="75" x2="55" y2="105" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="75" x2="75" y2="105" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Arm pulling */}
      <line x1="50" y1="45" x2="80" y2="55" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="50" y1="45" x2="75" y2="40" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="108" x2="105" y2="108" className="stroke-muted" strokeWidth="1" strokeDasharray="4 3"/>
      <path d="M80 55 L70 48" className="stroke-amber-500" strokeWidth="2" markerEnd="url(#arrowpull)"/>
      <defs><marker id="arrowpull" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" className="fill-amber-500"/></marker></defs>
    </svg>
  ),
  plank: (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      <circle cx="25" cy="32" r="8" className="fill-primary/20 stroke-primary" strokeWidth="2.5"/>
      <line x1="33" y1="32" x2="55" y2="40" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="55" y1="40" x2="95" y2="40" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="55" y1="40" x2="45" y2="65" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="95" y1="40" x2="105" y2="65" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Elbow support */}
      <rect x="40" y="38" width="8" height="12" rx="2" className="fill-primary/10 stroke-primary" strokeWidth="1.5"/>
      <line x1="15" y1="68" x2="115" y2="68" className="stroke-muted" strokeWidth="1" strokeDasharray="4 3"/>
      <text x="60" y="22" textAnchor="middle" className="fill-amber-500 text-[8px] font-medium">держать прямую линию</text>
      <line x1="25" y1="26" x2="105" y2="35" className="stroke-amber-500" strokeWidth="1" strokeDasharray="3 2"/>
    </svg>
  ),
  lunge: (
    <svg viewBox="0 0 120 130" className="w-full h-full" fill="none">
      <circle cx="60" cy="15" r="8" className="fill-primary/20 stroke-primary" strokeWidth="2.5"/>
      <line x1="60" y1="23" x2="60" y2="60" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="35" x2="42" y2="50" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="35" x2="78" y2="50" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="60" x2="40" y2="80" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="40" y1="80" x2="35" y2="110" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="60" x2="80" y2="80" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="80" y1="80" x2="85" y2="110" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="112" x2="105" y2="112" className="stroke-muted" strokeWidth="1" strokeDasharray="4 3"/>
      <path d="M88 108 L88 88" className="stroke-amber-500" strokeWidth="2" markerEnd="url(#arrowlunge)"/>
      <defs><marker id="arrowlunge" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" className="fill-amber-500"/></marker></defs>
    </svg>
  ),
  shoulder_press: (
    <svg viewBox="0 0 120 130" className="w-full h-full" fill="none">
      <circle cx="60" cy="20" r="8" className="fill-primary/20 stroke-primary" strokeWidth="2.5"/>
      <line x1="60" y1="28" x2="60" y2="70" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="70" x2="45" y2="110" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="70" x2="75" y2="110" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="40" x2="35" y2="25" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="40" x2="85" y2="25" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="112" x2="105" y2="112" className="stroke-muted" strokeWidth="1" strokeDasharray="4 3"/>
      <path d="M38 22 L38 12" className="stroke-amber-500" strokeWidth="2" markerEnd="url(#arrowpress)"/>
      <path d="M82 22 L82 12" className="stroke-amber-500" strokeWidth="2" markerEnd="url(#arrowpress)"/>
      <defs><marker id="arrowpress" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" className="fill-amber-500"/></marker></defs>
    </svg>
  ),
  deadlift: (
    <svg viewBox="0 0 120 130" className="w-full h-full" fill="none">
      <circle cx="60" cy="18" r="8" className="fill-primary/20 stroke-primary" strokeWidth="2.5"/>
      <line x1="60" y1="26" x2="55" y2="55" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="55" y1="55" x2="55" y2="80" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="55" y1="80" x2="45" y2="110" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="55" y1="80" x2="70" y2="110" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="55" y1="45" x2="30" y2="65" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="55" y1="45" x2="80" y2="65" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="112" x2="105" y2="112" className="stroke-muted" strokeWidth="1" strokeDasharray="4 3"/>
      <path d="M60 108 L60 78" className="stroke-amber-500" strokeWidth="2" markerEnd="url(#arrowdl)"/>
      <defs><marker id="arrowdl" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" className="fill-amber-500"/></marker></defs>
    </svg>
  ),
  bridge: (
    <svg viewBox="0 0 120 90" className="w-full h-full" fill="none">
      <circle cx="40" cy="30" r="8" className="fill-primary/20 stroke-primary" strokeWidth="2.5"/>
      <line x1="48" y1="35" x2="75" y2="50" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="55" x2="75" y2="50" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="75" y1="50" x2="100" y2="55" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="55" x2="15" y2="75" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="100" y1="55" x2="105" y2="75" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="78" x2="105" y2="78" className="stroke-muted" strokeWidth="1" strokeDasharray="4 3"/>
      <path d="M60 48 L60 38" className="stroke-amber-500" strokeWidth="2" markerEnd="url(#arrowbr)"/>
      <defs><marker id="arrowbr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" className="fill-amber-500"/></marker></defs>
    </svg>
  ),
  // Default for exercises without custom illustration
  _default: (
    <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
      <circle cx="60" cy="35" r="12" className="fill-primary/20 stroke-primary" strokeWidth="2.5"/>
      <line x1="60" y1="47" x2="60" y2="80" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="55" x2="35" y2="70" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="55" x2="85" y2="70" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="80" x2="42" y2="108" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="80" x2="78" y2="108" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="110" x2="100" y2="110" className="stroke-muted" strokeWidth="1" strokeDasharray="4 3"/>
    </svg>
  ),
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  strength: Dumbbell,
  cardio: Zap,
  flexibility: Waves,
};

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Силовые',
  cardio: 'Кардио',
  flexibility: 'Гибкость',
};

export function ExerciseGuideScreen() {
  const { selectedExerciseId, setScreen } = useAppStore();
  const exercise = EXERCISE_CATALOG.find((e) => e.id === selectedExerciseId);

  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-muted-foreground">Упражнение не найдено</p>
        <Button variant="outline" className="mt-4" onClick={() => setScreen('dashboard')}>
          Назад
        </Button>
      </div>
    );
  }

  const illustration = EXERCISE_ILLUSTRATIONS[exercise.id] ?? EXERCISE_ILLUSTRATIONS._default;
  const CategoryIcon = CATEGORY_ICONS[exercise.category] ?? Dumbbell;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setScreen('dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{exercise.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-[10px] gap-1">
              <CategoryIcon className="w-3 h-3" />
              {CATEGORY_LABELS[exercise.category]}
            </Badge>
            <span className="text-xs text-muted-foreground">{exercise.difficultyLevel === 'beginner' ? 'Новичок' : exercise.difficultyLevel === 'intermediate' ? 'Средний' : 'Продвинутый'}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
        {/* Illustration */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="h-40 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
              {illustration}
            </div>
          </CardContent>
        </Card>

        {/* Muscle groups */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Работающие мышцы</h3>
          <div className="flex flex-wrap gap-1.5">
            {exercise.primaryMuscleGroups.map((g) => (
              <Badge key={g} className="text-xs">{MUSCLE_LABELS[g] ?? g}</Badge>
            ))}
            {exercise.secondaryMuscleGroups.map((g) => (
              <Badge key={g} variant="outline" className="text-xs text-muted-foreground">{MUSCLE_LABELS[g] ?? g}</Badge>
            ))}
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Как выполнять</h3>
          <div className="space-y-2.5">
            {exercise.instructions.map((step, i) => (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3 items-start"
              >
                <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Available variants */}
        {exercise.variants.length > 1 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Варианты выполнения</h3>
            <div className="space-y-2">
              {exercise.variants.map((v) => (
                <div key={v.variantId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate">{v.variantName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {EQUIPMENT_LABELS[v.requiredEquipment]} · {v.adjustments.repRange.min}–{v.adjustments.repRange.max} повт.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}