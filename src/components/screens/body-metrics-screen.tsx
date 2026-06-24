'use client';

import { useState, type ReactNode } from 'react';
import { useAppStore, type BodyMetricEntry } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, Plus, Trash2, TrendingDown, TrendingUp, Minus, Ruler, Weight,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

type MetricField = {
  key: keyof Omit<BodyMetricEntry, 'id' | 'date'>;
  label: string;
  unit: string;
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
};

const METRIC_FIELDS: MetricField[] = [
  { key: 'weightKg', label: 'Вес', unit: 'кг', color: '#3b82f6', icon: Weight },
  { key: 'waistCm', label: 'Талия', unit: 'см', color: '#f59e0b', icon: Ruler },
  { key: 'chestCm', label: 'Грудь', unit: 'см', color: '#10b981', icon: Ruler },
  { key: 'hipsCm', label: 'Бёдра', unit: 'см', color: '#8b5cf6', icon: Ruler },
  { key: 'bicepsCm', label: 'Бицепс', unit: 'см', color: '#ec4899', icon: Ruler },
  { key: 'thighCm', label: 'Бедро', unit: 'см', color: '#f97316', icon: Ruler },
];

const VISIBLE_FIELDS = ['weightKg', 'waistCm', 'chestCm', 'hipsCm', 'bicepsCm', 'thighCm'] as const;

export function BodyMetricsScreen() {
  const { bodyMetrics, addBodyMetric, removeBodyMetric, setScreen } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(['weightKg', 'waistCm'])
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const toggleField = (key: string) => {
    const next = new Set(selectedFields);
    if (next.has(key)) next.delete(key);
    else if (next.size < 3) next.add(key);
    setSelectedFields(next);
  };

  const handleSave = () => {
    const entry: Omit<BodyMetricEntry, 'id' | 'date'> = {
      weightKg: formValues.weightKg ? parseFloat(formValues.weightKg) : null,
      waistCm: formValues.waistCm ? parseFloat(formValues.waistCm) : null,
      chestCm: formValues.chestCm ? parseFloat(formValues.chestCm) : null,
      hipsCm: formValues.hipsCm ? parseFloat(formValues.hipsCm) : null,
      bicepsCm: formValues.bicepsCm ? parseFloat(formValues.bicepsCm) : null,
      thighCm: formValues.thighCm ? parseFloat(formValues.thighCm) : null,
    };
    addBodyMetric(entry);
    setFormValues({});
    setShowForm(false);
  };

  // Chart data
  const chartData = bodyMetrics.map((m) => ({
    date: m.date.slice(5), // MM-DD
    ...Object.fromEntries(
      VISIBLE_FIELDS.filter((f) => m[f] != null).map((f) => [f, (m as unknown as Record<string, unknown>)[f] as number])
    ),
  }));

  // Latest change for each field
  const getChange = (key: string): { value: number; direction: 'up' | 'down' | 'same' } | null => {
    const withValue = bodyMetrics.filter((m) => (m as unknown as Record<string, unknown>)[key] != null);
    if (withValue.length < 2) return null;
    const last = (withValue[withValue.length - 1] as unknown as Record<string, unknown>)[key] as number;
    const prev = (withValue[withValue.length - 2] as unknown as Record<string, unknown>)[key] as number;
    const diff = Math.round((last - prev) * 10) / 10;
    if (Math.abs(diff) < 0.05) return { value: 0, direction: 'same' };
    return { value: diff, direction: diff > 0 ? 'up' : 'down' };
  };

  // Latest values
  const latestMetric = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setScreen('profile')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Тело и вес</h1>
          <p className="text-[10px] text-muted-foreground">Отслеживание изменений</p>
        </div>
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
          <Ruler className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-24 min-h-0">
        {/* Quick stats from latest measurement */}
        {latestMetric && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {METRIC_FIELDS.map((field) => {
              const val = (latestMetric as unknown as Record<string, unknown>)[field.key];
              if (val == null) return null;
              const change = getChange(field.key);
              const Icon = field.icon;
              return (
                <Card key={field.key} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5`} style={{ color: field.color }} />
                        <span className="text-[10px] text-muted-foreground">{field.label}</span>
                      </div>
                      {change && (
                        <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                          change.direction === 'down'
                            ? (field.key === 'weightKg' || field.key === 'waistCm' ? 'text-emerald-600' : 'text-rose-600')
                            : change.direction === 'up'
                            ? (field.key === 'weightKg' || field.key === 'waistCm' ? 'text-rose-600' : 'text-emerald-600')
                            : 'text-muted-foreground'
                        }`}>
                          {change.direction === 'up' && <TrendingUp className="w-3 h-3" />}
                          {change.direction === 'down' && <TrendingDown className="w-3 h-3" />}
                          {change.direction === 'same' && <Minus className="w-3 h-3" />}
                          {change.value > 0 ? '+' : ''}{change.value}
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-bold">{val as ReactNode} <span className="text-xs font-normal text-muted-foreground">{field.unit}</span></div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Chart */}
        {chartData.length >= 2 && (
          <Card className="border-0 shadow-sm mb-5 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Динамика</h3>
              </div>

              {/* Field toggles */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {METRIC_FIELDS.map((field) => {
                  const hasData = bodyMetrics.some((m) => (m as unknown as Record<string, unknown>)[field.key] != null);
                  if (!hasData) return null;
                  const isActive = selectedFields.has(field.key);
                  return (
                    <button
                      key={field.key}
                      onClick={() => toggleField(field.key)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                      style={isActive ? { backgroundColor: field.color } : undefined}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
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
                      formatter={(value: number, name: string) => {
                        const field = METRIC_FIELDS.find((f) => f.key === name);
                        return [`${value} ${field?.unit ?? ''}`, field?.label ?? name];
                      }}
                    />
                    {METRIC_FIELDS.filter((f) => selectedFields.has(f.key)).map((field) => (
                      <Line
                        key={field.key}
                        type="monotone"
                        dataKey={field.key}
                        stroke={field.color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: field.color }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No data state */}
        {bodyMetrics.length === 0 && !showForm && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/20">
              <Weight className="w-12 h-12 text-blue-400" />
            </div>
            <div className="text-center space-y-2 max-w-[260px]">
              <h2 className="text-base font-bold">Начните отслеживать тело</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Записывайте вес, объём талии и другие замеры. Приложение покажет динамику в виде графика, чтобы вы видели реальный прогресс.
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить замер
            </Button>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold">Новый замер</h3>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Дата</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-xl border-2 border-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {METRIC_FIELDS.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div key={field.key}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                        <Icon className="w-3 h-3" style={{ color: field.color }} />
                        {field.label} ({field.unit})
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder={field.key === 'weightKg' || field.key === 'waistCm' ? 'Рекомендуется' : 'По желанию'}
                        value={formValues[field.key] ?? ''}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full h-10 px-3 text-sm rounded-xl border-2 border-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex gap-3 pb-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setFormValues({}); }}>
                Отмена
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSave}>
                Сохранить
              </Button>
            </div>
          </div>
        )}

        {/* History list */}
        {!showForm && bodyMetrics.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Все замеры</h3>
              <span className="text-xs text-muted-foreground">{bodyMetrics.length} записей</span>
            </div>
            {bodyMetrics.slice().reverse().map((m) => (
              <Card key={m.id} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{m.date}</span>
                    <button
                      onClick={() => removeBodyMetric(m.id)}
                      className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.weightKg != null && (
                      <Badge variant="secondary" className="text-[10px]">
                        {m.weightKg} кг
                      </Badge>
                    )}
                    {m.waistCm != null && (
                      <Badge variant="secondary" className="text-[10px]">
                        Талия {m.waistCm} см
                      </Badge>
                    )}
                    {m.chestCm != null && (
                      <Badge variant="secondary" className="text-[10px]">
                        Грудь {m.chestCm} см
                      </Badge>
                    )}
                    {m.hipsCm != null && (
                      <Badge variant="secondary" className="text-[10px]">
                        Бёдра {m.hipsCm} см
                      </Badge>
                    )}
                    {m.bicepsCm != null && (
                      <Badge variant="secondary" className="text-[10px]">
                        Бицепс {m.bicepsCm} см
                      </Badge>
                    )}
                    {m.thighCm != null && (
                      <Badge variant="secondary" className="text-[10px]">
                        Бедро {m.thighCm} см
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4" />
              Добавить замер
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}