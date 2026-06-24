'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { INVENTORY_OPTIONS, EQUIPMENT_LABELS, type EquipmentType, type WeightedEquipmentType, type WeightItem } from '@/lib/exercises';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Square, Dumbbell, CircleDot, Minus, GripHorizontal, Link, Armchair, Plus,
  Waves, Activity, Bike, RotateCw, ArrowLeft, Sparkles, AlertTriangle,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Square, Dumbbell, CircleDot, Minus, GripHorizontal, Link, Armchair, Waves, Activity, Bike, RotateCw,
};

const WEIGHTED_TYPES: WeightedEquipmentType[] = ['dumbbell', 'kettlebell', 'barbell'];
const WEIGHT_PRESETS: Record<WeightedEquipmentType, number[]> = {
  dumbbell: [2, 4, 6, 8, 10, 12, 14, 16, 20, 24],
  kettlebell: [4, 6, 8, 10, 12, 14, 16, 20, 24, 32],
  barbell: [20, 30, 40, 50, 60, 80, 100],
};
const WEIGHTED_LABELS: Record<WeightedEquipmentType, string> = {
  dumbbell: 'Гантели',
  kettlebell: 'Гири',
  barbell: 'Штанга',
};

export function InventoryEditScreen() {
  const { profile, setProfileField, setScreen, generateNewPlan } = useAppStore();
  const [inventory, setInventory] = useState<EquipmentType[]>(profile?.inventory ?? []);
  const [weightedEquipment, setWeightedEquipment] = useState(profile?.weightedEquipment ?? { dumbbell: [], kettlebell: [], barbell: [] });
  const [originalInventory, setOriginalInventory] = useState<EquipmentType[]>(profile?.inventory ?? []);
  const [showRebuildModal, setShowRebuildModal] = useState(false);
  const [rebuildInfo, setRebuildInfo] = useState<{ added: string[]; removed: string[] }>({ added: [], removed: [] });
  const [expandedType, setExpandedType] = useState<WeightedEquipmentType | null>(null);

  useEffect(() => {
    if (profile) {
      setInventory(profile.inventory);
      setOriginalInventory(profile.inventory);
      setWeightedEquipment(profile.weightedEquipment ?? { dumbbell: [], kettlebell: [], barbell: [] });
    }
  }, [profile]);

  function toggle(type: EquipmentType) {
    if (inventory.includes(type)) {
      setInventory(inventory.filter((t) => t !== type));
    } else {
      setInventory([...inventory, type]);
    }
  }

  // Weight helpers
  function getItems(type: WeightedEquipmentType): WeightItem[] {
    return weightedEquipment[type] ?? [];
  }

  function setItems(type: WeightedEquipmentType, items: WeightItem[]) {
    setWeightedEquipment({ ...weightedEquipment, [type]: items });
  }

  function addWeight(type: WeightedEquipmentType, weightKg: number, count: number) {
    const items = [...getItems(type)];
    const existing = items.find(i => i.weightKg === weightKg);
    if (existing) {
      existing.count = count;
    } else {
      items.push({ weightKg, count });
    }
    items.sort((a, b) => a.weightKg - b.weightKg);
    setItems(type, items);
  }

  function removeWeight(type: WeightedEquipmentType, weightKg: number) {
    setItems(type, getItems(type).filter(i => i.weightKg !== weightKg));
  }

  function togglePreset(type: WeightedEquipmentType, weightKg: number) {
    const items = getItems(type);
    if (items.some(i => i.weightKg === weightKg)) {
      removeWeight(type, weightKg);
    } else {
      addWeight(type, weightKg, type === 'barbell' ? 1 : 2);
    }
  }

  function handleSave() {
    const added = inventory.filter((t) => !originalInventory.includes(t));
    const removed = originalInventory.filter((t) => !inventory.includes(t));

    setProfileField('inventory', inventory);
    setProfileField('weightedEquipment', weightedEquipment);

    if (added.length === 0 && removed.length === 0) {
      setScreen('profile');
      return;
    }

    setRebuildInfo({ added, removed });
    setShowRebuildModal(true);
  }

  function confirmRebuild() {
    setProfileField('inventory', inventory);
    setProfileField('weightedEquipment', weightedEquipment);
    generateNewPlan();
    setShowRebuildModal(false);
    setScreen('dashboard');
  }

  function declineRebuild() {
    setProfileField('inventory', inventory);
    setProfileField('weightedEquipment', weightedEquipment);
    setShowRebuildModal(false);
    setScreen('profile');
  }

  const hasChanges = inventory.some((t) => !originalInventory.includes(t)) ||
    originalInventory.some((t) => !inventory.includes(t));
  const hasWeightedEquipment = WEIGHTED_TYPES.some((t) => inventory.includes(t));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
        <button
          onClick={() => setScreen('profile')}
          className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Инвентарь</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <p className="text-sm text-muted-foreground mb-5">
          Отметьте доступное оборудование. При изменении программа будет скорректирована.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {INVENTORY_OPTIONS.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Square;
            const selected = inventory.includes(item.type);
            const wasRemoved = !selected && originalInventory.includes(item.type);
            const wasAdded = selected && !originalInventory.includes(item.type);
            return (
              <button
                key={item.type}
                onClick={() => toggle(item.type)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all relative ${
                  selected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-muted bg-background hover:border-primary/30'
                }`}
              >
                {wasRemoved && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <span className="text-[10px] font-bold">-</span>
                  </div>
                )}
                {wasAdded && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <span className="text-[10px] font-bold">+</span>
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl ${
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setInventory([])}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
              inventory.length === 0
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-muted bg-background hover:border-primary/30'
            }`}
          >
            <div
              className={`p-3 rounded-xl ${
                inventory.length === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Нет инвентаря</span>
          </button>
        </div>

        {/* Weight specification */}
        {hasWeightedEquipment && (
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/50 text-xs text-muted-foreground">
              <Dumbbell className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
              <span>Укажите веса, которые у вас есть, чтобы программа подбирала упражнения под ваш реальный инвентарь.</span>
            </div>

            {WEIGHTED_TYPES.filter((t) => inventory.includes(t)).map((type) => {
              const items = getItems(type);
              const isExpanded = expandedType === type;
              const presets = WEIGHT_PRESETS[type];

              return (
                <div key={type} className="rounded-2xl border border-muted overflow-hidden">
                  <button
                    onClick={() => setExpandedType(isExpanded ? null : type)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Dumbbell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-semibold">{WEIGHTED_LABELS[type]}</span>
                        <p className="text-[10px] text-muted-foreground">
                          {items.length === 0
                            ? 'Не указаны веса'
                            : items.map(i => `${i.weightKg} кг ×${i.count}`).join(', ')}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-muted">
                      <div className="pt-3">
                        <p className="text-[10px] text-muted-foreground mb-2">Быстрый выбор:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {presets.map((w) => {
                            const active = items.some(i => i.weightKg === w);
                            return (
                              <button
                                key={w}
                                onClick={() => togglePreset(type, w)}
                                className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                                  active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                              >
                                {w} кг
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          id={`custom-weight-${type}`}
                          type="number"
                          inputMode="numeric"
                          placeholder="Вес (кг)"
                          className="h-9 w-24 text-center text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseFloat((e.target as HTMLInputElement).value);
                              if (val > 0) {
                                addWeight(type, val, type === 'barbell' ? 1 : 2);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-3"
                          onClick={() => {
                            const input = document.getElementById(`custom-weight-${type}`) as HTMLInputElement;
                            const val = parseFloat(input?.value ?? '0');
                            if (val > 0) {
                              addWeight(type, val, type === 'barbell' ? 1 : 2);
                              if (input) input.value = '';
                            }
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {items.length > 0 && (
                        <div className="space-y-1.5">
                          {items.map((item) => (
                            <div
                              key={item.weightKg}
                              className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold tabular-nums w-14">
                                  {item.weightKg} кг
                                </span>
                                {type !== 'barbell' && (
                                  <span className="text-[10px] text-muted-foreground">
                                    ×{item.count} шт
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => removeWeight(type, item.weightKg)}
                                className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm border-t">
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={handleSave}
        >
          {hasChanges ? 'Сохранить' : 'Назад'}
        </Button>
      </div>

      {/* Rebuild modal */}
      {showRebuildModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-6 bg-background rounded-2xl p-6 shadow-xl border max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-base font-bold leading-tight">Перестроить программу?</h2>
            </div>
            <div className="space-y-2 mb-5">
              {rebuildInfo.added.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <span className="text-emerald-600 dark:text-emerald-400 text-lg leading-none">+</span>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">
                    О, у вас появился <b>{rebuildInfo.added.map((t) => EQUIPMENT_LABELS[t]).join(', ')}</b>!
                    Это даёт более широкие возможности.
                  </p>
                </div>
              )}
              {rebuildInfo.removed.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300">
                    Вы избавились от <b>{rebuildInfo.removed.map((t) => EQUIPMENT_LABELS[t]).join(', ')}</b>.
                    Нужно скорректировать программу.
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Перестроить текущую программу под новый инвентарь?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={declineRebuild}>
                Нет, позже
              </Button>
              <Button className="flex-1 h-11 font-semibold" onClick={confirmRebuild}>
                Да
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
