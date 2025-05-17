## 项目介绍

该项目是一个基于 Vue 3 和 Vite 的聊天应用程序，使用 Pinia 进行状态管理。项目包含以下主要功能：

- 人脸识别登录和注册功能，使用 `FaceCapture` 组件和 `faceUtil.js` 工具
- 用户可以通过人脸识别登录或注册，登录后可以与 AI 助手进行聊天
- 聊天记录和用户信息存储在 Pinia 状态管理中，并持久化到本地存储
- 使用 `showdown` 库将 Markdown 转换为 HTML，并支持代码块高亮显示
- 包含多个 Vue 组件，如 `ChatSidebar.vue`、`MessageList.vue`、`UserInfo.vue` 等，用于实现不同的功能
- 使用 `vite` 进行开发和构建，配置文件为 `vite.config.js`
- 支持用户信息的详细查看和编辑功能
- 支持会话的创建、重命名和删除功能

## 主要功能介绍

### 人脸识别登录和注册

使用 `FaceCapture` 组件和 `faceUtil.js` 工具实现人脸识别登录和注册功能。用户可以通过摄像头捕捉人脸图像，并进行登录或注册操作。

### 聊天功能

用户登录后可以与 AI 助手进行聊天。聊天记录和用户信息存储在 Pinia 状态管理中，并持久化到本地存储。

### Markdown 转换

项目使用 `showdown` 库将 Markdown 转换为 HTML，并支持代码块高亮显示。用户可以在聊天中使用 Markdown 语法。

### Vue 组件

项目包含多个 Vue 组件，用于实现不同的功能：

- `ChatSidebar.vue`：侧边栏组件，显示会话列表和用户信息
- `MessageList.vue`：消息列表组件，显示聊天记录
- `UserInfo.vue`：用户信息组件，显示和编辑用户信息
- `FaceCapture.vue`：人脸捕捉组件，用于人脸识别登录和注册
- `CodeBlock.vue`：代码块组件，用于显示高亮的代码块

### 开发和构建

项目使用 `vite` 进行开发和构建，配置文件为 `vite.config.js`。开发者可以使用 `vite` 提供的命令进行开发、构建和预览。

### 用户信息管理

项目支持用户信息的详细查看和编辑功能。用户可以查看和编辑自己的个人信息，如姓名、年龄、电话等。

### 会话管理

项目支持会话的创建、重命名和删除功能。用户可以创建新的会话，重命名现有会话，或删除不需要的会话。

## 安装和使用

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 目录结构

```plaintext
├── public
│   └── vite.svg
├── src
│   ├── assets
│   │   ├── css
│   │   │   └── styles.css
│   │   └── vue.svg
│   ├── components
│   │   ├── ChatSidebar.vue
│   │   ├── CodeBlock.vue
│   │   ├── FaceCapture.vue
│   │   ├── MessageList.vue
│   │   └── UserInfo.vue
│   ├── router
│   │   └── index.js
│   ├── store
│   │   └── index.js
│   ├── utils
│   │   ├── api.js
│   │   └── faceUtil.js
│   ├── views
│   │   ├── Chat.vue
│   │   ├── Login.vue
│   │   └── Register.vue
│   ├── App.vue
│   ├── main.js
│   └── index.html
├── .gitignore
├── package.json
├── README.md
└── vite.config.js
```
