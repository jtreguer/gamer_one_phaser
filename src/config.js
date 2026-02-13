// Text resolution multiplier for crisp rendering on HiDPI displays
export const TEXT_RES = Math.min(window.devicePixelRatio || 1, 3);

export const CONFIG = {
  // Display
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,

  // Colors (hex strings for Phaser text)
  COLORS: {
    SPACE_BG: '#0a0a14',
    PLANET_BODY: '#1a4a5a',
    PLANET_ATMOSPHERE: '#3af0e8',
    SILO_READY: '#40ff40',
    SILO_RELOADING: '#2a6630',
    SILO_DESTROYED: '#4a1a0a',
    INTERCEPTOR: '#40d0ff',
    INTERCEPTOR_TRAIL: '#40d0ff',
    BLAST_CORE: '#ffffff',
    BLAST_EDGE: '#40d0ff',
    ENEMY: '#ff4040',
    ENEMY_TRAIL: '#ff4040',
    ENEMY_TRAIL_FADE: '#601010',
    MIRV: '#ffaa20',
    MIRV_WARHEAD: '#ff6020',
    CROSSHAIR: '#ffffff',
    CROSSHAIR_REJECT: '#ff4040',
    UI_TEXT: '#e0e0e0',
    SCORE_POPUP: '#ffd040',
    WARNING_VIGNETTE: '#600000',
    WHITE: '#ffffff',
  },

  // Colors as numeric (for Graphics)
  TINT: {
    SPACE_BG: 0x0a0a14,
    PLANET_BODY: 0x1a4a5a,
    PLANET_BODY_LIGHT: 0x2a6a7a,
    PLANET_ATMOSPHERE: 0x3af0e8,
    SILO_READY: 0x40ff40,
    SILO_RELOADING: 0x2a6630,
    SILO_DESTROYED: 0x4a1a0a,
    INTERCEPTOR: 0x40d0ff,
    BLAST_CORE: 0xffffff,
    BLAST_EDGE: 0x40d0ff,
    ENEMY: 0xff4040,
    ENEMY_TRAIL_FADE: 0x601010,
    MIRV: 0xffaa20,
    MIRV_WARHEAD: 0xff6020,
    CROSSHAIR: 0xffffff,
    CROSSHAIR_REJECT: 0xff4040,
    SCORE_POPUP: 0xffd040,
    WARNING_VIGNETTE: 0x600000,
  },

  // Font
  FONT_FAMILY: 'Courier New, Courier, monospace',

  // Planet & World
  PLANET_RADIUS: 80,
  INITIAL_SILO_COUNT: 6,
  ROTATION_SPEED: 0.15,         // radians/sec
  SILO_HIT_TOLERANCE: 15,       // pixels along circumference
  SILO_TARGET_RATIO: 0.6,       // fraction targeting silos

  // Interceptor Missiles
  INTERCEPTOR_SPEED: 400,        // px/s base
  BLAST_RADIUS: 40,              // px base
  BLAST_EXPAND_TIME: 0.3,        // seconds
  BLAST_HOLD_TIME: 0.2,          // seconds
  BLAST_FADE_TIME: 0.2,          // seconds
  SILO_RELOAD_TIME: 1.5,         // seconds base

  // Enemy Missiles
  ENEMY_SPEED_MIN_BASE: 40,
  ENEMY_SPEED_MAX_BASE: 100,
  ENEMY_SPEED_ESCALATION: 6,
  ENEMY_SPEED_MAX_ESCALATION: 14,
  ENEMY_SPEED_CAP: 300,
  INITIAL_ENEMY_COUNT: 6,
  ENEMY_COUNT_ESCALATION: 2,
  ENEMY_COUNT_CAP: 60,
  SPAWN_MARGIN: 20,
  TRAIL_LIFETIME: 1.5,            // seconds (fade after detonation/death)

  // Trail rendering
  TRAIL_MAX_POINTS: 200,
  TRAIL_WIDTH: 2,
  ENEMY_TRAIL_WIDTH: 2.5,

  // MIRV
  MIRV_START_WAVE: 5,
  MIRV_BASE_CHANCE: 0.15,
  MIRV_CHANCE_PER_WAVE: 0.03,
  MIRV_CHANCE_CAP: 0.55,
  MIRV_SPLIT_DIST_MIN: 150,
  MIRV_SPLIT_DIST_MAX: 250,
  MIRV_MIN_WARHEADS: 2,
  MIRV_MAX_WARHEADS: 4,
  MIRV_WARHEAD_SPREAD: 0.52,    // ~30 degrees in radians

  // Scoring
  POINTS_ENEMY_KILL: 100,
  POINTS_MIRV_PRESPLIT: 250,
  POINTS_WARHEAD_KILL: 75,
  MULTI_KILL_BONUS: 150,           // bonus per kill when 2+ destroyed by one blast
  WAVE_CLEAR_BONUS: 500,
  SILO_SURVIVAL_BONUS: 200,
  ACCURACY_BONUS_THRESHOLD: 0.8,
  ACCURACY_BONUS: 300,
  SILO_REPAIR_COST_MULT: 5000,

  // Wave Timing
  WAVE_START_DELAY: 1.5,         // seconds
  BURST_INTERVAL: 2.0,           // seconds
  SPAWN_INTERVAL: 0.3,           // seconds

  // Upgrades
  UPGRADES: {
    interceptor_speed: {
      name: 'Interceptor Speed',
      icon: '>>=',
      maxLevel: 5,
      costs: [1000, 2000, 4000, 8000, 16000],
      perLevel: 60,              // +60 px/s per level
    },
    blast_radius: {
      name: 'Blast Radius',
      icon: '(O)',
      maxLevel: 5,
      costs: [1500, 3000, 6000, 12000, 24000],
      perLevel: 6,               // +6 px per level
    },
    reload_speed: {
      name: 'Reload Speed',
      icon: '<<<',
      maxLevel: 5,
      costs: [1200, 2400, 4800, 9600, 19200],
      perLevel: -0.18,           // -0.18s per level
    },
    silo_repair: {
      name: 'Silo Repair',
      icon: '[+]',
      maxLevel: 99,
      costs: null,               // dynamic: 5000 * wave_number
      perLevel: 1,               // restores 1 silo
    },
  },

  // Visual
  STAR_COUNT: 80,
  SILO_SIZE: 8,                  // triangle size for silo markers
  CROSSHAIR_SIZE: 12,
  CROSSHAIR_GAP: 4,

  // Background stars
  STAR_TWINKLE_MIN: 0.3,
  STAR_TWINKLE_MAX: 1.0,

  // Audio
  AUDIO: {
    MASTER_VOLUME: 0.3,
    AMBIENT: {
      DRONE_FREQUENCY: 45,
      DRONE_VOLUME: 0.06,
      DRONE_FILTER_FREQ: 180,
      DRONE_FILTER_Q: 2,
      DRONE_LFO_RATE: 0.1,
      DRONE_LFO_DEPTH: 80,
      BLEEP_INTERVAL_MIN: 800,
      BLEEP_INTERVAL_MAX: 3000,
      BLEEP_VOLUME: 0.06,
      BLOOP_VOLUME: 0.04,
    },
    SFX: {
      LAUNCH_VOLUME: 0.20,
      DETONATION_VOLUME: 0.25,
      ENEMY_DESTROY_VOLUME: 0.15,
      SILO_DESTROYED_VOLUME: 0.30,
      MIRV_SPLIT_VOLUME: 0.20,
      WAVE_CLEAR_VOLUME: 0.15,
      GAME_OVER_VOLUME: 0.20,
      REJECT_VOLUME: 0.12,
      RELOAD_VOLUME: 0.08,
      IMPACT_VOLUME: 0.15,
      UPGRADE_VOLUME: 0.15,
      MULTI_KILL_VOLUME: 0.20,
    },
  },
};
