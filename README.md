# 太湖慢游 · Taihu Field Notes

一份可以反复使用的环太湖旅行网页：六段湖岸、43个发现、8条主题路线，帮助每一次出发换一点体验。

- 网页：**https://guihualab.cn/taihu/**
- 项目导航：**https://guihualab.cn/**
- 公开源码：https://github.com/learner20230724/taihu-slow-travel

## 可以做什么

- 点击太湖分布地图查看地点，按地区、兴趣、季节、短停、主线、未去过和想去筛选。
- 查看湖岸、公园、古村、山野、人文景点、歇脚点和食单；每个地点附资料来源、导航词、建议停留和预算。
- 使用一日环湖、北岸看湖、南岸慢游、西山、东山、陶都、春日赏花、两日环湖等路线。
- 将地点加入本次路线，上下调整、反转顺序，复制或下载含导航链接的文字路书。
- 保存想去、已去和个人笔记，导出/合并JSON备份。

## 内容与数据边界

资料核对日期为 **2026-10-28**。所有建议停留、餐饮预算与景点预算都是规划参考，不能当作实时路况、现行报价或营业确认。开放、预约、演出、花情、船班和餐厅末单，应出发前向官方或店方核对。

地图轮廓使用 [Natural Earth 10m lakes](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_lakes.geojson) 中的 Tai Hu 公共领域数据；岛屿、地形装饰与卡片插画是项目绘制的示意。地点坐标为区域近似位置，环线是方向示意，**不提供驾驶路由**。高德与百度链接均按地点名称搜索，进入地图后确认具体入口、停车点和当前可行道路。

内容数据位于 `src/catalog.js`、`src/researched-places.json` 和 `src/data.js`。每项的 `source.url` 可直接查阅。地方主线与需要额外交通/游览时间的支线明确区分，不将多个半天景点塞进一日大环湖。

个人记录仅保存在当前浏览器的 `taihu-field-notes-v1`，不上传、不跨设备同步。发布不改变 origin 和数据键。损坏存储不会被初始状态覆盖，保存失败会显式提示；用户可导出个人记录备份。导入合并收藏和足迹，已有笔记与非空路线优先保留。服务端备份不能包含尚未从浏览器导出的个人记录。

## 开发与检查

Node.js 22.12+，本机使用Node.js 24。

```sh
npm ci --include=dev
npm run dev
npm run test
npm run build
npm run test:browser
```

开发地址为 `http://127.0.0.1:4238/taihu/`。浏览器检查默认使用本机 `/usr/bin/google-chrome`；可通过 `CHROME_PATH` 指向已有Chromium。`TAIHU_URL` 可指定检查入口，默认本地开发入口。

单元检查覆盖地点与路线完整性、多条件筛选、导入防护、损坏存储和名称导航。浏览器检查覆盖真实点击、收藏/已去/笔记刷新保留、路线排序与反转、文本和JSON导出、备份合并、无效文件、地图、弹窗、手机导航和320/393/768/1440宽布局。检查使用隔离浏览器上下文和合成记录，不使用用户实际数据。

## 一条命令发布

在本机完成首次 Caddy 路由配置后：

```sh
npm run deploy
```

该命令依次执行数据检查、构建、独立本地构建预览与浏览器验收、项目原子发布、公网HTTPS和资源验证、规划 Lab 卡片与真实截图同步、导航构建及规定检查、导航原子发布，最后从公开首页实际点击项目入口并检查手机路线页。

- 项目发布目录：`/var/www/taihu-slow-travel/releases/`，`current` 为原子切换的软链接，保留旧release。
- 规划Lab源码：`/home/ubuntu/apps/guihua-lab/`；仅更新本项目卡片与 `public/assets/taihu-slow-travel.png`。
- 导航静态发布目录：`/var/www/guihua-lab/releases/`，保留旧release。
- 首次路由由专用 `/home/ubuntu/guihualab.Caddyfile` 的 `/taihu` 和 `/taihu/*` 处理，其余站点与认证保持原样。
- 首次修改前必须重新读取实际配置，增量添加并验证，再执行 `systemctl reload guihualab-caddy.service`。常规静态更新不需要重启服务。
- 发布报告与截图在忽略的 `test-results/` 中。

回滚时把对应项目的 `current` 原子切换到一个确认可用的旧release，不覆盖其他站点，不清空个人浏览器记录。

本项目为纯网页，不建立APK、AI推理后端、额外用户账号或自动更新调研定时器。后续维护按需更新资料日期和来源。
