'use client';

import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FALLBACK = {
  gender: 'male' as const,
  age: 0,
  height: 0,
  weight: 0,
  medicalRestrictions: false,
};

export function StepProfile() {
  const { profile, setProfileField } = useAppStore();
  const p = profile ?? FALLBACK;

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Расскажите о себе</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Эти данные помогут подобрать оптимальную нагрузку
        </p>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label>Пол</Label>
        <div className="grid grid-cols-2 gap-3">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setProfileField('gender', g)}
              className={`h-12 rounded-xl border-2 text-sm font-medium transition-all ${
                p.gender === g
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-muted bg-background text-muted-foreground hover:border-primary/40'
              }`}
            >
              {g === 'male' ? 'Мужской' : 'Женский'}
            </button>
          ))}
        </div>
      </div>

      {/* Age, Height, Weight */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Возраст</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={p.age || ''}
            onChange={(e) => setProfileField('age', parseInt(e.target.value) || 0)}
            placeholder="25"
            className="h-12 text-center text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label>Рост (см)</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={p.height || ''}
            onChange={(e) => setProfileField('height', parseInt(e.target.value) || 0)}
            placeholder="170"
            className="h-12 text-center text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label>Вес (кг)</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={p.weight || ''}
            onChange={(e) => setProfileField('weight', parseInt(e.target.value) || 0)}
            placeholder="70"
            className="h-12 text-center text-lg"
          />
        </div>
      </div>

      {/* Medical restrictions */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
        <Checkbox
          id="med-restrictions"
          checked={p.medicalRestrictions}
          onCheckedChange={(v) => setProfileField('medicalRestrictions', !!v)}
          className="mt-0.5"
        />
        <div className="space-y-0.5">
          <Label htmlFor="med-restrictions" className="cursor-pointer text-sm font-medium">
            Есть медицинские ограничения
          </Label>
          <p className="text-xs text-muted-foreground">
            Травмы суставов, проблемы со спиной, сердечно-сосудистые заболевания и т.д.
          </p>
        </div>
      </div>
    </div>
  );
}