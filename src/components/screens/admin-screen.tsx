'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { EXERCISE_CATALOG, MUSCLE_LABELS, EQUIPMENT_LABELS, type ExerciseConfig, type ExerciseVariant, type EquipmentType } from '@/lib/exercises';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Pencil, Save, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_MUSCLES = Object.keys(MUSCLE_LABELS);
const CATEGORIES = ['strength', 'cardio', 'flexibility'] as const;
const CAT_LABELS: Record<string, string> = { strength: 'Силовое', cardio: 'Кардио', flexibility: 'Гибкость' };
const DIFF_LABELS: Record<string, string> = { beginner: 'Новичок', intermediate: 'Средний', advanced: 'Продвинутый' };

function MuscleSelector({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (m: string) => {
    onChange(selected.includes(m) ? selected.filter((x) => x !== m) : [...selected, m]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_MUSCLES.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => toggle(m)}
          className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
            selected.includes(m) ? 'bg-primary text-primary-foreground border-primary' : 'border-muted hover:border-primary/40'
          }`}
        >
          {MUSCLE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}

function ExerciseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ExerciseConfig;
  onSave: (ex: ExerciseConfig) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<string>(initial?.category ?? 'strength');
  const [difficulty, setDifficulty] = useState(initial?.difficultyLevel ?? 'beginner');
  const [primary, setPrimary] = useState<string[]>(initial?.primaryMuscleGroups ?? []);
  const [secondary, setSecondary] = useState<string[]>(initial?.secondaryMuscleGroups ?? []);
  const [isTimed, setIsTimed] = useState(initial?.isTimed ?? false);
  const [instructions, setInstructions] = useState(initial?.instructions.join('\n') ?? '');
  const [equip, setEquip] = useState<EquipmentType>('none');
  const [repMin, setRepMin] = useState(8);
  const [repMax, setRepMax] = useState(12);
  const [durSec, setDurSec] = useState(30);
  const [weightPct, setWeightPct] = useState(0);
  // Image paths (manual entry since we can't upload to public/ at runtime)
  const [imgStart, setImgStart] = useState(initial?.id ? `/exercises/${initial.id}_start.png` : '');
  const [imgMid, setImgMid] = useState(initial?.id ? `/exercises/${initial.id}.png` : '');
  const [imgFinish, setImgFinish] = useState(initial?.id ? `/exercises/${initial.id}_finish.png` : '');

  const handleSave = () => {
    if (!name.trim() || primary.length === 0) return;
    const id = initial?.id ?? `custom_${Date.now()}`;
    const variant: ExerciseVariant = {
      variantId: `${id}_v1`,
      variantName: equip === 'none' ? 'Собственный вес' : EQUIPMENT_LABELS[equip],
      requiredEquipment: equip,
      adjustments: {
        defaultWeightPercent: weightPct,
        repRange: { min: repMin, max: repMax },
        durationSeconds: isTimed ? durSec : undefined,
      },
    };
    const ex: ExerciseConfig = {
      id,
      name: name.trim(),
      primaryMuscleGroups: primary,
      secondaryMuscleGroups: secondary,
      difficultyLevel: difficulty as ExerciseConfig['difficultyLevel'],
      category: category as ExerciseConfig['category'],
      isTimed,
      variants: [variant],
      icon: 'Dumbbell',
      instructions: instructions.split('\n').filter((s) => s.trim()),
    };
    onSave(ex);
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 min-h-0">
      {/* Name */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Название</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 px-3 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Например: Жим гантелей лёжа"
        />
      </div>

      {/* Category + Difficulty + Timed */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Категория</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 px-2 py-2 text-xs rounded-xl border bg-background">
            {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Сложность</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full mt-1 px-2 py-2 text-xs rounded-xl border bg-background">
            {Object.entries(DIFF_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-xs py-2 cursor-pointer">
            <input type="checkbox" checked={isTimed} onChange={(e) => setIsTimed(e.target.checked)} className="rounded" />
            Таймовое (секунды)
          </label>
        </div>
      </div>

      {/* Primary muscles */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Основные мышцы</label>
        <div className="mt-1"><MuscleSelector selected={primary} onChange={setPrimary} /></div>
      </div>

      {/* Secondary muscles */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Вторичные мышцы</label>
        <div className="mt-1"><MuscleSelector selected={secondary} onChange={setSecondary} /></div>
      </div>

      {/* Variant settings */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-3">
          <h3 className="text-xs font-semibold">Вариант выполнения</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Инвентарь</label>
              <select value={equip} onChange={(e) => setEquip(e.target.value as EquipmentType)} className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border bg-background">
                {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Вес (% от массы)</label>
              <input type="number" value={weightPct} onChange={(e) => setWeightPct(+e.target.value)} min={0} max={100} className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border bg-background" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Повторений мин</label>
              <input type="number" value={repMin} onChange={(e) => setRepMin(+e.target.value)} min={1} className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border bg-background" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Повторений макс</label>
              <input type="number" value={repMax} onChange={(e) => setRepMax(+e.target.value)} min={1} className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border bg-background" />
            </div>
          </div>
          {isTimed && (
            <div>
              <label className="text-[10px] text-muted-foreground">Длительность (сек)</label>
              <input type="number" value={durSec} onChange={(e) => setDurSec(+e.target.value)} min={5} className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border bg-background" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-2">
          <h3 className="text-xs font-semibold flex items-center gap-1"><Upload className="w-3 h-3" /> Картинки (путь)</h3>
          <p className="text-[10px] text-muted-foreground">Положите файлы в /public/exercises/ и укажите пути</p>
          {[
            { label: 'Старт', value: imgStart, set: setImgStart },
            { label: 'Фаза', value: imgMid, set: setImgMid },
            { label: 'Финиш', value: imgFinish, set: setImgFinish },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-[10px] text-muted-foreground">{label}</label>
              <input value={value} onChange={(e) => set(e.target.value)} className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border bg-background font-mono" placeholder="/exercises/my_ex_start.png" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Instructions */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Инструкция (по строкам)</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Шаг 1&#10;Шаг 2&#10;Шаг 3"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Отмена</Button>
        <Button className="flex-1" onClick={handleSave} disabled={!name.trim() || primary.length === 0}>
          <Save className="w-4 h-4 mr-1" /> Сохранить
        </Button>
      </div>
    </div>
  );
}

export function AdminScreen() {
  const { setScreen, customExercises, addCustomExercise, updateCustomExercise, removeCustomExercise } = useAppStore();
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  const allExercises = [...EXERCISE_CATALOG, ...customExercises];
  const editingEx = editing === 'new' ? undefined : allExercises.find((e) => e.id === editing);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setScreen('profile')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold">Управление упражнениями</h1>
          <p className="text-xs text-muted-foreground">{allExercises.length} упражнений</p>
        </div>
        {editing === null && (
          <Button size="sm" className="h-8 gap-1" onClick={() => setEditing('new')}>
            <Plus className="w-3.5 h-3.5" /> Добавить
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editing !== null ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <ExerciseForm
              initial={editingEx}
              onSave={(ex) => {
                if (editing === 'new') addCustomExercise(ex);
                else updateCustomExercise(editing, ex);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto px-5 pb-6 space-y-2 min-h-0"
          >
            {allExercises.map((ex, i) => {
              const isCustom = customExercises.some((c) => c.id === ex.id);
              return (
                <motion.div
                  key={ex.id}
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{ex.name}</span>
                      {isCustom && <Badge className="text-[9px] px-1 py-0">Custom</Badge>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">{CAT_LABELS[ex.category]}</Badge>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{DIFF_LABELS[ex.difficultyLevel]}</Badge>
                      {ex.isTimed && <Badge variant="outline" className="text-[9px] px-1 py-0">Тайм</Badge>}
                      {ex.primaryMuscleGroups.map((g) => (
                        <span key={g} className="text-[9px] text-muted-foreground">{MUSCLE_LABELS[g]}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(ex.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {isCustom && (
                      <button onClick={() => removeCustomExercise(ex.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}