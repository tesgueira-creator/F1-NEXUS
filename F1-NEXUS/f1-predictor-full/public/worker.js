// Web Worker Monte Carlo — simulação com ranking (top3, posição média, DNFs e ruído por corrida)
self.onmessage = (e) => {
  const { labels, weights, runs, taxaAbandono, seed, sigma } = e.data;
  const n = weights.length;
  // RNG: seedable (mulberry32) ou Math.random
  function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rand = (typeof seed === 'number') ? mulberry32(seed) : Math.random;

  // Box-Muller for normal samples (for multiplicative log-normal noise)
  let spare = null;
  function randNormal(){
    if(spare !== null){ const s = spare; spare = null; return s; }
    let u = 0, v = 0;
    while(u === 0) u = rand();
    while(v === 0) v = rand();
    const r = Math.sqrt(-2 * Math.log(u));
    const theta = 2 * Math.PI * v;
    spare = r * Math.sin(theta);
    return r * Math.cos(theta);
  }

  const wins = Object.fromEntries(labels.map(l=>[l,0]));
  const top1 = Object.fromEntries(labels.map(l=>[l,0]));
  const top2 = Object.fromEntries(labels.map(l=>[l,0]));
  const top3 = Object.fromEntries(labels.map(l=>[l,0]));
  const posSum = Object.fromEntries(labels.map(l=>[l,0]));
  const dnfCounts = Object.fromEntries(labels.map(l=>[l,0]));
  const K = Math.min(10, n);
  const dist = Object.fromEntries(labels.map(l=>[l, new Array(K).fill(0)]));

  const sigmaVal = (typeof sigma === 'number') ? Math.max(0, sigma) : 0; // multiplicative noise

  // Preallocate arrays to reduce per-iteration allocations
  const aliveMask = new Array(n).fill(false);
  const wRunFull = new Array(n);
  const keyVals = new Float64Array(n);
  const keyIdx = new Int32Array(n);

  // progress cadence (about 5% steps, min 1)
  const step = Math.max(1, Math.floor(runs / 20));

  for (let k = 0; k < runs; k++){
    // determine which pilots finish this run (DNF sampling)
    const alive = [];
    for (let i = 0; i < n; i++){
      const pDNF = (taxaAbandono && taxaAbandono[i]) ? taxaAbandono[i] : 0;
      if (rand() >= pDNF) { alive.push(i); aliveMask[i] = true; }
      else dnfCounts[labels[i]]++;
    }

    const m = alive.length;
    if (m === 0) {
      // everyone DNF'd — treat as no result for this run
      continue;
    }

    // compute run-specific weights with optional multiplicative noise
    const wRun = wRunFull;
    let totalRun = 0;
    for (let j = 0; j < m; j++){
      const i = alive[j];
      let w = weights[i];
      if (sigmaVal > 0){ w = Math.max(1e-12, w * Math.exp(sigmaVal * randNormal())); }
      wRun[j] = w;
      totalRun += w;
    }

    // weighted sampling without replacement via exponential keys on alive pilots
    for (let j = 0; j < m; j++){
      const u = rand();
      const denom = (wRun[j]/(totalRun || 1)) + 1e-12;
      keyVals[j] = -Math.log(u) / denom;
      keyIdx[j] = alive[j];
    }
    // sort order of first m entries by keyVals
    const ord = new Array(m);
    for (let j = 0; j < m; j++) ord[j] = j;
    ord.sort((a,b) => keyVals[a] - keyVals[b]);

    // winners and podium
    wins[labels[keyIdx[ord[0]]]]++;
    top1[labels[keyIdx[ord[0]]]]++;
    if (m > 1) top2[labels[keyIdx[ord[1]]]]++;
    if (m > 2) top3[labels[keyIdx[ord[2]]]]++;

    // positions: for pilots that finished, assign positions; for DNFs assign n+1
    // finished
    for (let rnk = 0; rnk < m; rnk++){
      const lab = labels[keyIdx[ord[rnk]]];
      posSum[lab] += (rnk + 1);
      if (rnk < K) dist[lab][rnk]++;
    }
    // DNFs: assign position n+1 to reflect non-finish
    if (m < n){
      for (let i = 0; i < n; i++){
        if (!aliveMask[i]){
          const lab = labels[i];
          posSum[lab] += (n + 1);
        }
      }
    }

    // reset aliveMask entries we set to true
    for (let j = 0; j < m; j++){
      aliveMask[ alive[j] ] = false;
    }

    // progress updates
    if ((k + 1) % step === 0){
      const progress = Math.min(100, Math.round(((k + 1) / runs) * 100));
      try { self.postMessage({ type: 'progress', progress }); } catch {}
    }
  }

  const posMean = Object.fromEntries(labels.map(l=>[l, posSum[l] / runs]));
  self.postMessage({ wins, top1, top2, top3, posMean, dist, dnfCounts });
};
