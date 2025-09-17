import { describe, it, expect } from 'vitest';
import { resolveTargetsFromText, Roster } from '../lib/roster';

const roster: Roster = {
  drivers: [
    { id: 'ver', code: 'VER', name: 'Max Verstappen', team: 'Red Bull' },
    { id: 'ham', code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes' },
  ],
  byCode: new Map([
    ['VER', { id: 'ver', code: 'VER', name: 'Max Verstappen', team: 'Red Bull' }],
    ['HAM', { id: 'ham', code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes' }],
  ]),
  byName: new Map([
    ['max verstappen', { id: 'ver', code: 'VER', name: 'Max Verstappen', team: 'Red Bull' }],
    ['verstappen', { id: 'ver', code: 'VER', name: 'Max Verstappen', team: 'Red Bull' }],
    ['lewis hamilton', { id: 'ham', code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes' }],
    ['hamilton', { id: 'ham', code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes' }],
  ]),
  teamSynonyms: new Map([
    ['red bull', 'Red Bull'],
    ['red bull racing', 'Red Bull'],
    ['mercedes', 'Mercedes'],
    ['mercedes-amg', 'Mercedes'],
  ]),
};

describe('roster resolveTargetsFromText', () => {
  it('matches by driver code and name', () => {
    const t1 = resolveTargetsFromText('Penalty for VER in qualifying', roster);
    expect(t1.find(t => t.type==='driver' && t.id==='VER')).toBeTruthy();
    const t2 = resolveTargetsFromText('Max Verstappen wins again', roster);
    expect(t2.find(t => t.type==='driver' && t.id==='VER')).toBeTruthy();
  });

  it('matches by team synonyms', () => {
    const t = resolveTargetsFromText('Red Bull Racing brings upgrade', roster);
    expect(t.find(x => x.type==='team' && x.id==='Red Bull')).toBeTruthy();
  });
});

