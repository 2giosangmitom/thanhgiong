// Menu chính: nền giấy dó + núi mực nhiều lớp parallax (camera lia chậm), hoa văn trống đồng xoay
import {
    vec2, rgb, time, timeReal, FollowCamera, EngineObject, drawTile, lightSystem, uiSystem, UIObject, keyWasPressed, cameraPos,
    tweenProperty, Ease, Color, setAdditiveBlendMode, audioIsRunning,
} from 'littlejsengine';
import { CAM_Y, C, PAL } from '../config.js';
import { game, assets, world } from '../state.js';
import { buildMenuLayers } from '../art/backgrounds.js';
import { frameTile, drawSprite } from '../art/sheet.js';
import { playMusic } from '../audio/music.js';
import { play } from '../audio/sfx.js';
import { fxLeaves, drawShadow } from '../fx/fx.js';
import { withUI, text, brushBand } from '../ui/draw2d.js';
import { drawSeal } from '../art/props.js';
import { openPanel, closePanel, makeButton } from '../ui/panels.js';
import { goIntro } from './flow.js';

/** Vật thể vẽ cố định theo màn hình (bám camera) */
class ScreenProp extends EngineObject
{
    constructor(offset, order, draw)
    {
        super(vec2(), vec2(1));
        this.offset = offset; this.renderOrder = order; this.drawFn = draw;
    }
    render() { this.drawFn(cameraPos.add(this.offset)); }
}

export class MenuScene
{
    constructor(skipPress = false) { this.skipPress = skipPress; }

    enter()
    {
        game.state = 'MENU';
        world.scene = this;
        uiSystem.destroyObjects();
        lightSystem.ambientColor = rgb(1, 1, 1);
        this.layers = buildMenuLayers(CAM_Y);
        this.target = vec2(0, CAM_Y);
        this.camera = new FollowCamera(this.target, .6);
        this.ready = false;
        this.logoK = 0;
        tweenProperty(this, 'logoK', 0, 1, 1.1, { ease: Ease.OUT(Ease.ELASTIC), useRealTime: true });

        // hoa văn trống đồng xoay chậm sau logo
        new ScreenProp(vec2(0, 4.2), -975, p =>
        {
            drawTile(p, vec2(15), assets.drumSun, rgb(.72, .29, .23, .2), time * .05);
            drawTile(p, vec2(8.5), assets.drumSun, rgb(.2, .15, .14, .12), -time * .08);
        });
        // Gióng (trái) và bóng tướng giặc (phải): đứng trên mặt đất của lớp gần (y ≈ -0.5)
        const feetY = -.5 - CAM_Y;
        new ScreenProp(vec2(-10.5, feetY), -950, p =>
        {
            const sh = assets.giong, k = (time * 4 | 0) % 2;
            drawShadow(p, 3.4, .45);
            drawSprite(sh, frameTile(sh, 'cheer', k), p, false, new Color(1, 1, 1, 1), undefined, 1.55);
        });
        new ScreenProp(vec2(11, feetY), -955, p =>
        {
            const sh = assets.boss;
            drawShadow(p, 4.8, .4);
            drawSprite(sh, frameTile(sh, 'idle', (time * 4 | 0) % 4), p, true, new Color(.32, .27, .28, 1), undefined, 1.05);
        });
        fxLeaves(vec2(0, 14), vec2(40, 2), 2.5);

        // nhạc menu phát ngay khi mở trang (trình duyệt chỉ cho phát tiếng sau thao tác đầu tiên)
        playMusic('menu', .7, 1.5);
        this.showButtons();
    }

    showButtons()
    {
        if (this.ready) return;
        this.ready = true;
        audioIsRunning() && play('gong');
        const root = this.root = new UIObject(vec2(0, 72), vec2(10));
        root.color = rgb(0, 0, 0, 0); root.lineWidth = 0; root.shadowColor = undefined;
        makeButton(root, vec2(0, 0), vec2(270, 46), 'Bắt đầu', () => goIntro(), 1, true);
        makeButton(root, vec2(0, 56), vec2(270, 46), 'Hướng dẫn', () => this.showGuide(), 2);
        makeButton(root, vec2(0, 112), vec2(270, 46), 'Thoát', () => this.quit(), 3);
        uiSystem.navigationMode = true;
        tweenProperty(root, 'localPos', vec2(0, 420), vec2(0, 72), .6, { ease: Ease.OUT(Ease.BACK), useRealTime: true });
    }

    showGuide()
    {
        this.root.visible = false;
        openPanel({
            title: 'HƯỚNG DẪN', width: 600,
            lines: [
                'A / ←  ·  D / →   Di chuyển',
                'J   Roi Sắt — trúng địch +20 Nộ Khí',
                'K   Tre Thần (cần 100 Nộ Khí) — 3 sát thương quanh Gióng',
                'L   Lướt nhanh — né được mọi đòn trong lúc lướt',
                'Esc   Tạm dừng / tiếp tục',
                'Mẹo: lướt qua vùng đỏ khi tướng giặc gồng đao;',
                'Tre Thần có thể NGẮT đòn đang gồng!',
            ],
            buttons: [{ text: 'Quay lại', onClick: () => { this.root.visible = true; uiSystem.navigationMode = true; } }],
        });
    }

    quit()
    {
        this.root.visible = false;
        openPanel({
            title: 'THOÁT TRÒ CHƠI?', lines: ['Quê hương vẫn cần Gióng đấy!'],
            buttons: [
                { text: 'Ở lại chiến đấu', onClick: () => { this.root.visible = true; uiSystem.navigationMode = true; } },
                { text: 'Thoát', onClick: () => { window.close(); this.bye = timeReal; this.root.visible = true; } },
            ],
        });
    }

    update()
    {
        // camera lia chậm qua lại để lộ chiều sâu parallax
        this.target.x = Math.sin(time * .12) * 9;
        this.camera.target = this.target;
    }

    drawUI()
    {
        withUI((ctx, W) =>
        {
            const k = this.logoK, t = timeReal;
            ctx.save();
            ctx.translate(W / 2, 128); ctx.scale(.6 + .4 * k, .6 + .4 * k);
            brushBand(ctx, -330, -66, 660, 104, 'rgba(53,44,42,.9)', 77);
            text(ctx, 'THÁNH GIÓNG', 0, -16, 74, '#F3D9A4', { line: 9 });
            brushBand(ctx, -170, 40, 340, 42, 'rgba(185,75,59,.95)', 78);
            text(ctx, 'METAL RISING', 0, 62, 30, PAL.giay, { line: 5 });
            drawSeal(ctx, 300, 34, 26, 'GIÓNG');
            ctx.restore();
            if (!audioIsRunning())
                text(ctx, '♪ Nhấn phím bất kỳ để bật nhạc', W - 24, 36, 15, PAL.son, { align: 'right', line: 0, alpha: .6 + .4 * Math.sin(t * 4), shadow: false });
            text(ctx, '↑↓ chọn · Enter xác nhận', W / 2, 520, 14, PAL.muc, { line: 0, alpha: .7, shadow: false, weight: 'normal' });
            text(ctx, '“Cầm roi sắt, gọi tre thần, bảo vệ Phù Đổng!”', W / 2, 238, 17, PAL.muc, { line: 0, shadow: false, weight: 'italic', alpha: k });
            if (this.bye) text(ctx, 'Cảm ơn bạn đã chơi! (Hãy đóng thẻ trình duyệt)', W / 2, 330, 20, PAL.son, { line: 0, shadow: false });
        });
    }

    leave() { uiSystem.destroyObjects(); closePanel(); }
}
