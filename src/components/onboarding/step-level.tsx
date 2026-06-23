'use client';

import { useAppStore } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

function RpeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-lg font-bold text-primary tabular-nums">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Очень легко</span>
        <span>Максимальное усилие</span>
      </div>
    </div>
  );
}

const FALLBACK = {
  rpeSquat: 5,
  rpePushUp: 5,
  rpePlank: 5,
  comfortableMinutes: 0,
};

export function StepLevel() {
  const { profile, setProfileField } = useAppStore();
  const p = profile ?? FALLBACK;

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Оцените свой уровень</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Мы не проводим тест до отказа — используем самооценку
        </p>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/50 text-xs text-muted-foreground">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
        <span>
          Оцените, насколько тяжёлым кажется движение, где <b>1</b> — очень легко,{' '}
          <b>10</b> — максимальное усилие. Это снижает риск травм и психологический барьер.
        </span>
      </div>

      <div className="space-y-6">
        <RpeSlider
          label="Приседания"
          value={p.rpeSquat}
          onChange={(v) => setProfileField('rpeSquat', v)}
        />
        <RpeSlider
          label="Отжимания"
          value={p.rpePushUp}
          onChange={(v) => setProfileField('rpePushUp', v)}
        />
        <RpeSlider
          label="Планка"
          value={p.rpePlank}
          onChange={(v) => setProfileField('rpePlank', v)}
        />
      </div>

      <div className="space-y-2">
        <Label>Сколько минут непрерывной активности вам комфортно сейчас?</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            inputMode="numeric"
            value={p.comfortableMinutes || ''}
            onChange={(e) => setProfileField('comfortableMinutes', parseInt(e.target.value) || 0)}
            placeholder="15"
            className="h-12 w-24 text-center text-lg"
          />
          <span className="text-sm text-muted-foreground">минут</span>
        </div>
      </div>
    </div>
  );
}