'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  KNOWLEDGE_TOPICS,
  KNOWLEDGE_CATEGORIES,
  BOOK_SOURCES,
  type KnowledgeTopic,
} from '@/lib/knowledge-base';
import {
  ArrowLeft, ArrowDownUp, ArrowRightLeft, BookOpen, Brain,
  ChevronRight, Clock, Gauge, BarChart3, Heart, Layers, Library,
  ListOrdered, Pause, RefreshCw, Search, TrendingDown, TrendingUp,
  Zap, Dumbbell,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Layers, Gauge, BarChart3, ListOrdered, Heart, Zap, Dumbbell, Clock,
  Brain, ArrowRightLeft, ArrowDownUp, RefreshCw, TrendingUp,
  Pause, TrendingDown, Activity: Zap, Table: BarChart3, Timer: Clock,
  BrainCircuit: Brain,
};

export function KnowledgeScreen() {
  const { setScreen } = useAppStore();
  const [selectedTopic, setSelectedTopic] = useState<KnowledgeTopic | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (selectedTopic) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
          <button
            onClick={() => setSelectedTopic(null)}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{selectedTopic.title}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
          {/* Category badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="text-[10px]">
              {KNOWLEDGE_CATEGORIES.find((c) => c.id === selectedTopic.category)?.name}
            </Badge>
          </div>

          {/* Main content */}
          <div className="text-sm leading-relaxed text-foreground/90">
            {selectedTopic.content}
          </div>

          {/* Key points */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-primary" />
              Ключевые принципы
            </h3>
            {selectedTopic.keyPoints.map((point, i) => (
              <div
                key={i}
                className="flex gap-3 text-sm text-foreground/80 bg-muted/50 rounded-xl px-3 py-2.5"
              >
                <span className="text-primary font-semibold text-xs mt-0.5 shrink-0">
                  {i + 1}.
                </span>
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>

          {/* Practical application */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-primary mb-1.5">
                Применение в FitCoach
              </h3>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {selectedTopic.practicalApplication}
              </p>
            </CardContent>
          </Card>

          {/* Sources */}
          <div className="space-y-1.5 pt-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Источники
            </h3>
            {selectedTopic.sources.map((source, i) => (
              <p key={i} className="text-xs text-muted-foreground italic">
                {source}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredTopics = KNOWLEDGE_TOPICS.filter((topic) => {
    const matchesCategory = !activeCategory || topic.category === activeCategory;
    const matchesSearch = !searchQuery ||
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.shortTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedTopics = activeCategory
    ? { [activeCategory]: filteredTopics }
    : KNOWLEDGE_CATEGORIES.reduce<Record<string, KnowledgeTopic[]>>((acc, cat) => {
        const topics = filteredTopics.filter((t) => t.category === cat.id);
        if (topics.length > 0) acc[cat.id] = topics;
        return acc;
      }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
        <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
          <Library className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Конспекты</h1>
          <p className="text-[10px] text-muted-foreground">Научные основы тренировок</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pb-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по темам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="px-5 pb-3 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
              !activeCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Все
          </button>
          {KNOWLEDGE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                activeCategory === cat.id
                  ? cat.color
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">
        {Object.entries(groupedTopics).map(([catId, topics]) => {
          const cat = KNOWLEDGE_CATEGORIES.find((c) => c.id === catId);
          if (!cat || topics.length === 0) return null;

          return (
            <div key={catId} className="space-y-2">
              {!activeCategory && (
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${cat.color}`}>
                    {(() => {
                      const Icon = ICON_MAP[cat.icon] || BookOpen;
                      return <Icon className="w-3.5 h-3.5" />;
                    })()}
                  </div>
                  <h2 className="text-sm font-semibold">{cat.name}</h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {topics.length}
                  </Badge>
                </div>
              )}

              {topics.map((topic) => {
                const Icon = ICON_MAP[topic.icon] || BookOpen;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className="w-full text-left"
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3.5 flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${cat.color} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold">{topic.shortTitle}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                            {topic.keyPoints[0]}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Books section */}
        <div className="space-y-2 pt-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Источники (8 книг)
          </h2>
          {BOOK_SOURCES.map((book) => (
            <Card key={book.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="text-xs font-medium">{book.name}</div>
                <div className="text-[10px] text-muted-foreground italic">
                  {book.title}{book.year ? ` (${book.year})` : ''}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}