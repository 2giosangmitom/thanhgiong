// THÁNH GIÓNG: METAL RISING — khởi động LittleJS, plugin, tài nguyên và scene đầu tiên
import {
    engineInit, engineAddPlugin, setScene, getScene, vec2, rgb, mainCanvasSize, setCameraScale,
    setCanvasMinAspect, setCanvasMaxAspect, setTilesPixelated, setCanvasPixelated, setFontDefault, setShowSplashScreen,
    setDebugKey, setDebugWatermark, setGamepadsEnable, setTouchGamepadEnable, setSoundVolume, setCanvasClearColor,
    setCameraShakeDistance, setCameraShakeAngle, LightSystemPlugin, UISystemPlugin, setLoadingScreen, mainContext,
} from 'littlejsengine';
import * as LJS from 'littlejsengine';
import { VIEW_H, FONT, C } from './config.js';
import { assets, game, world } from './state.js';
import { bakeGiong } from './art/giong.js';
import { bakeSoldier } from './art/soldier.js';
import { bakeBoss } from './art/boss.js';
import { bakeBambooSprites, bakeDrumSun, bakeSoftDot, bakeInkSplat } from './art/props.js';
import { initAudio } from './audio/sfx.js';
import { prerenderMusic } from './audio/music.js';
import { initPost, fxFrame, setFxTiles } from './fx/fx.js';
import { styleUI } from './ui/panels.js';
import { drawHud, drawBanners, drawWipe } from './ui/hud.js';
import * as flow from './scenes/flow.js';
const { handlePauseKey } = flow;
import { MenuScene } from './scenes/MenuScene.js';

// ------------------------------------------------------------ cấu hình engine
setCanvasMinAspect(16 / 9);
setCanvasMaxAspect(16 / 9);
setTilesPixelated(false);
setCanvasPixelated(false);
setFontDefault(FONT);
setShowSplashScreen(false);
setDebugKey('Backquote');      // Esc dành cho tạm dừng
setDebugWatermark(false);
setGamepadsEnable(false);       // chỉ bàn phím
setTouchGamepadEnable(false);
setSoundVolume(.6);
setCanvasClearColor(rgb(.14, .1, .09));
setCameraShakeDistance(.6);
setCameraShakeAngle(.02);
setLoadingScreen(progress =>
{
    const ctx = mainContext, w = mainCanvasSize.x, h = mainCanvasSize.y;
    ctx.fillStyle = '#231B19'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#F1E1BE'; ctx.font = `bold ${h * .05}px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText('Đang mài roi sắt...', w / 2, h / 2);
    ctx.fillStyle = '#B94B3B'; ctx.fillRect(w * .3, h * .56, w * .4 * progress, h * .012);
});

const updateCamera = () => setCameraScale(mainCanvasSize.y / VIEW_H);

function gameInit()
{
    updateCamera();
    // thứ tự plugin: ánh sáng trước hậu kỳ
    new LightSystemPlugin(undefined, rgb(1, 1, 1));
    initPost();
    initAudio();
    new UISystemPlugin();
    styleUI();

    // bake toàn bộ đồ hoạ vẽ bằng Canvas2D
    assets.giong = bakeGiong();
    assets.soldier = bakeSoldier();
    assets.boss = bakeBoss();
    assets.bamboo = bakeBambooSprites();
    assets.drumSun = bakeDrumSun('#B94B3B');
    const soft = bakeSoftDot();
    setFxTiles(bakeInkSplat(), soft);

    // tiện cho kiểm thử trong console (chỉ bản dev)
    if (import.meta.env.DEV) window.__tg = { assets, game, world, LJS, flow };

    prerenderMusic(['menu']);
    setScene(new MenuScene());
    // render trước các bài còn lại khi menu đang chạy
    ['level1', 'level2', 'level2b', 'victory', 'defeat'].forEach((n, i) => setTimeout(() => prerenderMusic([n]), 600 + i * 350));

    // lớp phủ cuối cùng (trên cả UI): chuyển cảnh vệt mực
    engineAddPlugin(undefined, () => drawWipe());
}

function gameUpdate() {}

function gameUpdatePost()
{
    updateCamera();
    fxFrame();
    handlePauseKey();
}

function gameRender()
{
    updateCamera();
}

function gameRenderPost()
{
    getScene()?.drawUI?.();
    drawHud();
    drawBanners();
}

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
