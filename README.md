# 📁 文件中转站

一个零数据库的**局域网文件中转站**：在电脑上启动服务，手机连同一个 WiFi 打开网址，就能在设备之间互传文件、共享文本。

> 适合"手机 → 电脑"、"电脑 → 平板"这类临时传文件的场景：不用装 App、不用登录、不用数据线。

---

## ✨ 功能特点

### 📤 文件传输

- 拖拽上传 / 点击选择上传
- 支持**多文件同时上传**，带实时上传进度条
- 单个文件最大 **500MB**（可配置）
- 文件列表**每 5 秒自动刷新**，多设备看到的内容保持一致
- 按扩展名自动识别文件类型图标（文档 / 图片 / 视频 / 音频 / 压缩包 / 代码等）
- 一键下载（中文文件名不乱码）、一键删除（带二次确认）
- 文件名冲突自动加时间戳前缀，界面上仍显示原始文件名

### 📝 文本共享

- 多设备共享一块文本框，用来传验证码、链接、长文本
- **输入后 1 秒自动保存**，也可以点「💾 保存」手动保存
- 每 2 秒轮询同步，并显示同步状态（已同步 / 同步中 / 同步失败）
- 支持一键清空，实时字符计数

### 📱 界面

- 响应式设计，手机 / 平板 / 电脑都能正常使用
- 操作有 Toast 提示，拖拽有高亮反馈

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 16 或更高版本（自带 npm）
- 手机与电脑处于**同一个 WiFi / 局域网**

### 1. 获取代码并安装依赖

```bash
git clone https://github.com/你的用户名/file-transfer-station.git
cd file-transfer-station
npm install
```

也可以直接下载 ZIP 解压，然后在项目目录执行 `npm install`。

### 2. 启动服务

```bash
npm start
```

Windows 用户还可以直接**双击 `start-server.bat`**（脚本会先切换到自身所在目录，再执行 `npm start`）。

启动成功后终端会打印访问地址：

```
========================================
  🚀 文件中转站已启动！
========================================

  📱 手机/其他设备请访问:
     http://192.168.1.100:3000

  💻 本机访问:
     http://localhost:3000
     http://192.168.1.100:3000

  按 Ctrl+C 停止服务器
========================================
```

> 需要改代码后自动重启，可用 `npm run dev`（基于 nodemon）。

### 3. 在其他设备上访问

确保手机和电脑连接**同一个 WiFi**，在手机浏览器输入上面显示的局域网地址，例如 `http://192.168.1.100:3000`。

### 4. 手机打不开怎么办（Windows 常见）

多数是防火墙拦截了 Node.js：

1. 打开「Windows 安全中心」→「防火墙和网络保护」→「允许应用通过防火墙」
2. 找到 `Node.js JavaScript Runtime`，把**专用网络**和**公用网络**都勾上
3. 列表里没有就点「更改设置」→「允许其他应用」→ 手动添加 `node.exe`
4. 仍然不行：确认手机和电脑在同一网段，并检查路由器是否开启了「AP 隔离」

---

## 📖 使用方法

| 操作 | 步骤 |
| --- | --- |
| **上传文件** | 电脑端把文件拖进上传区；手机端点上传区，从相册或文件管理器选择 |
| **下载文件** | 在文件列表点「⬇️ 下载」 |
| **删除文件** | 点「🗑️ 删除」，确认后文件被**永久删除**（不可恢复） |
| **共享文本** | 在「📝 文本共享」框内输入，1 秒后自动同步到所有设备；点「🗑️ 清空」清空内容 |

---

## 🗂 项目结构

```
file-transfer-station/
├── server.js            # Express 服务端：上传 / 下载 / 删除 / 文本共享 API
├── package.json         # 项目配置与依赖
├── start-server.bat     # Windows 一键启动脚本
├── public/
│   └── index.html       # 前端页面（原生 HTML + CSS + JS，单文件）
├── uploads/             # 上传文件的存储目录（首次上传时自动创建）
└── shared-text.txt      # 共享文本的存储文件（首次保存时自动创建）
```

---

## 🔌 API 接口

| 方法 | 路径 | 说明 | 参数 / 返回 |
| --- | --- | --- | --- |
| `GET` | `/api/files` | 获取文件列表 | `[{ name, filename, size, sizeBytes, uploadTime }]`，最新在前 |
| `POST` | `/api/upload` | 上传文件 | `multipart/form-data`，字段名 `files`，可传多个 |
| `GET` | `/api/download/:filename` | 下载文件 | 以附件形式返回，自动还原中文文件名 |
| `DELETE` | `/api/files/:filename` | 删除文件 | `{ success, message }` |
| `GET` | `/api/text` | 读取共享文本 | `{ content, lastModified, exists }` |
| `POST` | `/api/text` | 保存共享文本 | JSON `{ content }` |
| `DELETE` | `/api/text` | 清空共享文本 | `{ success, message }` |

另外提供两个静态目录：`/` → `public/`，`/files` → `uploads/`。

---

## ⚙️ 配置

### 修改端口

推荐用环境变量临时指定，不用改代码：

```bash
PORT=3100 npm start        # macOS / Linux
$env:PORT=3100; npm start  # Windows PowerShell
```

想改默认值就编辑 `server.js`：

```javascript
const PORT = Number(process.env.PORT) || 3000;  // 把 3000 改成想要的默认端口
```

### 修改单文件大小限制

编辑 `server.js`：

```javascript
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 }  // 1GB
});
```

同时建议把 `public/index.html` 里「单个文件最大 500MB」的提示文字一起改掉。

---

## ❓ 常见问题

| 问题 | 原因与解决 |
| --- | --- |
| 手机访问不了 | 不在同一 WiFi；Windows 防火墙拦截 Node.js；路由器开了 AP 隔离 |
| 启动报 `EADDRINUSE` | 3000 端口被占用。用 `netstat -ano \| findstr :3000` 查占用进程，或改 `PORT` |
| 启动报 `Cannot find module 'express'` | 没装依赖，在项目目录执行 `npm install` |
| 双击 `start-server.bat` 一闪而过 | 目录里没有 `node_modules`，或 bat 内的路径指向了别处 |
| 上传大文件失败 | 超过 500MB 限制；部分手机浏览器自身也有限制 |
| 文件名显示乱码 | 服务端已按 UTF-8 处理原始文件名；如仍异常请提 Issue 并附上文件名 |
| Git 里中文文件名显示成 `\xxx` | 执行 `git config --global core.quotepath false` |

---

## 🔒 安全说明

- 本项目**没有任何身份验证**：同一局域网内知道地址的任何人都能上传、下载、删除文件，也能修改共享文本。
- **仅建议在可信内网临时使用，不要直接暴露到公网**（不要做端口映射 / 内网穿透后长期开放）。
- 如果确实需要公网访问，请自行加一层防护：反向代理 + Basic Auth / HTTPS，或增加访问令牌校验。
- 上传的文件原样保存在 `uploads/`，服务端不做类型与内容校验，请勿上传来源不明的文件后随意分发。
- 服务端已对文件名的 URL 参数做校验（拒绝 `../` 这类路径穿越写法，只允许操作 `uploads/` 目录内的文件），但这**不等于安全**：接口本身仍然没有任何鉴权。

---

## 🛠 技术栈

- **后端**：Node.js + Express 4 + Multer 1.4
- **前端**：原生 HTML / CSS / JavaScript（单文件，无构建步骤）
- **存储**：本地文件系统，无数据库
- **通信**：REST API + 定时轮询（未使用 WebSocket）

---

## 📄 开源协议

[MIT](https://opensource.org/licenses/MIT)
