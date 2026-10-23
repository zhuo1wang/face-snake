# 换脸贪吃蛇 · Face Snake

独立静态网页小游戏：经典贪吃蛇 + 自定义蛇头 / 食物照片。  
电脑与手机浏览器均可玩，**无后端**，图片仅存本机 `localStorage`。

## 本地运行

不要直接双击用 `file://` 打开（部分浏览器会限制模块脚本）。推荐：

```bash
cd face-snake
npx --yes serve .
```

浏览器打开终端里提示的地址（一般是 `http://localhost:3000`）。

或用 VS Code / Cursor 的 Live Server 打开 `index.html`。

## 操作

| 端 | 操作 |
|----|------|
| 电脑 | 方向键 / WASD |
| 手机 | 在棋盘上滑动，或点底部虚拟方向键 |
| 自定义 | 点「蛇头」「食物」上传照片，自动裁成圆形 |

## 目录

```
face-snake/
  index.html
  css/style.css
  js/main.js | game.js | input.js | avatar.js | storage.js
  docs/换脸贪吃蛇-方案.md
  README.md
```

默认蛇头 / 食物由 `avatar.js` 动态绘制，无需额外图片资源。

## 部署

把整个 `face-snake` 目录上传到任意静态托管即可：

- GitHub Pages / Cloudflare Pages / Nginx

确保以网站根或子路径正确引用相对路径的 `css/`、`js/`。
