# Thánh Gióng: Metal Rising

Game hành động 2D góc nhìn ngang, phong cách vẽ tay dân gian remix, làm bằng [LittleJS](https://killedbyapixel.github.io/LittleJS/docs/) 1.31 và Vite. Thiết kế chi tiết nằm trong [IDEAS.md](IDEAS.md).

> “Cầm roi sắt, gọi tre thần, cùng Thánh Gióng bảo vệ Phù Đổng và đánh bại tướng giặc trong hai trận chiến vẽ tay đậm chất dân gian remix.”

## Chạy game

Cần Node 22.12 trở lên.

```
npm install
npm run dev       # máy chủ dev, tự tải lại trang khi lưu
npm run build     # build ra thư mục dist/
npm run preview   # xem thử bản build
```

## Điều khiển (chỉ bàn phím)

| Phím | Hành động |
|---|---|
| `A` / `←`, `D` / `→` | Di chuyển |
| `J` | Roi Sắt: đánh trúng được +20 Nộ Khí |
| `K` | Tre Thần: cần 100 Nộ Khí, gây 3 sát thương quanh Gióng, ngắt được đòn boss đang gồng |
| `L` | Lướt nhanh: né được mọi đòn trong lúc lướt, hồi chiêu 0,75 giây |
| `Esc` | Tạm dừng / tiếp tục |
| `↑` / `↓`, `Enter` | Chọn và xác nhận trong menu |

## Nội dung

- **Màn 1 — Phù Đổng rực lửa:** hạ 12 lính giặc. Lính xuất hiện dần từ hai phía, tối đa 2, 3 rồi 4 lính cùng lúc.
- **Màn 2 — Sóc Sơn: quyết chiến:** đấu Thiết Giáp Tướng (20 HP, 2 giai đoạn). Mỗi nhát đao đều có vùng cảnh báo trên mặt đất.
- **Mở đầu + mini game "Giúp Gióng ăn mau lớn":** 10 giây bấm `Space` liên tục, mỗi 4 lần bấm là một tô cơm; mỗi tô +5 Nộ Khí khởi đầu.
- **Cảnh cuối:** Gióng cưỡi ngựa sắt lên đỉnh Sóc Sơn, cởi giáp, để lại roi sắt rồi bay về trời; tiếp theo là cảnh phim cũ bô lão kể chuyện Thánh Gióng cho trẻ con trong làng.
- Có các bảng Tạm dừng, Thất bại, Qua màn, Chiến thắng và Hướng dẫn.
- **Nhạc nền:** `HonPhuDong` (menu, mở đầu, mini game) → `DongSonChienKhuc` (màn 1) → `SaintGiong` (màn 2) → `TreXanhVuotNangMoi` (cảnh cuối). File nằm trong `music/`.

## Kỹ thuật

- **Đồ hoạ:** toàn bộ nhân vật, đạo cụ và nền đều vẽ bằng Canvas2D. Bộ "bút mực" tạo nét run tay, vân giấy và hoa văn trống đồng. Nhân vật được dựng theo kiểu rối giấy (khớp xương + pose) rồi bake thành spritesheet (`TextureInfo`) để vẽ bằng WebGL.
- **Parallax:** 6–8 lớp `ParallaxLayer` mỗi màn, kết hợp `FollowCamera` bám nhẹ trong đấu trường rộng hơn khung hình.
- **Hiệu ứng:** `LightSystemPlugin` (ánh lửa, hoàng hôn, hào quang boss), `PostProcessPlugin` (glow, chromatic, vignette, vân giấy, chớp màn hình; tự tắt glow khi máy yếu), particle, tween, hitstop/slow-mo, rung camera.
- **Âm thanh:** hiệu ứng ZzFX. Nhạc ngũ cung + trống dân gian + guitar méo tiếng được render bằng `zzfxG`, đi qua chuỗi reverb, bộ nén và bộ lọc thông thấp (bóp tiếng khi tạm dừng hoặc thua).

```
src/
  main.js              khởi động engine, plugin, bake tài nguyên
  config.js            hằng số GDD, bảng màu
  state.js             GameManager
  art/                 ink.js (bút vẽ tay), sheet.js (bake sprite), giong/soldier/boss/props/backgrounds
  audio/               sfx.js (ZzFX + audio effects), music.js (nhạc tự sinh)
  entities/            Player, Soldier, Boss, Bamboo (Tre Thần)
  fx/fx.js             post-process, hitstop, particle, vệt chém, chữ bay
  scenes/              MenuScene, IntroScene, LevelScene, flow (điều hướng, tạm dừng)
  ui/                  hud.js (HUD, banner, chuyển cảnh), panels.js (UISystem), draw2d.js
```
