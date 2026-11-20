// Gióng: di chuyển, Roi Sắt, Tre Thần, nhận sát thương
import { EngineObject, lightSystem, vec2, rgb, Timer, keyIsDown, keyWasPressed, sign, clamp, time, rand, WHITE, Color, Light, tweenProperty, Ease, setAdditiveBlendMode, drawTile } from 'littlejsengine';
import { CFG, ARENA_HALF, C } from '../config.js';
import { game, world, assets, isPlaying } from '../state.js';
import { makeAnimator, frameTile, drawSprite } from '../art/sheet.js';
import { play, playBambooPops, S } from '../audio/sfx.js';
import { SlashFx, SplatFx, FloatText, RingFx, fxSparks, fxDust, fxBambooDust, hitstop, shake, flash, chroma, whiteFlash, drawShadow, getSoftTile } from '../fx/fx.js';
import { BambooBurst } from './Bamboo.js';

const ATTACK_TIME = .3;

// Phím chiến đấu
export const KEYS = { attack: 'KeyJ', bamboo: 'KeyK', dash: 'KeyL' };

export class Player extends EngineObject
{
    constructor(x)
    {
        super(vec2(x, 0), vec2(1, 3.6));
        this.sheet = assets.giong;
        this.anim = makeAnimator(this.sheet, ['idle', 'walk', 'cheer']);
        this.dir = 1;
        this.renderOrder = 10;
        this.emissive = .3;
        this.attackT = new Timer;
        this.cooldown = new Timer;
        this.iframe = new Timer;
        this.hurtT = new Timer;
        this.slamT = new Timer;
        this.dashT = new Timer;
        this.dashCD = new Timer;
        this.dashDir = 1;
        this.ghosts = [];
        this.dodgeShown = false;
        this.hitSet = new Set;
        this.rageGiven = false;
        this.slashSpawned = false;
        this.moving = false;
        this.locked = false;
        this.dead = false;
        this.cheer = false;
        this.kick = 0;
        this.dustDist = 0;
        this.fallAngle = 0;
        this.rageWasFull = game.rage >= CFG.rageMax;
    }

    get halfW() { return CFG.playerHalfW; }
    get canAct() { return isPlaying() && !this.locked && !this.dead; }

    update()
    {
        let mx = 0;
        if (this.canAct)
        {
            mx = (keyIsDown('ArrowRight') || keyIsDown('KeyD') ? 1 : 0) - (keyIsDown('ArrowLeft') || keyIsDown('KeyA') ? 1 : 0);
            if (mx && !this.attackT.active() && !this.slamT.active() && !this.dashing) this.dir = mx;
            if (keyWasPressed(KEYS.dash)) this.tryDash(mx);
            if (keyWasPressed(KEYS.attack) && !this.cooldown.active() && !this.slamT.active() && !this.dashing) this.startAttack();
            if (keyWasPressed(KEYS.bamboo) && !this.dashing) this.tryBamboo();
        }
        let speed = CFG.playerSpeed;
        if (this.attackT.active()) speed *= .4;
        if (this.slamT.active()) speed = 0;
        if (this.hurtT.active()) speed *= .5;
        let dx = mx * speed + this.kick;
        if (this.dashing)
        {
            dx = this.dashDir * CFG.dashSpeed;
            // bóng mờ lưu ảnh
            if (this.dashTick++ % 2 === 0) this.ghosts.push({ pos: this.pos.copy(), mirror: this.dir < 0, age: 0 });
        }
        for (const g of this.ghosts) g.age += 1 / 60;
        this.ghosts = this.ghosts.filter(g => g.age < .25);
        this.kick *= .82;
        this.pos.x = clamp(this.pos.x + dx, -ARENA_HALF + .8, ARENA_HALF - .8);
        this.moving = !!mx && speed > 0;

        // bụi chân khi chạy
        this.dustDist += Math.abs(mx * speed);
        if (this.dustDist > 2.2) { this.dustDist = 0; fxDust(this.pos.add(vec2(-this.dir * .3, .1)), .35); }

        // vung roi: khung đánh trúng ở giữa động tác
        if (this.attackT.active())
        {
            const p = this.attackT.getPercent();
            if (p > .2 && !this.slashSpawned)
            {
                this.slashSpawned = true;
                const d = this.dir;
                new SlashFx(this.pos.add(vec2(d * .35, 2.3)), 2.75, -.25 * d, 2.35 * d, rgb(1, .93, .62), .17, .55);
            }
            if (p > .2 && p < .65) this.checkWhip();
        }

        // âm báo đủ Nộ Khí
        const full = game.rage >= CFG.rageMax;
        if (full && !this.rageWasFull) { play('rageFull'); new FloatText(this.pos.add(vec2(0, 4.4)), 'NỘ KHÍ ĐẦY!', C.tre.lerp(WHITE, .4), .7, 1.1); }
        this.rageWasFull = full;
    }

    get dashing() { return this.dashT.active(); }

    /** Lướt nhanh theo hướng đang bấm (hoặc hướng đang nhìn), bất tử trong lúc lướt */
    tryDash(mx)
    {
        if (this.dashCD.active() || this.slamT.active() || this.dashing) return;
        this.dashDir = mx || this.dir;
        this.dir = this.dashDir;
        this.dashT.set(CFG.dashTime);
        this.dashCD.set(CFG.dashCooldown);
        this.attackT.unset();
        this.dashTick = 0;
        this.dodgeShown = false;
        play('whoosh', this.pos, 1, 1.5);
        fxDust(this.pos.add(vec2(-this.dashDir * .4, .1)), .8);
        chroma(.004);
    }

    /** Hồi chiêu lướt 0..1 (1 = sẵn sàng), cho HUD */
    get dashReady() { return this.dashCD.active() ? this.dashCD.getPercent() : 1; }

    startAttack()
    {
        this.attackT.set(ATTACK_TIME);
        this.cooldown.set(CFG.whipCooldown);
        this.hitSet.clear();
        this.rageGiven = false;
        this.slashSpawned = false;
        play('whoosh', this.pos, .9, rand(.95, 1.1));
    }

    /** Danh sách mục tiêu có thể đánh */
    targets()
    {
        const list = world.enemies.filter(e => e.alive);
        if (world.boss && world.boss.hittable) list.push(world.boss);
        return list;
    }

    checkWhip()
    {
        const d = this.dir, x0 = this.pos.x + d * .1, x1 = this.pos.x + d * (this.halfW + CFG.whipRange);
        const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
        for (const t of this.targets())
        {
            if (this.hitSet.has(t)) continue;
            if (t.pos.x + t.halfW < lo || t.pos.x - t.halfW > hi) continue;
            this.hitSet.add(t);
            const contact = vec2(clamp(t.pos.x, lo, hi) - d * .2, 2 + rand(-.3, .4));
            t.takeHit(CFG.whipDamage, d, 'whip', contact);
            fxSparks(contact, d, t.isBoss);
            new SplatFx(contact, t.isBoss ? 2.2 : 1.7);
            if (!this.rageGiven)
            {
                this.rageGiven = true;
                game.rage = Math.min(CFG.rageMax, game.rage + CFG.rageGain);
            }
            hitstop(t.isBoss ? .07 : .055);
            shake(t.isBoss ? .22 : .14, vec2(1, .4));
        }
    }

    tryBamboo()
    {
        if (game.rage < CFG.rageMax || this.slamT.active())
        {
            game.rage < CFG.rageMax && play('uiMove', undefined, .5, .6);
            return;
        }
        game.rage = 0;
        this.slamT.set(.42);
        this.attackT.unset();
        if (!this.iframe.active()) this.iframe.set(.45);
        const x = this.pos.x, R = CFG.bambooRadius;

        new BambooBurst(x, R, false);
        new BambooBurst(x, R, true);
        new RingFx(vec2(x, .05), R * 2.1, rgb(.55, 1, .45), .5);
        fxBambooDust(vec2(x, .2), R);
        const light = new Light(vec2(x, 2), 12, rgb(.5, 1, .45, 1), 12);
        tweenProperty(light, 'color', rgb(.5, 1, .45, 1), rgb(.5, 1, .45, 0), .7).then(() => light.destroy());

        // sát thương một lần trong vùng
        for (const t of this.targets())
        {
            const dx = t.pos.x - x;
            if (Math.abs(dx) > R + t.halfW * .5) continue;
            t.takeHit(CFG.bambooDamage, sign(dx) || this.dir, 'bamboo', vec2(t.pos.x, 1.5));
        }
        play('boom', this.pos, 1); play('whooshBig', this.pos, .7, 1.4);
        playBambooPops(this.pos, 9);
        hitstop(.12); shake(.7, vec2(.6, 1)); chroma(.02); whiteFlash(.25);
    }

    /** Bị đánh: trả về true nếu thực sự mất máu */
    hurt(fromX)
    {
        if (this.dead || !isPlaying()) return false;
        if (this.dashing)
        {
            // né được đòn nhờ lướt
            if (!this.dodgeShown) { this.dodgeShown = true; new FloatText(this.pos.add(vec2(0, 4)), 'NÉ!', C.vang.lerp(WHITE, .4), .8); }
            return false;
        }
        if (this.iframe.active()) return false;
        game.hp = Math.max(0, game.hp - 1);
        this.iframe.set(CFG.iframes);
        this.hurtT.set(.28);
        this.attackT.unset();
        this.kick = sign(this.pos.x - fromX || -this.dir) * .32;
        flash(.5); shake(.5); hitstop(.09); chroma(.012);
        play('hurt', this.pos);
        new FloatText(this.pos.add(vec2(0, 4)), '-1', C.canh, 1);
        fxSparks(this.pos.add(vec2(0, 2)), 0, false);
        if (game.hp <= 0) this.die();
        return true;
    }

    die()
    {
        this.dead = true;
        this.kick *= 1.5;
        tweenProperty(this, 'fallAngle', 0, 1, .8, { ease: Ease.OUT(Ease.BOUNCE) });
    }

    render()
    {
        const t = this.attackT.getPercent();
        let tile, angle = 0, feet = this.pos.copy();
        if (this.dead)
        {
            tile = frameTile(this.sheet, 'dead', 0);
            angle = -this.dir * this.fallAngle * 1.4;
            feet = feet.add(vec2(0, this.fallAngle * .5));
        }
        else if (this.dashing) tile = frameTile(this.sheet, 'dash', 0);
        else if (this.slamT.active()) tile = frameTile(this.sheet, 'slam', 0);
        else if (this.attackT.active()) tile = frameTile(this.sheet, 'attack', t < .2 ? 0 : t < .45 ? 1 : t < .72 ? 2 : 3);
        else if (this.hurtT.active()) tile = frameTile(this.sheet, 'hurt', 0);
        else
        {
            this.anim.set(this.cheer ? 'cheer' : this.moving ? 'walk' : 'idle');
            tile = this.anim.tileInfo;
        }

        drawShadow(this.pos, 2.2);

        // bóng lưu ảnh khi lướt
        // (bỏ qua ở lượt emissive của LightSystem: lượt đó cần giữ chế độ cộng sáng)
        const fxPass = !lightSystem?.emissivePass;
        if (this.ghosts.length && fxPass)
        {
            const dashTile = frameTile(this.sheet, 'dash', 0);
            setAdditiveBlendMode(true);
            for (const g of this.ghosts)
                drawSprite(this.sheet, dashTile, g.pos, g.mirror, rgb(1, .55, .3, .45 * (1 - g.age / .25)));
            setAdditiveBlendMode(false);
        }

        // hào quang xanh khi đủ Nộ Khí
        const soft = getSoftTile();
        if (game.rage >= CFG.rageMax && !this.dead && soft && fxPass)
        {
            const k = .5 + .5 * Math.sin(time * 8);
            setAdditiveBlendMode(true);
            drawTile(this.pos.add(vec2(0, 1.9)), vec2(4.5 + k), soft, rgb(.4, 1, .4, .22 + k * .12));
            setAdditiveBlendMode(false);
        }

        // nhấp nháy trong thời gian bất tử
        let color = WHITE, additive;
        if (this.iframe.active() && !this.dead && !this.slamT.active() && !this.dashing)
            color = (time * 14 | 0) % 2 ? new Color(1, 1, 1, .35) : WHITE;
        if (this.hurtT.active()) additive = rgb(.6, 0, 0, 0);
        if (this.slamT.active()) additive = rgb(.1, .35, .05, 0);
        drawSprite(this.sheet, tile, feet, this.dir < 0, color, additive, 1, angle);
    }
}
