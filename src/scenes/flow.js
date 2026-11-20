// Điều hướng giữa các scene + tạm dừng
import { setScene, setPaused, paused, uiSystem, keyWasPressed } from 'littlejsengine';
import { game, resetRun } from '../state.js';
import { CFG } from '../config.js';
import { transition, isTransitioning } from '../ui/hud.js';
import { openPanel, closePanel } from '../ui/panels.js';
import { muffle } from '../audio/sfx.js';
import { clearTimeFx } from '../fx/fx.js';
import { MenuScene } from './MenuScene.js';
import { IntroScene } from './IntroScene.js';
import { LevelScene } from './LevelScene.js';
import { EndingScene } from './EndingScene.js';

function go(makeScene)
{
    transition(() =>
    {
        closePanel();
        setPaused(false);
        clearTimeFx();
        muffle(false, .1);
        setScene(makeScene());
    });
}

export const goMenu = () => go(() => new MenuScene(true));
export const goIntro = () => { resetRun(); go(() => new IntroScene); };
export const goLevel = (level) => go(() => new LevelScene(level));
/** Cảnh cuối: Gióng bay về trời */
export const goEnding = () => go(() => new EndingScene);
export const startRun = () => { resetRun(); game.runStart = performance.now(); go(() => new LevelScene(1)); };

/** Chơi lại màn hiện tại: hồi đầy máu, Nộ Khí trở về giá trị lúc vào màn */
export function retryLevel()
{
    game.hp = CFG.playerHP;
    game.rage = game.rageAtLevelStart;
    go(() => new LevelScene(game.level));
}

/** Sang màn 2: hồi đầy máu, giữ Nộ Khí */
export function nextLevel()
{
    game.hp = CFG.playerHP;
    go(() => new LevelScene(2));
}

// ------------------------------------------------------------ tạm dừng
export function pauseGame()
{
    if (game.state !== 'PLAYING' || isTransitioning()) return;
    game.state = 'PAUSED';
    setPaused(true);
    muffle(true);
    openPanel({
        title: 'TẠM DỪNG',
        lines: ['A/D: Di chuyển · J: Roi Sắt · K: Tre Thần · L: Lướt'],
        buttons: [
            { text: 'Tiếp tục', onClick: resumeGame },
            { text: 'Chơi lại màn', onClick: retryLevel },
            { text: 'Về menu', onClick: goMenu },
        ],
    });
}

export function resumeGame()
{
    if (game.state !== 'PAUSED') return;
    closePanel();
    game.state = 'PLAYING';
    setPaused(false);
    muffle(false);
}

/** Gọi trong gameUpdatePost (chạy cả khi tạm dừng) */
export function handlePauseKey()
{
    if (!keyWasPressed('Escape')) return;
    if (game.state === 'PLAYING') pauseGame();
    else if (game.state === 'PAUSED') resumeGame();
}
