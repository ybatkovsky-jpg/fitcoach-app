'use client';

import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getRecommendations } from '@/lib/lab-tests';
import {
  Apple, Egg, Beef, Droplets, Pill, Dumbbell, Fish, Salad,
  Wheat, Milk, Clock, AlertTriangle, Info, FlaskConical, ChevronRight,
} from 'lucide-react';

interface NutritionTip {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

interface SupplementTip {
  name: string;
  purpose: string;
  dosage: string;
  timing: string;
  note?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getCalorieTarget(profile: { weight: number; height: number; age: number; gender: string; goal: string }): { kcal: number; protein: number; fat: number; carbs: number } {
  // Mifflin-St Jeor
  const bmr = profile.gender === 'male'
    ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
    : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;

  const tdee = Math.round(bmr * 1.4); // moderate activity
  let target = tdee;
  if (profile.goal === 'lose_weight') target = tdee - 400;
  else if (profile.goal === 'muscle_tone') target = tdee + 200;

  return {
    kcal: target,
    protein: Math.round(profile.weight * (profile.goal === 'muscle_tone' ? 2.0 : 1.6)),
    fat: Math.round((target * 0.25) / 9),
    carbs: Math.round((target * 0.45) / 4),
  };
}

export function NutritionScreen() {
  const { profile, setScreen, labTestEntries } = useAppStore();
  if (!profile) return null;

  const macros = getCalorieTarget(profile);

  // Count lab test issues for badge
  const lastLabEntry = labTestEntries.length > 0 ? labTestEntries[labTestEntries.length - 1] : null;
  const labRecs = lastLabEntry ? getRecommendations(lastLabEntry.results) : [];

  const baseTips: NutritionTip[] = [
    {
      icon: Egg,
      title: 'Белок в каждый приём пищи',
      description: 'Распределите белок равномерно: 25–40 г за приём. Источники: яйца, курица, творог, рыба, бобовые. Белок стимулирует синтез мышечного белка и ускоряет восстановление после тренировок.',
      color: 'text-orange-500',
    },
    {
      icon: Wheat,
      title: 'Сложные углеводы',
      description: 'Основа энергии для тренировок: гречка, овсянка, бурый рис, цельнозерновой хлеб. Избегайте простых сахаров за исключением периода после тренировки (в окно 30 минут).',
      color: 'text-amber-600',
    },
    {
      icon: Beef,
      title: 'Полезные жиры',
      description: 'Омега-3 (рыба, льняное масло), мононенасыщенные (авокадо, оливковое масло). Жиры необходимы для гормональной регуляции и усвоения жирорастворимых витаминов A, D, E, K.',
      color: 'text-rose-500',
    },
    {
      icon: Droplets,
      title: 'Водный баланс',
      description: `Рекомендуемый объём: ~${(profile.weight * 0.033).toFixed(1)} л/день (${Math.round(profile.weight * 33)} мл). Увеличьте на 500 мл в дни тренировок. Дегидратация снижает силу на 10–20% и ухудшает восстановление.`,
      color: 'text-blue-500',
    },
    {
      icon: Clock,
      title: 'Тайминг приёмов пищи',
      description: 'За 1.5–2 ч до тренировки — углеводный приём (каша + фрукт). В течение 30 мин после — белок + углеводы (творог + банан). Последний приём за 2–3 ч до сна.',
      color: 'text-emerald-500',
    },
    {
      icon: Salad,
      title: 'Овощи и клетчатка',
      description: 'Минимум 400 г овощей в день для микронутриентов и пищеварения. Разнообразие цветов = разнообразие витаминов. Добавляйте зелень в каждый приём пищи.',
      color: 'text-green-600',
    },
  ];

  const supplements: SupplementTip[] = [
    {
      name: 'Витамин D3',
      purpose: 'Кости, иммунитет, мышечная функция',
      dosage: '2000–4000 МЕ/день',
      timing: 'Утром с едой (жирорастворимый)',
      note: 'Дефицит D3 — у 70% населения в наших широтах',
      icon: Pill,
    },
    {
      name: 'Омега-3',
      purpose: 'Противовоспалительное, суставы, сердце',
      dosage: '1000–2000 мг EPA+DHA/день',
      timing: 'С основным приёмом пищи',
      icon: Fish,
    },
    {
      name: 'Креатин моногидрат',
      purpose: 'Сила, мощность, объём мышц',
      dosage: '3–5 г/день (без фазы загрузки)',
      timing: 'В любое время, каждый день',
      note: 'Самый изученный БАД, безопасен для здоровых',
      icon: Dumbbell,
    },
    {
      name: 'Магний',
      purpose: 'Расслабление мышц, сон, нервная система',
      dosage: '300–400 мг (цитрат или глицинат)',
      timing: 'Вечером за 1 ч до сна',
      icon: Pill,
    },
    {
      name: 'Сывороточный протеин',
      purpose: 'Удобный источник белка после тренировки',
      dosage: '25–30 г (1 порция) при необходимости',
      timing: 'В течение 30 мин после тренировки',
      note: 'Не обязателен при достатке белка из еды',
      icon: Milk,
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-24 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold tracking-tight">Питание и БАДы</h1>

      {/* Macro targets */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-5">
            <div className="flex items-center gap-2 mb-3">
              <Apple className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Ваша суточная норма</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{macros.kcal}</div>
                <div className="text-[10px] text-muted-foreground">ккал</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{macros.protein}</div>
                <div className="text-[10px] text-muted-foreground">г белка</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{macros.fat}</div>
                <div className="text-[10px] text-muted-foreground">г жиров</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-500">{macros.carbs}</div>
                <div className="text-[10px] text-muted-foreground">г углев.</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lab tests link */}
      <button
        onClick={() => setScreen('lab_tests')}
        className="w-full text-left"
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 shrink-0">
              <FlaskConical className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Анализы и БАДы</span>
                {labRecs.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {labRecs.length} рек.
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {labTestEntries.length > 0
                  ? `Последний анализ: ${lastLabEntry?.date}. ${labRecs.length > 0 ? 'Есть рекомендации' : 'Всё в норме'}`
                  : 'Введите результаты анализов для персональных рекомендаций по добавкам'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </button>

      {/* Nutrition tips */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Основы питания</h3>
        {baseTips.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 bg-muted ${tip.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{tip.title}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* Supplements */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Рекомендуемые БАДы</h3>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
          <span>БАДы не заменяют сбалансированное питание. Перед приёмом проконсультируйтесь с врачом.</span>
        </div>
        {supplements.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold">{s.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.purpose}</p>
                <div className="flex gap-3 text-[10px]">
                  <span className="bg-primary/5 text-primary px-2 py-0.5 rounded-md font-medium">{s.dosage}</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md">{s.timing}</span>
                </div>
                {s.note && (
                  <p className="text-[10px] text-amber-600 flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    {s.note}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}