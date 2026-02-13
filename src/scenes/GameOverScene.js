import Phaser from 'phaser';
import { CONFIG, TEXT_RES } from '../config.js';
import gameManager from '../systems/GameManager.js';
import leaderboard from '../systems/Leaderboard.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    this.cx = CONFIG.GAME_WIDTH / 2;

    // Background
    this.add.graphics()
      .fillStyle(0x000000, 0.85)
      .fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

    // Title
    this.add.text(this.cx, 45, 'GAME OVER', this._style('32px', CONFIG.COLORS.ENEMY)).setOrigin(0.5);

    // Stats
    const stats = [
      `Final Score: ${gameManager.score}`,
      `Waves Survived: ${gameManager.currentWave}`,
      `Enemies Destroyed: ${gameManager.totalEnemiesDestroyed}`,
      `Accuracy: ${Math.round(gameManager.getOverallAccuracy() * 100)}%`,
    ];

    let y = 100;
    for (const stat of stats) {
      this.add.text(this.cx, y, stat, this._style('14px')).setOrigin(0.5);
      y += 24;
    }

    // Check for high score and branch
    this.qualifies = leaderboard.isHighScore(gameManager.score);

    if (this.qualifies) {
      this._showInitialsInput(y + 15);
    } else {
      this._addEntryAndShowBoard(null, y + 15);
    }
  }

  // --- Initials Input ---

  _showInitialsInput(startY) {
    this.inputActive = true;
    this.initials = [0, 0, 0]; // indices into CHARS
    this.cursorPos = 0;
    this.inputElements = [];

    // "NEW HIGH SCORE"
    const hsText = this.add.text(this.cx, startY, 'NEW HIGH SCORE!',
      this._style('18px', CONFIG.COLORS.SCORE_POPUP)).setOrigin(0.5);
    this.inputElements.push(hsText);

    // "ENTER YOUR INITIALS"
    const headerText = this.add.text(this.cx, startY + 35, 'ENTER YOUR INITIALS',
      this._style('14px', CONFIG.COLORS.PLANET_ATMOSPHERE)).setOrigin(0.5);
    this.inputElements.push(headerText);

    // Letter slots
    this.letterTexts = [];
    this.cursorGraphics = this.add.graphics().setDepth(10);
    this.inputElements.push(this.cursorGraphics);

    const letterY = startY + 75;
    const spacing = 50;
    const baseX = this.cx - spacing;

    for (let i = 0; i < 3; i++) {
      const lx = baseX + i * spacing;
      const letter = this.add.text(lx, letterY, CHARS[0],
        this._style('36px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5);
      this.letterTexts.push(letter);
      this.inputElements.push(letter);
    }

    // Up/down arrows hint per slot
    this.arrowTexts = [];
    for (let i = 0; i < 3; i++) {
      const lx = baseX + i * spacing;
      const upArrow = this.add.text(lx, letterY - 30, '\u25B2',
        this._style('12px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5).setAlpha(0.3);
      const downArrow = this.add.text(lx, letterY + 30, '\u25BC',
        this._style('12px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5).setAlpha(0.3);
      this.arrowTexts.push(upArrow, downArrow);
      this.inputElements.push(upArrow, downArrow);
    }

    // Instructions
    const instrText = this.add.text(this.cx, letterY + 55,
      'TYPE  or  \u2191\u2193 CHANGE  \u2190\u2192 MOVE',
      this._style('11px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5).setAlpha(0.5);
    this.inputElements.push(instrText);

    // Confirm button
    this.confirmY = letterY + 85;
    this.confirmText = this.add.text(this.cx, this.confirmY, '>>> CONFIRM <<<',
      this._style('16px', CONFIG.COLORS.MIRV)).setOrigin(0.5);
    this.inputElements.push(this.confirmText);

    this.tweens.add({
      targets: this.confirmText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Store startY for leaderboard placement after confirm
    this.boardStartY = startY;

    this._updateInitialsDisplay();

    // Keyboard input
    this.input.keyboard.on('keydown', this._onKeyDown, this);

    // Click on confirm
    this.confirmText.setInteractive({ useHandCursor: true });
    this.confirmText.on('pointerdown', () => this._onInitialsConfirmed());

    // Click on arrows to cycle
    for (let i = 0; i < 3; i++) {
      const upArrow = this.arrowTexts[i * 2];
      const downArrow = this.arrowTexts[i * 2 + 1];
      upArrow.setInteractive({ useHandCursor: true });
      downArrow.setInteractive({ useHandCursor: true });
      const slotIndex = i;
      upArrow.on('pointerdown', () => {
        if (!this.inputActive) return;
        this.cursorPos = slotIndex;
        this._cycleChar(1);
      });
      downArrow.on('pointerdown', () => {
        if (!this.inputActive) return;
        this.cursorPos = slotIndex;
        this._cycleChar(-1);
      });
    }
  }

  _onKeyDown(event) {
    if (!this.inputActive) return;

    const key = event.key;

    // Direct letter/number input
    if (key.length === 1) {
      const upper = key.toUpperCase();
      const idx = CHARS.indexOf(upper);
      if (idx >= 0) {
        this.initials[this.cursorPos] = idx;
        if (this.cursorPos < 2) this.cursorPos++;
        this._updateInitialsDisplay();
        return;
      }
    }

    switch (event.keyCode) {
      case Phaser.Input.Keyboard.KeyCodes.UP:
        this._cycleChar(1);
        break;
      case Phaser.Input.Keyboard.KeyCodes.DOWN:
        this._cycleChar(-1);
        break;
      case Phaser.Input.Keyboard.KeyCodes.LEFT:
        if (this.cursorPos > 0) this.cursorPos--;
        this._updateInitialsDisplay();
        break;
      case Phaser.Input.Keyboard.KeyCodes.RIGHT:
        if (this.cursorPos < 2) this.cursorPos++;
        this._updateInitialsDisplay();
        break;
      case Phaser.Input.Keyboard.KeyCodes.ENTER:
        this._onInitialsConfirmed();
        break;
      case Phaser.Input.Keyboard.KeyCodes.BACKSPACE:
        if (this.cursorPos > 0) this.cursorPos--;
        this._updateInitialsDisplay();
        break;
    }
  }

  _cycleChar(direction) {
    this.initials[this.cursorPos] = (this.initials[this.cursorPos] + direction + CHARS.length) % CHARS.length;
    this._updateInitialsDisplay();
  }

  _updateInitialsDisplay() {
    const g = this.cursorGraphics;
    g.clear();

    for (let i = 0; i < 3; i++) {
      const letter = this.letterTexts[i];
      const char = CHARS[this.initials[i]];
      letter.setText(char === ' ' ? '_' : char);

      if (i === this.cursorPos) {
        letter.setColor(CONFIG.COLORS.SCORE_POPUP);
        // Draw underline cursor
        g.lineStyle(2, CONFIG.TINT.SCORE_POPUP, 1);
        g.beginPath();
        g.moveTo(letter.x - 12, letter.y + 20);
        g.lineTo(letter.x + 12, letter.y + 20);
        g.strokePath();
        // Highlight arrows for this slot
        this.arrowTexts[i * 2].setAlpha(0.8);
        this.arrowTexts[i * 2 + 1].setAlpha(0.8);
      } else {
        letter.setColor(CONFIG.COLORS.UI_TEXT);
        this.arrowTexts[i * 2].setAlpha(0.3);
        this.arrowTexts[i * 2 + 1].setAlpha(0.3);
      }
    }
  }

  _onInitialsConfirmed() {
    if (!this.inputActive) return;
    this.inputActive = false;

    // Remove keyboard listener
    this.input.keyboard.off('keydown', this._onKeyDown, this);

    // Build name string (trim trailing spaces)
    const name = this.initials.map(i => CHARS[i]).join('').trimEnd() || '---';

    // Remove all input elements
    for (const el of this.inputElements) {
      el.destroy();
    }
    this.inputElements = [];
    this.letterTexts = [];
    this.arrowTexts = [];

    this._addEntryAndShowBoard(name, this.boardStartY);
  }

  // --- Leaderboard Display ---

  _addEntryAndShowBoard(name, startY) {
    const rank = leaderboard.addEntry(
      name,
      gameManager.score,
      gameManager.currentWave,
      gameManager.getOverallAccuracy()
    );

    if (!this.qualifies) {
      // Not a high score — just show a small note
      startY += 10;
    }

    // Leaderboard header
    this.add.text(this.cx, startY, '--- LEADERBOARD ---',
      this._style('14px', CONFIG.COLORS.PLANET_ATMOSPHERE)).setOrigin(0.5);
    let y = startY + 25;

    // Column header
    this.add.text(this.cx, y, '     NAME  SCORE    WAVE  ACC',
      this._style('11px', CONFIG.COLORS.UI_TEXT)).setOrigin(0.5).setAlpha(0.5);
    y += 20;

    const entries = leaderboard.getEntries();
    const showCount = Math.min(entries.length, 10);

    for (let i = 0; i < showCount; i++) {
      const e = entries[i];
      const isCurrentRun = i === rank;
      const marker = isCurrentRun ? '>' : ' ';
      const color = isCurrentRun ? CONFIG.COLORS.SCORE_POPUP : CONFIG.COLORS.UI_TEXT;
      const nameStr = (e.name || '---').padEnd(3);
      const scoreStr = String(e.score).padStart(7);
      const waveStr = ('W' + e.wave).padStart(4);
      const accStr = (e.accuracy + '%').padStart(5);
      const line = `${marker}${String(i + 1).padStart(2)}. ${nameStr} ${scoreStr}  ${waveStr} ${accStr}`;
      this.add.text(this.cx, y, line, this._style('12px', color)).setOrigin(0.5);
      y += 18;
    }

    // Restart prompt
    y = Math.max(y + 25, 520);
    const prompt = this.add.text(this.cx, y, '>>> CLICK TO PLAY AGAIN <<<',
      this._style('18px', CONFIG.COLORS.MIRV)).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Restart on click (delayed slightly to avoid accidental trigger)
    this.time.delayedCall(300, () => {
      this.input.once('pointerdown', () => {
        gameManager.reset();
        gameManager.startGame();
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      });
    });
  }

  // --- Helpers ---

  _style(size, color) {
    return {
      fontFamily: CONFIG.FONT_FAMILY,
      fontSize: size,
      color: color || CONFIG.COLORS.UI_TEXT,
      resolution: TEXT_RES,
    };
  }
}
