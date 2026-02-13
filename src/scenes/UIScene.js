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

    // Warning vignette (radial gradient)
    this._createVignetteTexture();
    this.vignette = this.add.image(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, '__vignette')
      .setDepth(99).setAlpha(0);

    // Pause overlay (hidden by default)
    this.pauseBg = this.add.rectangle(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT,
      0x000000, 0.5
    ).setDepth(200).setVisible(false);

    this.pauseText = this.add.text(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 20,
      'PAUSED', style('32px', CONFIG.COLORS.PLANET_ATMOSPHERE)
    ).setOrigin(0.5).setDepth(201).setVisible(false);

    this.pauseHint = this.add.text(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 20,
      'Press P to resume', style('14px')
    ).setOrigin(0.5).setDepth(201).setVisible(false);

    this.paused = false;

    // P key for resume (UIScene stays active while GameScene is paused)
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.pauseKey.on('down', this._onResumePressed, this);

    // Listen for events forwarded from GameScene (via UIScene.events.emit)
    this.events.on(EVENTS.SCORE_CHANGED, this._onScoreChanged, this);
    this.events.on(EVENTS.WAVE_STARTED, this._onWaveStarted, this);
    this.events.on(EVENTS.WAVE_COMPLETE, this._onWaveComplete, this);
    this.events.on(EVENTS.SILO_DESTROYED, this._onSiloCountChanged, this);
    this.events.on(EVENTS.GAME_OVER, this._onGameOver, this);
    this.events.on(EVENTS.MULTI_KILL, this._onMultiKill, this);
    this.events.on('game_paused', this._onGamePaused, this);

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

  _onGamePaused() {
    this.paused = true;
    this.pauseBg.setVisible(true);
    this.pauseText.setVisible(true);
    this.pauseHint.setVisible(true);
  }

  _onResumePressed() {
    if (!this.paused) return;
    this.paused = false;
    this.pauseBg.setVisible(false);
    this.pauseText.setVisible(false);
    this.pauseHint.setVisible(false);
    this.scene.resume('GameScene');
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

  _createVignetteTexture() {
    if (this.textures.exists('__vignette')) return;

    const w = CONFIG.GAME_WIDTH;
    const h = CONFIG.GAME_HEIGHT;
    const canvas = this.textures.createCanvas('__vignette', w, h);
    const ctx = canvas.getContext();

    // Radial gradient: transparent center → red edges
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.sqrt(cx * cx + cy * cy);

    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.35, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(96, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(96, 0, 0, 0)');
    gradient.addColorStop(0.75, 'rgba(96, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(96, 0, 0, 0.9)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    canvas.refresh();
  }

  shutdown() {
    this.events.off(EVENTS.SCORE_CHANGED, this._onScoreChanged, this);
    this.events.off(EVENTS.WAVE_STARTED, this._onWaveStarted, this);
    this.events.off(EVENTS.WAVE_COMPLETE, this._onWaveComplete, this);
    this.events.off(EVENTS.SILO_DESTROYED, this._onSiloCountChanged, this);
    this.events.off(EVENTS.GAME_OVER, this._onGameOver, this);
    this.events.off(EVENTS.MULTI_KILL, this._onMultiKill, this);
    this.events.off('game_paused', this._onGamePaused, this);
    this.pauseKey.off('down', this._onResumePressed, this);
    this.input.keyboard.removeKey(Phaser.Input.Keyboard.KeyCodes.P);
  }
}
