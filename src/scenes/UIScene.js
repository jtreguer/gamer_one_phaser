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

    // Streak multiplier display (below score)
    this.streakText = this.add.text(15, 30, '', style('14px', '#ffdd00'))
      .setDepth(100).setAlpha(0);

    // Wave announcement (large, centered)
    this.announceText = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 100, '', style('28px', CONFIG.COLORS.PLANET_ATMOSPHERE))
      .setOrigin(0.5).setDepth(101).setAlpha(0);

    // Warning vignette (radial gradient)
    this._createVignetteTexture();
    this.vignette = this.add.image(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, '__vignette')
      .setDepth(99).setAlpha(0);

    // Last stand state
    this.lastStandActive = false;
    this.siloPulseTween = null;
    this.vignettePulseTween = null;

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

    // P key toggles pause (handled entirely in UIScene since it stays active)
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.pauseKey.on('down', this._onPauseToggle, this);

    // Listen for events forwarded from GameScene (via UIScene.events.emit)
    this.events.on(EVENTS.SCORE_CHANGED, this._onScoreChanged, this);
    this.events.on(EVENTS.WAVE_STARTED, this._onWaveStarted, this);
    this.events.on(EVENTS.WAVE_COMPLETE, this._onWaveComplete, this);
    this.events.on(EVENTS.SILO_DESTROYED, this._onSiloCountChanged, this);
    this.events.on(EVENTS.GAME_OVER, this._onGameOver, this);
    this.events.on(EVENTS.MULTI_KILL, this._onMultiKill, this);
    this.events.on(EVENTS.STREAK_CHANGED, this._onStreakChanged, this);
    this.events.on(EVENTS.PERFECT_WAVE, this._onPerfectWave, this);
    this.events.on(EVENTS.LAST_STAND, this._onLastStand, this);

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
      if (count > 1) {
        this._showWarningVignette(true);
      }
    } else {
      this.siloText.setColor(CONFIG.COLORS.SILO_READY);
      this._showWarningVignette(false);
    }
  }

  _onStreakChanged(streakKills, multiplier) {
    if (multiplier <= 1.0) {
      // Fade out streak display
      this.tweens.add({
        targets: this.streakText,
        alpha: 0,
        duration: 300,
      });
      return;
    }

    // Update text
    this.streakText.setText(`x${multiplier.toFixed(1)}`);

    // Color escalation
    if (multiplier >= 2.5) {
      this.streakText.setColor('#ff4040'); // red
    } else if (multiplier >= 2.0) {
      this.streakText.setColor('#ff8830'); // orange
    } else if (multiplier >= 1.5) {
      this.streakText.setColor('#ffdd00'); // yellow
    } else {
      this.streakText.setColor('#ffffff'); // white
    }

    // Show and pulse
    this.streakText.setAlpha(1);
    this.tweens.add({
      targets: this.streakText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  _onPerfectWave(waveNum) {
    // Gold screen flash
    const flash = this.add.rectangle(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT,
      0xffd700, 0.15
    ).setDepth(98);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy(),
    });

    // "PERFECT WAVE!" text
    const perfectText = this.add.text(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 50,
      'PERFECT WAVE!', {
        fontFamily: CONFIG.FONT_FAMILY,
        fontSize: '32px',
        color: '#ffd700',
        resolution: TEXT_RES,
      }
    ).setOrigin(0.5).setDepth(102).setScale(0.5);

    this.tweens.add({
      targets: perfectText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: perfectText,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 150,
          onComplete: () => {
            this.tweens.add({
              targets: perfectText,
              alpha: 0,
              y: perfectText.y - 30,
              duration: 1200,
              delay: 800,
              ease: 'Power2',
              onComplete: () => perfectText.destroy(),
            });
          },
        });
      },
    });
  }

  _onLastStand(active) {
    if (active && !this.lastStandActive) {
      this.lastStandActive = true;

      // Show "LAST STAND!" announcement
      const lastStandText = this.add.text(
        CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 60,
        'LAST STAND!', {
          fontFamily: CONFIG.FONT_FAMILY,
          fontSize: '26px',
          color: '#ff4040',
          resolution: TEXT_RES,
        }
      ).setOrigin(0.5).setDepth(102);

      this.tweens.add({
        targets: lastStandText,
        alpha: 0,
        y: lastStandText.y - 40,
        duration: 2000,
        delay: 1000,
        ease: 'Power2',
        onComplete: () => lastStandText.destroy(),
      });

      // Pulsing vignette
      this.vignette.setAlpha(0.7);
      this.vignettePulseTween = this.tweens.add({
        targets: this.vignette,
        alpha: { from: 0.5, to: 0.8 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Pulsing silo text
      this.siloText.setColor('#ff4040');
      this.siloPulseTween = this.tweens.add({
        targets: this.siloText,
        alpha: { from: 0.5, to: 1.0 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (!active && this.lastStandActive) {
      this.lastStandActive = false;

      // Stop pulsing
      if (this.vignettePulseTween) {
        this.vignettePulseTween.stop();
        this.vignettePulseTween = null;
      }
      if (this.siloPulseTween) {
        this.siloPulseTween.stop();
        this.siloPulseTween = null;
        this.siloText.setAlpha(1);
      }

      this._showWarningVignette(false);
      this.siloText.setColor(CONFIG.COLORS.SILO_READY);
    }
  }

  _onMultiKill(count) {
    // Extra HUD feedback already handled in GameScene
  }

  _onPauseToggle() {
    if (this.paused) {
      this.paused = false;
      this.pauseBg.setVisible(false);
      this.pauseText.setVisible(false);
      this.pauseHint.setVisible(false);
      this.scene.resume('GameScene');
    } else {
      const gameScene = this.scene.get('GameScene');
      if (!gameScene || gameScene.gameOver || !gameScene.waveActive) return;
      this.paused = true;
      this.scene.pause('GameScene');
      this.pauseBg.setVisible(true);
      this.pauseText.setVisible(true);
      this.pauseHint.setVisible(true);
    }
  }

  _onGameOver() {
    this.announceText.setText('ALL SILOS DESTROYED');
    this.announceText.setAlpha(1).setColor(CONFIG.COLORS.ENEMY);
  }

  _showWarningVignette(show) {
    // Don't override last stand pulsing vignette
    if (this.lastStandActive) return;
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
    this.events.off(EVENTS.STREAK_CHANGED, this._onStreakChanged, this);
    this.events.off(EVENTS.PERFECT_WAVE, this._onPerfectWave, this);
    this.events.off(EVENTS.LAST_STAND, this._onLastStand, this);
    this.pauseKey.off('down', this._onPauseToggle, this);
    this.input.keyboard.removeKey(Phaser.Input.Keyboard.KeyCodes.P);

    if (this.vignettePulseTween) {
      this.vignettePulseTween.stop();
      this.vignettePulseTween = null;
    }
    if (this.siloPulseTween) {
      this.siloPulseTween.stop();
      this.siloPulseTween = null;
    }
  }
}
