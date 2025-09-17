import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

describe('public/worker.js smoke test', () => {
  it('produces results with expected shape and totals', () => {
    const file = path.resolve(__dirname, '../public/worker.js');
    const code = fs.readFileSync(file, 'utf8');

    const sandbox: any = { self: {} };
    sandbox.self.postMessage = (msg: any) => { sandbox.__result = msg; };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    // Prepare a small deterministic payload
    const labels = ['A', 'B'];
    const weights = [1, 1];
    const runs = 500;
    const taxaAbandono = [0, 0];
    const seed = 42; // to exercise mulberry32 path
    const sigma = 0.1;

    // Invoke the worker handler synchronously
    sandbox.self.onmessage({ data: { labels, weights, runs, taxaAbandono, seed, sigma } });

    const res = sandbox.__result;
    expect(res).toBeDefined();
    expect(res.wins).toBeDefined();
    expect(res.top1).toBeDefined();
    expect(res.top2).toBeDefined();
    expect(res.top3).toBeDefined();
    expect(res.posMean).toBeDefined();
    expect(res.dnfCounts).toBeDefined();

    // Sum of wins should equal runs
    const sumWins = labels.reduce((acc, l) => acc + (res.wins[l] || 0), 0);
    expect(sumWins).toBe(runs);

    // With no DNFs, dnfCounts should be zero for all labels
    for (const l of labels) {
      expect(res.dnfCounts[l]).toBe(0);
      expect(typeof res.posMean[l]).toBe('number');
    }
  });
});

