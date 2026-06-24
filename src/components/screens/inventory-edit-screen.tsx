'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { INVENTORY_OPTIONS, EQUIPMENT_LABELS, type EquipmentType } from '@/lib/exercises';
import { Button } from '@/components/ui/button';
import {
  Square, Dumbbell, CircleDot, Minus, GripHorizontal, Link, Armchair, Plus,
  Waves, Activity, Bike, RotateCw, ArrowLeft, Sparkles, AlertTriangle,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Square, Dumbbell, CircleDot, Minus, GripHorizontal, Link, Armchair, Waves, Activity, Bike, RotateCw,
};

export function InventoryEditScreen() {
  const { profile, setProfileField, setScreen, generateNewPlan } = useAppStore();
  const [inventory, setInventory] = useState<EquipmentType[]>(profile?.inventory ?? []);
  const [originalInventory, setOriginalInventory] = useState<EquipmentType[]>(profile?.inventory ?? []);
  const [showRebuildModal, setShowRebuildModal] = useState(false);
  const [rebuildInfo, setRebuildInfo] = useState<{ added: string[]; removed: string[] }>({ added: [], removed: [] });

  // Sync if profile changes externally
  useEffect(() => {
    if (profile) {
      setInventory(profile.inventory);
      setOriginalInventory(profile.inventory);
    }
  }, [profile]);

  function toggle(type: EquipmentType) {
    if (inventory.includes(type)) {
      setInventory(inventory.filter((t) => t !== type));
    } else {
      setInventory([...inventory, type]);
    }
  }

  function handleSave() {
    const added = inventory.filter((t) => !originalInventory.includes(t));
    const removed = originalInventory.filter((t) => !inventory.includes(t));

    if (added.length === 0 && removed.length === 0) {
      // Nothing changed, just go back
      setScreen('profile');
      return;
    }

    // There are changes — show rebuild modal
    setRebuildInfo({ added, removed });
    setShowRebuildModal(true);
  }

  function confirmRebuild() {
    // Save new inventory
    setProfileField('inventory', inventory);
    // Regenerate plan with new equipment
    generateNewPlan();
    setShowRebuildModal(false);
    setScreen('dashboard');
  }

  function declineRebuild() {
    // Save new inventory but don't rebuild yet
    setProfileField('inventory', inventory);
    setShowRebuildModal(false);
    setScreen('profile');
  }

  const hasChanges = inventory.some((t) => !originalInventory.includes(t)) ||
    originalInventory.some((t) => !inventory.includes(t));

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
                {/* Change indicator */}
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

          {/* "No equipment" button */}
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

        {inventory.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Выбрано: {inventory.map((t) => EQUIPMENT_LABELS[t]).join(', ')}
          </p>
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

      {/* Rebuild confirmation modal */}
      {showRebuildModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-6 bg-background rounded-2xl p-6 shadow-xl border max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-base font-bold leading-tight">
                Перестроить программу?
              </h2>
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
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={declineRebuild}
              >
                Нет, позже
              </Button>
              <Button
                className="flex-1 h-11 font-semibold"
                onClick={confirmRebuild}
              >
                Да
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}