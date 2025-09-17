#!/usr/bin/env node
/*
Converts new-schema CSVs (session_driver.csv + optional race_features.csv) to the legacy CSV the UI expects.
Usage:
  node scripts/convert_new_to_legacy.js --drivers path/to/session_driver.csv [--race path/to/race_features.csv] --out out.csv

Notes:
- Reads the legacy header from the repository sample `f1_monza2025_sample_upload.csv` to preserve exact column names/encoding.
- Fills missing subjective fields with neutral defaults.
*/

const fs = require('fs');
const path = require('path');

function parseArgs(argv){
  const args = {};
  for(let i=2;i<argv.length;i++){
    const a = argv[i];
    const n = argv[i+1];
    if(a==='--drivers'){ args.drivers = n; i++; }
    else if(a==='--race'){ args.race = n; i++; }
    else if(a==='--out' || a==='-o'){ args.out = n; i++; }
  }
  return args;
}

function parseCSV(text){
  const rows = [];
  let i=0, field='';
  const rec=[]; let inQuotes=false; let c, prev='';
  function pushField(){ rec.push(field); field=''; }
  function pushRecord(){ if(rec.length){ rows.push(rec.slice()); rec.length=0; } }
  while(i<text.length){
    c = text[i++];
    if(c==='\r') continue;
    if(inQuotes){
      if(c==='"'){
        if(text[i]==='"'){ field+='"'; i++; }
        else { inQuotes=false; }
      } else { field+=c; }
    } else {
      if(c==='"'){ inQuotes=true; }
      else if(c===','){ pushField(); }
      else if(c==='\n'){ pushField(); pushRecord(); }
      else { field+=c; }
    }
    prev=c;
  }
  if(field!=='' || rec.length){ pushField(); pushRecord(); }
  if(rows.length===0) return { header:[], data:[] };
  const header = rows[0];
  const data = rows.slice(1).filter(r=>r.length && r.some(v=>v!==''))
    .map(r => Object.fromEntries(header.map((h,idx)=>[h.trim(), r[idx]])));
  return { header, data };
}

function num(v, d=0){ const n = Number(v); return Number.isFinite(n) ? n : d; }
function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }

function loadCSV(p){ return fs.readFileSync(p, 'utf8'); }

function main(){
  const { drivers, race, out } = parseArgs(process.argv);
  if(!drivers || !out){
    console.error('Usage: node scripts/convert_new_to_legacy.js --drivers session_driver.csv [--race race_features.csv] --out out.csv');
    process.exit(1);
  }
  const driverCSV = loadCSV(drivers);
  const { data: drows } = parseCSV(driverCSV);
  if(drows.length===0){ console.error('No driver rows found'); process.exit(1); }
  let rmeta = {};
  if(race){
    try {
      const raceCSV = loadCSV(race);
      const rparsed = parseCSV(raceCSV);
      // use first row
      rmeta = rparsed.data[0] || {};
    } catch(e){ console.warn('Could not read race CSV:', e.message); }
  }
  // get legacy header from sample file to preserve exact encoding
  const sample = path.resolve(process.cwd(), 'f1_monza2025_sample_upload.csv');
  let legacyHeaderLine;
  try {
    legacyHeaderLine = fs.readFileSync(sample, 'utf8').split(/\r?\n/)[0];
  } catch(e){
    console.error('Could not read sample header from f1_monza2025_sample_upload.csv. Ensure it exists in repo.');
    process.exit(1);
  }
  const legacyHeader = parseCSV(legacyHeaderLine + '\n').header; // parse to split columns safely

  function mapRow(dr){
    const out = {};
    const name = dr['driver_name'] || dr['Piloto'] || dr['Driver'] || '';
    const team = dr['team_name'] || dr['team'] || dr['Equipa'] || dr['team_id'] || '';
    const grid = num(dr['grid_position'] ?? dr['Grid'], 0);
    const lrp = num(dr['fp_longrun_pace_s'] ?? dr['LongRunPace'], 0);
    const dnf = clamp(num(dr['dnf_rate'] ?? dr['TaxaAbandono'], 0), 0, 1);
    const scProb = rmeta['sc_prob']!==undefined ? num(rmeta['sc_prob'], 0) : num(dr['sc_prob'] ?? 0, 0);
    const rainProb = rmeta['rain_prob']!==undefined ? num(rmeta['rain_prob'], 0) : num(dr['rain_prob'] ?? 0, 0);
    const clima = rainProb>=0.5 ? 'Chuva' : 'Seco';
    const cornering = num(dr['cornering_index'] ?? 0, 0);
    const straight = num(dr['straightline_index'] ?? 0, 0);
    // simple transform z-> [0.3..0.9]
    const tfA = clamp(0.6 + 0.1*cornering, 0.3, 0.9);
    const tfP = clamp(0.6 + 0.1*straight, 0.3, 0.9);

    // defaults
    const defaults = {
      'Confian��a': 3,
      'Momentum': 0,
      'Pressǜo': 2,
      'Estado Emocional': 2,
      'Setup': 3,
      'Motor': 3,
      'Aero': 3,
      'Pneus': 3,
      'Combust��vel': 3,
      'Fiabilidade': 3,
      'Rumores': 0,
      'Conflitos': 0,
      'Ultimas5': '',
      'QualiMǸdia': 0,
      'Notas': 'Converted from new schema',
      'LongRunPace': lrp,
      'TopSpeed': 0,
      'TrackFit_Aero': tfA,
      'TrackFit_Power': tfP,
      'PitStopAvg': num(dr['pit_crew_mean_s'] ?? 19.0, 19.0),
      'Deg': num(dr['tyre_deg_soft'] ?? 0.4, 0.4),
      'Upgrades': ''
    };

    for(const h of legacyHeader){
      if(h==='Piloto') out[h] = name;
      else if(h==='Equipa') out[h] = team;
      else if(h==='Pontua��ǜo Total' || h==='Pontuacao Total') out[h] = 0; // no subjective base
      else if(h==='Grid') out[h] = grid;
      else if(h==='Clima') out[h] = clima;
      else if(h==='SafetyCar') out[h] = Math.round(100*scProb);
      else if(h==='TaxaAbandono') out[h] = dnf;
      else if(Object.prototype.hasOwnProperty.call(defaults, h)) out[h] = defaults[h];
      else out[h] = '';
    }
    return out;
  }

  const outRows = drows.map(mapRow);

  function serializeCSV(header, rows){
    const esc = (v)=>{
      const s = String(v ?? '');
      if(/[",\n]/.test(s)) return '"'+s.replace(/"/g,'""')+'"';
      return s;
    };
    const lines = [ header.join(',') ];
    for(const r of rows){ lines.push(header.map(h=>esc(r[h])).join(',')); }
    return lines.join('\n');
  }

  const outCSV = serializeCSV(legacyHeader, outRows);
  fs.writeFileSync(out, outCSV, 'utf8');
  console.log(`Wrote ${out} with ${outRows.length} rows.`);
}

if(require.main === module){
  try { main(); } catch(e){ console.error(e); process.exit(1); }
}

