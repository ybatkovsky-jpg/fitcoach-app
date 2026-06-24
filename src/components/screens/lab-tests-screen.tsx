'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BIOMARKERS,
  getBiomarkerStatus,
  getRecommendations,
  getLifestyleRecommendations,
  STATUS_CONFIG,
  LAB_PANELS,
  type BiomarkerDef,
  type BiomarkerStatus,
} from '@/lib/lab-tests';
import {
  ChevronLeft, Plus, Trash2, Pill, FlaskConical, Info,
  AlertTriangle, CheckCircle2, ArrowDown, ArrowUp, Minus,
  ClipboardList, Heart, Lightbulb, Clock, DollarSign, Beaker,
} from 'lucide-react';

const PRIORITY_CONFIG = {
  essential: { label: 'Обязательно', color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', dot: 'bg-rose-500' },
  recommended: { label: 'Рекомендовано', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', dot: 'bg-amber-500' },
  optional: { label: 'По желанию', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', dot: 'bg-blue-500' },
};

export function LabTestsScreen() {
  const { labTestEntries, addLabTestEntry, removeLabTestEntry, setScreen } = useAppStore();

  // Input state
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'enter' | 'history' | 'recommendations' | 'panels' | 'lifestyle'>('panels');
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  const handleSave = () => {
    const results: Record<string, number> = {};
    let hasValue = false;
    for (const [id, val] of Object.entries(inputValues)) {
      const num = parseFloat(val);
      if (!isNaN(num) && val.trim() !== '') {
        results[id] = num;
        hasValue = true;
      }
    }
    if (!hasValue) return;

    const newId = `lab_${Date.now()}`;
    addLabTestEntry(results);
    setInputValues({});
    setShowForm(false);
    setSelectedEntry(newId);
    setActiveTab('recommendations');
  };

  // Get the selected entry's data
  const selectedEntryData = selectedEntry
    ? labTestEntries.find((e) => e.id === selectedEntry)
    : labTestEntries.length > 0
      ? labTestEntries[labTestEntries.length - 1]
      : null;

  const recommendations = selectedEntryData
    ? getRecommendations(selectedEntryData.results)
    : [];

  const lifestyleRecs = selectedEntryData
    ? getLifestyleRecommendations(selectedEntryData.results)
    : [];

  const filledCount = Object.values(inputValues).filter((v) => v.trim() !== '').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setScreen('nutrition')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Анализы и БАДы</h1>
          <p className="text-[10px] text-muted-foreground">Персонализированные рекомендации</p>
        </div>
        <div className="p-2 rounded-xl bg-primary/10">
          <FlaskConical className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-1 shrink-0 overflow-x-auto">
        {([
          { id: 'panels' as const, label: 'Что сдать' },
          { id: 'enter' as const, label: 'Ввести' },
          { id: 'recommendations' as const, label: 'БАДы' },
          { id: 'lifestyle' as const, label: 'Советы' },
          { id: 'history' as const, label: 'История' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 py-2 text-[10px] font-medium rounded-lg transition-colors px-2.5 ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 min-h-0">
        {/* === PANELS TAB (What to test) === */}
        {activeTab === 'panels' && (
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-4">
              <div className="p-4 rounded-2xl bg-primary/5 inline-block">
                <ClipboardList className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-base font-bold">Какие анализы сдать?</h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                Выберите панель анализов в зависимости от ваших целей. Каждая панель содержит конкретные показатели и даёт чёткий результат: что у вас в норме, а что требует внимания.
              </p>
            </div>

            {LAB_PANELS.map((panel) => {
              const isExpanded = expandedPanel === panel.id;
              const pCfg = PRIORITY_CONFIG[panel.priority];
              // Check which biomarkers have already been tested
              const testedCount = labTestEntries.length > 0
                ? panel.biomarkerIds.filter((id) =>
                    labTestEntries[labTestEntries.length - 1].results[id] !== undefined
                  ).length
                : 0;

              return (
                <Card key={panel.id} className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      className="w-full text-left p-4"
                      onClick={() => setExpandedPanel(isExpanded ? null : panel.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-bold">{panel.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${pCfg.bg} ${pCfg.color}`}>
                              {pCfg.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {panel.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Beaker className="w-3 h-3" />
                              {panel.biomarkerIds.length} показателей
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {panel.frequency}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {panel.estimatedCost}
                            </span>
                          </div>
                        </div>
                        <ChevronIcon expanded={isExpanded} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t">
                        {/* What you get */}
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-semibold">Что вы узнаете:</span>
                          </div>
                          <ul className="space-y-1.5">
                            {panel.whatYouGet.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Biomarkers included */}
                        <div className="px-4 pb-3">
                          <div className="text-[10px] font-medium text-muted-foreground mb-1.5">Показатели в панели:</div>
                          <div className="flex flex-wrap gap-1">
                            {panel.biomarkerIds.map((id) => {
                              const b = BIOMARKERS.find((bm) => bm.id === id);
                              if (!b) return null;
                              const isTested = labTestEntries.length > 0 &&
                                labTestEntries[labTestEntries.length - 1].results[id] !== undefined;
                              return (
                                <span
                                  key={id}
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                    isTested
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {isTested ? '✓ ' : ''}{b.name.split('(')[0].trim()}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Preparation */}
                        <div className="px-4 pb-3">
                          <div className="p-3 rounded-xl bg-muted/50 text-[10px] text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1 font-medium text-foreground">
                              <Info className="w-3 h-3 text-primary" />
                              Подготовка к сдаче
                            </div>
                            <p>{panel.preparation}</p>
                          </div>
                        </div>

                        {/* Action */}
                        {testedCount > 0 && testedCount < panel.biomarkerIds.length && (
                          <div className="px-4 pb-4">
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-[10px] text-amber-700 dark:text-amber-400">
                              Из этой панели уже сдано {testedCount} из {panel.biomarkerIds.length}. Остальные показатели можно добавить в новой записи.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* General advice at bottom */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-semibold">Общие правила</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
                  <p>Сдавайте анализы утром натощак (8–12 часов голодания). Воду пить можно. Все анализы сдавайте в один день, чтобы получить полную картину.</p>
                  <p>За 48 часов до сдачи исключите интенсивные тренировки и алкоголь. Приём БАДов отмените в день сдачи (кроме тех, что назначены врачом постоянно).</p>
                  <p>Результаты введите в раздел «Ввести» — приложение автоматически определит отклонения и подберёт персональные рекомендации по добавкам и образу жизни.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === ENTER TAB === */}
        {activeTab === 'enter' && (
          <div className="space-y-4">
            {!showForm ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <div className="p-6 rounded-3xl bg-primary/5">
                  <FlaskConical className="w-12 h-12 text-primary/60" />
                </div>
                <div className="text-center space-y-2 max-w-[260px]">
                  <h2 className="text-base font-bold">Добавьте результаты анализов</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Введите показатели из вашего биохимического анализа крови. Мы подберём персональные рекомендации по БАДам на основе отклонений от нормы.
                  </p>
                </div>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ввести результаты
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold">Заполните показатели</h2>
                  <span className="text-xs text-muted-foreground">{filledCount} из {BIOMARKERS.length}</span>
                </div>

                {BIOMARKERS.map((b) => (
                  <BiomarkerInput
                    key={b.id}
                    biomarker={b}
                    value={inputValues[b.id] ?? ''}
                    onChange={(val) =>
                      setInputValues((prev) => ({ ...prev, [b.id]: val }))
                    }
                  />
                ))}

                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>
                    Заполняйте только те показатели, которые сдавали. Пустые поля будут проигнорированы.
                    Сдайте анализ натощак в утренние часы для наиболее точных результатов.
                  </span>
                </div>

                <div className="flex gap-3 pt-2 pb-4">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setInputValues({}); }}>
                    Отмена
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleSave} disabled={filledCount === 0}>
                    <CheckCircle2 className="w-4 h-4" />
                    Сохранить ({filledCount})
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* === RECOMMENDATIONS TAB (Supplements) === */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {!selectedEntryData ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Pill className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Введите результаты анализов, чтобы получить рекомендации по БАДам
                </p>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab('enter')}>
                  <Plus className="w-3.5 h-3.5" />
                  Ввести анализы
                </Button>
              </div>
            ) : (
              <>
                {/* Entry selector */}
                {labTestEntries.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {labTestEntries.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEntry(e.id)}
                        className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                          selectedEntry === e.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {e.date}
                      </button>
                    ))}
                  </div>
                )}

                {/* Results overview */}
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskConical className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-bold">Результаты от {selectedEntryData.date}</h2>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(selectedEntryData.results).map(([id, value]) => {
                          const b = BIOMARKERS.find((bm) => bm.id === id);
                          if (!b) return null;
                          const status = getBiomarkerStatus(value, b);
                          const cfg = STATUS_CONFIG[status];
                          const StatusIcon = status === 'low' ? ArrowDown : status === 'high' ? ArrowUp : Minus;
                          return (
                            <div key={id} className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${cfg.color}`} />
                                <span className="text-xs truncate">{b.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-semibold">{value} {b.unit}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${cfg.bg} ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supplement Recommendations */}
                {recommendations.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                      <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Всё в норме!</h3>
                      <p className="text-xs text-muted-foreground">
                        По введённым показателям отклонений не обнаружено. Продолжайте текущую программу supplementation и пересдайте анализы через 3–6 месяцев для контроля.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        Обнаружены отклонения. Рекомендации носят информационный характер.
                        Перед приёмом любых БАДов проконсультируйтесь с врачом.
                      </span>
                    </div>

                    {recommendations.map((rec, i) => (
                      <Card key={i} className="border-0 shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold">{rec.biomarkerName}</h3>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${STATUS_CONFIG[rec.status].bg} ${STATUS_CONFIG[rec.status].color}`}
                            >
                              {STATUS_CONFIG[rec.status].label}
                            </Badge>
                          </div>

                          {(() => {
                            const bDef = BIOMARKERS.find((b) => b.id === rec.biomarkerId);
                            return bDef ? (
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {bDef.description}
                              </p>
                            ) : null;
                          })()}

                          <Separator />

                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-semibold">Рекомендуемые БАДы:</span>
                            </div>
                            {rec.items.map((sup, j) => (
                              <div
                                key={j}
                                className="p-3 rounded-xl bg-muted/50 space-y-1.5"
                              >
                                <div className="text-xs font-semibold">{sup.name}</div>
                                <div className="flex gap-2 text-[10px]">
                                  <span className="bg-primary/5 text-primary px-2 py-0.5 rounded-md font-medium">
                                    {sup.dosage}
                                  </span>
                                </div>
                                {sup.note && (
                                  <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                                    <Info className="w-3 h-3 shrink-0 mt-0.5" />
                                    {sup.note}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}

                {/* General retest advice */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold">Когда пересдать анализы?</h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>
                        Железо и ферритин — через 6–8 недель после начала приёма. Витамин D — через 2–3 месяца. 
                        Гормоны (тестостерон, ТТГ, кортизол) — через 4–6 недель. Липидный профиль и глюкоза — через 2–3 месяца.
                      </p>
                      <p>
                        Все анализы сдавайте утром натощак (8–12 часов голодания). За 48 часов до сдачи исключите 
                        интенсивные тренировки и алкоголь. Приём обычных БАДов отмените в день сдачи.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* === LIFESTYLE TAB === */}
        {activeTab === 'lifestyle' && (
          <div className="space-y-4">
            {!selectedEntryData ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Lightbulb className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Введите результаты анализов для персональных рекомендаций по образу жизни
                </p>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab('enter')}>
                  <Plus className="w-3.5 h-3.5" />
                  Ввести анализы
                </Button>
              </div>
            ) : lifestyleRecs.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Ваш образ жизни в норме!</h3>
                  <p className="text-xs text-muted-foreground">
                    По вашим показателям нет отклонений, требующих корректировки образа жизни.
                    Продолжайте текущий режим тренировок и отдыха.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold">Рекомендации по образу жизни</h2>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Эти рекомендации подобраны на основе ваших отклонений от нормы. Каждая совет связан с конкретными показателями, которые нуждаются в корректировке.
                </p>

                {lifestyleRecs.map((advice, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">{advice.icon}</span>
                        <div>
                          <h3 className="text-sm font-bold">{advice.title}</h3>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                            {advice.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {advice.affectedBiomarkerIds.map((id) => {
                              const b = BIOMARKERS.find((bm) => bm.id === id);
                              const val = selectedEntryData?.results[id];
                              if (!b || val === undefined) return null;
                              const status = getBiomarkerStatus(val, b);
                              const cfg = STATUS_CONFIG[status];
                              return (
                                <span key={id} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${cfg.bg} ${cfg.color}`}>
                                  {b.name.split('(')[0].trim()}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>
                    Рекомендации носят информационный характер и не заменяют консультацию врача.
                    При серьёзных отклонениях обратитесь к специалисту.
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* === HISTORY TAB === */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {labTestEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FlaskConical className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Пока нет сохранённых анализов</p>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab('enter')}>
                  <Plus className="w-3.5 h-3.5" />
                  Добавить
                </Button>
              </div>
            ) : (
              labTestEntries.map((entry) => {
                const recs = getRecommendations(entry.results);
                const hasIssues = recs.length > 0;
                return (
                  <Card
                    key={entry.id}
                    className={`border-0 shadow-sm cursor-pointer transition-all ${
                      selectedEntry === entry.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => { setSelectedEntry(entry.id); setActiveTab('recommendations'); }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{entry.date}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {Object.keys(entry.results).length} показателей
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasIssues && (
                            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {recs.length} рек.
                            </Badge>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeLabTestEntry(entry.id); }}
                            className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(entry.results).map(([id, value]) => {
                          const b = BIOMARKERS.find((bm) => bm.id === id);
                          if (!b) return null;
                          const status = getBiomarkerStatus(value, b);
                          const cfg = STATUS_CONFIG[status];
                          return (
                            <span
                              key={id}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${cfg.bg} ${cfg.color}`}
                            >
                              {b.name.split('(')[0].trim()} {value} {b.unit}
                            </span>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Chevron toggle ---

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// --- Biomarker Input Component ---

function BiomarkerInput({
  biomarker,
  value,
  onChange,
}: {
  biomarker: BiomarkerDef;
  value: string;
  onChange: (val: string) => void;
}) {
  const numValue = parseFloat(value);
  const hasValue = value.trim() !== '' && !isNaN(numValue);
  const status: BiomarkerStatus | null = hasValue ? getBiomarkerStatus(numValue, biomarker) : null;
  const cfg = status ? STATUS_CONFIG[status] : null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold">{biomarker.name}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Норма: {biomarker.lowThreshold}–{biomarker.highThreshold} {biomarker.unit}
              {biomarker.idealMin !== undefined && biomarker.idealMax !== undefined && (
                <> · Идеально: {biomarker.idealMin}–{biomarker.idealMax}</>
              )}
            </div>
          </div>
          {cfg && (
            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md font-medium ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="0"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full h-10 px-3 pr-12 text-sm rounded-xl border-2 bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                status === 'low' ? 'border-blue-300 dark:border-blue-700' :
                status === 'high' ? 'border-rose-300 dark:border-rose-700' :
                status === 'ideal' ? 'border-emerald-300 dark:border-emerald-700' :
                status === 'normal' ? 'border-green-300 dark:border-green-700' :
                'border-muted'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {biomarker.unit}
            </span>
          </div>
        </div>
        {hasValue && (
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {biomarker.whatItAffects}
          </p>
        )}
      </CardContent>
    </Card>
  );
}