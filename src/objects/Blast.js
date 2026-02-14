import { CONFIG } from '../config.js';
import { BLAST_PHASE } from '../utils/constants.js';
import { distanceSq } from '../utils/math.js';
import gameManager from '../systems/GameManager.js';

export default class Blast {
  constructor(scene, x, y, chainDepth = 0) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.chainDepth = chainDepth;
    this.isChain = chainDepth > 0;

    const baseRadius = gameManager.getEffectiveBlastRadius();
    this.maxRadius = baseRadius * Math.pow(CONFIG.CHAIN_RADIUS_MULT, chainDepth);
    this.currentRadius = 0;
    this.phase = BLAST_PHASE.EXPANDING;
    this.alive = true;
    this.lethal = true; // can destroy enemies during EXPANDING and HOLDING
    this.timer = 0;

    this.expandTime = CONFIG.BLAST_EXPAND_TIME;
    this.holdTime = CONFIG.BLAST_HOLD_TIME;
    this.fadeTime = CONFIG.BLAST_FADE_TIME;

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(6);
  }

  update(delta) {
    if (!this.alive) return;

    const dt = delta / 1000;
    this.timer += dt;

    switch (this.phase) {
      case BLAST_PHASE.EXPANDING:
        this.currentRadius = (this.timer / this.expandTime) * this.maxRadius;
        if (this.timer >= this.expandTime) {
          this.currentRadius = this.maxRadius;
          this.timer = 0;
          this.phase = BLAST_PHASE.HOLDING;
        }
        break;

      case BLAST_PHASE.HOLDING:
        this.currentRadius = this.maxRadius;
        if (this.timer >= this.holdTime) {
          this.timer = 0;
          this.phase = BLAST_PHASE.FADING;
          this.lethal = false;
        }
        break;

      case BLAST_PHASE.FADING:
        if (this.timer >= this.fadeTime) {
          this.alive = false;
          this.destroy();
          return;
        }
        break;
    }

    this._draw();
  }

  isInRange(ex, ey) {
    if (!this.lethal) return false;
    return distanceSq(this.x, this.y, ex, ey) <= this.currentRadius * this.currentRadius;
  }

  _draw() {
    const g = this.graphics;
    g.clear();

    let alpha = 1;
    if (this.phase === BLAST_PHASE.FADING) {
      alpha = 1 - (this.timer / this.fadeTime);
    }

    const edgeColor = this.isChain ? CONFIG.CHAIN_BLAST_TINT : CONFIG.TINT.BLAST_EDGE;
    const coreColor = this.isChain ? CONFIG.CHAIN_BLAST_TINT : CONFIG.TINT.BLAST_CORE;

    // Outer ring
    g.lineStyle(2, edgeColor, alpha * 0.6);
    g.strokeCircle(this.x, this.y, this.currentRadius);

    // Filled circle with gradient effect
    g.fillStyle(edgeColor, alpha * 0.15);
    g.fillCircle(this.x, this.y, this.currentRadius);

    // Inner core
    const coreRadius = this.currentRadius * 0.4;
    g.fillStyle(coreColor, alpha * (this.isChain ? 0.4 : 0.5));
    g.fillCircle(this.x, this.y, coreRadius);
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}
