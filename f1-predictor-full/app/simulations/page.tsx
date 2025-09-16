"use client";

import { useMemo } from "react";
import { shallow } from "zustand/shallow";

import { simulateGrid } from "../../lib/simulation";
import { useSimulationStore } from "../../stores/simulationStore";

const formatDelta = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;

export default function SimulationsPage() {
  const { currentRun, history, isRunning, isFinished, activeDrivers, togglePerk } =
    useSimulationStore(
      (state) => ({
        currentRun: state.currentRun,
        history: state.history,
        isRunning: state.isRunning,
        isFinished: state.isFinished,
        activeDrivers: state.activeDrivers,
        togglePerk: state.togglePerk,
      }),
      shallow
    );

  const projections = useMemo(() => simulateGrid(activeDrivers), [activeDrivers]);
  const projectionLookup = useMemo(() => {
    const lookup = new Map(
      projections.map((result) => [
        result.driverId,
        new Map(result.perkBreakdown.map((perk) => [perk.id, perk.contribution])),
      ])
    );
    return lookup;
  }, [projections]);

  const hasHistory = history.length > 0;
  const recentRuns = hasHistory ? [...history].slice(-5).reverse() : [];

  return (
    <main className="space-y-6 p-6">
      <section className="space-y-4">
        <h1 className="text-3xl font-display font-bold">Simulações</h1>
        <p className="text-base text-zinc-300">
          Ajuste forças e fragilidades dos pilotos para testar cenários estratégicos
          antes de uma corrida real. As projeções são atualizadas automaticamente a
          cada alteração.
        </p>
      </section>

      <section className="space-y-2 rounded-2xl border border-white/10 bg-asphalt/60 p-5">
        <h2 className="text-sm font-display uppercase tracking-[0.3em] text-zinc-400">
          Estado da simulação
        </h2>
        {currentRun ? (
          <div className="space-y-1">
            <p className="text-base text-zinc-100">
              Simulação #{currentRun.id} {isRunning ? "em andamento" : "preparada"}
            </p>
            <p className="text-sm text-zinc-400">
              Acompanhe em tempo real até que a corrida seja concluída.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-base text-zinc-100">Nenhuma simulação em andamento</p>
            <p className="text-sm text-zinc-400">
              {isFinished && hasHistory
                ? "A última corrida foi concluída e está disponível no histórico."
                : "Inicie uma nova simulação para gerar cenários estratégicos."}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-asphalt/40 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-sm font-display uppercase tracking-[0.3em] text-zinc-400">
              Projeção de resultado
            </h2>
            <p className="text-sm text-zinc-400">
              A tabela considera pontuação base dos pilotos e o impacto líquido dos perks
              ativos.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-primary-100/80">
            Atualiza com cada alteração
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-zinc-200">
            <thead>
              <tr className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2">Piloto</th>
                <th className="px-3 py-2">Equipa</th>
                <th className="px-3 py-2">Base</th>
                <th className="px-3 py-2">Impacto perks</th>
                <th className="px-3 py-2">Pontuação projetada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projections.map((result) => (
                <tr key={result.driverId} className="hover:bg-white/5">
                  <td className="px-3 py-2 font-medium text-white">{result.position}</td>
                  <td className="px-3 py-2 font-medium text-white">{result.name}</td>
                  <td className="px-3 py-2 text-zinc-300">{result.team}</td>
                  <td className="px-3 py-2">{result.baseScore.toFixed(2)}</td>
                  <td
                    className={`px-3 py-2 ${
                      result.perkScore >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatDelta(result.perkScore)}
                  </td>
                  <td className="px-3 py-2 font-semibold text-white">
                    {result.totalScore.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-white/10 bg-asphalt/50 p-5">
        <div className="space-y-2">
          <h2 className="text-sm font-display uppercase tracking-[0.3em] text-zinc-400">
            Perks por piloto
          </h2>
          <p className="text-sm text-zinc-300">
            Ative ou desative cada atributo conforme cenários de pista. Forças adicionam
            pontos à projeção; fraquezas subtraem quando habilitadas.
          </p>
        </div>

        <div className="space-y-4">
          {activeDrivers.map((driver) => {
            const driverProjection = projections.find((entry) => entry.driverId === driver.id);
            const driverPerkMap = projectionLookup.get(driver.id);
            const totalScore = driverProjection?.totalScore ?? driver.baseScore;
            const perkScore = driverProjection?.perkScore ?? 0;

            const strengths = driver.perks.filter((perk) => perk.type === "strength");
            const weaknesses = driver.perks.filter((perk) => perk.type === "weakness");

            return (
              <article
                key={driver.id}
                className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4"
              >
                <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-white">
                      {driver.name}
                    </h3>
                    <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                      {driver.team}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-zinc-300">
                      Base {driver.baseScore.toFixed(2)}
                    </p>
                    <p className={`font-medium ${perkScore >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      Impacto atual {formatDelta(perkScore)}
                    </p>
                    <p className="text-base font-semibold text-white">
                      Pontuação projetada {totalScore.toFixed(2)}
                    </p>
                  </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-xs font-display uppercase tracking-[0.3em] text-emerald-300/80">
                      Pontos fortes
                    </h4>
                    <ul className="space-y-2">
                      {strengths.map((perk) => {
                        const contribution = driverPerkMap?.get(perk.id) ?? 0;
                        return (
                          <li
                            key={perk.id}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"
                          >
                            <label className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border border-emerald-500/40 bg-black/20"
                                checked={perk.enabled}
                                onChange={() => togglePerk(driver.id, perk.id)}
                                aria-label={`Alternar força ${perk.title} para ${driver.name}`}
                              />
                              <div className="space-y-1">
                                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                  <span className="font-medium text-emerald-100">
                                    {perk.title}
                                  </span>
                                  <span className="text-xs text-emerald-300">
                                    Peso +{perk.weight.toFixed(2)} · Atual {formatDelta(contribution)}
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-200/80">{perk.description}</p>
                              </div>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-display uppercase tracking-[0.3em] text-rose-300/80">
                      Pontos de atenção
                    </h4>
                    <ul className="space-y-2">
                      {weaknesses.map((perk) => {
                        const contribution = driverPerkMap?.get(perk.id) ?? 0;
                        return (
                          <li
                            key={perk.id}
                            className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3"
                          >
                            <label className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border border-rose-500/40 bg-black/20"
                                checked={perk.enabled}
                                onChange={() => togglePerk(driver.id, perk.id)}
                                aria-label={`Alternar fraqueza ${perk.title} para ${driver.name}`}
                              />
                              <div className="space-y-1">
                                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                  <span className="font-medium text-rose-100">
                                    {perk.title}
                                  </span>
                                  <span className="text-xs text-rose-300">
                                    Peso -{perk.weight.toFixed(2)} · Atual {formatDelta(contribution)}
                                  </span>
                                </div>
                                <p className="text-xs text-rose-200/80">{perk.description}</p>
                              </div>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-white/10 bg-asphalt/40 p-5">
        <h2 className="text-sm font-display uppercase tracking-[0.3em] text-zinc-400">
          Histórico recente
        </h2>
        {hasHistory ? (
          <ul className="space-y-2">
            {recentRuns.map((run) => (
              <li
                key={run.id}
                className="rounded-lg border border-white/5 bg-black/20 p-3 text-sm text-zinc-200"
              >
                <p>Execução #{run.id}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(run.id).toLocaleString("pt-PT")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">
            Nenhuma corrida registrada ainda. As simulações finalizadas aparecem aqui automaticamente.
          </p>
        )}
      </section>
    </main>
  );
}
