'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  getLevelInfo,
  getLevelTitle,
  calculateStreak,
} from '@/lib/achievements';
import {
  Trophy, Flame, Star, Zap, Target, Lock,
  ChevronRight, TrendingUp, Award, Timer, Dumbbell,
  X, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  workout: Dumbbell,
  streak: Flame,
  milestone: Target,
  special: Star,
};

export function AchievementsScreen() {
  const {
    totalXp,
    unlockedAchievements,
    recentlyUnlocked,
    history,
    clearRecentUnlocks,
  } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnlockPopup, setShowUnlockPopup] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);

  const levelInfo = getLevelInfo(totalXp);
  const streak = calculateStreak(history.map((h) => h.date));
  const totalMinutes = history.reduce((s, h) => s + h.durationMin, 0);

  // Show unlock notification
  useEffect(() => {
    if (recentlyUnlocked.length > 0) {
      setShowUnlockPopup(true);
      setPopupIndex(0);
    }
    }, [recentlyUnlocked.length]);

  // Auto-dismiss popup on unmount (when user navigates away)
  useEffect(() => {
    return () => {
      clearRecentUnlocks();
    };
  }, []);

  const handlePopupClose = () => {
    if (popupIndex < recentlyUnlocked.length - 1) {
      setPopupIndex(popupIndex + 1);
    } else {
      setShowUnlockPopup(false);
      clearRecentUnlocks();
    }
  };

  const filteredAchievements =
    selectedCategory === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="flex flex-col h-full">
      {/* Unlock popup */}
      <AnimatePresence>
        {showUnlockPopup && recentlyUnlocked.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handlePopupClose}
            style={{ cursor: 'pointer' }}
          >
            <motion.div
              key={popupIndex}
              initial={{ scale: 0.5, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="mx-8 p-6 rounded-3xl bg-background shadow-2xl text-center max-w-[280px]"
            >
              <div className="text-5xl mb-3">
                {ACHIEVEMENTS.find((a) => a.id === recentlyUnlocked[popupIndex])?.icon}
              </div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Достижение разблокировано!</span>
              </div>
              <h2 className="text-lg font-bold mt-1">
                {ACHIEVEMENTS.find((a) => a.id === recentlyUnlocked[popupIndex])?.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {ACHIEVEMENTS.find((a) => a.id === recentlyUnlocked[popupIndex])?.description}
              </p>
              {(() => {
                const def = ACHIEVEMENTS.find((a) => a.id === recentlyUnlocked[popupIndex]);
                return def && def.xpReward > 0 ? (
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
                    <Zap className="w-4 h-4" />
                    +{def.xpReward} XP
                  </div>
                ) : null;
              })()}
              <button
                onClick={handlePopupClose}
                className="mt-4 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                {popupIndex < recentlyUnlocked.length - 1 ? 'Далее' : 'Отлично!'}
              </button>
              {recentlyUnlocked.length > 1 && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  {popupIndex + 1} из {recentlyUnlocked.length}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Достижения</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Level & XP Card */}
        <Card className="border-0 shadow-md overflow-hidden mb-5">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-amber-500/10 via-primary/5 to-background p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                    <span className="text-2xl font-black text-primary">{levelInfo.level}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{getLevelTitle(levelInfo.level)}</div>
                    <div className="text-xs text-muted-foreground">Уровень {levelInfo.level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-bold text-primary">
                    <Zap className="w-4 h-4" />
                    {totalXp}
                  </div>
                  <div className="text-[10px] text-muted-foreground">XP всего</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Прогресс до уровня {levelInfo.level + 1}</span>
                  <span>{levelInfo.currentXp} / {levelInfo.xpForNext} XP</span>
                </div>
                <Progress value={levelInfo.progress * 100} className="h-2.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <div className="text-lg font-bold">{streak.current}</div>
              <div className="text-[10px] text-muted-foreground">Серия дней</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <div className="text-lg font-bold">{unlockedCount}/{totalCount}</div>
              <div className="text-[10px] text-muted-foreground">Достижения</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Timer className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className="text-lg font-bold">{totalMinutes}</div>
              <div className="text-[10px] text-muted-foreground">Минут всего</div>
            </CardContent>
          </Card>
        </div>

        {/* Streak card */}
        {streak.current > 0 && (
          <Card className="border-0 shadow-sm mb-5 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10">
                  <span className="text-2xl">{streak.current >= 7 ? '🔥' : '✨'}</span>
                </div>
                <div>
                  <div className="text-sm font-bold">
                    {streak.current >= 30
                      ? `${streak.current} дней подряд! Невероятно!`
                      : streak.current >= 14
                        ? `${streak.current} дней подряд! Потрясающе!`
                        : streak.current >= 7
                          ? `${streak.current} дней подряд! Отлично!`
                          : `Серия: ${streak.current} ${streak.current === 1 ? 'день' : 'дня'}`}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Максимальная серия: {streak.longest} дней
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category filter */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {ACHIEVEMENT_CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all'
                ? totalCount
                : ACHIEVEMENTS.filter((a) => a.category === cat.id).length;
            const unlockedInCat =
              cat.id === 'all'
                ? unlockedCount
                : ACHIEVEMENTS.filter(
                    (a) => a.category === cat.id && unlockedAchievements.includes(a.id),
                  ).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat.label}
                <span className="text-[10px] opacity-70">{unlockedInCat}/{count}</span>
              </button>
            );
          })}
        </div>

        {/* Achievement list */}
        <div className="space-y-2.5">
          {filteredAchievements.map((achievement, i) => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            const CatIcon = CATEGORY_ICONS[achievement.category] ?? Star;

            return (
              <motion.div
                key={achievement.id}
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`rounded-2xl border-2 transition-all ${
                  isUnlocked
                    ? 'border-primary/20 bg-background shadow-sm'
                    : 'border-muted bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3 p-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                      isUnlocked
                        ? 'bg-primary/10'
                        : 'bg-muted'
                    }`}
                  >
                    {isUnlocked ? achievement.icon : <Lock className="w-4 h-4 text-muted-foreground/50" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isUnlocked ? '' : 'text-muted-foreground'}`}>
                        {achievement.name}
                      </span>
                      {achievement.xpReward > 0 && (
                        <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          {achievement.xpReward}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                      {achievement.description}
                    </p>
                  </div>
                  {isUnlocked && (
                    <div className="shrink-0 p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* XP earning info */}
        <div className="mt-6 mb-4">
          <Separator className="mb-4" />
          <h3 className="text-sm font-semibold mb-3">Как заработать XP</h3>
          <div className="space-y-2">
            {[
              { icon: Dumbbell, text: 'Завершение тренировки', xp: '+50 XP' },
              { icon: Target, text: 'Каждое выполненное упражнение', xp: '+5 XP' },
              { icon: Award, text: 'Все упражнения без пропусков', xp: '+25 XP бонус' },
              { icon: Flame, text: 'Бонус за серию', xp: 'через достижения' },
              { icon: Sparkles, text: 'Разблокировка достижений', xp: 'до +1000 XP' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs">{item.text}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{item.xp}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}