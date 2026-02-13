const STORAGE_KEY = 'planet_defense_leaderboard';
const MAX_ENTRIES = 10;

class Leaderboard {
  constructor() {
    this.entries = this._load();
  }

  addEntry(score, wave, accuracy) {
    const entry = {
      score,
      wave,
      accuracy: Math.round(accuracy * 100),
      date: new Date().toISOString().slice(0, 10),
    };
    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, MAX_ENTRIES);
    this._save();
    return this.entries.indexOf(entry); // rank (0-indexed), or -1 if not in top 10
  }

  getEntries() {
    return this.entries;
  }

  isHighScore(score) {
    if (this.entries.length < MAX_ENTRIES) return true;
    return score > this.entries[this.entries.length - 1].score;
  }

  _load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch { /* ignore */ }
  }
}

const leaderboard = new Leaderboard();
export default leaderboard;
