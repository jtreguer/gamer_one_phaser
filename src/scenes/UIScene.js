import Phaser from 'phaser';
import { CONFIG, TEXT_RES } from '../config.js';
import { EVENTS } from '../utils/constants.js';
import gameManager from '../systems/GameManager.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const style = (size, color) => ({
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: size,
      color: color || CONFIG.COLORS.UI_TEXT,
      resolution: TEXT_RES,
    });

    // Score display (top-left)
    this.scoreText = this.add.text(15, 10, 'SCORE: 0', style('16px'))
      .setDepth(100);

    // High score (top-right)
    this.highScoreText = this.add.text(CONFIG.GAME_WIDTH - 15, 10, `HI: ${gameManager.highScore}`, style('12px'))
      .setOrigin(1, 0).setDepth(100);

    // Wave display (top-center)
    this.waveText = this.add.text(CONFIG.GAME_WIDTH / 2, 10, 'WAVE 1', style('14px', CONFIG.COLORS.PLANET_ATMOSPHERE))
      .setOrigin(0.5, 0).setDepth(100);

    // Silo count (bottom-center)
    this.siloText = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT - 20, `SILOS: ${CONFIG.INITIAL_SILO_COUNT}`, style('12px', CONFIG.COLORS.SILO_READY))
      .setOrigin(0.5, 1).setDepth(100);

    // Wave announcement (large, centered)
    this.announceText = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 100, '', style('28px', CONFIG.COLORS.PLANET_ATMOSPHERE))
      .setOrigin(0.5).setDepth(101).setAlpha(0);

    // Warning vignette
    this.vignette = this.add.graphics();
    this.vignette.setDepth(99).setAlpha(0);
    this._drawVignette();

    // Listen for events forwarded from GameScene (via UIScene.events.emit)
    this.events.on(EVENTS.SCORE_CHANGED, this._onScoreChanged, this);
    this.events.on(EVENTS.WAVE_STARTED, this._onWaveStarted, this);
    this.events.on(EVENTS.WAVE_COMPLETE, this._onWaveComplete, this);
    this.events.on(EVENTS.SILO_DESTROYED, this._onSiloCountChanged, this);
    this.events.on(EVENTS.GAME_OVER, this._onGameOver, this);
    this.events.on(EVENTS.MULTI_KILL, this._onMultiKill, this);

    // Register shutdown for cleanup on scene stop/restart
    this.events.once('shutdown', this.shutdown, this);
  }

  _onScoreChanged(score) {
    this.scoreText.setText(`SCORE: ${score}`);
    // Brief scale pop
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  _onWaveStarted(waveNum) {
    this.waveText.setText(`WAVE ${waveNum}`);
    this.siloText.setText(`SILOS: ${gameManager.activeSiloCount}`);

    // Announce wave
    this.announceText.setText(`WAVE ${waveNum}`);
    this.announceText.setAlpha(1);
    this.tweens.add({
      targets: this.announceText,
      alpha: 0,
      y: CONFIG.GAME_HEIGHT / 2 - 130,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        this.announceText.y = CONFIG.GAME_HEIGHT / 2 - 100;
      },
    });
  }

  _onWaveComplete(waveNum, bonus) {
    this.announceText.setText(`WAVE ${waveNum} CLEAR\n+${bonus}`);
    this.announceText.setAlpha(1).setAlign('center');
    this.tweens.add({
      targets: this.announceText,
      alpha: 0,
      duration: 2000,
      delay: 500,
      ease: 'Power2',
    });
  }

  _onSiloCountChanged(activeCount) {
    const count = typeof activeCount === 'number' ? activeCount : gameManager.activeSiloCount;
    this.siloText.setText(`SILOS: ${count}`);

    // Warning state
    if (count <= 2) {
      this.siloText.setColor(CONFIG.COLORS.ENEMY);
      this._showWarningVignette(true);
    } else {
      this.siloText.setColor(CONFIG.COLORS.SILO_READY);
      this._showWarningVignette(false);
    }
  }

  _onMultiKill(count) {
    // Extra HUD feedback already handled in GameScene
  }

  _onGameOver() {
    this.announceText.setText('ALL SILOS DESTROYED');
    this.announceText.setAlpha(1).setColor(CONFIG.COLORS.ENEMY);
  }

  _showWarningVignette(show) {
    this.tweens.add({
      targets: this.vignette,
      alpha: show ? 0.5 : 0,
      duration: 500,
    });
  }

  _drawVignette() {
    const w = CONFIG.GAME_WIDTH;
    const h = CONFIG.GAME_HEIGHT;
    const g = this.vignette;

    // Draw red vignette around edges
    const thickness = 80;
    g.fillStyle(CONFIG.TINT.WARNING_VIGNETTE, 0.6);

    // Top
    g.fillGradientStyle(CONFIG.TINT.WARNING_VIGNETTE, CONFIG.TINT.WARNING_VIGNETTE, 0x000000, 0x000000, 0.6, 0.6, 0, 0);
    g.fillRect(0, 0, w, thickness);
    // Bottom
    g.fillRect(0, h - thickness, w, thickness);
    // Left
    g.fillRect(0, 0, thickness, h);
    // Right
    g.fillRect(w - thickness, 0, thickness, h);
  }

  shutdown() {
    this.events.off(EVENTS.SCORE_CHANGED, this._onScoreChanged, this);
    this.events.off(EVENTS.WAVE_STARTED, this._onWaveStarted, this);
    this.events.off(EVENTS.WAVE_COMPLETE, this._onWaveComplete, this);
    this.events.off(EVENTS.SILO_DESTROYED, this._onSiloCountChanged, this);
    this.events.off(EVENTS.GAME_OVER, this._onGameOver, this);
    this.events.off(EVENTS.MULTI_KILL, this._onMultiKill, this);
  }
}
