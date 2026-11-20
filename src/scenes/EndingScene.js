// Cảnh cuối: Gióng lên đỉnh Sóc Sơn, cởi giáp sắt, để lại roi sắt rồi bay về trời
import {
    EngineObject, vec2, rgb, time, timeReal, Timer, FollowCamera, Light, lightSystem, uiSystem, keyWasPressed, tweenProperty, Ease,
    drawTile, setAdditiveBlendMode, Color, clamp, rand,
} from 'littlejsengine';
import { CAM_Y, PAL, C } from '../config.js';
import { game, world, assets } from '../state.js';
import { buildEndingLayers } from '../art/backgrounds.js';
import { makeAnimator, drawSprite } from '../art/sheet.js';
import { playMusic } from '../audio/music.js';
import { play } from '../audio/sfx.js';
import { fxSparkle, fxDust, whiteFlash, shake, drawShadow, getSoftTile, setDesat } from '../fx/fx.js';
import { withUI, text, brushBand } from '../ui/draw2d.js';
import { showBanner, clearBanners } from '../ui/hud.js';
import { openPanel } from '../ui/panels.js';
import { startRun, goMenu } from './flow.js';

const LINES = [
    'Giặc tan, Gióng một mình lên đỉnh núi Sóc Sơn.',
    'Gióng cởi áo giáp sắt, để lại roi sắt cho quê hương...',
    '...rồi bay thẳng về trời.',
    'Nhân dân nhớ ơn, tôn Gióng là Phù Đổng Thiên Vương.',
];

/** Gióng trong cảnh cuối (không điều khiển) */
class Hero extends EngineObject
{
    constructor(x)
    {
        super(vec2(x, 0), vec2(1));
        this.sheet = assets.giong;
        this.anim = makeAnimator(this.sheet, ['walk', 'idle', 'free', 'fly']);
        this.clip = 'walk';
        this.alpha = 1;
        this.glow = 0;
        this.renderOrder = 10;
        this.emissive = .4;
    }
    render()
    {
        const soft = getSoftTile(), h = this.pos.y;
        if (!lightSystem?.emissivePass)
        {
            drawShadow(vec2(this.pos.x, 0), 2.2 * clamp(1 - h / 5), .35);
            if (this.glow > 0 && soft)
            {
                setAdditiveBlendMode(true);
                drawTile(this.pos.add(vec2(0, 1.9)), vec2(6 + Math.sin(time * 6) * .5), soft, rgb(1, .85, .45, .55 * this.glow));
                setAdditiveBlendMode(false);
            }
        }
        this.anim.set(this.clip);
        drawSprite(this.sheet, this.anim.tileInfo, this.pos, false, new Color(1, 1, 1, this.alpha), this.glow ? rgb(.25 * this.glow, .2 * this.glow, .05 * this.glow, 0) : undefined);
    }
}

/** Ngôi sao mới trên bầu trời nơi Gióng biến mất */
class Star extends EngineObject
{
    constructor(pos) { super(pos, vec2(1)); this.k = 0; this.renderOrder = 50; }
    render()
    {
        const soft = getSoftTile();
        if (!soft || lightSystem?.emissivePass) return;
        const k = this.k, tw = 1 + Math.sin(time * 5) * .15;
        setAdditiveBlendMode(true);
        drawTile(this.pos, vec2(5 * k * tw), soft, rgb(1, .9, .6, .8));
        drawTile(this.pos, vec2(.6, 4).scale(k * tw), soft, rgb(1, 1, .9, 1));
        drawTile(this.pos, vec2(4, .6).scale(k * tw), soft, rgb(1, 1, .9, 1));
        setAdditiveBlendMode(false);
    }
}

/** Cột sáng từ trời rọi xuống */
class Beam extends EngineObject
{
    constructor(x)
    {
        super(vec2(x, 20), vec2(1));
        this.k = 0;
        this.renderOrder = -100;
    }
    render()
    {
        const soft = getSoftTile();
        if (!soft || this.k <= 0 || lightSystem?.emissivePass) return;
        setAdditiveBlendMode(true);
        const w = 3.2 + Math.sin(time * 3) * .3;
        drawTile(this.pos, vec2(w * 2.2, 70), soft, rgb(1, .85, .5, .35 * this.k));
        drawTile(this.pos, vec2(w, 70), soft, rgb(1, .95, .8, .6 * this.k));
        setAdditiveBlendMode(false);
    }
}

/** Áo giáp + roi sắt để lại trên đỉnh núi */
class Relics extends EngineObject
{
    constructor(x)
    {
        super(vec2(x, 2), vec2(1));
        this.renderOrder = 9;
        this.vy = 0;
        this.shine = 0;
    }
    update()
    {
        const b = assets.relics;
        const rest = b.size.y / 2 - .15;
        if (this.pos.y > rest) { this.vy -= .012; this.pos.y = Math.max(rest, this.pos.y + this.vy); if (this.pos.y === rest) { fxDust(vec2(this.pos.x, .1), .8); play('clang', this.pos, .5, .8); } }
    }
    render()
    {
        const b = assets.relics, soft = getSoftTile();
        if (soft && !lightSystem?.emissivePass)
        {
            setAdditiveBlendMode(true);
            drawTile(this.pos, b.size.scale(1.4), soft, rgb(1, .8, .4, .25 + Math.sin(time * 3) * .1));
            setAdditiveBlendMode(false);
        }
        drawTile(this.pos, b.size, b.tile);
    }
}

export class EndingScene
{
    enter()
    {
        game.state = 'ENDING';
        world.scene = this;
        world.enemies = []; world.player = undefined; world.boss = undefined;
        uiSystem.destroyObjects();
        clearBanners();
        setDesat(0);
        lightSystem.ambientColor = rgb(1, .96, .9);
        this.layers = buildEndingLayers();
        this.target = vec2(-2, CAM_Y);
        this.camera = new FollowCamera(this.target, .5);
        playMusic('ending', .75, 2.5);

        this.hero = new Hero(-10);
        this.beam = new Beam(0);
        this.light = new Light(vec2(0, 2), 10, rgb(1, .85, .5, 0), 10);
        this.line = -1; this.typed = 0; this.lineStart = 0; this.finished = false;
        this.t = new Timer; this.t.set(0);
        this.events = [
            [.6, () => this.next()],
            [3.6, () => { this.hero.clip = 'idle'; }],
            [4.6, () => this.dropArmor()],
            [8.2, () => this.ascend()],
            [13.6, () => this.heaven()],
            [19, () => this.finish()],
        ];
    }

    next() { this.line++; this.lineStart = timeReal; this.typed = 0; }

    dropArmor()
    {
        this.next();
        this.hero.clip = 'free';
        this.relics = new Relics(this.hero.pos.x + 4.2);
        play('glint', this.hero.pos, .7);
        fxSparkle(this.hero.pos.add(vec2(0, 2)), 1.4, .12);
        whiteFlash(.25);
    }

    ascend()
    {
        this.next();
        const h = this.hero;
        h.clip = 'fly';
        tweenProperty(this.beam, 'k', 0, 1, 1.2, { ease: Ease.OUT(Ease.SINE) });
        tweenProperty(h, 'glow', 0, 1, 1.5);
        tweenProperty(this.light, 'color', rgb(1, .85, .5, 0), rgb(1, .85, .5, .9), 1.5);
        play('gong'); shake(.3, vec2(0, 1));
        fxDust(vec2(h.pos.x, .1), 1.5);
        // bay lên: chậm rồi nhanh dần
        tweenProperty(h.pos, 'y', 0, 24, 6.5, { ease: Ease.POWER(2.2) });
        tweenProperty(this.target, 'y', CAM_Y, CAM_Y + 17, 7, { ease: Ease.IN_OUT(Ease.SINE) });
        this.sparkles = fxSparkle(h.pos.add(vec2(0, 1)), 2, .12);
    }

    heaven()
    {
        this.next();
        whiteFlash(.8);
        play('gong', undefined, 1, 1.2);
        tweenProperty(this.hero, 'alpha', 1, 0, 1.2);
        tweenProperty(this.beam, 'k', 1, 0, 3);
        this.star = new Star(this.hero.pos.add(vec2(0, 2)));
        tweenProperty(this.star, 'k', 0, 1, 1.5, { ease: Ease.OUT(Ease.BACK) });
        showBanner('PHÙ ĐỔNG THIÊN VƯƠNG', 'Đất nước yên bình — HẾT', 'big', 4.5);
    }

    finish()
    {
        if (this.finished) return;
        this.finished = true;
        game.state = 'VICTORY';
        const secs = Math.round((performance.now() - game.runStart) / 1000);
        openPanel({
            title: 'CHIẾN THẮNG!', title2: 'Thánh Gióng bảo vệ quê hương',
            lines: [`Tổng số giặc đã hạ: ${game.totalKills} · Thời gian: ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`],
            buttons: [{ text: 'Chơi lại từ đầu', onClick: startRun }, { text: 'Về menu', onClick: goMenu }],
            titleColor: C.son, dim: .25,
        });
    }

    update()
    {
        while (this.events.length && this.t.get() >= this.events[0][0]) this.events.shift()[1]();
        const h = this.hero;
        // đi bộ lên giữa đỉnh núi
        if (h.clip === 'walk') h.pos.x = Math.min(0, h.pos.x + .045);
        this.target.x = h.pos.x * .3;
        this.camera.target = this.target;
        this.light.pos = h.pos.add(vec2(0, 2));
        if (this.sparkles) this.sparkles.pos = h.pos.add(vec2(0, 1));
        // mây trôi
        this.layers.cloudsHigh.pos.x += .006;
        // gõ chữ
        if (this.line >= 0)
        {
            const n = Math.min(LINES[this.line].length, ((timeReal - this.lineStart) * 26) | 0);
            if (n > this.typed) { this.typed = n; LINES[this.line][n - 1] !== ' ' && play('type', undefined, .5, rand(.9, 1.2)); }
        }
        // Enter: bỏ qua đến cuối
        if (!this.finished && (keyWasPressed('Enter') || keyWasPressed('Escape')))
        {
            this.events = [];
            this.line = LINES.length - 1; this.typed = LINES[this.line].length;
            this.finish();
        }
    }

    drawUI()
    {
        withUI((ctx, W) =>
        {
            ctx.fillStyle = 'rgba(35,27,25,.85)';
            ctx.fillRect(0, 0, W, 40); ctx.fillRect(0, 540 - 110, W, 110);
            if (this.line >= 0 && !this.finished)
            {
                const from = Math.max(0, this.line - 2);
                for (let i = from; i <= this.line; i++)
                {
                    const cur = i === this.line, s = cur ? LINES[i].slice(0, this.typed) : LINES[i];
                    text(ctx, s, 70, 540 - 86 + (i - from) * 30, cur ? 24 : 19, cur ? '#FFE9A8' : PAL.giay, { align: 'left', line: 4, alpha: cur ? 1 : .55 });
                }
            }
            if (!this.finished) text(ctx, 'Enter — bỏ qua', W - 20, 22, 14, PAL.giay, { align: 'right', line: 0, alpha: .6, weight: 'normal', shadow: false });
        });
    }

    leave() { uiSystem.destroyObjects(); world.scene = undefined; }
}
