# JoyDigi Check-in Desktop - Electron

Desktop app đa nền tảng dùng Electron cho 2 URL:

- Check-in: https://checkin.joydigi.net/
- Kiosk: https://checkin.joydigi.net/kiosk/

## Tính năng

- Không cần Rust/Cargo/Tauri.
- Windows, macOS và Linux.
- Website được tải trực tiếp trong Electron BrowserWindow, không dùng iframe.
- Thanh chuyển nhanh `Check-in` / `Kiosk` / `Reload` / `Fullscreen` được gắn nổi trên website.
- Link cùng `checkin.joydigi.net` mở trong app.
- Link HTTP/HTTPS ngoài domain, `mailto:` và `tel:` được mở bằng ứng dụng/browser mặc định.
- `target="_blank"` nội bộ vẫn được mở trong cửa sổ app hiện tại.
- Cookie/session lưu persistent để hạn chế phải đăng nhập lại mỗi lần mở app.
- Security: `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`.
- `F11`: bật/tắt fullscreen; nếu app đang ở chế độ kiosk khóa thì F11 thoát kiosk.
- `Ctrl+1`: Check-in.
- `Ctrl+2`: Kiosk.
- Có chế độ khởi động thẳng Kiosk bằng `--kiosk`.

## Yêu cầu chung

Cài Node.js LTS 22 hoặc mới hơn:

https://nodejs.org/

Kiểm tra:

```bash
node --version
npm --version
```

## Chạy thử trên Windows

Mở CMD tại thư mục project:

```bat
npm install
npm start
```

Hoặc double-click:

```text
scripts\run-dev.bat
```

Chạy thẳng Kiosk:

```bat
npm run start:kiosk
```

## Build Windows EXE

Cách nhanh nhất:

```bat
npm install
npm run build:win
```

Hoặc double-click:

```text
scripts\build-windows.bat
```

Sau khi build xong, file cài đặt `.exe` nằm trong:

```text
dist\
```

Ví dụ tên file có thể giống:

```text
JoyDigi Check-in Setup 0.1.0.exe
```

Build bản portable:

```bat
npm run build:win:portable
```

> Electron build này KHÔNG cần `cargo`, `rustc` hay Rustup.

## Build macOS

Nên build trên máy macOS hoặc GitHub Actions.

```bash
npm install
npm run build:mac
```

Output:

```text
dist/*.dmg
```

Cấu hình hiện tại build cả `x64` và `arm64`.

Nếu phát hành công khai, nên thêm Apple Developer signing/notarization.

## Build Linux

Nên build trên Ubuntu/Debian:

```bash
npm install
npm run build:linux
```

Output gồm AppImage và DEB trong:

```text
dist/
```

## GitHub Actions build cả 3 OS

Workflow đã có tại:

```text
.github/workflows/build.yml
```

Bạn có thể push source lên GitHub rồi vào:

`Actions -> Build desktop installers -> Run workflow`

Artifacts sẽ có:

- `joydigi-windows`
- `joydigi-linux`
- `joydigi-macos`

## Cấu trúc project

```text
joydigi-electron-desktop/
├─ main.js
├─ package.json
├─ README.md
├─ LICENSE
├─ build/
│  ├─ icon.png
│  ├─ icon.ico
│  └─ icon.icns
├─ scripts/
│  ├─ run-dev.bat
│  ├─ build-windows.bat
│  ├─ build-macos.sh
│  └─ build-linux.sh
└─ .github/workflows/build.yml
```

## Đổi URL

Trong `main.js`, sửa:

```js
const APP_HOST = 'checkin.joydigi.net';
const CHECKIN_URL = 'https://checkin.joydigi.net/';
const KIOSK_URL = 'https://checkin.joydigi.net/kiosk/';
```

## Đổi tên app / App ID

Trong `package.json`:

```json
{
  "build": {
    "appId": "net.joydigi.checkin.desktop",
    "productName": "JoyDigi Check-in"
  }
}
```

## Icon

Các icon hiện tại là placeholder. Thay các file sau bằng icon chính thức:

```text
build/icon.png
build/icon.ico
build/icon.icns
```

Nên dùng ảnh nguồn PNG 1024x1024.

## Ghi chú về link ngoài

Mặc định app chỉ coi `checkin.joydigi.net` là website nội bộ. Những URL HTTP/HTTPS khác sẽ được chuyển sang browser mặc định. Điều này giúp nội dung web bên ngoài không tự chạy bên trong BrowserWindow của app.

Nếu hệ thống Check-in sau này cần Google/Microsoft OAuth chạy hoàn toàn trong Electron, cần thêm domain đăng nhập tương ứng vào allowlist và kiểm tra callback trước khi phát hành.


## GitHub Actions: lỗi GH_TOKEN

Nếu log có dòng `GitHub Personal Access Token is not set`, nghĩa là `electron-builder` đang cố publish artifact lên GitHub Release do phát hiện môi trường CI/tag. Project này chỉ build và upload bằng `actions/upload-artifact`, vì vậy tất cả lệnh CI đã được cấu hình `--publish never`.

Nếu bạn vừa cập nhật source nhưng bấm **Re-run jobs** trên một workflow cũ, GitHub vẫn chạy đúng commit/tag cũ. Hãy commit + push các file mới rồi chạy workflow mới, hoặc tạo tag mới (ví dụ `v0.1.1`).
