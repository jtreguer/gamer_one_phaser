import Phaser from 'phaser';
import { CONFIG, TEXT_RES } from '../config.js';
import gameManager from '../systems/GameManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const cy = CONFIG.GAME_HEIGHT / 2;
    const style = (size, color) => ({
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: size,
      color,
      resolution: TEXT_RES,
    });

    // Starfield background
    const gfx = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * CONFIG.GAME_WIDTH;
      const y = Math.random() * CONFIG.GAME_HEIGHT;
      const alpha = 0.3 + Math.random() * 0.7;
      gfx.fillStyle(0xffffff, alpha);
      gfx.fillCircle(x, y, Math.random() < 0.1 ? 1.5 : 0.8);
    }

    // Planet preview
    const planet = this.add.graphics();
    planet.fillStyle(CONFIG.TINT.PLANET_BODY, 1);
    planet.fillCircle(cx, cy - 30, 50);
    planet.lineStyle(2, CONFIG.TINT.PLANET_ATMOSPHERE, 0.4);
    planet.strokeCircle(cx, cy - 30, 55);

    // Title
    this.add.text(cx, 80, 'PLANET DEFENSE', style('32px', CONFIG.COLORS.PLANET_ATMOSPHERE)).setOrigin(0.5);
    this.add.text(cx, 115, 'ORBITAL COMMAND', style('14px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);

    // High score
    if (gameManager.highScore > 0) {
      this.add.text(cx, 430, `HIGH SCORE: ${gameManager.highScore}`, style('14px', CONFIG.COLORS.SCORE_POPUP)).setOrigin(0.5);
    }

    // Controls
    this.add.text(cx, 440, 'CLICK TO LAUNCH INTERCEPTORS', style('12px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);
    this.add.text(cx, 458, 'DEFEND YOUR PLANET FROM INCOMING MISSILES', style('12px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);
    this.add.text(cx, 476, 'P — PAUSE', style('12px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);

    // Difficulty selector
    const difficulties = [
      { key: 'pedestrian', label: 'Pedestrian' },
      { key: 'fort_alamo', label: 'Fort Alamo' },
      { key: 'atomic', label: 'Atomic!' },
    ];
    this.selectedDifficulty = 'fort_alamo';
    const diffButtons = [];

    const diffY = 510;
    this.add.text(cx, diffY - 20, 'DIFFICULTY', style('10px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);

    const spacing = 140;
    const startX = cx - spacing;

    difficulties.forEach((d, i) => {
      const bx = startX + i * spacing;
      const btn = this.add.text(bx, diffY, d.label, style('14px',
        d.key === this.selectedDifficulty ? CONFIG.COLORS.PLANET_ATMOSPHERE : CONFIG.COLORS.UI_TEXT
      )).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => { if (d.key !== this.selectedDifficulty) btn.setColor(CONFIG.COLORS.WHITE); });
      btn.on('pointerout', () => { btn.setColor(d.key === this.selectedDifficulty ? CONFIG.COLORS.PLANET_ATMOSPHERE : CONFIG.COLORS.UI_TEXT); });
      btn.on('pointerdown', () => {
        this.selectedDifficulty = d.key;
        diffButtons.forEach((b, j) => {
          b.setColor(difficulties[j].key === d.key ? CONFIG.COLORS.PLANET_ATMOSPHERE : CONFIG.COLORS.UI_TEXT);
        });
      });
      diffButtons.push(btn);
    });

    // Blinking start button
    this.prompt = this.add.text(cx, 555, '>>> CLICK TO START <<<', style('18px', CONFIG.COLORS.MIRV))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tweens.add({
      targets: this.prompt,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Start on click (also unlocks audio)
    this.prompt.on('pointerdown', () => {
      gameManager.reset();
      gameManager.setDifficulty(this.selectedDifficulty);
      gameManager.startGame();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }
}
