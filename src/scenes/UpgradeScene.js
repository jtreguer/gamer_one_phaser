import Phaser from 'phaser';
import { CONFIG, TEXT_RES } from '../config.js';
import { EVENTS } from '../utils/constants.js';
import gameManager from '../systems/GameManager.js';

export default class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('UpgradeScene');
  }

  init(data) {
    this.waveNum = data.wave || 1;
    this.siloCount = data.siloCount || CONFIG.INITIAL_SILO_COUNT;
    this.maxSilos = data.maxSilos || CONFIG.INITIAL_SILO_COUNT;
  }

  create() {
    // Show cursor for the upgrade shop UI
    document.body.classList.remove('hide-cursor');

    const cx = CONFIG.GAME_WIDTH / 2;
    const style = (size, color) => ({
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: size,
      color: color || CONFIG.COLORS.UI_TEXT,
      resolution: TEXT_RES,
    });

    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

    // Title
    this.add.text(cx, 60, 'UPGRADE SHOP', style('24px', CONFIG.COLORS.PLANET_ATMOSPHERE)).setOrigin(0.5);
    this.add.text(cx, 90, `Wave ${this.waveNum} Complete`, style('14px')).setOrigin(0.5);

    // Score display
    this.scoreText = this.add.text(cx, 120, `SCORE: ${gameManager.score}`, style('16px', CONFIG.COLORS.SCORE_POPUP)).setOrigin(0.5);

    // Upgrade cards
    const upgradeIds = ['interceptor_speed', 'blast_radius', 'reload_speed', 'silo_repair'];
    const cardWidth = 160;
    const cardHeight = 200;
    const cardGap = 20;
    const totalWidth = upgradeIds.length * cardWidth + (upgradeIds.length - 1) * cardGap;
    const startX = (CONFIG.GAME_WIDTH - totalWidth) / 2;
    const cardY = 180;

    this.cards = [];

    for (let i = 0; i < upgradeIds.length; i++) {
      const id = upgradeIds[i];
      const x = startX + i * (cardWidth + cardGap);
      const card = this._createCard(x, cardY, cardWidth, cardHeight, id, style);
      this.cards.push(card);
    }

    // Continue button
    const continueBtn = this.add.text(cx, 440, '[ CONTINUE ]', style('20px', CONFIG.COLORS.SILO_READY))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerover', () => continueBtn.setColor(CONFIG.COLORS.WHITE));
    continueBtn.on('pointerout', () => continueBtn.setColor(CONFIG.COLORS.SILO_READY));
    continueBtn.on('pointerdown', () => this._close());

    // Blinking continue
    this.tweens.add({
      targets: continueBtn,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _createCard(x, y, width, height, upgradeId, style) {
    const upgrade = CONFIG.UPGRADES[upgradeId];
    const level = gameManager.upgradeLevel[upgradeId] || 0;
    const cost = gameManager.getUpgradeCost(upgradeId);
    const maxed = gameManager.isUpgradeMaxed(upgradeId);
    const canAfford = gameManager.canAffordUpgrade(upgradeId);

    // Special case: silo repair only if silos destroyed
    const siloRepairUnavailable = upgradeId === 'silo_repair' && this.siloCount >= this.maxSilos;

    const dimmed = maxed || !canAfford || siloRepairUnavailable;

    const gfx = this.add.graphics();
    const borderColor = dimmed ? 0x444444 : CONFIG.TINT.PLANET_ATMOSPHERE;
    const bgAlpha = dimmed ? 0.15 : 0.25;

    gfx.fillStyle(0x1a1a2e, bgAlpha);
    gfx.fillRoundedRect(x, y, width, height, 8);
    gfx.lineStyle(1.5, borderColor, dimmed ? 0.3 : 0.8);
    gfx.strokeRoundedRect(x, y, width, height, 8);

    const cx = x + width / 2;
    const textColor = dimmed ? '#555555' : CONFIG.COLORS.UI_TEXT;

    // Icon
    this.add.text(cx, y + 25, upgrade.icon, style('24px', dimmed ? '#444444' : CONFIG.COLORS.PLANET_ATMOSPHERE)).setOrigin(0.5);

    // Name
    this.add.text(cx, y + 60, upgrade.name, {
      ...style('14px', textColor),
      align: 'center',
      wordWrap: { width: width - 10 },
    }).setOrigin(0.5);

    // Level
    if (upgradeId !== 'silo_repair') {
      const levelStr = maxed ? 'MAX' : `Level ${level}/${upgrade.maxLevel}`;
      this.add.text(cx, y + 85, levelStr, style('13px', dimmed ? '#444444' : CONFIG.COLORS.SILO_READY)).setOrigin(0.5);
    } else {
      const repairStr = siloRepairUnavailable ? 'ALL INTACT' : `${this.siloCount}/${this.maxSilos} SILOS`;
      this.add.text(cx, y + 85, repairStr, style('13px', dimmed ? '#444444' : CONFIG.COLORS.MIRV)).setOrigin(0.5);
    }

    // Effect description
    let effectStr = '';
    if (upgradeId === 'interceptor_speed') {
      effectStr = `Speed: ${gameManager.getEffectiveInterceptorSpeed()}`;
    } else if (upgradeId === 'blast_radius') {
      effectStr = `Radius: ${gameManager.getEffectiveBlastRadius()}`;
    } else if (upgradeId === 'reload_speed') {
      effectStr = `Reload: ${gameManager.getEffectiveReloadTime().toFixed(2)}s`;
    } else {
      effectStr = 'Restore 1 silo';
    }
    this.add.text(cx, y + 112, effectStr, style('12px', '#aaaaaa')).setOrigin(0.5);

    // Cost
    const costStr = maxed ? '---' : siloRepairUnavailable ? '---' : `${cost}`;
    this.add.text(cx, y + 145, costStr, style('16px', canAfford && !dimmed ? CONFIG.COLORS.SCORE_POPUP : '#666666')).setOrigin(0.5);

    // Make the entire card clickable via an invisible hit zone
    if (!dimmed) {
      const hitZone = this.add.zone(x + width / 2, y + height / 2, width, height)
        .setInteractive({ useHandCursor: true });

      // Hover highlight
      const hoverGfx = this.add.graphics();
      hoverGfx.setAlpha(0);

      hitZone.on('pointerover', () => {
        hoverGfx.clear();
        hoverGfx.fillStyle(CONFIG.TINT.PLANET_ATMOSPHERE, 0.08);
        hoverGfx.fillRoundedRect(x, y, width, height, 8);
        hoverGfx.lineStyle(2, CONFIG.TINT.PLANET_ATMOSPHERE, 1);
        hoverGfx.strokeRoundedRect(x, y, width, height, 8);
        hoverGfx.setAlpha(1);
      });

      hitZone.on('pointerout', () => {
        hoverGfx.setAlpha(0);
      });

      hitZone.on('pointerdown', () => {
        if (gameManager.purchaseUpgrade(upgradeId)) {
          if (upgradeId === 'silo_repair') {
            this.siloCount++;
            const gameScene = this.scene.get('GameScene');
            if (gameScene) gameScene.onSiloRepaired();
          }
          try { this.sound.play('upgrade', { volume: CONFIG.AUDIO.SFX.UPGRADE_VOLUME }); } catch { /* no sound */ }
          this.scene.restart({
            wave: this.waveNum,
            score: gameManager.score,
            siloCount: this.siloCount,
            maxSilos: this.maxSilos,
          });
        }
      });

      return { gfx, hitZone, hoverGfx };
    }

    return { gfx };
  }

  _close() {
    // Hide cursor again for gameplay
    document.body.classList.add('hide-cursor');

    // Notify GameScene to continue
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.emit(EVENTS.SHOP_CLOSED);
    }
    this.scene.stop();
  }
}
