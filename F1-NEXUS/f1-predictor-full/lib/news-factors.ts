export type NewsArticle = {
  title: string;
  description?: string;
  url: string;
  source?: string;
  publishedAt?: string;
};

export type VariationTarget = {
  type: "driver" | "team";
  id: string; // driver code (e.g., VER) or team name key (e.g., "Ferrari")
};

export type NewsFactor = {
  id: string; // stable identifier for the factor
  label: string; // short name
  description: string; // short reasoning from news
  impactType: "pace" | "reliability" | "qualifying" | "strategy";
  targets: VariationTarget[]; // affected entities
  magnitude: number; // -1..1 (negative = worse; positive = better)
  enabled: boolean;
};

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function normaliseMagnitude(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return clamp(x, -1, 1);
}

export function dedupeFactors(factors: NewsFactor[]): NewsFactor[] {
  const seen = new Set<string>();
  const out: NewsFactor[] = [];
  for (const f of factors) {
    const key = f.id || `${f.impactType}:${(f.targets || []).map(t => t.type+":"+t.id).join(',')}:${f.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...f, magnitude: normaliseMagnitude(f.magnitude), enabled: Boolean(f.enabled) });
  }
  return out;
}

export function simpleHeuristicFromNews(articles: NewsArticle[]): NewsFactor[] {
  const text = (s?: string) => (s || '').toLowerCase();
  const factors: NewsFactor[] = [];

  for (const a of articles) {
    const t = text(a.title + ' ' + a.description);
    const targets: VariationTarget[] = [];
    // quick-and-dirty driver code/teams spotting
    const teams = ["Red Bull", "Ferrari", "Mercedes", "McLaren", "Aston Martin", "Alpine", "Williams", "RB", "Haas", "Sauber", "Stake"];
    for (const team of teams) {
      if (t.includes(team.toLowerCase())) targets.push({ type: 'team', id: team });
    }
    const codes = ["VER","PER","HAM","RUS","NOR","PIA","LEC","SAI","ALO","STR","GAS","OCO","ALB","SAR","TSU","RIC","HUL","MAG","BOT","ZHO"]; // not exhaustive
    for (const c of codes) {
      if (t.includes(c.toLowerCase())) targets.push({ type: 'driver', id: c });
    }

    const mk = (impactType: NewsFactor['impactType'], magnitude: number, label: string) => {
      const id = `${impactType}:${label}:${targets.map(t=>t.type+":"+t.id).join(',')}`;
      factors.push({ id, label, description: a.title || label, impactType, targets: targets.length?targets:[{type:'team', id:'GLOBAL'}], magnitude, enabled: true });
    };

    if (/(upgrade|new floor|rear wing|aero|package|updates?)/.test(t)) {
      mk('pace', 0.2, 'Atualização técnica');
    }
    if (/(penalty|grid drop|disqualif|ban)/.test(t)) {
      mk('qualifying', -0.5, 'Penalização');
    }
    if (/(engine|power unit|gearbox|failure|problem|reliab|issue|smoke|fire)/.test(t)) {
      mk('reliability', -0.3, 'Problemas de fiabilidade');
    }
    if (/(strategy|pit stop|undercut|overcut)/.test(t)) {
      mk('strategy', 0.1, 'Variação estratégica');
    }
    if (/(rain|wet|storm)/.test(t)) {
      mk('strategy', 0.15, 'Possível chuva/estratégia');
    }
  }

  return dedupeFactors(factors).slice(0, 12);
}

