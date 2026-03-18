# Moyu（龙虾摸鱼）

Web 端 2D 像素风放置小游戏：龙虾主角，自动产金币，商店升级，场景随购买变化。

## 运行

直接用浏览器打开：
- `index.html`

建议本地起一个静态服务器（避免某些浏览器的 module 限制）：

```bash
cd /home/worldedit/workspace/Moyu
python3 -m http.server 5173
```

然后打开：
- http://localhost:5173/

## 玩法
- 初始每 **5 秒 +10** 金币
- 右上角显示金币与自动收益
- 点击“商店”购买道具提升自动收益
- 离线收益最多补 **2 小时**

## 说明
- 当前像素素材为程序绘制占位，后续可替换 sprite。
