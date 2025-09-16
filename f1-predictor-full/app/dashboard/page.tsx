import Navbar from "components/Navbar";
import {
  Activity,
  BarChart3,
  Cpu,
  Flag,
  GaugeCircle,
  Radar,
  Settings2,
  Timer,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const kpis: Array<{
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
}> = [
  {
    title: "Predictive accuracy",
    value: "92.4%",
    change: "+1.2% vs Jeddah GP",
    icon: Activity,
  },
  {
    title: "Simulations this week",
    value: "128 runs",
    change: "42 tyre, 58 race pace, 28 weather",
    icon: Settings2,
  },
  {
    title: "Average pit stop",
    value: "2.36 s",
    change: "-0.08 s vs field",
    icon: Timer,
  },
  {
    title: "Power unit health",
    value: "98.1%",
    change: "Nominal wear projection",
    icon: GaugeCircle,
  },
];

const upcomingRaces: Array<{
  grandPrix: string;
  circuit: string;
  date: string;
  focus: string;
  strategy: string;
}> = [
  {
    grandPrix: "Australian Grand Prix",
    circuit: "Albert Park Circuit",
    date: "24 Mar 2024",
    focus: "High tyre degradation, medium-downforce baseline",
    strategy: "Start on mediums, extend to lap 24 before late soft attack",
  },
  {
    grandPrix: "Japanese Grand Prix",
    circuit: "Suzuka International Racing Course",
    date: "07 Apr 2024",
    focus: "Heavy aero efficiency demand, gusty crosswinds",
    strategy: "Balance wing levels, protect front-left wear on long sweepers",
  },
  {
    grandPrix: "Chinese Grand Prix",
    circuit: "Shanghai International Circuit",
    date: "21 Apr 2024",
    focus: "Regenerated surface, expect cooler track temps",
    strategy: "Undercut viable from lap 16 with two-stop soft/medium plan",
  },
];

const driverStandings: Array<{
  position: number;
  driver: string;
  team: string;
  points: number;
  delta: string;
}> = [
  { position: 1, driver: "Max Verstappen", team: "Oracle Red Bull Racing", points: 69, delta: "+18" },
  { position: 2, driver: "Charles Leclerc", team: "Scuderia Ferrari", points: 51, delta: "+6" },
  { position: 3, driver: "Lando Norris", team: "McLaren F1 Team", points: 47, delta: "+10" },
  { position: 4, driver: "Carlos Sainz", team: "Scuderia Ferrari", points: 42, delta: "+4" },
  { position: 5, driver: "Lewis Hamilton", team: "Mercedes-AMG F1", points: 38, delta: "+2" },
];

const telemetryFocus: Array<{
  label: string;
  value: string;
  detail: string;
}> = [
  {
    label: "ERS deployment delta",
    value: "+0.27 s/lap",
    detail: "Optimised burst on sector three straight maximises top speed",
  },
  {
    label: "Tyre wear trajectory",
    value: "-6%",
    detail: "Thermal deg reduced after revised brake duct inlet sizing",
  },
  {
    label: "Fuel target",
    value: "-1.8 kg",
    detail: "Lean mix laps 8-11 retain safety margin for late push",
  },
];

type InsightImpact = "positive" | "neutral" | "caution";

type SimulationInsight = {
  title: string;
  metric: string;
  description: string;
  nextStep: string;
  impact: InsightImpact;
  icon: LucideIcon;
};

const simulationInsights: SimulationInsight[] = [
  {
    title: "VSC window advantage",
    metric: "+6.2 s gain",
    description: "Virtual Safety Car pit on laps 18-22 beats baseline run in 78% of Monte Carlo iterations.",
    nextStep: "Brief strategy unit before FP3 to prime race engineers.",
    impact: "positive",
    icon: Radar,
  },
  {
    title: "Soft compound fade",
    metric: "0.12 s/lap",
    description: "Soft tyre delta spikes after lap 9, amplifying thermal runaway in traffic scenarios.",
    nextStep: "Schedule short-run qualifying sims to validate heat management.",
    impact: "caution",
    icon: TrendingUp,
  },
  {
    title: "Pit crew consistency",
    metric: "2.31-2.40 s",
    description: "Latest drills show 0.09 s spread with new front-jack choreography in place.",
    nextStep: "Deploy final rehearsal on Saturday with live tyre blankets.",
    impact: "neutral",
    icon: BarChart3,
  },
];

const impactStyles: Record<InsightImpact, string> = {
  positive: "bg-emerald-500/10 text-emerald-400",
  neutral: "bg-slate-500/10 text-slate-200",
  caution: "bg-amber-500/10 text-amber-300",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-asphalt text-asphalt-foreground">
      <Navbar />
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 shadow-pitlane">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">F1 Nexus Command</p>
            <h1 className="mt-4 font-display text-4xl font-semibold text-white">Operações de Desempenho</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Monitorize as tendências mais recentes das simulações, performance dos pilotos e prioridades
              estratégicas para o próximo fim de semana de Grande Prémio.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.title} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-white/50">{kpi.title}</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{kpi.value}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 p-3 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-4 text-xs text-white/60">{kpi.change}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 p-2 text-primary">
                  <Flag className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Próximos Grandes Prémios</h2>
                  <p className="text-xs uppercase tracking-widest text-white/50">Janela de preparação</p>
                </div>
              </div>
              <ul className="mt-6 space-y-4">
                {upcomingRaces.map((race) => (
                  <li key={race.grandPrix} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{race.grandPrix}</p>
                        <p className="text-xs text-white/60">{race.circuit}</p>
                      </div>
                      <span className="text-xs font-medium text-white/70">{race.date}</span>
                    </div>
                    <p className="mt-3 text-xs text-white/60">{race.focus}</p>
                    <p className="mt-2 text-xs text-primary">{race.strategy}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6 text-primary-foreground">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/20 p-2">
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold">Sprint Performance Watch</h2>
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/70">
                    Meta: top 3 em ritmo de corrida
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-primary-foreground/90">
                Simulação indica ritmo sustentável para disputar o pódio em stints curtos com pneu macio e
                prioridade na gestão de energia ERS.
              </p>
              <p className="mt-4 text-xs text-primary-foreground/70">
                Próxima acção: validar mapa de motor M3 em sessão FP2.
              </p>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Monitor de Performance dos Pilotos</h2>
              <span className="rounded-full bg-white/10 p-2 text-white/70">
                <Trophy className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {driverStandings.map((driver) => (
                <div key={driver.position} className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 font-display text-lg font-semibold text-primary">
                      {driver.position}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{driver.driver}</p>
                      <p className="text-xs text-white/60">{driver.team}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{driver.points} pts</p>
                    <p className="text-xs text-emerald-400">{driver.delta} desde a última prova</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Foco de Telemetria</h2>
              <span className="rounded-full bg-white/10 p-2 text-white/70">
                <Cpu className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {telemetryFocus.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-xs text-white/60">{item.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-white/50">
              Dados agregados a partir de 18 simulações de alta fidelidade processadas nas últimas 12 horas.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {simulationInsights.map((insight) => {
            const Icon = insight.icon;
            return (
              <article key={insight.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full p-2 ${impactStyles[insight.impact]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">{insight.title}</h3>
                    <p className="text-xs uppercase tracking-widest text-white/50">{insight.metric}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/70">{insight.description}</p>
                <p className="mt-4 text-xs text-white/60">Próximo passo: {insight.nextStep}</p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
