'use client';

import { useAppStore } from '@/lib/store';
import { INVENTORY_OPTIONS, EQUIPMENT_LABELS, type EquipmentType } from '@/lib/exercises';
import {
  Square, Dumbbell, CircleDot, Minus, GripHorizontal, Link, Armchair, Plus,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Square, Dumbbell, CircleDot, Minus, GripHorizontal, Link, Armchair,
};

export function StepInventory() {
  const { profile, setProfileField } = useAppStore();
  const inventory: EquipmentType[] = profile?.inventory ?? [];

  function toggle(type: EquipmentType) {
    if (inventory.includes(type)) {
      setProfileField(
        'inventory',
        inventory.filter((t) => t !== type),
      );
    } else {
      setProfileField('inventory', [...inventory, type]);
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

        {/* "No equipment" button */}
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

      {inventory.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Выбрано: {inventory.map((t) => EQUIPMENT_LABELS[t]).join(', ')}
        </p>
      )}
    </div>
  );
}