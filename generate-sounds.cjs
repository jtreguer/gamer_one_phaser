#!/usr/bin/env node
// Generates 8-bit WAV sound effects for Planet Defense.
// Run: node generate-sounds.cjs

const fs = require('fs');
const path = require('path');

const RATE = 22050;
const DIR = path.join(__dirname, 'public', 'assets', 'audio');

fs.mkdirSync(DIR, { recursive: true });

// --- WAV writer ---

function writeWav(filename, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);       // PCM
  buf.writeUInt16LE(1, 22);       // mono
  buf.writeUInt32LE(RATE, 24);    // sample rate
  buf.writeUInt32LE(RATE, 28);    // byte rate
  buf.writeUInt16LE(1, 32);       // block align
  buf.writeUInt16LE(8, 34);       // 8-bit
  buf.write('data', 36);
  buf.writeUInt32LE(n, 40);
  for (let i = 0; i < n; i++) {
    buf.writeUInt8(Math.max(0, Math.min(255, Math.round((samples[i] + 1) * 127.5))), 44 + i);
  }
  fs.writeFileSync(path.join(DIR, filename), buf);
  console.log(`  ${filename} (${n} samples, ${(n / RATE).toFixed(3)}s)`);
}

// --- Oscillators ---

function osc(type, phase) {
  const p = ((phase % 1) + 1) % 1;
  switch (type) {
    case 'sine': return Math.sin(p * 2 * Math.PI);
    case 'square': return p < 0.5 ? 1 : -1;
    case 'sawtooth': return 2 * p - 1;
    case 'triangle': return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
    case 'noise': return Math.random() * 2 - 1;
  }
}

function expInterp(a, b, t) { return a * Math.pow(b / a, Math.max(0, Math.min(1, t))); }

// --- Sound generators ---

// 1. Launch — ascending whoosh
function genLaunch() {
  const dur = 0.25, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(200, 1200, t);
    phase += freq / RATE;
    const env = t < 0.05 ? t / 0.05 : Math.pow(1 - t, 1.5);
    samples[i] = (osc('sawtooth', phase) * 0.3 + osc('noise', 0) * 0.2) * env;
  }
  return samples;
}

// 2. Detonation — deep thump with reverb
function genDetonation() {
  const dur = 0.5, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(150, 40, t);
    p1 += freq / RATE;
    p2 += (freq * 1.5) / RATE;
    const env = t < 0.02 ? t / 0.02 : Math.pow(1 - t, 1.2);
    samples[i] = (osc('sine', p1) * 0.5 + osc('square', p2) * 0.2 + osc('noise', 0) * 0.1) * env;
  }
  return samples;
}

// 3. Enemy destroy — crisp crackle
function genEnemyDestroy() {
  const dur = 0.15, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(800, 200, t);
    phase += freq / RATE;
    const env = t < 0.02 ? t / 0.02 : Math.pow(1 - t, 2);
    samples[i] = (osc('square', phase) * 0.4 + osc('noise', 0) * 0.15) * env;
  }
  return samples;
}

// 4. Silo destroyed — heavy bass boom
function genSiloDestroyed() {
  const dur = 0.7, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(120, 30, t);
    p1 += freq / RATE;
    p2 += (freq * 3) / RATE;
    const env = t < 0.01 ? t / 0.01 : Math.pow(1 - t, 0.8);
    samples[i] = (osc('sine', p1) * 0.6 + osc('sawtooth', p2) * 0.15 + osc('noise', 0) * 0.15) * env;
  }
  return samples;
}

// 5. MIRV split — sharp crack
function genMirvSplit() {
  const dur = 0.18, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(1500, 400, t);
    phase += freq / RATE;
    const env = t < 0.01 ? t / 0.01 : Math.pow(1 - t, 2.5);
    samples[i] = (osc('square', phase) * 0.35 + osc('noise', 0) * 0.25) * env;
  }
  return samples;
}

// 6. Wave clear — ascending chime
function genWaveClear() {
  const notes = [523, 659, 784, 1047];
  const noteDur = 0.12, gap = 0.04, lastSustain = 0.35;
  const totalDur = (notes.length - 1) * (noteDur + gap) + lastSustain;
  const n = Math.floor(RATE * totalDur);
  const samples = new Float32Array(n);
  let phase = 0, phase2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let noteIdx = -1, noteT = 0, elapsed = 0;
    for (let j = 0; j < notes.length; j++) {
      const d = j === notes.length - 1 ? lastSustain : noteDur;
      if (t >= elapsed && t < elapsed + d) {
        noteIdx = j;
        noteT = (t - elapsed) / d;
        break;
      }
      elapsed += d + gap;
    }
    if (noteIdx >= 0) {
      const freq = notes[noteIdx];
      phase += freq / RATE;
      let env = noteT < 0.05 ? noteT / 0.05 : Math.pow(1 - noteT, 1.5);
      let val = osc('sine', phase) * 0.4 * env;
      if (noteIdx === notes.length - 1) {
        phase2 += (freq * 1.003) / RATE;
        val = (val + osc('sine', phase2) * 0.4 * env) * 0.6;
      }
      samples[i] = val;
    }
  }
  return samples;
}

// 7. Game over — descending rumble
function genGameOver() {
  const notes = [330, 262, 196, 131];
  const noteDur = 0.3, gap = 0.1;
  const totalDur = notes.length * noteDur + (notes.length - 1) * gap + 0.5;
  const n = Math.floor(RATE * totalDur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let noteIdx = -1, noteT = 0, elapsed = 0;
    for (let j = 0; j < notes.length; j++) {
      if (t >= elapsed && t < elapsed + noteDur) {
        noteIdx = j;
        noteT = (t - elapsed) / noteDur;
        break;
      }
      elapsed += noteDur + gap;
    }
    if (noteIdx >= 0) {
      phase += notes[noteIdx] / RATE;
      let env = noteT < 0.03 ? noteT / 0.03 : Math.pow(1 - noteT, 1);
      samples[i] = (osc('sawtooth', phase) * 0.3 + osc('sine', phase * 0.5) * 0.2) * env;
    } else if (t > elapsed) {
      // Fade to silence
      const fadeT = (t - elapsed) / 0.5;
      if (fadeT < 1) {
        samples[i] = osc('noise', 0) * 0.1 * (1 - fadeT);
      }
    }
  }
  return samples;
}

// 8. Reject — dull buzz
function genReject() {
  const dur = 0.12, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    phase += 150 / RATE;
    const env = t < 0.05 ? t / 0.05 : (1 - t) / 0.95;
    samples[i] = osc('square', phase) * 0.3 * env;
  }
  return samples;
}

// 9. Reload — subtle ping
function genReload() {
  const dur = 0.1, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    phase += 1200 / RATE;
    const env = t < 0.02 ? t / 0.02 : Math.pow(1 - t, 3);
    samples[i] = osc('sine', phase) * 0.25 * env;
  }
  return samples;
}

// 10. Impact — surface thud
function genImpact() {
  const dur = 0.2, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(200, 80, t);
    phase += freq / RATE;
    const env = t < 0.02 ? t / 0.02 : Math.pow(1 - t, 1.5);
    samples[i] = (osc('sine', phase) * 0.3 + osc('noise', 0) * 0.15) * env;
  }
  return samples;
}

// 11. Upgrade — satisfying confirm
function genUpgrade() {
  const dur = 0.25, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(400, 800, t);
    p1 += freq / RATE;
    p2 += (freq * 1.5) / RATE;
    const env = t < 0.02 ? t / 0.02 : Math.pow(1 - t, 1.5);
    samples[i] = (osc('sine', p1) + osc('sine', p2)) * 0.3 * env;
  }
  return samples;
}

// 12. Multi kill — ascending zap burst
function genMultiKill() {
  const dur = 0.3, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(300, 2000, t);
    phase += freq / RATE;
    let env = t < 0.02 ? t / 0.02 : (1 - t);
    // Add pulsing
    env *= 0.7 + Math.sin(t * 40) * 0.3;
    samples[i] = (osc('square', phase) * 0.25 + osc('sawtooth', phase * 0.5) * 0.15) * env;
  }
  return samples;
}

// --- Generate all ---

console.log('Generating 8-bit WAV sounds in public/assets/audio/...');
writeWav('launch.wav', genLaunch());
writeWav('detonation.wav', genDetonation());
writeWav('enemy_destroy.wav', genEnemyDestroy());
writeWav('silo_destroyed.wav', genSiloDestroyed());
writeWav('mirv_split.wav', genMirvSplit());
writeWav('wave_clear.wav', genWaveClear());
writeWav('game_over.wav', genGameOver());
writeWav('reject.wav', genReject());
writeWav('reload.wav', genReload());
writeWav('impact.wav', genImpact());
writeWav('upgrade.wav', genUpgrade());
writeWav('multi_kill.wav', genMultiKill());
console.log('Done! 12 sound files generated.');
