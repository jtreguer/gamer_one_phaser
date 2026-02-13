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
    this.add.text(cx, 460, 'CLICK TO LAUNCH INTERCEPTORS', style('12px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);
    this.add.text(cx, 480, 'DEFEND YOUR PLANET FROM INCOMING MISSILES', style('12px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);

    // Blinking prompt
    this.prompt = this.add.text(cx, 530, '>>> CLICK TO START <<<', style('18px', CONFIG.COLORS.MIRV)).setOrigin(0.5);
    this.tweens.add({
      targets: this.prompt,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Start on click (also unlocks audio)
    this.input.once('pointerdown', () => {
      gameManager.reset();
      gameManager.startGame();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }
}
