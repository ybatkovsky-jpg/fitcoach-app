'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/lib/exercises';
import type { FitnessLevel } from '@/lib/exercises';
import {
  User, Dumbbell, Target, Activity, Calendar, RotateCcw,
  ChevronRight, Trophy, Flame,
} from 'lucide-react';

const LEVEL_LABELS: Record<FitnessLevel, string> = {
  beginner: 'Новичок',
  intermediate: 'Продолжающий',
  advanced: 'Продвинутый',
};

const GOAL_LABELS: Record<string, string> = {
  maintain: 'Поддержание формы',
  lose_weight: 'Снижение веса',
  muscle_tone: 'Тонус мышц',
  flexibility: 'Гибкость',
};

export function ProfileScreen() {
  const { profile, history, currentPlan, generateNewPlan, setScreen, resetAll } = useAppStore();

  if (!profile) return null;

  const totalWorkouts = history.length;
  const totalMinutes = history.reduce((s, h) => s + h.durationMin, 0);
  const avgFeedback = (() => {
    const fb = history.filter((h) => h.feedback);
    if (fb.length === 0) return null;
    const avg =
      fb.reduce((s, h) => {
        const map = { easier: 2, normal: 3, harder: 4, very_hard: 5 };
        return s + (map[h.feedback!] ?? 3);
      }, 0) / fb.length;
    if (avg <= 2.5) return 'Легко';
    if (avg <= 3.5) return 'Нормально';
    if (avg <= 4.2) return 'Тяжело';
    return 'Очень тяжело';
  })();

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-24 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold tracking-tight">Профиль</h1>

      {/* User info card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  {profile.gender === 'male' ? 'Мужчина' : 'Женщина'}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {LEVEL_LABELS[profile.fitnessLevel]}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {profile.age} лет · {profile.height} см · {profile.weight} кг
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Цель:</span>
              <span className="font-medium">{GOAL_LABELS[profile.goal]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">RPE:</span>
              <span className="font-medium">
                {Math.round((profile.rpeSquat + profile.rpePushUp + profile.rpePlank) / 3)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Активность:</span>
              <span className="font-medium">{profile.comfortableMinutes} мин</span>
            </div>
            {avgFeedback && (
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">В среднем:</span>
                <span className="font-medium">{avgFeedback}</span>
              </div>
            )}
          </div>

          {profile.medicalRestrictions && (
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg px-3 py-2">
              ⚠️ Есть медицинские ограничения
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold">{totalWorkouts}</div>
            <div className="text-xs text-muted-foreground">Тренировок</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{totalMinutes}</div>
            <div className="text-xs text-muted-foreground">Минут всего</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2">Инвентарь</h3>
          {profile.inventory.length === 0 ? (
            <p className="text-xs text-muted-foreground">Без инвентаря (собственный вес)</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.inventory.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {EQUIPMENT_LABELS[t]}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adaptive algorithm info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">Адаптивный алгоритм</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Нагрузка корректируется на основе ваших отзывов. «Нормально» — нагрузка растёт на 5–10%.
            «Тяжело» — стабилизация. «Очень тяжело» 2 раза подряд — разгрузочная неделя.
            Пропуски свыше 3 дней — мягкое снижение до 80%.
          </p>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">История тренировок</h3>
          {history.slice().reverse().map((h) => (
            <Card key={h.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{h.date}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {h.durationMin} мин
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {h.exercises.filter((e) => e.completed).length}/{h.exercises.length} упражнений
                  {h.feedback && ` · Оценка: ${h.feedback === 'easier' ? 'Легко' : h.feedback === 'normal' ? 'Нормально' : h.feedback === 'harder' ? 'Тяжело' : 'Очень тяжело'}`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            generateNewPlan();
            setScreen('dashboard');
          }}
        >
          <RotateCcw className="w-4 h-4" />
          Сгенерировать новый план
        </Button>
        <Button
          variant="destructive"
          className="w-full"
          onClick={resetAll}
        >
          Сбросить данные
        </Button>
      </div>
    </div>
  );
}