'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { INVENTORY_OPTIONS, EQUIPMENT_LABELS, type EquipmentType, type WeightedEquipmentType, type WeightItem } from '@/lib/exercises';
import {
  Square, Dumbbell, CircleDot, Minus, GripHorizontal, Link, Armchair, Plus,
  Waves, Activity, Bike, RotateCw, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export function StepInventory() {
  const { profile, setProfileField } = useAppStore();
  const inventory: EquipmentType[] = profile?.inventory ?? [];
  const [expandedType, setExpandedType] = useState<WeightedEquipmentType | null>(null);

  function toggle(type: EquipmentType) {
    if (inventory.includes(type)) {
      setProfileField('inventory', inventory.filter((t) => t !== type));
    } else {
      setProfileField('inventory', [...inventory, type]);
    }
  }

  const hasWeightedEquipment = WEIGHTED_TYPES.some((t) => inventory.includes(t));

  function getWeightItems(type: WeightedEquipmentType): WeightItem[] {
    return profile?.weightedEquipment?.[type] ?? [];
  }

  function setWeightItems(type: WeightedEquipmentType, items: WeightItem[]) {
    const current = profile?.weightedEquipment ?? { dumbbell: [], kettlebell: [], barbell: [] };
    setProfileField('weightedEquipment', { ...current, [type]: items });
  }

  function addWeight(type: WeightedEquipmentType, weightKg: number, count: number) {
    const items = [...getWeightItems(type)];
    const existing = items.find(i => i.weightKg === weightKg);
    if (existing) {
      existing.count = count;
    } else {
      items.push({ weightKg, count: count || 1 });
    }
    items.sort((a, b) => a.weightKg - b.weightKg);
    setWeightItems(type, items);
  }

  function removeWeight(type: WeightedEquipmentType, weightKg: number) {
    const items = getWeightItems(type).filter(i => i.weightKg !== weightKg);
    setWeightItems(type, items);
  }

  function togglePreset(type: WeightedEquipmentType, weightKg: number) {
    const items = getWeightItems(type);
    const exists = items.find(i => i.weightKg === weightKg);
    if (exists) {
      removeWeight(type, weightKg);
    } else {
      addWeight(type, weightKg, type === 'barbell' ? 1 : 2);
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ваш инвентарь</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Отметьте доступное оборудование. Можно изменить позже.
        </p>
      </div>

      {/* Equipment grid */}
      <div className="grid grid-cols-2 gap-3">
        {INVENTORY_OPTIONS.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? Square;
          const selected = inventory.includes(item.type);
          return (
            <button
              key={item.type}
              onClick={() => toggle(item.type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                selected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-muted bg-background hover:border-primary/30'
              }`}
            >
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
          onClick={() => setProfileField('inventory', [])}
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

      {/* Weight specification for weighted equipment */}
      {hasWeightedEquipment && (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/50 text-xs text-muted-foreground">
            <Dumbbell className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <span>
              Укажите какие <b>веса</b> у вас есть. Это нужно, чтобы подбирать
              упражнения под ваш реальный инвентарь.
            </span>
          </div>

          {WEIGHTED_TYPES.filter((t) => inventory.includes(t)).map((type) => {
            const items = getWeightItems(type);
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
                    {/* Preset chips */}
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

                    {/* Custom weight input */}
                    <div className="flex items-center gap-2">
                      <Input
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

                    {/* Current weights list */}
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

      {inventory.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Выбрано: {inventory.map((t) => EQUIPMENT_LABELS[t]).join(', ')}
        </p>
      )}
    </div>
  );
}
