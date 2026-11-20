// Lính giặc: đi về phía Gióng, chạm thì gây 1 HP, 2 HP, khi bị hạ thì văng giáp và bụi
import { EngineObject, drawTile, vec2, rgb, Timer, sign, clamp, rand, randSign, time, WHITE, Color, tweenProperty, Ease } from 'littlejsengine';
import { CFG, ARENA_HALF, C } from '../config.js';
import { game, world, assets, isPlaying } from '../state.js';
import { makeAnimator, frameTile, drawSprite } from '../art/sheet.js';
import { play } from '../audio/sfx.js';
import { FloatText, fxDust, fxDebris, drawShadow } from '../fx/fx.js';

export class Soldier extends EngineObject
{
    /** mode: 'attack' | 'march' (cảnh mở đầu) | 'flee' (bỏ chạy khi thua trận) */
    constructor(x, mode = 'attack', onKill)
    {
        super(vec2(x, 0), vec2(1, 3.3));
        this.sheet = assets.soldier;
        this.anim = makeAnimator(this.sheet, ['walk', 'flee']);
        this.anim.clips.walk.speed = rand(.9, 1.1);
        this.mode = mode;
        this.onKill = onKill;
        this.hp = CFG.soldierHP;
        this.dir = x > 0 ? -1 : 1;
        this.speed = CFG.soldierSpeed * rand(.9, 1.1);
        this.renderOrder = 8 + rand();
        this.emissive = .2;
        this.hurtT = new Timer;
        this.flashT = new Timer;
        this.thrustT = new Timer;
        this.kb = 0;
        this.alive = true;
        this.deadAge = 0;
        this.fall = 0;
        this.isBoss = false;
        world.enemies.push(this);
    }

    get halfW() { return CFG.soldierHalfW; }

    update()
    {
        if (!this.alive)
        {
            this.deadAge += 1 / 60;
            this.pos.x += this.kb; this.kb *= .88;
            if (this.deadAge > 1.1) this.destroy();
            return;
        }
        if (this.mode === 'flee' || this.mode === 'march')
        {
            this.pos.x += this.dir * this.speed * (this.mode === 'flee' ? 2 : 1);
            if (Math.abs(this.pos.x) > ARENA_HALF + 6) this.destroy();
            return;
        }

        const p = world.player;
        if (p && isPlaying() && !p.dead)
        {
            const dx = p.pos.x - this.pos.x;
            if (!this.hurtT.active())
            {
                if (Math.abs(dx) > .3) this.dir = sign(dx);
                if (Math.abs(dx) > .55 && !this.thrustT.active()) this.pos.x += this.dir * this.speed;
                // chạm vào Gióng
                if (Math.abs(dx) < (CFG.playerHalfW + this.halfW) * .9 && p.hurt(this.pos.x))
                {
                    this.thrustT.set(.35);
                    this.kb = -this.dir * .25;
                }
            }
        }
        // giãn cách giữa các lính
        for (const o of world.enemies)
        {
            if (o === this || !o.alive || o.mode !== 'attack') continue;
            const d = this.pos.x - o.pos.x;
            if (Math.abs(d) < .8) this.pos.x += (sign(d) || randSign()) * .02;
        }
        this.pos.x += this.kb;
        this.kb *= .84;
        this.pos.x = clamp(this.pos.x, -ARENA_HALF - 2, ARENA_HALF + 2);
    }

    takeHit(dmg, dir, src)
    {
        if (!this.alive) return;
        this.hp -= dmg;
        this.flashT.set(.1);
        this.hurtT.set(src === 'bamboo' ? .4 : .22);
        this.kb = dir * (src === 'bamboo' ? .45 : .28);
        new FloatText(this.pos.add(vec2(rand(-.3, .3), 3.6)), '-' + dmg, src === 'bamboo' ? C.tre.lerp(WHITE, .5) : C.giay, src === 'bamboo' ? 1 : .8);
        play(src === 'bamboo' ? 'hit' : 'clang', this.pos, .8, rand(1, 1.25));
        play('hit', this.pos, .6);
        if (this.hp <= 0) this.die(dir);
    }

    die(dir)
    {
        this.alive = false;
        this.dir = -dir;
        this.kb = dir * .35;
        tweenProperty(this, 'fall', 0, 1, .45, { ease: Ease.OUT(Ease.BOUNCE) });
        play('kill', this.pos);
        fxDust(this.pos.add(vec2(0, .3)), 1.2);
        fxDebris(this.pos.add(vec2(0, 1.8)), .8);
        // giáp, khiên, giáo văng ra
        for (let i = 0; i < 3; i++) new Debris(this.pos.add(vec2(0, 2.4 - i * .6)), i, dir);
        game.totalKills++;
        this.onKill?.(this);
    }

    render()
    {
        let tile, angle = 0, color = WHITE, feet = this.pos;
        if (!this.alive)
        {
            tile = frameTile(this.sheet, 'die', 0);
            angle = -this.dir * this.fall * 1.3;
            feet = this.pos.add(vec2(0, -this.fall * .8));
            color = new Color(1, 1, 1, clamp(1.6 - this.deadAge * 1.6));
        }
        else if (this.mode === 'flee') { this.anim.set('flee'); tile = this.anim.tileInfo; }
        else if (this.hurtT.active()) tile = frameTile(this.sheet, 'hurt', 0);
        else if (this.thrustT.active()) tile = frameTile(this.sheet, 'thrust', 0);
        else { this.anim.set('walk'); tile = this.anim.tileInfo; }

        drawShadow(this.pos, 2, .3 * color.a);
        const additive = this.flashT.active() ? rgb(1, 1, 1, 0) : undefined;
        const mirror = this.mode === 'flee' ? this.dir < 0 : this.dir < 0;
        drawSprite(this.sheet, tile, feet, mirror, color, additive, 1, angle);
    }
}

/** Mảnh giáp / khiên / giáo văng ra */
export class Debris extends EngineObject
{
    constructor(pos, part, dir)
    {
        super(pos, vec2(1));
        this.part = part;
        this.vel = vec2(dir * rand(.06, .16), rand(.18, .3));
        this.spin = rand(-.3, .3);
        this.renderOrder = 12;
        this.age = 0;
        this.bounced = false;
    }
    update()
    {
        this.age += 1 / 60;
        this.vel.y -= .018;
        this.pos = this.pos.add(this.vel);
        this.angle += this.spin;
        if (this.pos.y < .25)
        {
            this.pos.y = .25;
            if (!this.bounced) { this.bounced = true; this.vel = vec2(this.vel.x * .5, -this.vel.y * .35); this.spin *= .4; play('step', this.pos, .3, 2); }
            else { this.vel = this.vel.scale(.8); this.spin *= .8; }
        }
        if (this.age > 1.6) this.destroy();
    }
    render()
    {
        const s = assets.soldier, c = new Color(1, 1, 1, clamp(1.6 - this.age));
        drawTile(this.pos, s.size.scale(.9), frameTile(s, 'parts', this.part), c, this.angle);
    }
}
