// GameManager: trạng thái chung của trò chơi
import { CFG } from './config.js';

export const game = {
    level: 1,
    hp: CFG.playerHP,
    rage: 0,
    rageAtLevelStart: 0,
    kills: 0,
    spawned: 0,
    bossHP: CFG.bossHP,
    // MENU | INTRO | PLAYING | PAUSED | GAME_OVER | LEVEL_CLEAR | VICTORY | CUTSCENE
    state: 'MENU',
    runStart: 0,
    totalKills: 0,
};

/** Các thực thể đang sống trong màn */
export const world = {
    player: undefined,
    enemies: [],
    boss: undefined,
    scene: undefined,
};

/** Tài nguyên đã bake */
export const assets = {};

export function resetRun()
{
    game.level = 1;
    game.hp = CFG.playerHP;
    game.rage = 0;
    game.rageAtLevelStart = 0;
    game.totalKills = 0;
}

export const isPlaying = () => game.state === 'PLAYING';
