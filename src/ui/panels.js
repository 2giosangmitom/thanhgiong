// Các bảng UI (UISystem của LittleJS): điều hướng bằng phím mũi tên / W S, xác nhận bằng Enter / Space
import { UIObject, UIText, UIButton, uiSystem, vec2, rgb, Timer, tweenProperty, Ease } from 'littlejsengine';
import { C, FONT, PAL } from '../config.js';
import { S } from '../audio/sfx.js';

export function styleUI()
{
    uiSystem.nativeHeight = 540;
    uiSystem.defaultColor = C.giay.copy();
    uiSystem.defaultButtonColor = C.giay.copy();
    uiSystem.defaultHoverColor = C.vang.copy();
    uiSystem.defaultLineColor = C.muc.copy();
    uiSystem.defaultTextColor = C.muc.copy();
    uiSystem.defaultDisabledColor = rgb(.75, .7, .6);
    uiSystem.defaultLineWidth = 3;
    uiSystem.defaultCornerRadius = 6;
    uiSystem.defaultFont = FONT;
    uiSystem.defaultShadowColor = rgb(.08, .05, .04, .45);
    uiSystem.defaultShadowBlur = 10;
    uiSystem.defaultShadowOffset = vec2(4, 5);
    uiSystem.defaultSoundPress = S.uiMove;
    uiSystem.defaultSoundClick = S.uiOk;
    uiSystem.navigationDirection = 1;
}

let current;
export function closePanel()
{
    current?.destroy();
    current = undefined;
}

/** Tạo nút có phong cách giấy dó */
export function makeButton(parent, pos, size, label, onClick, index, autoSelect)
{
    const b = new UIButton(pos, size, label);
    b.textHeight = size.y * .5;
    b.fontStyle = 'bold';
    b.navigationIndex = index;
    b.navigationAutoSelect = !!autoSelect;
    b.onClick = onClick;
    b.textLineWidth = 0;
    parent.addChild(b);
    return b;
}

/**
 * Mở bảng trạng thái
 * @param {object} o title, lines[], buttons[{text, onClick}], titleColor, dim (làm tối nền)
 */
export function openPanel(o)
{
    closePanel();
    S.uiOk?.play(undefined, .6, .8);
    const lines = o.lines || [], buttons = o.buttons || [];
    const w = o.width || 500, h = 116 + lines.length * 30 + buttons.length * 62 + (o.title2 ? 30 : 0);

    const root = new UIObject(vec2(), vec2(4000, 3000));
    root.color = rgb(.1, .06, .05, o.dim ?? .55);
    root.lineWidth = 0; root.cornerRadius = 0; root.shadowColor = undefined;
    current = root;

    const panel = new UIObject(vec2(0, -40), vec2(w, h));
    panel.color = C.giay.copy();
    panel.gradientColor = rgb(.88, .8, .64);
    panel.lineWidth = 5; panel.cornerRadius = 10;
    root.addChild(panel);

    // dải đỏ trang trí
    const band = new UIObject(vec2(0, -h / 2 + 8), vec2(w - 30, 6));
    band.color = C.son.copy(); band.lineWidth = 0; band.shadowColor = undefined;
    panel.addChild(band);

    let y = -h / 2 + 52;
    const title = new UIText(vec2(0, y), vec2(w - 40, 54), o.title);
    title.textColor = (o.titleColor || C.son).copy();
    title.fontStyle = 'bold';
    title.textLineWidth = 4; title.textLineColor = C.muc.copy();
    panel.addChild(title);
    y += 46;
    if (o.title2)
    {
        const t2 = new UIText(vec2(0, y - 6), vec2(w - 40, 24), o.title2);
        t2.textColor = C.muc.copy(); t2.fontStyle = 'italic';
        panel.addChild(t2);
        y += 30;
    }
    for (const line of lines)
    {
        const t = new UIText(vec2(0, y), vec2(w - 60, 22), line);
        t.textColor = C.muc.copy();
        panel.addChild(t);
        y += 30;
    }
    y += 14;
    const btns = buttons.map((b, i) =>
    {
        const btn = makeButton(panel, vec2(0, y + i * 62), vec2(300, 48), b.text, () => { closePanel(); b.onClick(); }, i + 1, i === 0);
        btn.disabled = true;
        return btn;
    });

    // tránh bấm nhầm khi đang đánh (Space/Enter) — kích hoạt nút sau một nhịp
    const arm = new Timer(.45, true);
    root.onUpdate = () =>
    {
        if (arm.elapsed() && btns[0]?.disabled) { btns.forEach(b => b.disabled = false); uiSystem.navigationMode = true; }
    };
    uiSystem.navigationMode = true;

    // trượt vào
    tweenProperty(panel, 'localPos', vec2(0, -420), vec2(0, -40), .45, { ease: Ease.OUT(Ease.BACK), useRealTime: true });
    return root;
}

export const panelOpen = () => !!current && !current.destroyed;
