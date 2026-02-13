export const GAME_STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  WAVE_TRANSITION: 'WAVE_TRANSITION',
  UPGRADE_SHOP: 'UPGRADE_SHOP',
  GAME_OVER: 'GAME_OVER',
};

export const SILO_STATE = {
  READY: 'READY',
  RELOADING: 'RELOADING',
  DESTROYED: 'DESTROYED',
};

export const BLAST_PHASE = {
  EXPANDING: 'EXPANDING',
  HOLDING: 'HOLDING',
  FADING: 'FADING',
};

export const EVENTS = {
  INTERCEPTOR_LAUNCH: 'interceptor_launch',
  INTERCEPTOR_DETONATED: 'interceptor_detonated',
  ENEMY_DESTROYED: 'enemy_destroyed',
  ENEMY_IMPACTED: 'enemy_impacted',
  MIRV_SPLIT: 'mirv_split',
  SILO_DESTROYED: 'silo_destroyed',
  SILO_RELOADED: 'silo_reloaded',
  ALL_SILOS_DESTROYED: 'all_silos_destroyed',
  WAVE_STARTED: 'wave_started',
  WAVE_COMPLETE: 'wave_complete',
  WAVE_ENEMIES_SPAWNED: 'wave_enemies_spawned',
  SCORE_CHANGED: 'score_changed',
  GAME_OVER: 'game_over',
  CLICK_REJECTED: 'click_rejected',
  MULTI_KILL: 'multi_kill',
  SHOP_CLOSED: 'shop_closed',
};
