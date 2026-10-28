# 太湖慢游 · Taihu Field Notes

可反复使用的环太湖旅行手册：六段湖岸、69项详细攻略、12条主题路线。

- 网页：https://guihualab.cn/taihu/
- 规划 Lab：https://guihualab.cn/
- 源码：https://github.com/learner20230724/taihu-slow-travel

## 使用

在可缩放、拖动的真实道路地图上筛选地区、兴趣、季节和短停地点。每项攻略包含看点、三步建议走法、时间、入口交通与停车、餐饮、附近搭配及资料来源。手机点击标记直接打开完整攻略。

当前61项具有来源坐标，3项道路使用原始路段，另5项未取得可信定位而不落图。详情区分地图POI、区域中心和入口；区域中心不是停车场。可核对原始坐标、坐标系、匹配名称与原始地图记录。无法定位的地点仍可阅读攻略和按名称搜索。

主题路线可载入、排序、反转，复制或下载文字路书。道路计算由OSRM返回真实道路几何、距离和模型行车时间，可能包含高速或隧道，不代表沿湖偏好、实时交通和道路管制。缺少单一导航点时不自动猜入口；用户可明确选择只算已定位地点，结果会列出未计算部分。当前支持2至12个已定位点。

想去、已去、笔记与本次路线保存在同一origin的 `taihu-field-notes-v1`，保留初版43个稳定地点ID，不自动上传、不跨设备同步。提供JSON导出和合并导入；损坏数据不会被默认值覆盖。道路计算只在点击后发送所选地点坐标，不包含笔记与足迹。

## 地图与内容来源

核对日期：2026-10-28。事实资料见每个地点的来源链接。玩法、停留时长和搭配为编辑建议；票务、营业、停车收费和预约以当日官方或商家为准，未核实事项在正文标明。没有把旧的预算或开放时间猜测当成现行报价。

地图使用Leaflet及[OpenStreetMap](https://www.openstreetmap.org/copyright)标准瓦片，湖岸、岛屿和路网均来自实际底图。地点坐标保留原始来源和精度类型：OSM为WGS84；高德等明确采用GCJ-02的记录经迭代转换后才显示于WGS84底图，导航链接同时声明原坐标系。使用[coordtransform](https://github.com/wandergis/coordtransform)转换库。道路数据保留原始OSM要素与出处，不跨缺口虚构连接；OSM数据按ODbL使用。

本机地图服务仅转发太湖周边正常浏览产生的瓦片请求，固定上游、识别User-Agent、缓存并按上游有效期复用和条件重验证，遵循[瓦片使用政策](https://operations.osmfoundation.org/policies/tiles/)。无批量下载或离线地图功能。道路服务使用[OSRM](https://project-osrm.org/docs/v5.24.0/api/)；失败明确显示，不生成直线替代。公共上游不保证持续可用，详情另有高德、百度和原地图链接。

数据在 `src/content/{suzhou,northwest,south}.json`，实际道路在 `src/content/roads.json`，路线与季节内容在 `src/catalog.js`。`src/data.js`只根据有来源的记录生成显示坐标，不回退到旧估计值。详见[本次地图与内容修复记录](docs/map-content-v2.md)。

## 开发与验证

使用Node.js 24。本机地图服务需要Node的环境代理支持；不关闭TLS校验，不读取地图API私钥。

```sh
npm ci --include=dev
npm run dev
npm test
npm run build
npm run test:browser
```

开发地址 `http://127.0.0.1:4238/taihu/`；Vite将 `/api/taihu` 转发到本机4240端口。开发前启动地图服务，或运行 `node server/map-service.mjs` 并指定可写的 `TAIHU_MAP_CACHE`。本机使用受控的 `taihu-map.service`，缓存 `/var/cache/taihu-map`，监听loopback。代理仅供该服务访问固定地图上游使用；具体环境设置见部署unit。

单元检查覆盖原ID兼容、独立坐标纠错样例、GCJ-02转换、无来源不落点、真实道路分段、攻略完整度、瓦片缓存与重验证、上游失败、道路几何返回、筛选和记录备份。浏览器检查覆盖筛选、详细攻略、手机地图点击、路线排序和计算、收藏笔记刷新保留、导入导出、损坏记录、地图失败和320/393/768/1440宽布局。

批量UI回归使用明确标注的瓦片与路由模拟，避免重复访问地图上游；这些截图不作为导航预览。发布另在实际公网入口加载真实256像素瓦片、核对纠错地点、完成一次真实道路计算并检查手机。浏览器采用隔离合成记录，不读取用户的私人笔记。

## 部署

首次在本机安装 `deploy/taihu-map.service`，并根据实际路径及网络配置调整。按 `deploy/Caddyfile.snippet` 在实际 `/home/ubuntu/guihualab.Caddyfile` 中增量添加路由，先重新读取该配置、备份和验证，再热重载专用Caddy实例；保持其他站点和认证。

日常发布：

```sh
npm run deploy
```

该命令执行测试、构建、独立构建预览和UI回归，重启本项目地图服务，原子发布项目，验证公网HTML、资源、真实地图与道路计算，拍摄真实界面后更新规划Lab原卡片，构建并运行导航站规定检查，原子发布导航，最后从首页点击进入并验证手机地图和路线。

- 网站：`/var/www/taihu-slow-travel/releases/`，`current`原子切换。
- 导航源码：`/home/ubuntu/apps/guihua-lab/`，只更新本项目卡片和 `public/assets/taihu-slow-travel.png`。
- 导航发布：`/var/www/guihua-lab/releases/`，保留旧release。
- 后端：`server/map-service.mjs`，`taihu-map.service`，loopback4240。
- 公网API：`/api/taihu/tiles/...`、`/api/taihu/route`、`/api/taihu/health`。
- 证据：被Git忽略的 `test-results/`，含真实截图、浏览器和发布报告。

回滚时将本项目 `current` 原子切换至已确认的旧release，后端代码按对应版本恢复。保留其他站点、用户origin、存储键和个人记录。本项目为纯网页，不额外构建APK，不创建个人账号或自动调研定时器。
