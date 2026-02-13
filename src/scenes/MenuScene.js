import Phaser from 'phaser';
import { CONFIG, TEXT_RES } from '../config.js';
import gameManager from '../systems/GameManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const style = (size, color) => ({
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: size,
      color,
      resolution: TEXT_RES,
    });

    // Starfield background
    const bg = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * CONFIG.GAME_WIDTH;
      const y = Math.random() * CONFIG.GAME_HEIGHT;
      const alpha = 0.3 + Math.random() * 0.7;
      bg.fillStyle(0xffffff, alpha);
      bg.fillCircle(x, y, Math.random() < 0.1 ? 1.5 : 0.8);
    }

    // Title
    this.add.text(cx, 55, 'PLANET DEFENSE', style('32px', CONFIG.COLORS.PLANET_ATMOSPHERE)).setOrigin(0.5);
    this.add.text(cx, 90, 'ORBITAL COMMAND', style('14px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);

    // High score
    if (gameManager.highScore > 0) {
      this.add.text(cx, 128, `HIGH SCORE: ${gameManager.highScore}`, style('14px', CONFIG.COLORS.SCORE_POPUP)).setOrigin(0.5);
    }

    // Difficulty spheres — center of the screen
    this.selectedDifficulty = 'fort_alamo';
    const sphereRadius = 38;
    const sphereY = 280;
    const spacing = 190;
    const baseX = cx - spacing;

    const diffs = [
      { key: 'pedestrian', label: 'Pedestrian', color: 0x88cc88, colorLight: 0xb0eeb0, colorDark: 0x558855, colorStr: '#88cc88' },
      { key: 'fort_alamo', label: 'Fort Alamo', color: 0xe89030, colorLight: 0xffb860, colorDark: 0xa06020, colorStr: '#e89030' },
      { key: 'atomic', label: 'Atomic!', color: 0xcc2020, colorLight: 0xff4848, colorDark: 0x881010, colorStr: '#cc2020' },
    ];

    this.spheres = diffs.map((d, i) => {
      const sx = baseX + i * spacing;

      // Sphere graphics
      const gfx = this.add.graphics();
      this._drawSphere(gfx, 0, 0, sphereRadius, d);

      // Label below sphere
      const lbl = this.add.text(0, sphereRadius + 16, d.label, style('13px', d.colorStr)).setOrigin(0.5);

      // Interactive container
      const container = this.add.container(sx, sphereY, [gfx, lbl]);
      container.setInteractive(
        new Phaser.Geom.Circle(0, 0, sphereRadius + 8),
        Phaser.Geom.Circle.Contains
      );
      container.input.cursor = 'pointer';

      const entry = { ...d, container, gfx, lbl };

      // Selected sphere starts enlarged
      if (d.key === this.selectedDifficulty) {
        container.setScale(1.3);
      }

      container.on('pointerover', () => {
        if (d.key !== this.selectedDifficulty) {
          this.tweens.add({ targets: container, scale: 1.15, duration: 150, ease: 'Sine.easeOut' });
        }
      });

      container.on('pointerout', () => {
        if (d.key !== this.selectedDifficulty) {
          this.tweens.add({ targets: container, scale: 1.0, duration: 150, ease: 'Sine.easeOut' });
        }
      });

      container.on('pointerdown', () => this._selectDifficulty(entry));

      return entry;
    });

    // Controls (condensed)
    this.add.text(cx, 435, 'CLICK TO LAUNCH INTERCEPTORS', style('11px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);
    this.add.text(cx, 455, 'DEFEND YOUR PLANET  \u2022  P \u2014 PAUSE', style('11px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);

    // Blinking start button
    this.prompt = this.add.text(cx, 535, '>>> CLICK TO START <<<', style('18px', CONFIG.COLORS.MIRV))
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

  _drawSphere(gfx, x, y, r, d) {
    gfx.clear();
    // Outer glow
    gfx.fillStyle(d.color, 0.12);
    gfx.fillCircle(x, y, r + 12);
    // Main body
    gfx.fillStyle(d.color, 0.8);
    gfx.fillCircle(x, y, r);
    // Rim
    gfx.lineStyle(1.5, d.colorDark, 0.5);
    gfx.strokeCircle(x, y, r);
    // Specular highlight (upper-left)
    gfx.fillStyle(d.colorLight, 0.3);
    gfx.fillCircle(x - r * 0.22, y - r * 0.22, r * 0.45);
  }

  _selectDifficulty(selected) {
    if (selected.key === this.selectedDifficulty) return;
    const prevKey = this.selectedDifficulty;
    this.selectedDifficulty = selected.key;

    this.spheres.forEach((s) => {
      if (s.key === selected.key) {
        this.tweens.add({ targets: s.container, scale: 1.3, duration: 250, ease: 'Back.easeOut' });
      } else if (s.key === prevKey) {
        this.tweens.add({ targets: s.container, scale: 1.0, duration: 200, ease: 'Sine.easeOut' });
      }
    });
  }
}
