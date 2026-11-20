// Tre Thần: cụm tre mọc từ đất (scale Y bằng easing BACK), tồn tại ~0,5s rồi mờ dần
import { EngineObject, vec2, rand, lerp, clamp, drawTile, Color, Ease } from 'littlejsengine';
import { CFG } from '../config.js';
import { assets } from '../state.js';

const easeBack = Ease.OUT(Ease.BACK);

export class BambooBurst extends EngineObject
{
    constructor(x, radius, front)
    {
        super(vec2(x, 0), vec2(1));
        this.front = front;
        this.renderOrder = front ? 15 : 3;
        const n = front ? 7 : 10;
        this.stalks = [];
        for (let i = 0; i < n; i++)
        {
            const off = lerp(-radius, radius, (i + (front ? .5 : 0)) / (n - (front ? 0 : 1))) + rand(-.25, .25);
            const center = 1 - Math.abs(off) / radius;
            this.stalks.push({
                off,
                delay: Math.abs(off) / radius * .1 + rand(.02),
                scale: (front ? .38 : .5) + center * (front ? .18 : .3) + rand(.06),
                tile: (rand(assets.bamboo.tiles.length)) | 0,
                lean: rand(-.12, .12) + off * .015,
                mirror: rand() < .5,
                shade: front ? 1 : .72,
            });
        }
        this.age = 0;
    }

    update()
    {
        this.age += 1 / 60;
        if (this.age > CFG.bambooLife + .3) this.destroy();
    }

    render()
    {
        const b = assets.bamboo, life = CFG.bambooLife;
        const fade = this.age > life ? clamp(1 - (this.age - life) / .3) : 1;
        for (const s of this.stalks)
        {
            const t = clamp((this.age - s.delay) / .16);
            if (t <= 0) continue;
            const g = easeBack(t) * s.scale;
            const h = b.size.y * g, w = b.size.x * s.scale * (1.1 - .1 * t);
            const pos = vec2(this.pos.x + s.off + Math.sin(s.lean) * h / 2, -b.footOffset * g + h / 2 * Math.cos(s.lean) - .1);
            const c = new Color(s.shade, s.shade, s.shade, fade);
            drawTile(pos, vec2(w, h), b.tiles[s.tile], c, s.lean, s.mirror);
        }
    }
}
