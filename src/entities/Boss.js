// Thiết Giáp Tướng: máy trạng thái enter → approach → windup → slash → recover, 2 giai đoạn
import {
    EngineObject, vec2, rgb, Timer, sign, clamp, rand, time, WHITE, Color, drawRect, drawText, drawTile, setAdditiveBlendMode,
    tweenProperty, Ease, Light, lightSystem,
} from 'littlejsengine';
import { CFG, ARENA_HALF, C, FONT } from '../config.js';
import { game, world, assets, isPlaying } from '../state.js';
import { makeAnimator, frameTile, drawSprite } from '../art/sheet.js';
import { play, S } from '../audio/sfx.js';
import { SlashFx, FloatText, fxSparks, fxDust, fxDebris, hitstop, shake, flash, chroma, drawShadow, getSoftTile, fxEmbers } from '../fx/fx.js';

export class Boss extends EngineObject
{
    constructor(x, events = {})
    {
        super(vec2(x, 0), vec2(2.8, 6.2));
        this.sheet = assets.boss;
        this.anim = makeAnimator(this.sheet, ['idle', 'walk']);
        this.events = events;           // onPhase2, onDeath
        this.hp = CFG.bossHP;
        this.phase = 1;
        this.state = 'enter';
        this.stateT = new Timer;
        this.flashT = new Timer;
        this.dir = -1;
        this.renderOrder = 6;
        this.emissive = .25;
        this.slashHit = false;
        this.glinted = false;
        this.enterX = 10;
        this.lastWalkFrame = -1;
        this.fall = 0;
        this.alpha = 1;
        this.isBoss = true;
        this.halfW = CFG.bossHalfW;
        game.bossHP = this.hp;
        world.boss = this;
        // ánh đỏ (giai đoạn 2)
        this.light = new Light(this.pos.add(vec2(0, 3)), 7, rgb(1, .2, .1, 0), 7);
    }

    get hittable() { return !['dead', 'enter', 'idle'].includes(this.state); }
    get speed() { return CFG.bossSpeed * (this.phase === 2 ? 1.2 : 1); }
    get windupTime() { return this.phase === 2 ? CFG.bossWindup2 : CFG.bossWindup1; }
    get recoverTime() { return this.phase === 2 ? CFG.bossRecover2 : CFG.bossRecover1; }
    /** Vùng đánh của đao: [lo, hi] trên trục x */
    zone()
    {
        const a = this.pos.x + this.dir * .3, b = this.pos.x + this.dir * (this.halfW + CFG.bossReach);
        return [Math.min(a, b), Math.max(a, b)];
    }

    setState(s, dur = 0)
    {
        this.state = s;
        dur ? this.stateT.set(dur) : this.stateT.unset();
    }

    update()
    {
        const p = world.player;
        this.light.pos = this.pos.add(vec2(this.dir * .3, 3.2));
        if (this.phase === 2 && this.state !== 'dead')
            this.light.color = rgb(1, .22, .1, .55 + Math.sin(time * 6) * .2);

        switch (this.state)
        {
            case 'enter':
                this.dir = -1;
                this.pos.x -= this.speed * 1.1;
                this.stepFx();
                if (this.pos.x <= this.enterX) { this.pos.x = this.enterX; this.setState('idle'); this.events.onArrive?.(); }
                break;
            case 'idle':
                break;
            case 'approach':
            {
                if (!isPlaying() || !p || p.dead) break;
                const dx = p.pos.x - this.pos.x;
                this.dir = sign(dx) || this.dir;
                if (Math.abs(dx) > this.halfW + CFG.bossReach * .75)
                {
                    this.pos.x += this.dir * this.speed;
                    this.stepFx();
                }
                else this.startWindup();
                break;
            }
            case 'windup':
            {
                const k = this.stateT.getPercent();
                if (k > .62 && !this.glinted) { this.glinted = true; play('glint', this.pos, .8); }
                if (this.stateT.elapsed()) this.doSlash();
                break;
            }
            case 'slash':
                if (this.stateT.elapsed()) this.setState('recover', this.recoverTime);
                break;
            case 'recover':
            case 'stagger':
            case 'roar':
                if (this.stateT.elapsed()) this.setState('approach');
                break;
        }
        this.pos.x = clamp(this.pos.x, -ARENA_HALF + 1.5, this.state === 'enter' ? 99 : ARENA_HALF - 1.5);
    }

    /** Bước chân nặng: rung nhẹ + bụi */
    stepFx()
    {
        const f = this.anim.clips.walk.frame;
        if (f !== this.lastWalkFrame && (f === 0 || f === 3))
        {
            play('step', this.pos, .9);
            shake(.08, vec2(0, 1));
            fxDust(this.pos.add(vec2(this.dir * .6, .1)), .6);
        }
        this.lastWalkFrame = f;
    }

    startWindup()
    {
        this.setState('windup', this.windupTime);
        this.slashHit = false;
        this.glinted = false;
        play('charge', this.pos, 1, this.phase === 2 ? 1.25 : 1);
    }

    doSlash()
    {
        this.setState('slash', .2);
        play('whooshBig', this.pos, 1, this.phase === 2 ? 1.2 : 1);
        shake(.3, vec2(1, .3));
        const d = this.dir;
        new SlashFx(this.pos.add(vec2(d * .5, 3.4)), 4.6, -.6 * d, 2.5 * d, this.phase === 2 ? rgb(1, .45, .3) : rgb(.85, .92, 1), .22, 1.1);
        fxDust(this.pos.add(vec2(d * 3.5, .2)), 1.3);
        // đúng một lần sát thương mỗi nhát
        const p = world.player, [lo, hi] = this.zone();
        if (!this.slashHit && p && p.pos.x + p.halfW > lo && p.pos.x - p.halfW < hi)
        {
            this.slashHit = true;
            p.hurt(this.pos.x);
        }
    }

    takeHit(dmg, dir, src, at)
    {
        if (!this.hittable) return;
        if (this.state === 'roar')
        {
            // đang gầm: giáp cứng, không mất máu
            play('clang', this.pos, .7, .7);
            new FloatText(this.pos.add(vec2(0, 6.5)), 'GIÁP CỨNG!', C.sat.lerp(WHITE, .5), .6);
            return;
        }
        this.hp = Math.max(0, this.hp - dmg);
        game.bossHP = this.hp;
        this.flashT.set(.12);
        new FloatText((at || this.pos.add(vec2(0, 4))).add(vec2(0, 1.5)), '-' + dmg, src === 'bamboo' ? C.tre.lerp(WHITE, .5) : C.giay, src === 'bamboo' ? 1.3 : .9);
        play(src === 'bamboo' ? 'clangBig' : 'clang', this.pos, 1, rand(.8, 1));

        if (src === 'bamboo' && this.state === 'windup')
        {
            // Tre Thần ngắt đòn đang gồng
            this.setState('stagger', .9);
            new FloatText(this.pos.add(vec2(0, 7.2)), 'NGẮT ĐÒN!', C.tre.lerp(WHITE, .35), 1.1, 1.3);
            play('clangBig', this.pos, 1, .7);
        }
        if (this.hp <= 0) return this.die();
        if (this.phase === 1 && this.hp <= CFG.bossPhase2HP)
        {
            this.phase = 2;
            this.setState('roar', 1.5);
            this.events.onPhase2?.();
            play('roar', this.pos, 1);
            shake(.8); flash(.35); chroma(.02); hitstop(.15);
            fxDebris(this.pos.add(vec2(0, 3)), 1.5);
            this.embers = fxEmbers(this.pos.add(vec2(0, 2)), vec2(3, 4));
        }
    }

    die()
    {
        this.setState('dead');
        this.embers?.destroy();
        tweenProperty(this, 'fall', 0, 1, 1.3, { ease: Ease.OUT(Ease.BOUNCE) });
        tweenProperty(this.light, 'color', rgb(1, .3, .1, .8), rgb(1, .3, .1, 0), 1.5);
        play('roar', this.pos, 1, .7);
        play('clangBig', this.pos, 1, .6);
        fxDebris(this.pos.add(vec2(0, 3)), 2);
        fxDust(this.pos.add(vec2(0, .3)), 2.5);
        this.events.onDeath?.();
    }

    render()
    {
        const sh = this.sheet;
        let tile, angle = 0, feet = this.pos;
        switch (this.state)
        {
            case 'windup': tile = frameTile(sh, 'windup', Math.min(2, this.stateT.getPercent() * 3.2)); break;
            case 'slash': tile = frameTile(sh, 'slash', Math.min(2, this.stateT.getPercent() * 3)); break;
            case 'recover': tile = frameTile(sh, 'recover', this.stateT.getPercent() * 2); break;
            case 'stagger': tile = frameTile(sh, 'stagger', 0); break;
            case 'roar': tile = frameTile(sh, 'windup', 2); break;
            case 'dead':
                tile = frameTile(sh, 'stagger', 0);
                // ngã ngửa quanh gót chân, thân nằm trên mặt đất
                angle = -this.dir * this.fall * 1.5;
                feet = this.pos.add(vec2(this.dir * this.fall * .4, this.fall * 1.05));
                break;
            default:
                this.anim.set(this.state === 'enter' || (this.state === 'approach' && isPlaying()) ? 'walk' : 'idle');
                tile = this.anim.tileInfo;
        }

        // vùng cảnh báo trên mặt đất khi đang gồng đòn: băng mực đậm + sọc đỏ chéo + cột sáng
        if (this.state === 'windup' && !lightSystem?.emissivePass)
        {
            const k = this.stateT.getPercent(), [lo, hi] = this.zone();
            const pulse = .5 + .5 * Math.sin(time * 30), mid = (lo + hi) / 2, w = hi - lo;
            const soft = getSoftTile();
            if (soft)
            {
                setAdditiveBlendMode(true);
                drawTile(vec2(mid, 1.2), vec2(w * 1.25, 3.2), soft, rgb(1, .18, .05, .25 + k * .45 + pulse * .1));
                setAdditiveBlendMode(false);
            }
            drawRect(vec2(mid, -.3), vec2(w, .62), rgb(.12, .05, .04, .8));
            const stripe = rgb(.92, .3, .2, .65 + k * .35);
            for (let x = lo + .2; x < hi - .1; x += .45)
                drawRect(vec2(x, -.3), vec2(.18, .72), stripe, .6 * this.dir);
            const edge = rgb(.95, .32, .2, .6 + k * .4);
            drawRect(vec2(lo, 1.5), vec2(.1, 3.6), edge);
            drawRect(vec2(hi, 1.5), vec2(.1, 3.6), edge);
            drawText('!', this.pos.add(vec2(0, 7.2 + Math.sin(time * 20) * .1)), 1.4 + k * .4, C.canh, .2, C.muc, 'center', FONT, 'bold');
        }

        drawShadow(this.pos, 4.6, .42 * this.alpha);

        // hào quang đỏ giai đoạn 2
        const soft = getSoftTile();
        const fxPass = !lightSystem?.emissivePass;
        if (this.phase === 2 && this.state !== 'dead' && soft && fxPass)
        {
            setAdditiveBlendMode(true);
            drawTile(this.pos.add(vec2(0, 3)), vec2(7.5 + Math.sin(time * 9) * .6, 8.5), soft, rgb(1, .15, .05, .3));
            setAdditiveBlendMode(false);
        }

        let additive;
        if (this.flashT.active()) additive = rgb(1, 1, 1, 0);
        else if (this.state === 'windup') additive = rgb(.5 * this.stateT.getPercent(), .05, 0, 0);
        else if (this.phase === 2) additive = rgb(.22 + Math.sin(time * 8) * .08, 0, 0, 0);
        drawSprite(sh, tile, feet, this.dir < 0, new Color(1, 1, 1, this.alpha), additive, 1, angle);

        // mắt đỏ rực giai đoạn 2
        if (this.phase === 2 && this.state !== 'dead' && soft && fxPass)
        {
            setAdditiveBlendMode(true);
            drawTile(this.pos.add(vec2(this.dir * .55, 5.15)), vec2(1.2), soft, rgb(1, .2, .1, .9));
            setAdditiveBlendMode(false);
        }
    }

    destroy()
    {
        this.light?.destroy();
        super.destroy();
    }
}
