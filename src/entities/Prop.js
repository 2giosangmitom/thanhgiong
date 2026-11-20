// Nhân vật / đạo cụ trong các cảnh phim (không điều khiển): vẽ từ spritesheet bake sẵn
import { EngineObject, vec2, rgb, lightSystem, drawTile, setAdditiveBlendMode, time, Color } from 'littlejsengine';
import { makeAnimator, drawSprite } from '../art/sheet.js';
import { drawShadow, getSoftTile } from '../fx/fx.js';

export class SpriteProp extends EngineObject
{
    /**
     * @param {object} sheet  spritesheet đã bake
     * @param {string[]} clips các clip có thể dùng (clip đầu tiên hiện trước)
     * @param {Vector2} pos    vị trí chân
     * @param {object} o       mirror, scale, order, shadow (độ rộng bóng), alpha
     */
    constructor(sheet, clips, pos, o = {})
    {
        super(pos.copy(), vec2(1));
        this.sheet = sheet;
        this.anim = makeAnimator(sheet, clips);
        this.clip = clips[0];
        this.mirror = !!o.mirror;
        this.scale = o.scale ?? 1;
        this.renderOrder = o.order ?? 10;
        this.shadowW = o.shadow ?? 2;
        this.alpha = o.alpha ?? 1;
        this.glow = 0;
        this.glowColor = rgb(1, .85, .45);
        this.tint = new Color(1, 1, 1);
        this.emissive = .3;
    }
    render()
    {
        const soft = getSoftTile(), fxPass = !lightSystem?.emissivePass;
        if (fxPass && this.shadowW > 0)
            drawShadow(vec2(this.pos.x, 0), this.shadowW * this.scale * Math.max(0, 1 - this.pos.y / 5), .35 * this.alpha);
        if (fxPass && this.glow > 0 && soft)
        {
            setAdditiveBlendMode(true);
            drawTile(this.pos.add(vec2(0, 2 * this.scale)), vec2((6 + Math.sin(time * 6) * .5) * this.scale), soft, this.glowColor.scale(1, .55 * this.glow));
            setAdditiveBlendMode(false);
        }
        let tileInfo = this.frameOverride;
        if (!tileInfo) { this.anim.set(this.clip); tileInfo = this.anim.tileInfo; }
        const c = this.tint.copy(); c.a = this.alpha;
        const add = this.glow > 0 ? rgb(.25 * this.glow, .2 * this.glow, .05 * this.glow, 0) : undefined;
        drawSprite(this.sheet, tileInfo, this.pos, this.mirror, c, add, this.scale);
    }
}
