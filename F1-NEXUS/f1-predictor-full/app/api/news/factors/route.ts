export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { NewsArticle, NewsFactor, dedupeFactors, simpleHeuristicFromNews, normaliseMagnitude } from "lib/news-factors";
import { getRoster, resolveTargetsFromText } from "lib/roster";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
// Default to a lighter model; override via OLLAMA_MODEL env
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b-instruct";

async function fetchNews(baseUrl: string): Promise<NewsArticle[]> {
  try {
    // Try cache-only first to preserve daily quota
    let res = await fetch(new URL("/api/news?language=en&pageSize=20&cacheOnly=1", baseUrl), { cache: "no-store" });
    let json = await res.json();
    let articles: NewsArticle[] = (json.articles || []) as NewsArticle[];
    if (!articles.length) {
      res = await fetch(new URL("/api/news?language=en&pageSize=20", baseUrl), { cache: "no-store" });
      json = await res.json();
      articles = (json.articles || []) as NewsArticle[];
    }
    return articles;
  } catch {
    return [];
  }
}

function buildPrompt(articles: NewsArticle[], allowedCodes: string[], allowedTeams: string[]): string {
  const ctx = articles.map((a, i) => `- [${i+1}] ${a.title} :: ${a.description || ''}`).join("\n");
  const codes = allowedCodes.join(', ');
  const teams = allowedTeams.join(', ');
  return `You are an F1 analyst. Read the headlines and output a JSON array called factors.\n\nRules:\n- Output ONLY JSON.\n- Each factor has: id, label, description, impactType(one of pace,reliability,qualifying,strategy), targets(array of {type:'driver'|'team', id}), magnitude([-1..1]), enabled(true).\n- Valid driver codes: ${codes}.\n- Valid team names: ${teams}.\n- magnitude: negative = worse performance/reliability/qualifying, positive = better.\n- Keep 3-8 concise factors.\n\nHeadlines:\n${ctx}\n\nJSON:`;
}

async function analyzeWithOllama(articles: NewsArticle[], allowedCodes: string[], allowedTeams: string[]): Promise<NewsFactor[] | null> {
  const prompt = buildPrompt(articles, allowedCodes, allowedTeams);
  const maxAttempts = 2;
  let lastErr: any = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, options: { temperature: 0.2 } }),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text: string = data.response || data?.message?.content || "";
      const m = text.match(/\[([\s\S]*)\]/);
      const jsonStr = m ? `[${m[1]}]` : text.trim();
      const raw = JSON.parse(jsonStr);
      if (!Array.isArray(raw)) return null;
      const factors = raw.map((f: any): NewsFactor => ({
        id: String(f.id || f.label || Math.random().toString(36).slice(2)),
        label: String(f.label || "Fator"),
        description: String(f.description || ""),
        impactType: (f.impactType === 'pace' || f.impactType === 'reliability' || f.impactType === 'qualifying' || f.impactType === 'strategy') ? f.impactType : 'pace',
        targets: Array.isArray(f.targets) ? f.targets.filter((t: any) => t && (t.type==='driver' || t.type==='team') && t.id).map((t: any) => ({ type: t.type, id: String(t.id).toUpperCase() })) : [],
        magnitude: normaliseMagnitude(Number(f.magnitude ?? 0)),
        enabled: Boolean(f.enabled ?? true),
      }));
      return dedupeFactors(factors);
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 250));
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  const roster = await getRoster();
  const articles = await fetchNews(baseUrl);
  const fromAI = await analyzeWithOllama(articles, roster.drivers.map(d=>d.code), Array.from(new Set(roster.drivers.map(d=>d.team))));
  if (fromAI && fromAI.length) {
    const refined = fromAI.map(f => {
      let targets = f.targets && f.targets.length ? f.targets : resolveTargetsFromText((f.description||'') + ' ' + articles.map(a=>a.title + ' ' + (a.description||'')).join(' '), roster);
      // Filter to allowed sets
      targets = targets.filter(t => t.type === 'driver' ? roster.byCode.has(String(t.id).toUpperCase()) : true)
                       .map(t => t.type === 'team' ? { ...t, id: t.id } : { ...t, id: String(t.id).toUpperCase() });
      return { ...f, targets };
    });
    const updatedAt = new Date().toISOString();
    return new NextResponse(
      JSON.stringify({ factors: refined, source: 'ollama', updatedAt }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'X-Analysis-Source': 'ollama', 'X-Updated-At': updatedAt } }
    );
  }
  const fallbackRaw = simpleHeuristicFromNews(articles);
  const fallback = fallbackRaw.map(f => {
    let targets = f.targets && f.targets.length ? f.targets : resolveTargetsFromText((f.description||'') + ' ' + articles.map(a=>a.title + ' ' + (a.description||'')).join(' '), roster);
    targets = targets.filter(t => t.type === 'driver' ? roster.byCode.has(String(t.id).toUpperCase()) : true)
                     .map(t => t.type === 'team' ? { ...t, id: t.id } : { ...t, id: String(t.id).toUpperCase() });
    return { ...f, targets };
  });
  const updatedAt = new Date().toISOString();
  return new NextResponse(
    JSON.stringify({ factors: fallback, source: 'heuristic', updatedAt }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'X-Analysis-Source': 'heuristic', 'X-Updated-At': updatedAt } }
  );
}
