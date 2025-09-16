"use client";

import { useMemo } from "react";
import { shallow } from "zustand/shallow";

import { useSimulationStore } from "../../stores/simulationStore";
import { type DriverPerkDefinition, type WeatherCondition } from "../../lib/simulationEngine";

const weatherOptions: Array<{ value: WeatherCondition; label: string; description: string }> = [
  { value: "sunny", label: "Céu limpo", description: "Aderência máxima e menor desgaste." },
  { value: "overcast", label: "Nublado", description: "Temperaturas mais baixas favorecem pneus médios." },
  { value: "light-rain", label: "Chuva leve", description: "Necessário equilíbrio entre velocidade e cautela." },
  { value: "heavy-rain", label: "Chuva forte", description: "Ritmos reduzidos e maior risco de erros." },
];

const weatherLabel: Record<WeatherCondition, string> = {
  "sunny": "Céu limpo",
  "overcast": "Nublado",
  "light-rain": "Chuva leve",
  "heavy-rain": "Chuva forte",
};

function formatSeconds(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  const minutes = Math.floor(value / 60);
  const seconds = value - minutes * 60;
  const formattedSeconds = seconds.toFixed(3).padStart(6, "0");
  return `${minutes}:${formattedSeconds}`;
}

function formatGap(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `+${value.toFixed(3)}`;
}

function formatDateTime(timestamp?: number) {
  if (!timestamp) {
    return "—";
  }
  try {
    return new Date(timestamp).toLocaleString("pt-PT");
  } catch (error) {
    return "—";
  }
}

function renderPerk(
  perk: DriverPerkDefinition,
  isEnabled: boolean,
  onToggle: () => void,
  accentClass: string
) {
  return (
    <label
      key={perk.key}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-black/20 p-3 transition hover:border-white/20"
    >
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={onToggle}
        className="mt-1 h-4 w-4 accent-emerald-500"
      />
      <div className="space-y-1">
        <p className={`text-sm font-medium text-white ${isEnabled ? accentClass : ""}`}>{perk.label}</p>
        <p className="text-xs text-zinc-400">{perk.description}</p>
      </div>
    </label>
  );
}

export default function SimulationsPage() {
  const {
    configuration,
    updateConfiguration,
    availableDrivers,
    lineup,
    toggleDriver,
    toggleStrength,
    toggleWeakness,
    runSimulation,
    cancelSimulation,
    isRunning,
    statusMessage,
    currentRun,
    history,
    resetLineup,
    resetHistory,
  } = useSimulationStore(
    (state) => ({
      configuration: state.configuration,
      updateConfiguration: state.updateConfiguration,
      availableDrivers: state.availableDrivers,
      lineup: state.lineup,
      toggleDriver: state.toggleDriver,
      toggleStrength: state.toggleStrength,
      toggleWeakness: state.toggleWeakness,
      runSimulation: state.runSimulation,
      cancelSimulation: state.cancelSimulation,
      isRunning: state.isRunning,
      statusMessage: state.statusMessage,
      currentRun: state.currentRun,
      history: state.history,
      resetLineup: state.resetLineup,
      resetHistory: state.resetHistory,
    }),
    shallow
  );

  const lineupMap = useMemo(() => new Map(lineup.map((driver) => [driver.id, driver])), [lineup]);
  const canRun = lineup.length > 0 && !isRunning;
  const recentHistory = useMemo(() => [...history].reverse(), [history]);
  const lastLaps = currentRun?.laps ? [...currentRun.laps].slice(-5).reverse() : [];
  const fastestLap = currentRun?.result?.fastestLap;

  const statusLabel = currentRun
    ? currentRun.status === "running"
      ? "Em execução"
      : currentRun.status === "completed"
        ? "Concluída"
        : currentRun.status === "cancelled"
          ? "Cancelada"
          : "Falhou"
    : "Nenhuma simulação em andamento";

  const handleRun = () => {
    void runSimulation();
  };

  const handleCancel = () => {
    cancelSimulation();
  };

  const renderDriverCard = (driver: (typeof availableDrivers)[number]) => {
    const selection = lineupMap.get(driver.id);
    const isSelected = Boolean(selection);

    return (
      <article
        key={driver.id}
        className={`space-y-4 rounded-2xl border p-4 transition ${
          isSelected ? "border-emerald-400/60 bg-emerald-400/5" : "border-white/10 bg-black/20"
        }`}
      >
        <header className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white">{driver.name}</h3>
            <p className="text-sm text-zinc-400">{driver.team}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleDriver(driver.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isSelected
                ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {isSelected ? "Remover" : "Selecionar"}
          </button>
        </header>

        <dl className="grid grid-cols-2 gap-3 text-xs text-zinc-300 md:grid-cols-3">
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500">Qualy</dt>
            <dd className="text-base font-semibold text-white">{driver.stats.qualifying}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500">Corrida</dt>
            <dd className="text-base font-semibold text-white">{driver.stats.race}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500">Pneus</dt>
            <dd className="text-base font-semibold text-white">{driver.stats.tireManagement}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500">Chuva</dt>
            <dd className="text-base font-semibold text-white">{driver.stats.wetSkill}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500">Consistência</dt>
            <dd className="text-base font-semibold text-white">{driver.stats.consistency}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500">Agressividade</dt>
            <dd className="text-base font-semibold text-white">{driver.stats.aggression}</dd>
          </div>
        </dl>

        {isSelected ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">Forças</p>
              <div className="mt-2 space-y-2">
                {driver.strengths.length ? (
                  driver.strengths.map((perk) =>
                    renderPerk(
                      perk,
                      selection!.strengthsEnabled.includes(perk.key),
                      () => toggleStrength(driver.id, perk.key),
                      "text-emerald-300"
                    )
                  )
                ) : (
                  <p className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-zinc-500">
                    Este piloto não possui forças configuráveis.
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-300">Fraquezas</p>
              <div className="mt-2 space-y-2">
                {driver.weaknesses.length ? (
                  driver.weaknesses.map((perk) =>
                    renderPerk(
                      perk,
                      selection!.weaknessesEnabled.includes(perk.key),
                      () => toggleWeakness(driver.id, perk.key),
                      "text-rose-300"
                    )
                  )
                ) : (
                  <p className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-zinc-500">
                    Sem fraquezas registradas para este piloto.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Selecione o piloto para habilitar ajustes de forças e fraquezas específicos.
          </p>
        )}
      </article>
    );
  };

  const renderResultRow = (entry: NonNullable<typeof currentRun>["result"]["finishingOrder"][number]) => (
    <tr key={`${entry.driverId}-${entry.position}`} className="divide-x divide-white/5 border-b border-white/5">
      <td className="px-3 py-2 text-center text-white">{entry.position}</td>
      <td className="px-3 py-2">
        <p className="text-sm font-medium text-white">{entry.name}</p>
        <p className="text-xs text-zinc-400">{entry.team}</p>
      </td>
      <td className="px-3 py-2 text-sm text-zinc-300">{entry.status}</td>
      <td className="px-3 py-2 text-sm text-zinc-100">{formatSeconds(entry.totalTime)}</td>
      <td className="px-3 py-2 text-sm text-zinc-300">{formatGap(entry.gapToLeader)}</td>
      <td className="px-3 py-2 text-sm font-semibold text-emerald-300">{entry.points}</td>
    </tr>
  );

  return (
    <main className="space-y-8 p-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-display font-bold">Simulações</h1>
        <p className="text-base text-zinc-300">
          Configure cenários estratégicos de corrida, selecione o alinhamento ideal e acompanhe a
          evolução volta a volta para antever resultados.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-asphalt/60 p-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-display uppercase tracking-[0.3em] text-zinc-400">
              Configuração da corrida
            </h2>
            <p className="text-xs text-zinc-400">
              Ajuste parâmetros do traçado, clima e incidentes antes de iniciar a simulação.
            </p>
          </div>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">Traçado</span>
            <input
              type="text"
              value={configuration.track}
              onChange={(event) => updateConfiguration({ track: event.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              placeholder="Ex.: Interlagos"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">Voltas</span>
            <input
              type="number"
              min={5}
              value={configuration.laps}
              onChange={(event) => updateConfiguration({ laps: Number(event.target.value) })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">Temperatura (°C)</span>
            <input
              type="number"
              value={configuration.temperature}
              onChange={(event) => updateConfiguration({ temperature: Number(event.target.value) })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">Clima</span>
            <select
              value={configuration.weather}
              onChange={(event) => updateConfiguration({ weather: event.target.value as WeatherCondition })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              {weatherOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">
              {weatherOptions.find((option) => option.value === configuration.weather)?.description ?? ""}
            </p>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              Probabilidade de Safety Car
            </span>
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={configuration.safetyCarProbability}
              onChange={(event) => updateConfiguration({ safetyCarProbability: Number(event.target.value) })}
              className="w-full accent-emerald-500"
            />
            <p className="text-xs text-zinc-400">
              {(configuration.safetyCarProbability * 100).toFixed(0)}% de chance de incidente gerar safety car.
            </p>
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-asphalt/40 p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-display uppercase tracking-[0.3em] text-zinc-400">
              Alinhamento de pilotos
            </h2>
            <p className="text-xs text-zinc-400">
              Escolha quem participa da corrida simulada e ajuste atributos situacionais.
            </p>
          </div>
          <button
            type="button"
            onClick={resetLineup}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-white"
          >
            Limpar seleção
          </button>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {availableDrivers.map((driver) => renderDriverCard(driver))}
        </div>
        {lineup.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-400">
            Nenhum piloto selecionado. Escolha pelo menos um piloto para liberar a simulação.
          </p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={!canRun}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
              canRun
                ? "bg-emerald-500 text-black hover:bg-emerald-400"
                : "bg-emerald-500/20 text-emerald-200/70"
            }`}
          >
            Iniciar simulação
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isRunning}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
              isRunning ? "bg-rose-500/20 text-rose-200 hover:bg-rose-500/30" : "bg-rose-500/10 text-rose-200/60"
            }`}
          >
            Cancelar
          </button>
          <div className="flex flex-col text-sm text-zinc-300">
            <span className="font-semibold text-white">{statusLabel}</span>
            {statusMessage ? <span className="text-xs text-zinc-400">{statusMessage}</span> : null}
          </div>
        </div>
        {currentRun ? (
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-zinc-300">
            <p>
              <span className="font-semibold text-white">#{currentRun.id}</span> — {currentRun.configuration.track} · {currentRun.configuration.laps} voltas ·
              {" "}
              {weatherLabel[currentRun.configuration.weather]}
            </p>
            <p className="text-xs text-zinc-400">Iniciada em {formatDateTime(currentRun.startedAt)}</p>
            {currentRun.seed ? (
              <p className="text-xs text-zinc-500">Seed: {currentRun.seed}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      {currentRun?.result ? (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-asphalt/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-display uppercase tracking-[0.3em] text-zinc-400">
              Resultado da simulação
            </h2>
            {fastestLap ? (
              <p className="text-xs text-emerald-300">
                Volta mais rápida: <span className="font-semibold">{fastestLap.name}</span> na volta {fastestLap.lap}
                {" "}
                ({formatSeconds(fastestLap.time)})
              </p>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                <tr className="divide-x divide-white/5">
                  <th className="px-3 py-2 text-center">Pos</th>
                  <th className="px-3 py-2">Piloto</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Tempo</th>
                  <th className="px-3 py-2">Gap</th>
                  <th className="px-3 py-2">Pts</th>
                </tr>
              </thead>
              <tbody>{currentRun.result.finishingOrder.map((entry) => renderResultRow(entry))}</tbody>
            </table>
          </div>
          {currentRun.result.retirements.length ? (
            <div className="rounded-xl border border-white/5 bg-black/30 p-4 text-xs text-rose-200">
              <p className="font-semibold uppercase tracking-[0.3em] text-rose-300">Abandonos</p>
              <ul className="mt-2 space-y-1">
                {currentRun.result.retirements.map((retirement) => (
                  <li key={retirement.driverId}>
                    {retirement.name} — volta {retirement.lap}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {lastLaps.length ? (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-sm font-display uppercase tracking-[0.3em] text-zinc-400">
            Últimas voltas
          </h2>
          <div className="space-y-3">
            {lastLaps.map((lap) => (
              <article key={lap.lap} className="space-y-2 rounded-xl border border-white/10 bg-black/40 p-4">
                <header className="flex items-center justify-between text-sm text-zinc-200">
                  <span className="font-semibold text-white">Volta {lap.lap}</span>
                  <span className="text-xs text-zinc-400">
                    Ordem: {lap.order.slice(0, 5).map((entry) => `P${entry.position}-${entry.name.split(" ").pop()}`).join(", ")}
                  </span>
                </header>
                {lap.events.length ? (
                  <ul className="space-y-1 text-xs text-emerald-300">
                    {lap.events.slice(0, 3).map((event, index) => (
                      <li key={`${lap.lap}-event-${index}`}>{event}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-500">Volta sem ocorrências relevantes.</p>
                )}
                <div className="grid gap-2 text-xs text-zinc-400 md:grid-cols-2">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.3em] text-zinc-500">Top tempos</p>
                    <ul className="mt-1 space-y-1">
                      {lap.lapTimes.slice(0, 3).map((time) => (
                        <li key={time.driverId} className="flex justify-between">
                          <span>{time.name}</span>
                          <span className="text-zinc-200">{formatSeconds(time.time)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-[0.3em] text-zinc-500">Gaps para o líder</p>
                    <ul className="mt-1 space-y-1">
                      {lap.order.slice(0, 4).map((entry) => (
                        <li key={entry.driverId} className="flex justify-between">
                          <span>{entry.name}</span>
                          <span className="text-zinc-200">{formatGap(entry.gapToLeader)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-white/10 bg-asphalt/40 p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-display uppercase tracking-[0.3em] text-zinc-400">
              Histórico de execuções
            </h2>
            <p className="text-xs text-zinc-400">
              As simulações mais recentes ficam guardadas para comparação posterior.
            </p>
          </div>
          <button
            type="button"
            onClick={resetHistory}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-rose-400 hover:text-white"
          >
            Limpar histórico
          </button>
        </header>
        {recentHistory.length ? (
          <ul className="space-y-3">
            {recentHistory.map((run) => (
              <li
                key={run.id}
                className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">#{run.id}</p>
                    <p className="text-xs text-zinc-400">
                      {run.configuration.track} · {run.configuration.laps} voltas · {weatherLabel[run.configuration.weather]}
                    </p>
                    <p className="text-xs text-zinc-500">{formatDateTime(run.startedAt)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      run.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : run.status === "cancelled"
                          ? "bg-yellow-500/20 text-yellow-200"
                          : run.status === "failed"
                            ? "bg-rose-500/20 text-rose-200"
                            : "bg-white/10 text-white"
                    }`}
                  >
                    {run.status.toUpperCase()}
                  </span>
                </div>
                {run.result ? (
                  <p className="text-xs text-zinc-400">
                    Vencedor: <span className="font-semibold text-white">{run.result.finishingOrder[0]?.name ?? "—"}</span>
                    {" · "}
                    Pontuação total do top 3: {run.result.finishingOrder.slice(0, 3).reduce((sum, item) => sum + item.points, 0)} pts
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400">{run.message}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-400">
            Nenhuma corrida registrada ainda. Finalize uma simulação para popular o histórico.
          </p>
        )}
      </section>
    </main>
  );
}
