'use client';
import React, { useEffect } from 'react';
import { useSimulationStore } from 'stores/simulationStore';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SimulationsPage() {
  const { drivers, context, result, isRunning, progress, toggleDriver, setContext, runSimulation, cancelSimulation, variations, variationsLoading, variationsError, variationsUpdatedAt, variationsSource, fetchNewsFactors, toggleVariation, clearVariations, loadDriversCSVText } = useSimulationStore();

  useEffect(() => { fetchNewsFactors(); }, [fetchNewsFactors]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-3xl font-display font-bold">Simulacoes</h1>
      <p className="text-base text-zinc-300">Configure o cenario e execute simulacoes Monte Carlo.</p>

      {/* CSV Handling */}
      <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Gestao de Dados</h2>
        <div className="flex gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                await loadDriversCSVText(text);
                alert('CSV carregado com sucesso.');
              } catch (err: any) {
                alert('Falha ao carregar CSV: ' + (err?.message || String(err)));
              }
            }}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={() => {
              try {
                const headers = ['driver_name','team_name','grid_position','qualy_gap_ms','fp_longrun_pace_s','straightline_index','cornering_index','pit_crew_mean_s','dnf_rate','speed_trap_kph'];
                const rows = drivers.map(d => [d.name,d.team,d.gridPosition,d.qualyGapMs,d.longRunPaceDelta,d.straightlineIndex,d.corneringIndex,d.pitStopMedian,d.dnfRate,d.speedTrapKph].join(','));
                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'drivers_export.csv';
                a.click();
                URL.revokeObjectURL(url);
              } catch {}
            }}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Race Context Form */}
      <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Configuracao da Corrida</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Perfil da Pista</label>
            <select value={context.trackProfile} onChange={(e) => setContext({ trackProfile: e.target.value as any })} className="w-full p-2 bg-zinc-700 rounded">
              <option value="balanced">Equilibrado</option>
              <option value="power">Potência</option>
              <option value="technical">Técnico</option>
            </select>
            <AutoProfileHint />
          </div>
          <div>
            <label className="block text-sm font-medium">Tempo</label>
            <select value={context.weather} onChange={(e) => setContext({ weather: e.target.value as any })} className="w-full p-2 bg-zinc-700 rounded">
              <option value="dry">Seco</option>
              <option value="mixed">Misto</option>
              <option value="wet">Molhado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Stress dos Pneus</label>
            <select value={context.tyreStress} onChange={(e) => setContext({ tyreStress: e.target.value as any })} className="w-full p-2 bg-zinc-700 rounded">
              <option value="low">Baixo</option>
              <option value="medium">Medio</option>
              <option value="high">Alto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Carro de Seguranca</label>
            <select value={context.safetyCar} onChange={(e) => setContext({ safetyCar: e.target.value as any })} className="w-full p-2 bg-zinc-700 rounded">
              <option value="low">Baixo</option>
              <option value="medium">Medio</option>
              <option value="high">Alto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Numero de Simulacoes</label>
            <input type="number" value={context.runs} onChange={(e) => setContext({ runs: Number(e.target.value) })} min="500" max="20000" className="w-full p-2 bg-zinc-700 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Aleatoriedade</label>
            <input type="number" value={context.randomness} onChange={(e) => setContext({ randomness: Number(e.target.value) })} min="0" max="1" step="0.1" className="w-full p-2 bg-zinc-700 rounded" />
          </div>
        </div>
      </div>

      {/* News-based Variations */}
      <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Variacoes por Noticias</h2>
          <div className="space-x-2 flex items-center gap-3">
            {variationsUpdatedAt && (
              <span className="text-xs text-zinc-400">Atualizado há {formatAgo(variationsUpdatedAt)}</span>
            )}
            {variationsSource && (
              <span className="text-xs text-zinc-400">Fonte: {variationsSource}</span>
            )}
            <button onClick={fetchNewsFactors} disabled={variationsLoading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 px-3 py-1.5 rounded text-sm font-semibold">{variationsLoading ? 'A analisar...' : 'Analisar Noticias'}</button>
            <button onClick={clearVariations} className="bg-zinc-600 hover:bg-zinc-700 px-3 py-1.5 rounded text-sm font-semibold">Limpar</button>
          </div>
        </div>
        {variationsError && (
          <p className="text-red-400 text-sm">Erro: {variationsError}</p>
        )}
        {(!variations || variations.length === 0) ? (
          <p className="text-zinc-300 text-sm">Sem variacoes ativas. Clique em "Analisar Noticias" para gerar fatores.</p>
        ) : (
          <div className="space-y-2">
            {variations.map(v => (
              <label key={v.id} className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded">
                <input type="checkbox" checked={v.enabled} onChange={() => toggleVariation(v.id)} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{v.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 uppercase">{v.impactType}</span>
                    <span className="text-xs text-zinc-300">mag: {v.magnitude.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{v.description}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Driver Selection */}
      <div className="bg-zinc-800 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Selecao de Pilotos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {drivers.map((driver) => (
            <label key={driver.id} className="flex items-center space-x-2">
              <input type="checkbox" checked={driver.isActive} onChange={() => toggleDriver(driver.id)} className="rounded" />
              <span>{driver.name} ({driver.code})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Run Simulation */}
      <div className="flex gap-3 items-center">
        <button onClick={runSimulation} disabled={isRunning || drivers.filter(d => d.isActive).length < 2} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded font-semibold">
          {isRunning ? (`Executando... ${progress ?? 0}%`) : 'Executar Simulacao'}
        </button>
        {isRunning && (
          <button onClick={cancelSimulation} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold">Cancelar</button>
        )}
      </div>
      {isRunning && (
        <div className="w-full h-2 bg-zinc-700 rounded" role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-2 bg-blue-500 rounded" style={{ width: `${progress ?? 0}%` }} />
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold">Resultados da Simulacao</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Vencedor Previsto</h3>
              <p>{result.predictedWinner?.name} ({result.predictedWinner?.code}) - {result.predictedWinner?.winProbability.toFixed(2)}%</p>
            </div>
            <div>
              <h3 className="font-medium">Podio Previsto</h3>
              <ul>
                {result.predictedPodium.map((driver, idx) => (
                  <li key={driver.id}>{idx + 1}. {driver.name} - {driver.podiumProbability.toFixed(2)}%</li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h3 className="font-medium">Win Probabilities Chart</h3>
            <Bar
              data={{
                labels: result.results.slice(0, 10).map(d => d.name),
                datasets: [{
                  label: 'Win Probability',
                  data: result.results.slice(0, 10).map(d => d.winProbability),
                  backgroundColor: 'rgba(54, 162, 235, 0.5)',
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Win Probabilities' }
                }
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function formatAgo(ts: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

function AutoProfileHint() {
  const { autoTrackProfileLabel, autoTrackProfileAt, nextRaceCircuit, nextRaceCountry, nextRaceLocality } = useSimulationStore();
  if (!autoTrackProfileLabel || !autoTrackProfileAt) return null;
  const [profileRaw, circuitRaw] = autoTrackProfileLabel.split('|').map(s => s.trim());
  const profile = profileRaw === 'power' ? 'Potência' : profileRaw === 'technical' ? 'Técnico' : 'Equilibrado';
  const place = [nextRaceLocality, nextRaceCountry].filter(Boolean).join(', ');
  return (
    <p className="mt-1 text-xs text-zinc-400">
      Próxima pista: {nextRaceCircuit || circuitRaw || '—'}{place ? ` — ${place}` : ''} • Perfil auto: {profile} • {formatAgo(autoTrackProfileAt)} atrás
    </p>
  );
}
"use client";
import React, { useEffect } from "react";
import { useSimulationStore } from "stores/simulationStore";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SimulationsPage() {
  const { drivers, context, result, isRunning, toggleDriver, setContext, runSimulation, cancelSimulation, variations, variationsLoading, variationsError, variationsUpdatedAt, variationsSource, fetchNewsFactors, toggleVariation, clearVariations, loadDriversCSVText } = useSimulationStore();

  useEffect(() => { fetchNewsFactors(); }, [fetchNewsFactors]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-3xl font-display font-bold">{"Simula\u00E7\u00F5es"}</h1>
      <p className="text-base text-zinc-300">{"Configure o cen\u00E1rio e execute simula\u00E7\u00F5es Monte Carlo."}</p>

      <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">{"Gest\u00E3o de Dados"}</h2>
        <div className="flex gap-4">
          <input type="file" accept=".csv" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              await loadDriversCSVText(text);
              alert('CSV carregado com sucesso.');
            } catch (err: any) {
              alert('Falha ao carregar CSV: ' + (err?.message || String(err)));
            }
          }} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          <button onClick={() => {
            try {
              const headers = ['driver_name','team_name','grid_position','qualy_gap_ms','fp_longrun_pace_s','straightline_index','cornering_index','pit_crew_mean_s','dnf_rate','speed_trap_kph'];
              const rows = drivers.map(d => [d.name,d.team,d.gridPosition,d.qualyGapMs,d.longRunPaceDelta,d.straightlineIndex,d.corneringIndex,d.pitStopMedian,d.dnfRate,d.speedTrapKph].join(','));
              const csv = [headers.join(','), ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'drivers_export.csv';
              a.click();
              URL.revokeObjectURL(url);
            } catch {}
          }} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold">Exportar CSV</button>
        </div>
      </div>

      <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">{"Configura\u00E7\u00E3o da Corrida"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Perfil da Pista</label>
            <select value={context.trackProfile} onChange={(e) => setContext({ trackProfile: e.target.value as any })} className="w-full p-2 bg-zinc-700 rounded">
              <option value="balanced">Equilibrado</option>
              <option value="power">{"Pot\u00EAncia"}</option>
              <option value="technical">{"T\u00E9cnico"}</option>
            </select>
            <AutoProfileHint />
          </div>
          <div>
            <label className="block text-sm font-medium">Tempo</label>
            <select value={context.weather} onChange={(e) => setContext({ weather: e.target.value as any })} className="w-full p-2 bg-zinc-700 rounded">
              <option value="dry">Seco</option>
              <option value="mixed">Misto</option>
              <option value="wet">Molhado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Desgaste dos Pneus</label>
            <select value={context.tyreStress} onChange={(e) => setContext({ tyreStress: e.target.value as any })} className="w-full p-2 bg-zinc-700 rounded">
              <option value="low">Baixo</option>
              <option value="medium">{"M\u00E9dio"}</option>
              <option value="high">Alto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">{"Carro de Seguran\u00E7a"}</label>
            <select value={context.safetyCar} onChange={(e) => setContext({ safetyCar: e.target.value as any })} className="w-full p-2 bg-zinc-700 rounded">
              <option value="low">Baixo</option>
              <option value="medium">{"M\u00E9dio"}</option>
              <option value="high">Alto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">{"N\u00FAmero de Simula\u00E7\u00F5es"}</label>
            <input type="number" value={context.runs} onChange={(e) => setContext({ runs: Number(e.target.value) })} min="500" max="20000" className="w-full p-2 bg-zinc-700 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Aleatoriedade</label>
            <input type="number" value={context.randomness} onChange={(e) => setContext({ randomness: Number(e.target.value) })} min="0" max="1" step="0.1" className="w-full p-2 bg-zinc-700 rounded" />
          </div>
        </div>
      </div>

      <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{"Varia\u00E7\u00F5es por Not\u00EDcias"}</h2>
          <div className="space-x-2 flex items-center gap-3">
            {variationsUpdatedAt && (<span className="text-xs text-zinc-400">Atualizado há {formatAgo(variationsUpdatedAt)}</span>)}
            {variationsSource && (<span className="text-xs text-zinc-400">Fonte: {variationsSource}</span>)}
            <button onClick={fetchNewsFactors} disabled={variationsLoading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 px-3 py-1.5 rounded text-sm font-semibold">{variationsLoading ? 'A analisar...' : 'Analisar Notícias'}</button>
            <button onClick={clearVariations} className="bg-zinc-600 hover:bg-zinc-700 px-3 py-1.5 rounded text-sm font-semibold">Limpar</button>
          </div>
        </div>
        {variationsError && (<p className="text-red-400 text-sm">Erro: {variationsError}</p>)}
        {(!variations || variations.length === 0) ? (
          <p className="text-zinc-300 text-sm">{"Sem varia\u00E7\u00F5es ativas. Clique em \"Analisar Not\u00EDcias\" para gerar fatores."}</p>
        ) : (
          <div className="space-y-2">
            {variations.map(v => (
              <label key={v.id} className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded">
                <input type="checkbox" checked={v.enabled} onChange={() => toggleVariation(v.id)} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{v.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 uppercase">{v.impactType}</span>
                    <span className="text-xs text-zinc-300">mag: {v.magnitude.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{v.description}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-zinc-800 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">{"Sele\u00E7\u00E3o de Pilotos"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {drivers.map((driver) => (
            <label key={driver.id} className="flex items-center space-x-2">
              <input type="checkbox" checked={driver.isActive} onChange={() => toggleDriver(driver.id)} className="rounded" />
              <span>{driver.name} ({driver.code})</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <button onClick={runSimulation} disabled={isRunning || drivers.filter(d => d.isActive).length < 2} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded font-semibold">{isRunning ? (`Executando... ${useSimulationStore().progress ?? 0}%`) : 'Executar Simulação'}</button>
        {isRunning && (<button onClick={cancelSimulation} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold">Cancelar</button>)}
      </div>

      {result && (
        <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold">{"Resultados da Simula\u00E7\u00E3o"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Vencedor Previsto</h3>
              <p>{result.predictedWinner?.name} ({result.predictedWinner?.code}) - {result.predictedWinner?.winProbability.toFixed(2)}%</p>
            </div>
            <div>
              <h3 className="font-medium">{"P\u00F3dio Previsto"}</h3>
              <ul>
                {result.predictedPodium.map((driver, idx) => (<li key={driver.id}>{idx + 1}. {driver.name} - {driver.podiumProbability.toFixed(2)}%</li>))}
              </ul>
            </div>
          </div>
          <div>
            <h3 className="font-medium">{"Gr\u00E1fico de Probabilidades de Vit\u00F3ria"}</h3>
            <Bar data={{ labels: result.results.slice(0, 10).map(d => d.name), datasets: [{ label: 'Probabilidade de Vitória', data: result.results.slice(0, 10).map(d => d.winProbability), backgroundColor: 'rgba(54, 162, 235, 0.5)' }] }} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Probabilidades de Vitória' } } }} />
          </div>
        </div>
      )}
    </main>
  );
}

function formatAgo(ts: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

function AutoProfileHint() {
  const { autoTrackProfileLabel, autoTrackProfileAt, nextRaceCircuit, nextRaceCountry, nextRaceLocality } = useSimulationStore();
  if (!autoTrackProfileLabel || !autoTrackProfileAt) return null;
  const [profileRaw, circuitRaw] = autoTrackProfileLabel.split('|').map(s => s.trim());
  const profile = profileRaw === 'power' ? 'Potência' : profileRaw === 'technical' ? 'Técnico' : 'Equilibrado';
  const place = [nextRaceLocality, nextRaceCountry].filter(Boolean).join(', ');
  return (
    <p className="mt-1 text-xs text-zinc-400">{"Pr\u00F3xima pista: "}{nextRaceCircuit || circuitRaw || '-'}{place ? ` - ${place}` : ''}{" • Perfil auto: "}{profile}{" • "}{formatAgo(autoTrackProfileAt)}{" atrás"}</p>
  );
}
