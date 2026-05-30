# Chord Piano

Vite + React + TypeScript 编写的 Web 钢琴和弦识别工具。

## 运行

```bash
npm install
npm run dev
```

浏览器打开终端输出的本地地址即可使用，默认是 `http://127.0.0.1:5173/`。

## 构建与测试

```bash
npm test
npm run build
```

构建后的静态文件会输出到 `dist/`，可以用 `npm run preview` 本地预览。

## 钢琴音色

```bash
node scripts/generate-piano-samples.mjs
```

项目使用 `public/samples/piano/` 中的本地生成 WAV 采样播放钢琴音色。当前键盘范围内每个琴键都有独立采样；采样尚未加载完成时会回退到 Web Audio 合成音。

## 快捷键

- 低八度：`Z S X D C V G B H N J M`
- 中八度：`Q 2 W 3 E R 5 T 6 Y 7 U`
- 高八度：`Shift+Q Shift+2 Shift+W Shift+3 Shift+E Shift+R Shift+5 Shift+T Shift+6 Shift+Y Shift+7 Shift+U`
- `Esc` 清空已选音符
