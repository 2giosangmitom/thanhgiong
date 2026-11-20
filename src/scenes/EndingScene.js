// Cảnh cuối (phần 1): Gióng cưỡi ngựa sắt lên đỉnh Sóc Sơn, cởi giáp sắt, để lại roi sắt rồi cả người lẫn ngựa bay về trời
import {
    EngineObject, vec2, rgb, time, timeReal, Timer, FollowCamera, Light, lightSystem, uiSystem, keyWasPressed, tweenProperty, Ease,
    drawTile, setAdditiveBlendMode, rand, particleEffect,
} from 'littlejsengine';
import { CAM_Y, PAL } from '../config.js';
import { game, world, assets } from '../state.js';
import { buildEndingLayers } from '../art/backgrounds.js';
import { SpriteProp } from '../entities/Prop.js';
import { playMusic } from '../audio/music.js';
import { play } from '../audio/sfx.js';
import { fxSparkle, fxDust, fxFire, whiteFlash, shake, getSoftTile, setDesat } from '../fx/fx.js';
import { withUI, text } from '../ui/draw2d.js';
import { showBanner, clearBanners } from '../ui/hud.js';
import { goStory } from './flow.js';

const LINES = [
    'Giặc tan, Gióng cưỡi ngựa sắt lên đỉnh núi Sóc Sơn.',
    'Gióng cởi áo giáp sắt, để lại roi sắt cho quê hương...',
    '...rồi cả người lẫn ngựa sắt bay thẳng về trời.',
];

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
    constructor(x) { super(vec2(x, 20), vec2(1)); this.k = 0; this.renderOrder = -100; }
    render()
    {
        const soft = getSoftTile();
        if (!soft || this.k <= 0 || lightSystem?.emissivePass) return;
        setAdditiveBlendMode(true);
        const w = 3.6 + Math.sin(time * 3) * .3;
        drawTile(this.pos, vec2(w * 2.2, 70), soft, rgb(1, .85, .5, .35 * this.k));
        drawTile(this.pos, vec2(w, 70), soft, rgb(1, .95, .8, .6 * this.k));
        setAdditiveBlendMode(false);
    }
}

/** Áo giáp + roi sắt để lại trên đỉnh núi */
class Relics extends EngineObject
{
    constructor(x) { super(vec2(x, 2.5), vec2(1)); this.renderOrder = 9; this.vy = 0; }
    update()
    {
        const rest = assets.relics.size.y / 2 - .15;
        if (this.pos.y > rest)
        {
            this.vy -= .012;
            this.pos.y = Math.max(rest, this.pos.y + this.vy);
            if (this.pos.y === rest) { fxDust(vec2(this.pos.x, .1), .8); play('clang', this.pos, .5, .8); }
        }
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
        this.target = vec2(-3, CAM_Y);
        this.camera = new FollowCamera(this.target, .5);
        playMusic('ending', .75, 2.5);

        this.horse = new SpriteProp(assets.horse, ['gallop', 'stand', 'free', 'fly'], vec2(-17, 0), { shadow: 4.5 });
        this.beam = new Beam(0);
        this.light = new Light(vec2(0, 2), 12, rgb(1, .85, .5, 0), 12);
        this.line = -1; this.typed = 0; this.lineStart = 0; this.done = false;
        this.t = new Timer; this.t.set(0);
        this.events = [
            [.4, () => this.next()],
            [3.4, () => this.arrive()],
            [5.4, () => this.dropArmor()],
            [9, () => this.ascend()],
            [15, () => this.heaven()],
            [19.5, () => this.finish()],
        ];
    }

    next() { this.line++; this.lineStart = timeReal; this.typed = 0; }

    arrive()
    {
        const h = this.horse;
        h.clip = 'stand';
        play('roar', h.pos, .5, 1.6);
        fxDust(vec2(h.pos.x + 1, .1), 1.4);
        this.snort = fxFire(h.pos.add(vec2(3.2, 3.6)), .5);
        this.snort.renderOrder = 12;
    }

    dropArmor()
    {
        this.next();
        this.horse.clip = 'free';
        this.relics = new Relics(this.horse.pos.x - 5);
        play('glint', this.horse.pos, .7);
        fxSparkle(this.horse.pos.add(vec2(0, 4)), 1.4, .12);
        whiteFlash(.25);
    }

    ascend()
    {
        this.next();
        const h = this.horse;
        h.clip = 'fly';
        this.snort?.destroy();
        tweenProperty(this.beam, 'k', 0, 1, 1.2, { ease: Ease.OUT(Ease.SINE) });
        tweenProperty(h, 'glow', 0, 1, 1.5);
        tweenProperty(this.light, 'color', rgb(1, .85, .5, 0), rgb(1, .85, .5, .9), 1.5);
        play('roar', h.pos, .8, 1.3); play('gong'); shake(.4, vec2(0, 1));
        fxDust(vec2(h.pos.x, .1), 2);
        // ngựa sắt bay lên: chậm rồi nhanh dần, lửa cháy dưới vó
        tweenProperty(h.pos, 'y', 0, 26, 7, { ease: Ease.POWER(2.2) });
        tweenProperty(h.pos, 'x', h.pos.x, h.pos.x + 4, 7, { ease: Ease.POWER(2) });
        tweenProperty(this.target, 'y', CAM_Y, CAM_Y + 18, 7.5, { ease: Ease.IN_OUT(Ease.SINE) });
        this.trail = fxFire(h.pos, 1.4);
        this.trail.renderOrder = 8;
        this.sparkles = fxSparkle(h.pos.add(vec2(0, 2)), 2, .12);
    }

    heaven()
    {
        whiteFlash(.8);
        play('gong', undefined, 1, 1.2);
        tweenProperty(this.horse, 'alpha', 1, 0, 1.2);
        tweenProperty(this.beam, 'k', 1, 0, 3);
        this.trail?.destroy(); this.trail = undefined;
        this.star = new Star(this.horse.pos.add(vec2(0, 2)));
        tweenProperty(this.star, 'k', 0, 1, 1.5, { ease: Ease.OUT(Ease.BACK) });
        showBanner('PHÙ ĐỔNG THIÊN VƯƠNG', 'Gióng đã về trời', 'big', 4);
    }

    finish()
    {
        if (this.done) return;
        this.done = true;
        goStory();
    }

    update()
    {
        while (this.events.length && this.t.get() >= this.events[0][0]) this.events.shift()[1]();
        const h = this.horse;
        // phi nước đại lên giữa đỉnh núi
        if (h.clip === 'gallop')
        {
            h.pos.x = Math.min(0, h.pos.x + .1);
            if ((time * 6 | 0) !== this.lastStep) { this.lastStep = time * 6 | 0; play('step', h.pos, .5, 1.3); fxDust(vec2(h.pos.x - 1.5, .1), .5); }
        }
        this.target.x = h.pos.x * .3;
        this.camera.target = this.target;
        this.light.pos = h.pos.add(vec2(0, 3));
        if (this.trail) this.trail.pos = h.pos.add(vec2(-1.2, .5));
        if (this.sparkles) this.sparkles.pos = h.pos.add(vec2(0, 2));
        this.layers.cloudsHigh.pos.x += .006;
        if (this.line >= 0)
        {
            const n = Math.min(LINES[this.line].length, ((timeReal - this.lineStart) * 26) | 0);
            if (n > this.typed) { this.typed = n; LINES[this.line][n - 1] !== ' ' && play('type', undefined, .5, rand(.9, 1.2)); }
        }
        if (keyWasPressed('Enter') || keyWasPressed('Escape')) this.finish();
    }

    drawUI()
    {
        withUI((ctx, W) =>
        {
            ctx.fillStyle = 'rgba(35,27,25,.85)';
            ctx.fillRect(0, 0, W, 40); ctx.fillRect(0, 540 - 110, W, 110);
            if (this.line >= 0)
                for (let i = 0; i <= this.line; i++)
                {
                    const cur = i === this.line, s = cur ? LINES[i].slice(0, this.typed) : LINES[i];
                    text(ctx, s, 70, 540 - 86 + i * 30, cur ? 24 : 19, cur ? '#FFE9A8' : PAL.giay, { align: 'left', line: 4, alpha: cur ? 1 : .55 });
                }
            text(ctx, 'Enter — bỏ qua', W - 20, 22, 14, PAL.giay, { align: 'right', line: 0, alpha: .6, weight: 'normal', shadow: false });
        });
    }

    leave() { uiSystem.destroyObjects(); }
}
