'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MUSCLE_LABELS, EQUIPMENT_LABELS, type FitnessLevel } from '@/lib/exercises';
import {
  Play, RotateCcw, Clock, Dumbbell, TrendingUp, Flame,
  ChevronRight, Zap, Calendar, BookOpen, Trophy, Star, Sparkles,
} from 'lucide-react';
import { getLevelInfo, getLevelTitle, calculateStreak, ACHIEVEMENTS as ACHIEVEMENT_DEF } from '@/lib/achievements';
import { PHASE_CONFIG, TOTAL_CYCLE_WEEKS, TRAINING_METHODS, type PeriodizationPhase } from '@/lib/training-science';

const LEVEL_LABELS: Record<FitnessLevel, string> = {
  beginner: 'Новичок',
  intermediate: 'Продолжающий',
  advanced: 'Продвинутый',
};

const LEVEL_COLORS: Record<FitnessLevel, string> = {
  beginner: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  advanced: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

const GOAL_LABELS: Record<string, string> = {
  maintain: 'Поддержание формы',
  lose_weight: 'Снижение веса',
  muscle_tone: 'Тонус мышц',
  flexibility: 'Гибкость',
};

export function DashboardScreen() {
  const {
    profile,
    currentPlan,
    startWorkout,
    generateNewPlan,
    history,
    setScreen,
    openExerciseGuide,
    totalXp,
    unlockedAchievements,
  } = useAppStore();

  if (!profile) return null;

  // If no plan yet, show generate button
  if (!currentPlan || currentPlan.exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="text-center space-y-2">
          <Zap className="w-10 h-10 mx-auto text-primary" />
          <h2 className="text-lg font-bold">Готовы к тренировке!</h2>
          <p className="text-sm text-muted-foreground">
            Нажмите кнопку ниже, чтобы сгенерировать план тренировки
            на основе вашего уровня и инвентаря.
          </p>
        </div>
        <Button onClick={generateNewPlan} className="w-full max-w-xs">
          <Sparkles className="w-4 h-4 mr-2" />
          Сгенерировать план
        </Button>
      </div>
    );
  }

  const completedCount = history.length;
  const totalExercises = currentPlan.exercises.length;
  const estMinutes = currentPlan.estimatedDurationMin;

  // Gamification data
  const levelInfo = getLevelInfo(totalXp);
  const streak = calculateStreak(history.map((h) => h.date));
  const nextAchievement = (() => {
    const locked = ACHIEVEMENT_DEF.filter((a) => !unlockedAchievements.includes(a.id));
    return locked.length > 0 ? locked[0] : null;
  })();

  // This week's activity (simplified)
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-24 overflow-y-auto h-full min-h-0">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Привет! 👋
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className={LEVEL_COLORS[profile.fitnessLevel]}>
            {LEVEL_LABELS[profile.fitnessLevel]}
          </Badge>
          <span className="text-sm text-muted-foreground">{GOAL_LABELS[profile.goal]}</span>
        </div>
      </div>

      {/* XP & Level mini card */}
      <button
        onClick={() => setScreen('achievements')}
        className="w-full text-left"
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">{levelInfo.level}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{getLevelTitle(levelInfo.level)}</span>
                  <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                    <Zap className="w-3 h-3" />{totalXp} XP
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${levelInfo.progress * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {streak.current > 0 ? `🔥 ${streak.current} дн. серия` : `Следующее: ${nextAchievement?.name ?? '—'}`}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </button>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <div className="text-xl font-bold">{completedCount}</div>
            <div className="text-[10px] text-muted-foreground">Тренировок</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <div className="text-xl font-bold">{weekDays[dayOfWeek]}</div>
            <div className="text-[10px] text-muted-foreground">Сегодня</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <div className="text-xl font-bold">{estMinutes}</div>
            <div className="text-[10px] text-muted-foreground">Мин. план</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's workout card */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold">Тренировка на сегодня</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalExercises} упражнений · ~{estMinutes} мин
                </p>
              </div>
              <div className="p-2 rounded-xl bg-primary text-primary-foreground shrink-0">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            {/* Scientific: Periodization phase badge */}
            {currentPlan.periodizationPhase && (
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`text-[10px] font-semibold ${PHASE_CONFIG[currentPlan.periodizationPhase as PeriodizationPhase]?.badgeClass ?? ''}`}>
                  {PHASE_CONFIG[currentPlan.periodizationPhase as PeriodizationPhase]?.nameRu}
                </Badge>
                {currentPlan.workoutType && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {currentPlan.workoutType}
                  </span>
                )}
              </div>
            )}

            {/* Scientific: Block progress */}
            {currentPlan.blockNumber && currentPlan.weekInBlock && (
              <div className="flex items-center gap-2 mb-3 text-[10px] text-muted-foreground">
                <span>Блок {currentPlan.blockNumber}</span>
                <span>·</span>
                <span>Неделя {currentPlan.weekInBlock} из {PHASE_CONFIG[currentPlan.periodizationPhase as PeriodizationPhase]?.weeksDuration ?? '?'}</span>
                <span>·</span>
                <span>Цикл {((currentPlan.totalCycleWeeks ?? TOTAL_CYCLE_WEEKS))} нед.</span>
              </div>
            )}

            {/* Exercise preview list */}
            <div className="space-y-2 mb-5">
              {currentPlan.exercises.slice(0, 4).map((ex, i) => (
                <div
                  key={ex.exerciseConfigId}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-background/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {ex.category === 'cardio' && <Zap className="w-3 h-3 text-orange-500 shrink-0" />}
                        <span className="text-sm font-medium truncate">{ex.exerciseName}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {ex.variantName}
                      </div>
                    </div>
                    <button
                      onClick={() => openExerciseGuide(ex.exerciseConfigId)}
                      className="p-1.5 rounded-lg hover:bg-muted shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 ml-2">
                    {ex.durationSeconds
                      ? `${Math.round(ex.durationSeconds / 60)} мин`
                      : `${ex.targetSets} × ${ex.targetReps}`}
                    {ex.recommendedWeightLabel && (
                      <span className="text-[10px] text-primary/70 ml-1">· {ex.recommendedWeightLabel}</span>
                    )}
                    {ex.restSeconds && ex.restSeconds !== 60 && (
                      <span className="text-[9px] text-muted-foreground/60 ml-1">
                        · {ex.restSeconds}с
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {totalExercises > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  + ещё {totalExercises - 4} упражнений
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                className="flex-1 h-12 text-base font-semibold gap-2"
                onClick={startWorkout}
              >
                <Play className="w-4 h-4" />
                Начать
              </Button>
              <Button
                variant="outline"
                className="h-12 px-4"
                onClick={generateNewPlan}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent history */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Последние тренировки</h3>
            <button
              onClick={() => setScreen('progress')}
              className="text-xs text-primary font-medium flex items-center gap-1"
            >
              Все <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {history.slice(-3).reverse().map((h) => (
            <Card key={h.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{h.date}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {h.exercises.filter((e) => e.completed).length}/{h.exercises.length} выполнено · {h.durationMin} мин
                  </div>
                </div>
                {h.feedback && (
                  <Badge variant="secondary" className="text-[10px]">
                    {h.feedback === 'easier' && 'Легко'}
                    {h.feedback === 'normal' && 'Нормально'}
                    {h.feedback === 'harder' && 'Тяжело'}
                    {h.feedback === 'very_hard' && 'Очень тяжело'}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}