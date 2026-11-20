# THÁNH GIÓNG: METAL RISING

> **IDEA / Mini Game Design Document (GDD)**  
> Chủ đề: **Dân gian Remix** · Thể loại: **2D action arena / side-view** · Phong cách: **Hand-drawn**  
> Phiên bản: **MVP 0.2** (bổ sung parallax, ánh sáng, hậu kỳ, nhạc tự sinh) · Mục tiêu: **2 màn, khoảng 3–5 phút/lượt**  
> Engine: **LittleJS 1.31** + Vite · Đồ hoạ nhân vật vẽ bằng **Canvas2D** rồi bake thành spritesheet

## 1. Tóm tắt ý tưởng

**Thánh Gióng: Metal Rising** là game hành động 2D góc nhìn ngang, lấy cảm hứng từ truyền thuyết Thánh Gióng và remix bằng những đòn đánh có hiệu ứng sắt thép, lửa và tre thần. Người chơi điều khiển Gióng chống lại **giặc Tàu** — một đạo quân xâm lược **hư cấu trong thế giới cổ tích** — qua hai màn chơi ngắn. Màn đầu là cuộc phòng thủ làng Phù Đổng; màn cuối là trận quyết đấu với tướng giặc tại Sóc Sơn.

**Tinh thần thể hiện:** đối thủ là những binh lính và tướng xâm lược trong câu chuyện, không phải đại diện cho người Trung Quốc hiện đại hay một cộng đồng dân tộc. Tránh tạo hình miệt thị sắc tộc; phân biệt phe giặc bằng cờ hiệu, áo giáp, vũ khí và hành vi xâm lược.

**Điểm hấp dẫn chính:** đánh roi sắt để tích Nộ Khí, rồi dùng **Tre Thần** quét sạch kẻ địch hoặc phá thế thủ của boss.

## 2. Mục tiêu và phạm vi

- **Nền tảng:** PC, chơi bằng bàn phím.
- **Góc nhìn:** 2D ngang, nhân vật chỉ đi trái/phải trên một mặt đất phẳng; không có nhảy.
- **Camera & parallax:** đấu trường rộng hơn khung hình khoảng 1,3 lần (42 × 18 đơn vị so với khung nhìn 32 × 18). Camera bám nhẹ theo Gióng (`FollowCamera` có làm mượt và giới hạn biên đấu trường) để các lớp nền **parallax** trượt với tốc độ khác nhau, tạo chiều sâu. Đây vẫn là một đấu trường cố định, không phải bản đồ cuộn dài.
- **Số màn:** đúng **2**; mỗi màn dùng một đấu trường cố định.
- **Thời lượng:** màn 1 khoảng 60–90 giây, màn 2 khoảng 90–120 giây; cả lượt 3–5 phút kể cả chuyển cảnh.
- **Nội dung MVP:** 1 nhân vật chơi, 1 loại lính thường, 1 boss, 2 kỹ năng tấn công, HUD, thắng/thua, chơi lại.
- **Không làm ở MVP:** ngựa cưỡi, nâng cấp, nhiều loại vũ khí, hội thoại dài, lưu game, multiplayer, combo phức tạp, bản đồ rộng.

> **Lưu ý tiến độ:** 2 tiếng là mục tiêu cho một prototype rất tối giản khi người làm đã quen engine và có asset/placeholder sẵn. Vẽ tay đầy đủ, làm hoạt ảnh đẹp và cân bằng boss có thể cần thêm thời gian. Ưu tiên game chạy được trước, thay hình sau.

## 3. Cốt truyện

Giặc Tàu tràn đến làng Phù Đổng, đốt phá và uy hiếp dân làng. Nghe tiếng kêu cứu, Gióng đứng dậy, khoác giáp, cầm roi sắt ra trận. Sau khi đẩy lùi đợt quân đầu tiên, Gióng truy đuổi quân xâm lược đến chân núi Sóc Sơn. Tại đây, **Thiết Giáp Tướng** chặn đường. Gióng phải kết hợp roi sắt và sức mạnh tre thần để đánh bại hắn, mang lại bình yên cho quê hương.

**Mở đầu:** một màn hình tranh minh họa với câu chữ ngắn: “Giặc kéo đến Phù Đổng. Tiếng trống nổi lên. Gióng cầm roi sắt xuất trận!”  
**Kết thúc:** boss gục xuống, quân giặc rút lui; nền trời sáng dần và hiện chữ “ĐẤT NƯỚC YÊN BÌNH — CHIẾN THẮNG!”.

## 4. Luật chơi chung

### 4.1. Chỉ số nhân vật

| Chỉ số | Giá trị MVP | Ý nghĩa |
|---|---:|---|
| Máu Gióng | 5 HP | Về 0: thua, chơi lại từ đầu màn hiện tại |
| Nộ Khí | 0–100 | Tích khi đánh trúng địch |
| Sát thương Roi Sắt | 1 | Một đòn đánh trúng gây 1 sát thương |
| Hồi chiêu Roi Sắt | 0,45 giây | Tránh spam quá nhanh |
| Sát thương Tre Thần | 3 | Gây sát thương trong vùng quanh Gióng |
| Giá Tre Thần | 100 Nộ Khí | Dùng xong trở về 0 |
| Bất tử sau trúng đòn | 1 giây | Tránh mất máu liên tục khi chạm địch |

### 4.2. Di chuyển và tấn công

- Gióng đi ngang trong giới hạn màn hình và quay mặt theo hướng di chuyển gần nhất.
- Roi Sắt đánh theo hướng Gióng đang nhìn, phạm vi ngắn (gợi ý 75 px tính từ nhân vật trên khung game 960×540).
- Khi đánh trúng một mục tiêu bằng Roi Sắt, nhận **+20 Nộ Khí**. Một lần vung roi chỉ cộng Nộ Khí tối đa một lần, dù trúng nhiều kẻ địch.
- **Tre Thần:** khi đủ 100 Nộ Khí, nhấn phím kỹ năng để tre mọc từ đất trong vùng bán kính khoảng 140 px quanh Gióng; gây 3 sát thương lên mỗi địch trong vùng, chỉ một lần mỗi lần kích hoạt.
- Tre Thần có hiệu ứng tồn tại khoảng 0,5 giây, nhưng vùng sát thương chỉ tính một lần.
- Đòn Roi Sắt có thể đánh trúng boss; Tre Thần gây sát thương mạnh và có thể ngắt đòn đang chuẩn bị của boss (không ngắt đòn đã tung ra).
- Không có va chạm vật lý đẩy nhân vật lùi bắt buộc; có thể thêm nháy đỏ và giật nhẹ khi bị thương.

### 4.3. Nhận sát thương và thất bại

- Lính thường gây **1 HP** khi chạm vào Gióng; lính gây sát thương tối đa một lần trong mỗi khoảng bất tử.
- Đòn đánh boss gây **1 HP** mỗi lần trúng.
- Khi HP về 0, dừng gameplay, hiện **THẤT BẠI** và hai lựa chọn: **Chơi lại màn** / **Về menu**.
- Khi chuyển từ màn 1 sang màn 2, **hồi đầy 5 HP** nhưng giữ Nộ Khí hiện có; giúp người chơi dễ tiếp cận và tạo phần thưởng cho việc chơi tốt ở màn 1.

## 5. Phím điều khiển

| Phím | Hành động | Ghi chú |
|---|---|---|
| `A` / `←` | Đi sang trái | Quay mặt sang trái |
| `D` / `→` | Đi sang phải | Quay mặt sang phải |
| `Space` | Đánh Roi Sắt | Có hồi chiêu 0,45 giây |
| `E` | Dùng Tre Thần | Chỉ khi Nộ Khí đạt 100 |
| `Esc` | Tạm dừng / tiếp tục | Hiện bảng Pause |
| `Enter` | Xác nhận | Menu, chuyển màn, chơi lại |

**Không có nhảy** để tiết kiệm thời gian lập trình và thiết kế hoạt ảnh.

## 6. Kẻ địch

### 6.1. Lính giặc Tàu (màn 1 và màn 2)

- **Vai trò:** kẻ địch cận chiến đơn giản, mang giáp vải/giáp phiến và giáo ngắn; cờ hiệu quân xâm lược hư cấu.
- **Máu:** 2 HP (hai đòn Roi Sắt hoặc một Tre Thần).
- **Hành vi:** sinh ra ở mép trái/phải màn hình, tự đi về phía Gióng; không nhảy, không bắn đạn.
- **Tốc độ:** chậm hơn Gióng khoảng 30–40%.
- **Tấn công:** gây 1 HP khi chạm Gióng.
- **Khi chết:** phát hiệu ứng bụi/giáp rơi, biến mất; cộng 1 vào bộ đếm hạ gục.

### 6.2. Boss: Thiết Giáp Tướng (chỉ màn 2)

- **Tạo hình:** tướng xâm lược hư cấu mặc giáp sắt lớn, cầm đại đao; mũ có chỏm kim loại, áo choàng tối màu. Không dùng đặc điểm khuôn mặt để quy gán sắc tộc.
- **Máu:** 20 HP.
- **Kích thước:** cao khoảng 1,7 lần Gióng.
- **Di chuyển:** chậm, hướng về Gióng; luôn giữ trong đấu trường.
- **Hai giai đoạn:**
  - **Phase 1 (20–11 HP):** tiến gần và vung đao ngang. Trước đòn có dấu hiệu giơ đao 0,7 giây; vùng đánh trước mặt khoảng 100 px. Sau đòn nghỉ 1,2 giây.
  - **Phase 2 (10–0 HP):** phát sáng đỏ, di chuyển nhanh hơn khoảng 20%; đòn vung đao được báo trước 0,55 giây, nghỉ 1 giây. Không thêm đòn mới để tiết kiệm thời gian.
- **Tương tác Tre Thần:** gây 3 sát thương, ngắt hoạt ảnh chuẩn bị đòn nếu boss chưa tung đao.
- **Điều kiện thắng:** boss còn 0 HP, chuyển sang màn Victory.

**Nguyên tắc công bằng:** luôn có dấu hiệu rõ trước đòn boss (nháy vũ khí/đường cảnh báo). Gióng có thể né bằng cách đi ra khỏi tầm đao.

## 7. Chi tiết hai màn chơi

### Màn 1 — PHÙ ĐỔNG RỰC LỬA

**Mục tiêu:** tiêu diệt **12 lính giặc Tàu** để bảo vệ làng.

**Bối cảnh:** sân đất trước đình làng, hàng tre, mái nhà tranh đang cháy, khói và cờ giặc ở xa. Nền gồm **nhiều lớp parallax** vẽ tay (trời → mây trôi → đồi và trại giặc → làng, đình → lũy tre → sân đất → cỏ tiền cảnh). Lửa, khói và ánh lửa bập bùng được gắn vào đúng mái nhà trên lớp parallax.

**Bố trí:** Gióng xuất hiện ở giữa; lính lần lượt xuất hiện từ hai mép màn hình, cách vị trí Gióng đủ xa để phản ứng.

**Nhịp độ đề xuất:**
1. **0–15 giây:** chỉ 1–2 lính để học di chuyển và đánh.
2. **15–45 giây:** tăng dần lên tối đa 3 lính cùng lúc.
3. **Sau 45 giây:** tối đa 4 lính cùng lúc; tiếp tục cho đến khi hạ đủ 12.

**Spawn:** mỗi 3 giây thử sinh 1 lính, nếu số lính đang sống chưa chạm giới hạn; dừng sinh khi tổng số lính đã sinh là 12. Màn chỉ hoàn thành khi cả 12 lính đã bị tiêu diệt.

**HUD:** `HP`, `Nộ Khí`, `Giặc đã hạ: X/12`.

**Hoàn thành:** hiện bảng **“ĐÃ GIỮ ĐƯỢC LÀNG!”**, nút `Enter — Đến Sóc Sơn`; hồi đầy HP khi chuyển màn.

### Màn 2 — SÓC SƠN: QUYẾT CHIẾN

**Mục tiêu:** đánh bại **Thiết Giáp Tướng**.

**Bối cảnh:** chân núi Sóc Sơn, đá núi, bụi tre, cờ chiến rách, trời đỏ hoàng hôn. Đấu trường ngang, nền phẳng.

**Trình tự:**
1. Hiện tên boss **THIẾT GIÁP TƯỚNG** trong 2 giây.
2. Boss xuất hiện ở phía phải, Gióng ở phía trái; bắt đầu chiến đấu.
3. Boss đánh theo Phase 1; khi còn 10 HP, chuyển sang Phase 2 với hiệu ứng đỏ và tiếng trống mạnh.
4. Boss hết máu: dừng điều khiển, chạy hoạt ảnh ngã đơn giản, hiện **CHIẾN THẮNG!**.

**HUD:** `HP`, `Nộ Khí`, thanh máu boss `THIẾT GIÁP TƯỚNG`.

**Không thêm lính phụ** trong trận boss để tránh quá tải và dễ hoàn thiện.

## 8. Phong cách đồ họa hand-drawn

### 8.1. Art direction

- **Phong cách:** tranh vẽ tay 2D, nét mực nâu đậm không hoàn toàn đều, mảng màu phẳng có chút texture giấy, lấy cảm hứng từ mỹ thuật dân gian Việt Nam (không sao chép trực tiếp tranh cụ thể).
- **Cảm giác:** anh hùng, vui mắt, hơi phóng đại; không máu me, không kinh dị.
- **Tỷ lệ:** nhân vật đầu hơi lớn, tay chân rõ để đọc chuyển động ở kích thước nhỏ; boss lớn hơn rõ rệt.
- **Góc nhìn:** side-view, mặt đất phẳng; nhân vật luôn nhìn trái hoặc phải.
- **Độ phân giải thiết kế:** 960×540 (16:9), có thể scale lên 1920×1080.
- **Nét viền:** 3–5 px tại độ phân giải thiết kế; giữ độ dày nhất quán.

### 8.2. Bảng màu đề xuất

| Màu | Mã HEX | Ứng dụng |
|---|---|---|
| Đỏ son | `#B94B3B` | Khăn/áo Gióng, điểm nhấn UI |
| Vàng đất | `#D6A65D` | Nền, ánh sáng, chi tiết giáp |
| Xanh tre | `#557B50` | Tre, kỹ năng Tre Thần |
| Nâu mực | `#352C2A` | Viền nhân vật, chữ, mái nhà |
| Kem giấy | `#F1E1BE` | Nền menu, hộp thoại |
| Xám sắt | `#62676B` | Roi sắt, giáp boss |
| Đỏ cảnh báo | `#DB6049` | Báo đòn boss, sát thương |

### 8.3. Thiết kế nhân vật

**Gióng:** chiến binh trẻ với khăn đỏ, áo giáp đơn giản gợi họa tiết trống đồng, roi sắt dài; silhouette dễ nhận biết. Khi đánh, vệt roi màu vàng trắng; khi dùng Tre Thần, tre xanh mọc thành cụm từ mặt đất.

**Lính giặc:** trang phục quân xâm lược hư cấu, áo giáp tối màu, giáo ngắn, khiên nhỏ tùy chọn; dùng một mẫu sprite duy nhất và lật ngang theo hướng di chuyển.

**Boss:** giáp kim loại tối, đại đao lớn, áo choàng đỏ sẫm; Phase 2 có viền đỏ và hơi nóng. Thiết kế nhấn vào vai trò thủ lĩnh quân xâm lược, không dùng biếm họa dân tộc.

### 8.4. Hoạt ảnh tối thiểu

| Đối tượng | Hoạt ảnh | Cách làm nhanh |
|---|---|---|
| Gióng | Idle, Walk, Attack, Hurt | 2–4 frame/animation hoặc tween bộ phận |
| Tre Thần | Mọc lên, biến mất | Scale Y từ 0 lên 1, rồi fade out |
| Lính | Walk, Hurt/Die | 2 frame đi, nháy màu khi trúng |
| Boss | Idle/Walk, Wind-up, Slash, Die | 1–3 frame/động tác, xoay tay/vũ khí |
| UI | HP giảm, Nộ Khí đầy | Thanh fill, nháy sáng đơn giản |

### 8.5. Môi trường (nhiều lớp parallax)

Mỗi màn là một chồng `ParallaxLayer` vẽ tay bằng Canvas2D. Hệ số parallax: 1 = gắn với màn hình, 0 = gắn với thế giới, âm = tiền cảnh chạy nhanh hơn thế giới.

| Lớp | Màn 1 — Phù Đổng | Màn 2 — Sóc Sơn | Parallax |
|---|---|---|---:|
| Trời | Vàng nhạt → cam, mặt trời, khói xa, chim | Tím → đỏ → cam hoàng hôn, dải mây chiều | 1 |
| Trời phụ | Mây trôi chậm (lặp liền mạch) | Trời bình minh, ẩn, hiện dần khi chiến thắng | 0,93 / 1 |
| Xa | Đồi, trại và cờ giặc | Núi Sóc Sơn xa (lặp liền mạch) | 0,82–0,88 |
| Giữa | Làng: nhà tranh cháy, đình làng, cây đa | Núi đá xanh xám, vân đá, thông | 0,58–0,7 |
| Gần | Hàng rào và lũy tre, đống rơm | Đá, bụi tre, cờ rách, giáo gãy | 0,3–0,38 |
| Sân | Sân đất, cỏ, sỏi | Đất đá | 0 |
| Tiền cảnh | Cỏ, lá tre mờ trước nhân vật | Đá tối và cỏ | −0,35 |

- **Màn 1:** tông vàng-cam ấm, ánh lửa (`Light`) ở các mái nhà cháy, tàn lửa và lá tre bay. Cờ giặc trong sân bay phấp phới (vẽ lại mỗi frame).
- **Màn 2:** hoàng hôn đỏ, núi xanh xám; khu vực chiến đấu ít chi tiết ở tiền cảnh để dễ nhìn hitbox. Khi thắng, trời bình minh hiện dần và ánh sáng chuyển sang trắng ấm.
- **Menu:** nền giấy dó giả lập, khung viền hoa văn trống đồng, núi mực tàu nhiều lớp. Camera lia chậm qua lại để khoe parallax; phía sau logo có hoa văn mặt trời trống đồng xoay chậm.

### 8.6. Hiệu ứng và âm thanh

- Roi Sắt: tiếng `whoosh` ngắn + `clang` khi trúng giáp.
- Tre Thần: tiếng tre bật lên + bụi đất xanh/nâu.
- Trúng đòn: nhân vật nhấp nháy trong thời gian bất tử, âm thanh ngắn.
- Boss Phase 2: trống dồn một nhịp, ánh đỏ lóe nhẹ.
- Nhạc nền: **tự sinh bằng code**, không cần file. Bài được soạn theo thang ngũ cung (Do Re Fa Sol La): sáo trúc, đàn gảy, trống cái, trống cơm, phách, cồng, cùng guitar méo tiếng kiểu "metal remix". Các nốt được render sẵn bằng `zzfxG` thành buffer stereo lặp liền mạch. Có các bài: Menu, Màn 1, Màn 2, Màn 2 – pha 2 (dồn dập hơn), Chiến thắng, Thất bại.
- Hiệu ứng âm thanh: ZzFX (whoosh, clang, tre bật, trống, cồng, gầm...). Chuỗi `AudioEffects`: vang (reverb) cho trống, cồng và nhạc; bộ nén ở kênh master; bộ lọc thông thấp "bóp tiếng" khi tạm dừng hoặc thua.
- Cảm giác đòn đánh: hitstop (`timeScale = 0` trong vài chục ms), rung camera, chớp màn hình (đỏ khi bị đánh, trắng khi kết liễu), tách màu chromatic khi tung Tre Thần, slow-mo khi hạ boss, số sát thương bay lên, vết mực và tia lửa.

## 9. Giao diện (UI/UX)

### Menu chính

- Logo: **THÁNH GIÓNG: METAL RISING**.
- Nút: **Bắt đầu**, **Hướng dẫn**, **Thoát**.
- Hướng dẫn ngắn: `A/D: Di chuyển · Space: Roi Sắt · E: Tre Thần · Esc: Tạm dừng`.

### HUD trong trận

- **Trên trái:** `♥♥♥♥♥` và thanh Nộ Khí `0/100`.
- **Trên phải màn 1:** `Đã hạ: 0/12`.
- **Trên cùng giữa màn 2:** thanh máu boss và tên boss.
- **Khi đủ Nộ Khí:** chữ `E — TRE THẦN!` nhấp nháy nhẹ ở góc dưới.

### Các màn trạng thái

- **Pause:** `Tiếp tục` / `Chơi lại màn` / `Về menu`.
- **Game Over:** `THẤT BẠI` / `Chơi lại màn` / `Về menu`.
- **Qua màn:** `ĐÃ GIỮ ĐƯỢC LÀNG!` / `Enter — Tiếp tục`.
- **Victory:** `CHIẾN THẮNG!` / `Chơi lại từ đầu` / `Về menu`.

## 10. Luồng game

```text
MENU
  ├─ Hướng dẫn
  └─ Bắt đầu
       ↓
MÀN 1 — PHÙ ĐỔNG
  ├─ HP = 0 → Game Over → Chơi lại màn 1
  └─ Hạ đủ 12 lính → Qua màn
                         ↓
MÀN 2 — SÓC SƠN
  ├─ HP = 0 → Game Over → Chơi lại màn 2
  └─ Boss HP = 0 → Victory → Menu / Chơi lại từ đầu
```

## 11. Yêu cầu kỹ thuật tối giản

**Các thực thể:** `Player`, `Soldier`, `Boss`, `BambooBurst`, `GameManager` (`state.js`), UI. Mỗi màn là một scene (`SceneSystem`): `MenuScene`, `IntroScene`, `LevelScene(1|2)`.

**Tận dụng LittleJS:**

| Tính năng | Dùng cho |
|---|---|
| `TextureInfo` từ canvas + `tile`, `SpriteAnimation`, `SpriteAnimator` | Nhân vật vẽ bằng Canvas2D theo kiểu rối giấy (khớp xương + pose), bake thành spritesheet và vẽ bằng WebGL |
| `ParallaxLayer` | Nền nhiều lớp của menu và hai màn |
| `FollowCamera`, `cameraShake` | Camera bám nhẹ, giới hạn biên đấu trường; rung khi trúng đòn |
| `LightSystemPlugin`, `Light`, `emissive` | Ánh lửa, ánh hoàng hôn, hào quang đỏ của boss pha 2, ánh xanh của Tre Thần |
| `PostProcessPlugin` + `postProcessEffects` | Glow, chromatic, vignette, vân giấy, chớp màn hình, giảm bão hoà khi thua (tự tắt glow trên máy yếu) |
| `particleEffect` | Bụi, tia lửa, lửa, khói, tàn lửa, lá tre, pháo giấy |
| `Tween`, `Ease` | Tre mọc (BACK), ngã gục (BOUNCE), bảng UI trượt vào, trời sáng dần |
| `SceneSystem` | Menu, mở đầu, màn 1, màn 2 |
| `UISystemPlugin` | Menu, Tạm dừng, Thua, Qua màn, Chiến thắng, Hướng dẫn; điều hướng bằng phím |
| `Sound` (ZzFX), `zzfxG`, `AudioReverb`/`AudioFilter`/`AudioCompressor` | Hiệu ứng âm thanh và nhạc tự sinh |
| `setTimeScale` | Hitstop và slow-mo |

**Biến trạng thái tối thiểu:**

```text
current_level = 1 | 2
player_hp = 5
rage = 0..100
kills = 0..12
spawned = 0..12
boss_hp = 20
game_state = MENU | INTRO | CUTSCENE | PLAYING | PAUSED | GAME_OVER | LEVEL_CLEAR | VICTORY
```

**Luật xử lý quan trọng:**

1. Chỉ nhận input chiến đấu khi `game_state == PLAYING`.
2. Một lần vung roi chỉ gây sát thương một lần trên mỗi mục tiêu.
3. Chỉ cộng Nộ Khí khi roi thực sự đánh trúng; không cộng từ Tre Thần.
4. Lính không xuất hiện vượt quá tổng 12 ở màn 1.
5. Khi chuyển màn, xóa toàn bộ kẻ địch cũ và reset trạng thái đánh, nhưng giữ Nộ Khí.
6. Boss không thể gây nhiều lần sát thương trong cùng một lần vung đao.
7. Khi nhân vật/boss chết, khóa tấn công và dừng spawn.

## 12. Kế hoạch làm prototype trong 120 phút

| Thời gian | Công việc | Kết quả bắt buộc |
|---|---|---|
| 0–20 phút | Tạo scene, nền tĩnh, Gióng di chuyển | Đi trái/phải được |
| 20–45 phút | Lính tự đuổi, roi sắt, HP | Đánh và tiêu diệt lính được |
| 45–65 phút | Spawn 12 lính, đếm hạ gục, qua màn | Màn 1 hoàn thành |
| 65–90 phút | Boss 20 HP, hai phase, đòn báo trước | Màn 2 chơi được |
| 90–105 phút | Nộ Khí, Tre Thần, HUD | Cơ chế remix hoạt động |
| 105–120 phút | Menu, thắng/thua, kiểm thử, thay asset sẵn có | Chơi trọn hai màn |

**Thứ tự cắt giảm nếu trễ:** (1) hoạt ảnh phụ → (2) âm nhạc → (3) menu hướng dẫn riêng → (4) hiệu ứng Phase 2. **Không cắt:** hai màn, lính, boss, Roi Sắt, thắng/thua. Nếu Tre Thần chưa kịp làm, có thể thay tạm bằng vòng sát thương màu xanh để giữ cơ chế.

## 13. Tiêu chí hoàn thành (Definition of Done)

- [x] Chạy game, vào menu và bắt đầu được.
- [x] Gióng đi trái/phải và đánh roi sắt đúng hướng.
- [x] Lính giặc tự tiến đến, nhận sát thương và bị hạ.
- [x] Màn 1 kết thúc sau khi tiêu diệt đủ 12 lính.
- [x] Sang màn 2 với HP đầy và Nộ Khí được giữ lại.
- [x] Boss có thanh HP, đòn đánh báo trước và hai giai đoạn.
- [x] Tre Thần kích hoạt khi đủ 100 Nộ Khí và gây sát thương.
- [x] HP về 0 hiện Game Over; boss về 0 hiện Victory.
- [x] Có thể chơi lại màn hoặc quay về menu.
- [x] Hình ảnh thể hiện phong cách hand-drawn, có ít nhất hai background khác nhau.

## 14. Một câu giới thiệu game

**“Cầm roi sắt, gọi tre thần, cùng Thánh Gióng bảo vệ Phù Đổng và đánh bại tướng giặc trong hai trận chiến vẽ tay đậm chất dân gian remix.”**
