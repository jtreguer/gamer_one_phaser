import { CONFIG } from '../config.js';

const AUDIO = () => CONFIG.AUDIO;

export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
    this.masterGain = null;
    this.droneNodes = [];
    this.bleepTimer = null;
    this.running = false;
  }

  init() {
    const snd = this.scene.sound;
    if (!snd || !snd.context) return false;
    this.ctx = snd.context;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = AUDIO().MASTER_VOLUME;
    this.masterGain.connect(this.ctx.destination);
    return true;
  }

  startAmbient() {
    if (!this.ctx || this.running) return;
    this.running = true;
    this._startDrone();
    this._scheduleBleep();
  }

  stopAmbient() {
    this.running = false;

    if (this.bleepTimer) {
      this.bleepTimer.destroy();
      this.bleepTimer = null;
    }

    const now = this.ctx?.currentTime ?? 0;
    for (const node of this.droneNodes) {
      try {
        if (node.stop) node.stop(now + 0.05);
        if (node.disconnect) node.disconnect();
      } catch { /* already stopped */ }
    }
    this.droneNodes = [];
  }

  destroy() {
    this.stopAmbient();
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    this.ctx = null;
  }

  // --- SFX methods ---

  playLaunch() {
    this.scene.sound.play('launch', { volume: AUDIO().SFX.LAUNCH_VOLUME });
  }

  playDetonation() {
    this.scene.sound.play('detonation', { volume: AUDIO().SFX.DETONATION_VOLUME });
  }

  playEnemyDestroy() {
    this.scene.sound.play('enemy_destroy', { volume: AUDIO().SFX.ENEMY_DESTROY_VOLUME });
  }

  playSiloDestroyed() {
    this.scene.sound.play('silo_destroyed', { volume: AUDIO().SFX.SILO_DESTROYED_VOLUME });
  }

  playMirvSplit() {
    this.scene.sound.play('mirv_split', { volume: AUDIO().SFX.MIRV_SPLIT_VOLUME });
  }

  playWaveClear() {
    this.scene.sound.play('wave_clear', { volume: AUDIO().SFX.WAVE_CLEAR_VOLUME });
  }

  playGameOver() {
    this.scene.sound.play('game_over', { volume: AUDIO().SFX.GAME_OVER_VOLUME });
  }

  playReject() {
    this.scene.sound.play('reject', { volume: AUDIO().SFX.REJECT_VOLUME });
  }

  playReload() {
    this.scene.sound.play('reload', { volume: AUDIO().SFX.RELOAD_VOLUME });
  }

  playImpact() {
    this.scene.sound.play('impact', { volume: AUDIO().SFX.IMPACT_VOLUME });
  }

  playUpgrade() {
    this.scene.sound.play('upgrade', { volume: AUDIO().SFX.UPGRADE_VOLUME });
  }

  playMultiKill() {
    this.scene.sound.play('multi_kill', { volume: AUDIO().SFX.MULTI_KILL_VOLUME });
  }

  // --- Ambient audio ---

  _startDrone() {
    const cfg = AUDIO().AMBIENT;
    const now = this.ctx.currentTime;

    // Sub-bass sine
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = cfg.DRONE_FREQUENCY;
    const subGain = this.ctx.createGain();
    subGain.gain.value = cfg.DRONE_VOLUME * 0.6;
    sub.connect(subGain);
    subGain.connect(this.masterGain);

    // Sawtooth through low-pass
    const saw = this.ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = cfg.DRONE_FREQUENCY;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cfg.DRONE_FILTER_FREQ;
    filter.Q.value = cfg.DRONE_FILTER_Q;

    // LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = cfg.DRONE_LFO_RATE;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = cfg.DRONE_LFO_DEPTH;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const droneGain = this.ctx.createGain();
    droneGain.gain.value = cfg.DRONE_VOLUME;
    saw.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.masterGain);

    sub.start(now);
    saw.start(now);
    lfo.start(now);

    this.droneNodes.push(sub, subGain, saw, filter, lfo, lfoGain, droneGain);
  }

  _scheduleBleep() {
    if (!this.running) return;

    const cfg = AUDIO().AMBIENT;
    const delay = cfg.BLEEP_INTERVAL_MIN +
      Math.random() * (cfg.BLEEP_INTERVAL_MAX - cfg.BLEEP_INTERVAL_MIN);

    this.bleepTimer = this.scene.time.delayedCall(delay, () => {
      if (!this.running) return;
      // Use detonation/launch sounds at very low volume for ambient texture
      const rate = 0.3 + Math.random() * 0.5;
      if (Math.random() > 0.5) {
        this.scene.sound.play('launch', { volume: cfg.BLEEP_VOLUME, rate });
      } else {
        this.scene.sound.play('detonation', { volume: cfg.BLOOP_VOLUME, rate });
      }
      this._scheduleBleep();
    });
  }
}
