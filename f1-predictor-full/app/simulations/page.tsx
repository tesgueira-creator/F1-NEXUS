'use client';

import { shallow } from "zustand/shallow";

import { useSimulationStore } from "../../stores/simulationStore";

export default function SimulationsPage() {
  const { currentRun, history, isRunning, isFinished } = useSimulationStore(
    (state) => ({
      currentRun: state.currentRun,
      history: state.history,
      isRunning: state.isRunning,
      isFinished: state.isFinished,
    }),
    shallow
  );

  const hasHistory = history.length > 0;
  const recentRuns = hasHistory ? [...history].slice(-5).reverse() : [];

  return (
    <main className="p-6 space-y-6">
      <section className="space-y-4">
        <h1 className="text-3xl font-display font-bold">Simulações</h1>
        <p className="text-base text-zinc-300">
          Esta área vai permitir configurar cenários e acompanhar o histórico das
          corridas simuladas assim que os módulos estiverem prontos.
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
