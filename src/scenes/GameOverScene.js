import Phaser from 'phaser';
import { CONFIG, TEXT_RES } from '../config.js';
import gameManager from '../systems/GameManager.js';
import leaderboard from '../systems/Leaderboard.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const style = (size, color) => ({
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: size,
      color: color || CONFIG.COLORS.UI_TEXT,
      resolution: TEXT_RES,
    });

    // Background
    this.add.graphics().fillStyle(0x000000, 0.85).fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

    // Title
    this.add.text(cx, 50, 'GAME OVER', style('32px', CONFIG.COLORS.ENEMY)).setOrigin(0.5);

    // Stats
    const stats = [
      `Final Score: ${gameManager.score}`,
      `Waves Survived: ${gameManager.currentWave}`,
      `Enemies Destroyed: ${gameManager.totalEnemiesDestroyed}`,
      `Overall Accuracy: ${Math.round(gameManager.getOverallAccuracy() * 100)}%`,
      `Total Shots Fired: ${gameManager.shotsFired}`,
    ];

    let y = 120;
    for (const stat of stats) {
      this.add.text(cx, y, stat, style('14px')).setOrigin(0.5);
      y += 26;
    }

    // Add to leaderboard
    const rank = leaderboard.addEntry(
      gameManager.score,
      gameManager.currentWave,
      gameManager.getOverallAccuracy()
    );

    if (rank >= 0 && rank < 3) {
      this.add.text(cx, y + 10, 'NEW HIGH SCORE!', style('18px', CONFIG.COLORS.SCORE_POPUP)).setOrigin(0.5);
      y += 40;
    } else {
      y += 20;
    }

    // Leaderboard
    this.add.text(cx, y, '--- LEADERBOARD ---', style('14px', CONFIG.COLORS.PLANET_ATMOSPHERE)).setOrigin(0.5);
    y += 25;

    const entries = leaderboard.getEntries();
    for (let i = 0; i < Math.min(entries.length, 5); i++) {
      const e = entries[i];
      const marker = i === rank ? '>' : ' ';
      const color = i === rank ? CONFIG.COLORS.SCORE_POPUP : CONFIG.COLORS.UI_TEXT;
      this.add.text(cx, y, `${marker} ${i + 1}. ${e.score}  W${e.wave}  ${e.accuracy}%  ${e.date}`, style('12px', color)).setOrigin(0.5);
      y += 20;
    }

    // Restart prompt
    y = Math.max(y + 30, 480);
    const prompt = this.add.text(cx, y, '>>> CLICK TO PLAY AGAIN <<<', style('18px', CONFIG.COLORS.MIRV)).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Restart on click
    this.input.once('pointerdown', () => {
      gameManager.reset();
      gameManager.startGame();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }
}
