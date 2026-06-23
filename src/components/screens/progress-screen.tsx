'use client';

import { useState, useMemo } from 'react';
import { useAppStore, type ExerciseHistoryRecord } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft, TrendingUp, TrendingDown, Minus, Zap, Timer,
  BarChart3, Activity, Clock, ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

export function ProgressScreen() {
  const { history, setScreen, profile } = useAppStore();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'speed' | 'volume' | 'overview'>('overview');

  // Aggregate exercises across history
  const exerciseStats = useMemo(() => {
    const map = new Map<string, {
      name: string;
      sessions: {
        date: string;
        totalReps: number;
        totalSeconds: number;
        repsPerMinute: number;
        completed: boolean;
        sets: number;
        reps: number;
      }[];
    }>();

    for (const entry of history) {
      for (const ex of entry.exercises) {
        const key = ex.exerciseConfigId;
        if (!map.has(key)) {
          map.set(key, { name: ex.exerciseName, sessions: [] });
        }
        map.get(key)!.sessions.push({
          date: entry.date,
          totalReps: ex.totalRepsDone,
          totalSeconds: ex.totalSeconds,
          repsPerMinute: ex.repsPerMinute,
          completed: ex.completed,
          sets: ex.sets,
          reps: ex.reps,
        });
      }
    }

    return Array.from(map.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      sessions: data.sessions,
      totalSessions: data.sessions.length,
      avgRpm: data.sessions.length > 0
        ? Math.round(data.sessions.reduce((s, sess) => s + sess.repsPerMinute, 0) / data.sessions.length * 10) / 10
        : 0,
      lastRpm: data.sessions.length > 0 ? data.sessions[data.sessions.length - 1].repsPerMinute : 0,
      prevRpm: data.sessions.length > 1 ? data.sessions[data.sessions.length - 2].repsPerMinute : null,
      totalRepsAllTime: data.sessions.reduce((s, sess) => s + sess.totalReps, 0),
      totalSecondsAllTime: data.sessions.reduce((s, sess) => s + sess.totalSeconds, 0),
    })).sort((a, b) => b.totalSessions - a.totalSessions);
  }, [history]);

  // Selected exercise chart data
  const selectedData = useMemo(() => {
    if (!selectedExercise) return [];
    const ex = exerciseStats.find((e) => e.id === selectedExercise);
    if (!ex) return [];
    return ex.sessions.map((s) => ({
      date: s.date.slice(5),
      'реп/мин': s.repsPerMinute,
      'всего реп.': s.totalReps,
      'время (сек)': s.totalSeconds,
    }));
  }, [selectedExercise, exerciseStats]);

  const selectedEx = exerciseStats.find((e) => e.id === selectedExercise);

  // Volume chart: total reps per workout
  const volumeData = useMemo(() => {
    return history.map((h) => ({
      date: h.date.slice(5),
      'выполнено реп.': h.exercises.reduce((s, e) => s + e.totalRepsDone, 0),
      'план реп.': h.exercises.reduce((s, e) => s + e.sets * e.reps, 0),
      '% выполнения': Math.round(
        (h.exercises.reduce((s, e) => s + e.totalRepsDone, 0) /
        Math.max(1, h.exercises.reduce((s, e) => s + e.sets * e.reps, 0))) * 100
      ),
    }));
  }, [history]);

  // Overview stats
  const overviewStats = useMemo(() => {
    const totalRepsAll = history.reduce((s, h) => s + h.exercises.reduce((es, e) => es + e.totalRepsDone, 0), 0);
    const totalSecondsAll = history.reduce((s, h) => s + h.durationMin * 60, 0);
    const avgRpmAll = exerciseStats.length > 0
      ? Math.round(exerciseStats.reduce((s, e) => s + e.avgRpm, 0) / exerciseStats.length * 10) / 10
      : 0;
    const bestExercise = exerciseStats.length > 0
      ? exerciseStats.reduce((best, e) => e.avgRpm > best.avgRpm ? e : best, exerciseStats[0])
      : null;

    // Trend: compare last 3 workouts vs previous 3
    const recent3 = history.slice(-3);
    const prev3 = history.slice(-6, -3);
    const recentAvgReps = recent3.length > 0
      ? recent3.reduce((s, h) => s + h.exercises.reduce((es, e) => es + e.totalRepsDone, 0), 0) / recent3.length
      : 0;
    const prevAvgReps = prev3.length > 0
      ? prev3.reduce((s, h) => s + h.exercises.reduce((es, e) => es + e.totalRepsDone, 0), 0) / prev3.length
      : 0;
    const volumeTrend = prevAvgReps > 0
      ? Math.round(((recentAvgReps - prevAvgReps) / prevAvgReps) * 100)
      : 0;

    return { totalRepsAll, totalSecondsAll, avgRpmAll, bestExercise, volumeTrend, recentAvgReps };
  }, [history, exerciseStats]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 pt-5 pb-3 flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setScreen('dashboard')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Прогресс</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center space-y-3">
            <div className="p-6 rounded-3xl bg-primary/5 inline-block">
              <BarChart3 className="w-12 h-12 text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground">Выполните первую тренировку, чтобы увидеть прогресс</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setScreen('dashboard')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Прогресс</h1>
          <p className="text-[10px] text-muted-foreground">Скорость, объём, тренды</p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
          <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-1 shrink-0">
        {([
          { id: 'overview' as const, label: 'Общее' },
          { id: 'speed' as const, label: 'Скорость' },
          { id: 'volume' as const, label: 'Объём' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 min-h-0">
        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-bold">{overviewStats.totalRepsAll}</div>
                  <div className="text-[10px] text-muted-foreground">Повторений всего</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-2xl font-bold">{Math.round(overviewStats.totalSecondsAll / 60)}</div>
                  <div className="text-[10px] text-muted-foreground">Минут всего</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  <Activity className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <div className="text-2xl font-bold">{overviewStats.avgRpmAll}</div>
                  <div className="text-[10px] text-muted-foreground">Средн. реп/мин</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  {overviewStats.volumeTrend > 5 ? (
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                  ) : overviewStats.volumeTrend < -5 ? (
                    <TrendingDown className="w-5 h-5 mx-auto mb-1 text-rose-500" />
                  ) : (
                    <Minus className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  )}
                  <div className="text-2xl font-bold">{overviewStats.volumeTrend > 0 ? '+' : ''}{overviewStats.volumeTrend}%</div>
                  <div className="text-[10px] text-muted-foreground">Тренд объёма</div>
                </CardContent>
              </Card>
            </div>

            {overviewStats.bestExercise && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold">Лучший по скорости</span>
                  </div>
                  <div className="text-sm font-bold">{overviewStats.bestExercise.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {overviewStats.bestExercise.avgRpm} реп/мин в среднем за {overviewStats.bestExercise.totalSessions} тренировок
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Volume chart */}
            {volumeData.length >= 2 && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Объём по тренировкам</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={volumeData.slice(-10)} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: 11,
                            borderRadius: 10,
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            backgroundColor: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                        <Bar dataKey="выполнено реп." fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="план реп." fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All exercises list */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Все упражнения ({exerciseStats.length})</h3>
              {exerciseStats.map((ex) => {
                const trend = ex.prevRpm !== null
                  ? Math.round(((ex.lastRpm - ex.prevRpm) / Math.max(0.1, ex.prevRpm)) * 100)
                  : null;
                return (
                  <Card
                    key={ex.id}
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { setSelectedExercise(ex.id); setActiveTab('speed'); }}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{ex.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {ex.totalSessions} раз · {ex.totalRepsAllTime} реп. · {ex.avgRpm} реп/мин ср.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {trend !== null && (
                          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                            trend > 3 ? 'text-emerald-600' : trend < -3 ? 'text-rose-600' : 'text-muted-foreground'
                          }`}>
                            {trend > 3 ? <TrendingUp className="w-3 h-3" /> : trend < -3 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {trend > 0 ? '+' : ''}{trend}%
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* === SPEED TAB === */}
        {activeTab === 'speed' && (
          <div className="space-y-4">
            {!selectedExercise ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Выберите упражнение</h3>
                <p className="text-xs text-muted-foreground">
                  График скорости (реп/мин) для каждого упражнения по тренировкам
                </p>
                {exerciseStats.map((ex) => (
                  <Card
                    key={ex.id}
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedExercise(ex.id)}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{ex.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {ex.sessions.length} записей · ср. {ex.avgRpm} реп/мин
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Back button */}
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-xs text-primary font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Все упражнения
                </button>

                {selectedEx && (
                  <>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold">{selectedEx.name}</h3>
                          <Badge variant="secondary" className="text-[10px]">
                            {selectedEx.avgRpm} реп/мин ср.
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div className="text-center">
                            <div className="text-lg font-bold">{selectedEx.lastRpm}</div>
                            <div className="text-[10px] text-muted-foreground">Последняя</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{selectedEx.totalRepsAllTime}</div>
                            <div className="text-[10px] text-muted-foreground">Реп. всего</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{Math.round(selectedEx.totalSecondsAllTime / 60)}</div>
                            <div className="text-[10px] text-muted-foreground">Мин. всего</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Speed chart */}
                    {selectedData.length >= 2 && (
                      <Card className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          <h4 className="text-xs font-semibold mb-3">Скорость (реп/мин)</h4>
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={selectedData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={35}
                                />
                                <Tooltip
                                  contentStyle={{
                                    fontSize: 11,
                                    borderRadius: 10,
                                    border: 'none',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    backgroundColor: 'hsl(var(--background))',
                                    color: 'hsl(var(--foreground))',
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="реп/мин"
                                  stroke="hsl(var(--primary))"
                                  strokeWidth={2.5}
                                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Total reps chart */}
                    {selectedData.length >= 2 && (
                      <Card className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          <h4 className="text-xs font-semibold mb-3">Объём (всего повторений)</h4>
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={selectedData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={35}
                                />
                                <Tooltip
                                  contentStyle={{
                                    fontSize: 11,
                                    borderRadius: 10,
                                    border: 'none',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    backgroundColor: 'hsl(var(--background))',
                                    color: 'hsl(var(--foreground))',
                                  }}
                                />
                                <Bar dataKey="всего реп." fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.8} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Per-session table */}
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <h4 className="text-xs font-semibold mb-2">По тренировкам</h4>
                        <div className="space-y-1.5">
                          {selectedEx.sessions.slice().reverse().map((s, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                              <span className="text-xs text-muted-foreground">{s.date}</span>
                              <div className="flex items-center gap-3 text-xs">
                                <span>{s.totalReps} реп.</span>
                                <span className="text-muted-foreground">{s.totalSeconds} сек.</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {s.repsPerMinute} реп/мин
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* === VOLUME TAB === */}
        {activeTab === 'volume' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Объём по тренировкам</h3>
            <p className="text-xs text-muted-foreground">
              Сравнение запланированного и фактического объёма повторений
            </p>

            {volumeData.length >= 2 && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={volumeData.slice(-10)} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: 11,
                            borderRadius: 10,
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            backgroundColor: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                        <Bar dataKey="выполнено реп." fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="план реп." fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completion % chart */}
            {volumeData.length >= 2 && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold mb-3">% выполнения плана</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={volumeData.slice(-10)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                          domain={[0, 120]}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: 11,
                            borderRadius: 10,
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            backgroundColor: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                          }}
                          formatter={(value: number) => [`${value}%`, 'Выполнение']}
                        />
                        <Line
                          type="monotone"
                          dataKey="% выполнения"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Per-workout breakdown */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Детализация</h3>
              {history.slice().reverse().map((h) => {
                const done = h.exercises.reduce((s, e) => s + e.totalRepsDone, 0);
                const plan = h.exercises.reduce((s, e) => s + e.sets * e.reps, 0);
                const pct = plan > 0 ? Math.round((done / plan) * 100) : 0;
                return (
                  <Card key={h.id} className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{h.date}</span>
                        <Badge variant="outline" className="text-[10px]">{h.durationMin} мин</Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-primary' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground shrink-0">{pct}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {done} / {plan} повторений · {h.exercises.filter((e) => e.completed).length} / {h.exercises.length} упражнений
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}