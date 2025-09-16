const raceWeekend = {
  grandPrix: "Grande Prémio de Mônaco",
  circuit: "Circuit de Monaco",
  laps: 78,
  raceDistance: "260.286 km",
  sessions: [
    { name: "Treinos Livres 1", day: "sexta-feira", time: "11:30" },
    { name: "Treinos Livres 2", day: "sexta-feira", time: "15:00" },
    { name: "Treinos Livres 3", day: "sábado", time: "11:30" },
    { name: "Qualificação", day: "sábado", time: "15:00" },
    { name: "Corrida", day: "domingo", time: "14:00" },
  ],
  weatherOutlook: {
    conditions: "Ensolarado com nebulosidade variável",
    trackTemp: "32ºC",
    chanceOfRain: "12%",
  },
};

const performanceMetrics = [
  {
    label: "Pontos acumulados",
    value: "247",
    change: "+18 vs. última corrida",
    tone: "positive",
  },
  {
    label: "Taxa de consistência",
    value: "92%",
    change: "Top 5 em 11/12 provas",
    tone: "neutral",
  },
  {
    label: "Eficiência do pit stop",
    value: "2,41s",
    change: "Melhor marca da temporada",
    tone: "highlight",
  },
];

const driverStandings = [
  {
    position: 1,
    driver: "Max Verstappen",
    team: "Red Bull Racing",
    points: 247,
    delta: "+18",
  },
  {
    position: 2,
    driver: "Charles Leclerc",
    team: "Ferrari",
    points: 214,
    delta: "+10",
  },
  {
    position: 3,
    driver: "Lando Norris",
    team: "McLaren",
    points: 198,
    delta: "+25",
  },
  {
    position: 4,
    driver: "Carlos Sainz",
    team: "Ferrari",
    points: 176,
    delta: "+8",
  },
  {
    position: 5,
    driver: "Lewis Hamilton",
    team: "Mercedes",
    points: 158,
    delta: "+12",
  },
];

const constructorStandings = [
  {
    position: 1,
    team: "Red Bull Racing",
    points: 396,
    delta: "+28",
  },
  {
    position: 2,
    team: "Ferrari",
    points: 368,
    delta: "+18",
  },
  {
    position: 3,
    team: "McLaren",
    points: 322,
    delta: "+40",
  },
  {
    position: 4,
    team: "Mercedes",
    points: 274,
    delta: "+22",
  },
  {
    position: 5,
    team: "Aston Martin",
    points: 146,
    delta: "+6",
  },
];

const strategicInsights = [
  {
    title: "Gestão de pneus",
    description:
      "Programar stint inicial com pneus médios para aproveitar janela de aquecimento mais rápida e proteger contra safety car antecipado.",
  },
  {
    title: "Configuração aerodinâmica",
    description:
      "Maximizar carga nos eixos dianteiro e traseiro para melhor tração na saída das curvas lentas do setor final.",
  },
  {
    title: "Drivers to Watch",
    description:
      "Lando Norris mantém ritmo consistente nas últimas corridas e deve ser monitorado para reações estratégicas em undercut.",
  },
];

const recentHighlights = [
  {
    event: "GP da Emília-Romanha",
    takeaway:
      "Dupla da equipe completou a prova dentro do top 6 com ritmo forte em stint final.",
  },
  {
    event: "GP de Miami",
    takeaway:
      "Ajustes de suspensão reduziram desgaste de pneus macios, garantindo volta mais rápida da corrida.",
  },
  {
    event: "GP da China",
    takeaway:
      "Pit stop recorde da equipe (2,41s) consolidou salto estratégico sobre concorrência direta.",
  },
];

export default function DashboardPage() {
  return (
    <main className="space-y-12 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="uppercase tracking-[0.3em] text-sm text-primary-foreground/70">
            Temporada 2024
          </p>
          <h1 className="text-4xl font-display font-semibold text-white">
            Centro de operações F1 Nexus
          </h1>
          <p className="max-w-2xl text-base text-zinc-300">
            Acompanhe métricas estratégicas da temporada, performance dos
            pilotos e atualizações essenciais para preparar os próximos fins de
            semana de corrida com precisão e agilidade.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-zinc-300 md:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-asphalt/60 p-3">
            <p className="text-xs uppercase text-zinc-400">Próxima etapa</p>
            <p className="font-semibold text-white">Mônaco</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-asphalt/60 p-3">
            <p className="text-xs uppercase text-zinc-400">Circuito</p>
            <p className="font-semibold text-white">{raceWeekend.circuit}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-asphalt/60 p-3">
            <p className="text-xs uppercase text-zinc-400">Voltas</p>
            <p className="font-semibold text-white">{raceWeekend.laps}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-asphalt/60 p-3">
            <p className="text-xs uppercase text-zinc-400">Distância total</p>
            <p className="font-semibold text-white">
              {raceWeekend.raceDistance}
            </p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-display uppercase tracking-[0.3em] text-zinc-400">
          Métricas principais
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {performanceMetrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-asphalt/70 p-5 shadow-lg shadow-black/30"
            >
              <p className="text-sm uppercase tracking-wide text-zinc-400">
                {metric.label}
              </p>
              <p className="mt-4 text-3xl font-display font-semibold text-white">
                {metric.value}
              </p>
              <p
                className={`mt-2 text-sm ${
                  metric.tone === "positive"
                    ? "text-emerald-400"
                    : metric.tone === "highlight"
                      ? "text-primary"
                      : "text-zinc-300"
                }`}
              >
                {metric.change}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2 space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-asphalt/90 via-asphalt to-black/80 p-6 shadow-xl shadow-black/40">
          <header className="flex flex-col gap-1">
            <span className="text-sm uppercase tracking-[0.25em] text-zinc-400">
              Próximo fim de semana
            </span>
            <h2 className="text-2xl font-display font-semibold text-white">
              {raceWeekend.grandPrix}
            </h2>
            <p className="text-zinc-300">
              Monitorização completa das sessões e condições para definir
              estratégias de qualificação e corrida.
            </p>
          </header>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <dt className="text-xs uppercase tracking-widest text-zinc-500">
                Condições esperadas
              </dt>
              <dd className="mt-2 text-sm text-zinc-200">
                {raceWeekend.weatherOutlook.conditions}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <dt className="text-xs uppercase tracking-widest text-zinc-500">
                Temperatura da pista
              </dt>
              <dd className="mt-2 text-sm text-zinc-200">
                {raceWeekend.weatherOutlook.trackTemp}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <dt className="text-xs uppercase tracking-widest text-zinc-500">
                Chance de chuva
              </dt>
              <dd className="mt-2 text-sm text-zinc-200">
                {raceWeekend.weatherOutlook.chanceOfRain}
              </dd>
            </div>
          </dl>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
              Agenda oficial
            </h3>
            <ul className="space-y-2">
              {raceWeekend.sessions.map((session) => (
                <li
                  key={session.name}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-zinc-100"
                >
                  <div>
                    <p className="font-medium text-white">{session.name}</p>
                    <p className="text-xs uppercase tracking-wide text-zinc-400">
                      {session.day}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {session.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>
        <article className="space-y-4 rounded-3xl border border-white/10 bg-asphalt/80 p-6 shadow-xl shadow-black/40">
          <header>
            <span className="text-sm uppercase tracking-[0.3em] text-zinc-400">
              Últimas corridas
            </span>
            <h2 className="mt-1 text-xl font-display font-semibold text-white">
              Destaques recentes
            </h2>
          </header>
          <ul className="space-y-4 text-sm text-zinc-200">
            {recentHighlights.map((highlight) => (
              <li
                key={highlight.event}
                className="rounded-xl border border-white/5 bg-black/40 p-4"
              >
                <p className="text-xs uppercase tracking-widest text-zinc-500">
                  {highlight.event}
                </p>
                <p className="mt-2 leading-relaxed text-zinc-200">
                  {highlight.takeaway}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-asphalt/80 p-6 shadow-lg shadow-black/30">
          <header className="flex items-center justify-between">
            <div>
              <span className="text-sm uppercase tracking-[0.3em] text-zinc-400">
                Pilotos
              </span>
              <h2 className="mt-1 text-xl font-display font-semibold text-white">
                Classificação do campeonato
              </h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Atualizado
            </span>
          </header>
          <div className="mt-4 space-y-2">
            {driverStandings.map((driver) => (
              <div
                key={driver.driver}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-sm text-zinc-100"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-display text-base font-semibold text-white">
                    {driver.position}
                  </span>
                  <div>
                    <p className="font-medium text-white">{driver.driver}</p>
                    <p className="text-xs uppercase tracking-wide text-zinc-400">
                      {driver.team}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">
                    {driver.points} pts
                  </p>
                  <p className="text-xs text-emerald-400">{driver.delta}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="space-y-5 rounded-3xl border border-white/10 bg-asphalt/80 p-6 shadow-lg shadow-black/30">
          <header>
            <span className="text-sm uppercase tracking-[0.3em] text-zinc-400">
              Construtores
            </span>
            <h2 className="mt-1 text-xl font-display font-semibold text-white">
              Disputa entre equipes
            </h2>
          </header>
          <div className="space-y-2">
            {constructorStandings.map((team) => (
              <div
                key={team.team}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-sm text-zinc-100"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-display text-base font-semibold text-white">
                    {team.position}
                  </span>
                  <p className="font-medium text-white">{team.team}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{team.points} pts</p>
                  <p className="text-xs text-emerald-400">{team.delta}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary-foreground">
            <p className="font-semibold uppercase tracking-wide text-primary">
              Foco operacional
            </p>
            <p className="mt-2 text-zinc-200">
              Equipe técnica prioriza atualizações de pacote aerodinâmico para
              Barcelona com especial atenção à estabilidade em curvas de alta. A
              correlação com o túnel de vento está dentro de 0,8%, indicando
              excelente previsibilidade.
            </p>
          </div>
        </article>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-display uppercase tracking-[0.3em] text-zinc-400">
          Briefing estratégico
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {strategicInsights.map((insight) => (
            <article
              key={insight.title}
              className="rounded-2xl border border-white/10 bg-asphalt/70 p-5 text-sm text-zinc-200 shadow-lg shadow-black/30"
            >
              <h3 className="text-lg font-display font-semibold text-white">
                {insight.title}
              </h3>
              <p className="mt-2 leading-relaxed text-zinc-300">
                {insight.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
