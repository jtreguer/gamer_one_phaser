import Phaser from 'phaser';
import { CONFIG, TEXT_RES } from '../config.js';

const SOUNDS = [
  'launch', 'detonation', 'enemy_destroy', 'silo_destroyed',
  'mirv_split', 'wave_clear', 'game_over', 'reject',
  'reload', 'impact', 'upgrade', 'multi_kill',
];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    for (const name of SOUNDS) {
      this.load.audio(name, `assets/audio/${name}.wav`);
    }
  }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const cy = CONFIG.GAME_HEIGHT / 2;

    this.add.text(cx, cy - 40, 'INITIALIZING DEFENSE GRID...', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '18px',
      color: CONFIG.COLORS.PLANET_ATMOSPHERE,
      resolution: TEXT_RES,
    }).setOrigin(0.5);

    const barWidth = 30;
    this.barText = this.add.text(cx, cy + 10, '[' + '\u00B7'.repeat(barWidth) + ']', {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: '16px',
      color: CONFIG.COLORS.SILO_READY,
      resolution: TEXT_RES,
    }).setOrigin(0.5);

    let progress = 0;
    this.time.addEvent({
      delay: 35,
      repeat: barWidth - 1,
      callback: () => {
        progress++;
        const filled = '>'.repeat(progress);
        const empty = '\u00B7'.repeat(barWidth - progress);
        this.barText.setText('[' + filled + empty + ']');

        if (progress >= barWidth) {
          this.time.delayedCall(200, () => {
            this.scene.start('MenuScene');
          });
        }
      },
    });
  }
}
