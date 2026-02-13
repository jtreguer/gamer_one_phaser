import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { EVENTS, SILO_STATE, GAME_STATE } from '../utils/constants.js';
import gameManager from '../systems/GameManager.js';
import SoundManager from '../systems/SoundManager.js';
import WaveSpawner from '../systems/WaveSpawner.js';
import Background from '../objects/Background.js';
import Planet from '../objects/Planet.js';
import SiloManager from '../objects/SiloManager.js';
import Crosshair from '../objects/Crosshair.js';
import Interceptor from '../objects/Interceptor.js';
import Blast from '../objects/Blast.js';
import MirvMissile from '../objects/MirvMissile.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.planetX = CONFIG.GAME_WIDTH / 2;
    this.planetY = CONFIG.GAME_HEIGHT / 2;

    // Arrays for active game objects
    this.interceptors = [];
    this.blasts = [];
    this.enemies = [];
    this.popups = [];

    // Flags
    this.waveAllSpawned = false;
    this.gameOver = false;
    this.waveActive = false;

    // Sound
    this.soundManager = new SoundManager(this);
    this.soundManager.init();

    // Create game objects
    this.background = new Background(this);
    this.planet = new Planet(this, this.planetX, this.planetY);
    this.siloManager = new SiloManager(this);
    this.siloManager.init(CONFIG.INITIAL_SILO_COUNT);
    this.crosshair = new Crosshair(this);

    // Wave spawner
    this.waveSpawner = new WaveSpawner(this);

    // Effects graphics (for popups, impact effects)
    this.effectsGfx = this.add.graphics();
    this.effectsGfx.setDepth(50);

    // --- Event handlers ---
    this.events.on('enemy_spawned', this._onEnemySpawned, this);
    this.events.on(EVENTS.INTERCEPTOR_DETONATED, this._onInterceptorDetonated, this);
    this.events.on(EVENTS.WAVE_ENEMIES_SPAWNED, this._onWaveEnemiesSpawned, this);
    this.events.on(EVENTS.SILO_DESTROYED, this._onSiloDestroyed, this);
    this.events.on(EVENTS.ALL_SILOS_DESTROYED, this._onAllSilosDestroyed, this);
    this.events.on(EVENTS.SILO_RELOADED, this._onSiloReloaded, this);

    // Input
    this.input.on('pointerdown', this._onPointerDown, this);

    // Start ambient audio
    this.soundManager.startAmbient();

    // Start first wave
    this._startWave();
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Update background
    this.background.update(time);

    // Update planet (rotation)
    this.planet.update(delta);

    // Update silos
    this.siloManager.update(
      delta, this.planetX, this.planetY,
      CONFIG.PLANET_RADIUS, this.planet.currentRotation
    );
    gameManager.activeSiloCount = this.siloManager.getActiveCount();

    // Update crosshair
    this.crosshair.update(delta);

    // Update interceptors
    for (let i = this.interceptors.length - 1; i >= 0; i--) {
      const interceptor = this.interceptors[i];
      interceptor.update(delta);
      if (interceptor.detonated || !interceptor.alive) {
        this.interceptors.splice(i, 1);
      }
    }

    // Update blasts and check hits
    for (let i = this.blasts.length - 1; i >= 0; i--) {
      const blast = this.blasts[i];
      blast.update(delta);

      if (blast.lethal) {
        this._checkBlastHits(blast);
      }

      if (!blast.alive) {
        this.blasts.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) {
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(delta, this.planetX, this.planetY);

      // MIRV split check
      if (enemy instanceof MirvMissile && !enemy.hasSplit) {
        const warheads = enemy.checkSplit(this.planetX, this.planetY);
        if (warheads) {
          this.soundManager.playMirvSplit();
          this._showMirvSplitEffect(enemy.x, enemy.y);
          for (const w of warheads) {
            this.enemies.push(w);
          }
          this.enemies.splice(i, 1);
          continue;
        }
      }

      // Impact check
      if (enemy.impacted) {
        this._onEnemyImpact(enemy);
        this.enemies.splice(i, 1);
      }
    }

    // Update popups
    this._updatePopups(delta);

    // Check wave completion
    if (this.waveAllSpawned && this.enemies.length === 0 && this.waveActive) {
      this._onWaveComplete();
    }
  }

  // --- Input ---

  _onPointerDown(pointer) {
    if (this.gameOver || !this.waveActive) return;

    const x = pointer.worldX;
    const y = pointer.worldY;

    // Reject clicks inside planet
    if (this.planet.isPointInside(x, y)) {
      this.crosshair.flash();
      this.soundManager.playReject();
      this.scene.get('UIScene')?.events.emit(EVENTS.CLICK_REJECTED);
      return;
    }

    // Find nearest available silo
    const silo = this.siloManager.getNearestAvailable(x, y);
    if (!silo) {
      this.crosshair.flash();
      this.soundManager.playReject();
      this.scene.get('UIScene')?.events.emit(EVENTS.CLICK_REJECTED);
      return;
    }

    // Fire
    const reloadTime = gameManager.getEffectiveReloadTime();
    silo.fire(reloadTime);
    gameManager.recordShotFired();
    this.soundManager.playLaunch();

    const speed = gameManager.getEffectiveInterceptorSpeed();
    const interceptor = new Interceptor(this, silo.x, silo.y, x, y, speed);
    this.interceptors.push(interceptor);

    this.scene.get('UIScene')?.events.emit(EVENTS.INTERCEPTOR_LAUNCH);
  }

  // --- Blast hit detection ---

  _checkBlastHits(blast) {
    let killCount = 0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) continue;

      if (blast.isInRange(enemy.x, enemy.y)) {
        // Determine points
        let points;
        if (enemy.isMirv && !enemy.hasSplit) {
          points = CONFIG.POINTS_MIRV_PRESPLIT;
        } else if (enemy.isWarhead) {
          points = CONFIG.POINTS_WARHEAD_KILL;
        } else {
          points = CONFIG.POINTS_ENEMY_KILL;
        }

        enemy.kill();
        gameManager.addScore(points);
        gameManager.recordShotHit();
        gameManager.totalEnemiesDestroyed++;
        killCount++;

        this.soundManager.playEnemyDestroy();
        this._showScorePopup(enemy.x, enemy.y, points);
        this.scene.get('UIScene')?.events.emit(EVENTS.SCORE_CHANGED, gameManager.score);
      }
    }

    if (killCount >= 3) {
      // Multi-kill feedback
      this.cameras.main.shake(200, 0.01);
      this.soundManager.playMultiKill();
      this._showMultiKillText(blast.x, blast.y, killCount);
      this.scene.get('UIScene')?.events.emit(EVENTS.MULTI_KILL, killCount);
    } else if (killCount > 0) {
      this.cameras.main.shake(80, 0.004);
    }
  }

  // --- Events ---

  _onEnemySpawned(enemy) {
    this.enemies.push(enemy);
  }

  _onInterceptorDetonated(x, y) {
    this.soundManager.playDetonation();
    const blast = new Blast(this, x, y);
    this.blasts.push(blast);
    this.cameras.main.shake(60, 0.003);
  }

  _onWaveEnemiesSpawned() {
    this.waveAllSpawned = true;
  }

  _onEnemyImpact(enemy) {
    // Check if hit a silo
    const hitSilo = this.siloManager.checkSiloHit(
      enemy.x, enemy.y,
      this.planetX, this.planetY,
      CONFIG.PLANET_RADIUS
    );

    if (hitSilo) {
      // Silo destroyed is handled by the event
    } else {
      // Surface impact — harmless
      this.soundManager.playImpact();
      this._showImpactEffect(enemy.x, enemy.y);
    }
  }

  _onSiloDestroyed(silo) {
    this.soundManager.playSiloDestroyed();
    this.cameras.main.shake(300, 0.015);
    this._showSiloDestructionEffect(silo.x, silo.y);
    gameManager.waveSilosLost++;

    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.emit(EVENTS.SILO_DESTROYED, this.siloManager.getActiveCount());
    }
  }

  _onAllSilosDestroyed() {
    this.gameOver = true;
    this.waveActive = false;
    gameManager.currentState = GAME_STATE.GAME_OVER;
    gameManager.saveHighScore();

    this.waveSpawner.stop();
    this.soundManager.playGameOver();
    this.soundManager.stopAmbient();

    // Let remaining enemies impact for dramatic effect
    this.time.delayedCall(3000, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene');
    });

    this.scene.get('UIScene')?.events.emit(EVENTS.GAME_OVER);
  }

  _onSiloReloaded(silo) {
    this.soundManager.playReload();
  }

  // --- Wave management ---

  _startWave() {
    this.waveAllSpawned = false;
    this.waveActive = true;
    const waveData = gameManager.startNextWave();

    // Notify UI
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.emit(EVENTS.WAVE_STARTED, gameManager.currentWave);
      uiScene.events.emit(EVENTS.SCORE_CHANGED, gameManager.score);
    }

    // Start spawning
    this.waveSpawner.startWave(
      waveData,
      this.planetX, this.planetY,
      CONFIG.PLANET_RADIUS,
      this.siloManager.silos
    );
  }

  _onWaveComplete() {
    this.waveActive = false;
    gameManager.currentState = GAME_STATE.WAVE_TRANSITION;

    // Calculate and add wave bonuses
    const bonus = gameManager.calculateWaveBonuses();
    gameManager.addScore(bonus);

    this.soundManager.playWaveClear();

    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.emit(EVENTS.WAVE_COMPLETE, gameManager.currentWave, bonus);
      uiScene.events.emit(EVENTS.SCORE_CHANGED, gameManager.score);
    }

    // Transition to upgrade shop after brief delay
    this.time.delayedCall(2000, () => {
      if (this.gameOver) return;
      gameManager.currentState = GAME_STATE.UPGRADE_SHOP;
      this.scene.pause();
      this.scene.launch('UpgradeScene', {
        wave: gameManager.currentWave,
        score: gameManager.score,
        siloCount: this.siloManager.getActiveCount(),
        maxSilos: CONFIG.INITIAL_SILO_COUNT,
      });
    });

    // Listen for upgrade scene completion
    this.scene.get('UpgradeScene')?.events.once(EVENTS.SHOP_CLOSED, () => {
      this._onShopClosed();
    });
    // Also listen on our own events in case UpgradeScene isn't loaded yet
    this.events.once(EVENTS.SHOP_CLOSED, () => {
      this._onShopClosed();
    });
  }

  _onShopClosed() {
    if (this.gameOver) return;
    this.scene.resume();

    // Check if silo was repaired
    gameManager.activeSiloCount = this.siloManager.getActiveCount();

    // Start next wave
    this._startWave();
  }

  onSiloRepaired() {
    const destroyed = this.siloManager.getFirstDestroyed();
    if (destroyed) {
      destroyed.repair(gameManager.getEffectiveReloadTime());
    }
  }

  // --- Visual effects ---

  _showScorePopup(x, y, points) {
    const text = this.add.text(x, y - 10, `+${points}`, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '14px',
      color: CONFIG.COLORS.SCORE_POPUP,
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  _showMultiKillText(x, y, count) {
    const label = count >= 5 ? 'MEGA KILL!' : count >= 4 ? 'ULTRA KILL!' : 'MULTI KILL!';
    const text = this.add.text(x, y - 30, label, {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '18px',
      color: CONFIG.COLORS.WHITE,
    }).setOrigin(0.5).setDepth(61);

    this.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  _showMirvSplitEffect(x, y) {
    const flash = this.add.graphics().setDepth(55);
    flash.fillStyle(CONFIG.TINT.MIRV, 0.6);
    flash.fillCircle(x, y, 15);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  _showImpactEffect(x, y) {
    const flash = this.add.graphics().setDepth(55);
    flash.fillStyle(CONFIG.TINT.ENEMY, 0.3);
    flash.fillCircle(x, y, 8);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });
  }

  _showSiloDestructionEffect(x, y) {
    const flash = this.add.graphics().setDepth(55);
    // Large explosion
    flash.fillStyle(CONFIG.TINT.ENEMY, 0.8);
    flash.fillCircle(x, y, 20);
    flash.fillStyle(CONFIG.TINT.MIRV, 0.6);
    flash.fillCircle(x, y, 12);
    flash.fillStyle(0xffffff, 0.9);
    flash.fillCircle(x, y, 5);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 600,
      onComplete: () => flash.destroy(),
    });
  }

  _updatePopups(delta) {
    // Popups are managed by tweens, nothing extra needed
  }

  // --- Cleanup ---

  shutdown() {
    this.soundManager.stopAmbient();
    this.soundManager.destroy();
    this.waveSpawner.destroy();

    this.events.off('enemy_spawned', this._onEnemySpawned, this);
    this.events.off(EVENTS.INTERCEPTOR_DETONATED, this._onInterceptorDetonated, this);
    this.events.off(EVENTS.WAVE_ENEMIES_SPAWNED, this._onWaveEnemiesSpawned, this);
    this.events.off(EVENTS.SILO_DESTROYED, this._onSiloDestroyed, this);
    this.events.off(EVENTS.ALL_SILOS_DESTROYED, this._onAllSilosDestroyed, this);
    this.events.off(EVENTS.SILO_RELOADED, this._onSiloReloaded, this);
    this.input.off('pointerdown', this._onPointerDown, this);

    for (const i of this.interceptors) i.destroy();
    for (const b of this.blasts) b.destroy();
    for (const e of this.enemies) e.destroy();

    this.background.destroy();
    this.planet.destroy();
    this.siloManager.destroy();
    this.crosshair.destroy();
  }
}
