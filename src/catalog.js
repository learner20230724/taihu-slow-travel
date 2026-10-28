export const checkedAt = '2026-10-28';
export const regions = [
  { id: 'all', name: '整座太湖', short: '全部', subtitle: '六段湖岸，慢慢发现', color: '#286250' },
  { id: 'suzhou', name: '苏州', short: '苏州', subtitle: '古村、湖岛与落日', color: '#718a5b', center: [120.46, 31.19] },
  { id: 'wuxi', name: '无锡', short: '无锡', subtitle: '山水相依的北湖岸', color: '#477d6a', center: [120.22, 31.5] },
  { id: 'changzhou', name: '常州', short: '常州', subtitle: '太湖湾，停一停', color: '#a89865', center: [120.02, 31.48] },
  { id: 'yixing', name: '宜兴', short: '宜兴', subtitle: '陶都老街与茶竹山野', color: '#a27a65', center: [119.91, 31.35] },
  { id: 'changxing', name: '长兴', short: '长兴', subtitle: '公路、芦苇与茶香', color: '#6b927e', center: [119.98, 31.08] },
  { id: 'huzhou', name: '湖州', short: '湖州', subtitle: '溇港古村与南岸烟火', color: '#648895', center: [120.18, 30.94] }
];
export const categories = [
  { id: 'all', name: '全部发现', icon: 'Compass', color: '#286250' },
  { id: 'lake', name: '湖岸风景', icon: 'Waves', color: '#407e78' },
  { id: 'village', name: '古村老街', icon: 'House', color: '#a98157' },
  { id: 'nature', name: '山野散步', icon: 'TreePine', color: '#70864d' },
  { id: 'culture', name: '人文园林', icon: 'Landmark', color: '#967c96' },
  { id: 'food', name: '沿湖食单', icon: 'Utensils', color: '#c1884f' },
  { id: 'rest', name: '歇脚补给', icon: 'Coffee', color: '#829498' }
];
export const seasons = [
  { id: 'all', name: '四季皆可', months: '随时出发', title: '把时间留给湖边', desc: '看湖、走老街、吃一顿当地饭。一圈装不下的，留到下一次。', picks: ['mingzhu', 'xiangshan', 'moon'] },
  { id: 'spring', name: '春', months: '3—5月', title: '花开时，放慢一点', desc: '鼋头渚赏樱、蠡园寻春、东山品茶。花期随天气变化，热门花季给停车多留一点时间。', picks: ['yuantouzhu', 'liyuan', 'luxiang'] },
  { id: 'summer', name: '夏', months: '6—8月', title: '晨风和傍晚，比正午更好', desc: '湖边短走安排在早晚，中午找园林、展馆或餐厅歇脚。入夏果季适合东山、西山支线。', picks: ['bogo', 'ceramics', 'mingyue'] },
  { id: 'autumn', name: '秋', months: '9—11月', title: '一年里，最想绕湖的时候', desc: '湖岸散步、古村看秋色、尝一口蟹鲜。长兴银杏通常晚秋更有看头，别把季节预期当即时花情。', picks: ['badu', 'yigao', 'mingzhu'] },
  { id: 'winter', name: '冬', months: '12—2月', title: '一碗热汤，把旅行暖起来', desc: '藏书羊肉、湖州千张包，配一段晴天湖岸。下雨就把长时间户外换成陶瓷馆和老街短走。', picks: ['yangrou', 'dinglianfang', 'ceramics'] }
];

const S = {
  lihu: { title: '蠡湖风景区管理处', url: 'https://www.wxlihu.com/index.asp' },
  corridor: { title: '无锡市政府 · 太湖108廊道', url: 'https://www.wuxi.gov.cn/doc/2023/05/19/4011152.shtml' },
  mingzhu: { title: '无锡市政府 · 湖湾会客厅', url: 'https://www.wuxi.gov.cn/doc/2024/11/07/4427573.shtml' },
  ytz: { title: '鼋头渚景区官网', url: 'https://jp.ytz.com.cn/' },
  lingshan: { title: '无锡太湖国家旅游度假区', url: 'https://www.taihutour.com/' },
  nh: { title: '拈花湾官方票务', url: 'https://www.nianhuawan.com/ticket/' },
  hotel: { title: '君来酒店集团 · 湖滨饭店', url: 'https://www.junahotels.com/hbfd/' },
  xihe: { title: '携程 · 锡和景丽苑店', url: 'https://gs.ctrip.com/html5/you/foods/fooddetail/10/11877133.html' },
  fortune: { title: 'Trip.com · 好福气渔人码头店', url: 'https://tw.trip.com/restaurant/china/huzhou/detail/good-fortune-taihu-farmhouse-cuisine-16008887/' },
  yangrou: { title: '苏州文旅 · 羊肉寻鲜地图', url: 'https://visitsz.wglj.suzhou.com.cn/news-detail.aspx?id=1053' },
  snacks: { title: '湖州市妇联 · 衣裳街风味', url: 'https://sfl.huzhou.gov.cn/fgdt/flkx/20240603/i3773136.html' }
};

export const corePlaces = [
  { id: 'lihu', name: '蠡湖大桥公园', region: 'wuxi', category: 'lake', coords: [120.263,31.519], ring: 15, duration: [25,50], cost: [0,0], tags: ['轻松散步','亲子','湖景'], seasons: ['spring','summer','autumn','winter'], tagline: '吃完午饭，走到湖边去', summary: '桥、湖面与太湖之星组成一段轻松的城市湖岸。适合无锡午餐后散步，不用把时间全部交给大景区。', tip: '公园散步与摩天轮是不同体验；游乐项目另收费，运营情况到场核对。', source: S.lihu, nav: '无锡蠡湖大桥公园', featured: true },
  { id: 'bogo', name: '渤公岛生态公园', region: 'wuxi', category: 'lake', coords: [120.229,31.545], ring: 16, duration: [35,70], cost: [0,0], tags: ['轻松散步','亲子','湿地'], seasons: ['spring','summer','autumn','winter'], tagline: '桥和水岸之间，留一段空白', summary: '蠡湖开放式公园的一站。顺着步道看水、看芦苇，适合不赶行程的短步行，也能与渔父岛择一游览。', tip: '导航到公园停车入口，步行游览；不把园内慢行步道当机动车通道。', source: S.lihu, nav: '无锡渤公岛生态公园' },
  { id: 'yufu', name: '渔父岛 · 蠡湖之光', region: 'wuxi', category: 'lake', coords: [120.235,31.541], ring: 16.5, duration: [30,60], cost: [0,0], tags: ['日落','轻松散步','亲子'], seasons: ['spring','summer','autumn','winter'], tagline: '在蠡湖边，等一会儿光', summary: '开放的蠡湖岸线，适合傍晚慢走。与渤公岛相距不远，半日行程选择其中一段，就能减少停车和挪车。', tip: '喷泉不保证每天开放，喷泉表演以管理处当天公告为准。', source: S.lihu, nav: '无锡蠡湖之光', featured: true },
  { id: 'yuantouzhu', name: '鼋头渚', region: 'wuxi', category: 'culture', coords: [120.226,31.521], ring: 17, duration: [150,240], cost: [90,120], tags: ['赏花','园林','需要预约核对'], seasons: ['spring','autumn','winter'], tagline: '太湖佳处，值得专门留半天', summary: '半岛、湖山、园林和春日樱花，是无锡太湖的经典体验。想坐船或走得深入，需要比路边看湖多留时间。', tip: '建议预留半天。票种、船班、临时闭园和花情看官网，不沿用往年节庆时刻。', source: S.ytz, nav: '鼋头渚充山大门', branch: true, featured: true },
  { id: 'liyuan', name: '蠡园', region: 'wuxi', category: 'culture', coords: [120.257,31.515], ring: 17.5, duration: [70,120], cost: [30,60], tags: ['园林','赏花','轻松散步'], seasons: ['spring','summer','autumn'], tagline: '把江南园林，放在湖边看', summary: '亭廊、假山与蠡湖水面相映，是比赶多个大景区更从容的园林选择。春季看桃花，其他季节也适合沿廊慢走。', tip: '门票、游船和专类园可能分别收费，按当日票种确认。', source: { title: '携程 · 蠡园景区资料', url: 'https://you.ctrip.com/sight/wuxi10/1769.html' }, nav: '无锡蠡园', branch: true },
  { id: 'shibawan', name: '十八湾湖岸', region: 'wuxi', category: 'lake', coords: [120.153,31.548], ring: 19, duration: [15,35], cost: [0,0], tags: ['公路风景','湿地','轻松散步'], seasons: ['spring','summer','autumn','winter'], tagline: '一边山色，一边太湖', summary: '从无锡蠡湖前往马山的沿湖风景段。以车览为主，选一处正规停车点步行看湖，比每一湾都停更自在。', tip: '观景放在停车之后。不同湖岸入口、停车位置以现场管理为准。', source: S.corridor, nav: '无锡十八湾湿地公园', featured: true },
  { id: 'mingzhu', name: '十里明珠堤', region: 'wuxi', category: 'lake', coords: [120.119,31.491], ring: 20, duration: [25,50], cost: [0,0], tags: ['公路风景','看湖','轻松散步'], seasons: ['spring','summer','autumn','winter'], tagline: '不用进景区，也能把太湖看够', summary: '马山入口的一段开阔湖岸，休闲驿站让看湖、歇脚变得容易。适合环湖途中留一杯茶的时间。', tip: '导航碧玉螺岸驿站，寻找正规停车位；湖岸观景本身与停车收费分开。', source: S.mingzhu, nav: '十里明珠堤碧玉螺岸驿站', featured: true },
  { id: 'mashan', name: '马山环山西路', region: 'wuxi', category: 'lake', coords: [120.071,31.445], ring: 22, duration: [35,65], cost: [0,0], tags: ['公路风景','山湖','自驾'], seasons: ['spring','summer','autumn','winter'], tagline: '这段路，本身就是目的地', summary: '山与湖在马山半岛交替出现。选择一段环山公路慢慢开，比把灵山、拈花湾和整个环湖日全排在一起更合适。', tip: '完整绕马山会增加里程。这里的停留时间含短段车览，不能用作道路通行承诺。', source: S.lingshan, nav: '无锡马山环山西路', featured: true },
  { id: 'lingshan', name: '灵山胜境', region: 'wuxi', category: 'culture', coords: [120.101,31.422], ring: 23, duration: [180,300], cost: [180,240], tags: ['人文','建筑','半天起'], seasons: ['spring','summer','autumn','winter'], tagline: '把一整个上午，留给灵山', summary: '以大佛和佛教文化景观为核心，适合对建筑、人文有兴趣的一次专程游。园区较大，步行与游览需要体力。', tip: '建议单独安排半天以上。开放、票种及表演以景区当日信息为准。', source: S.lingshan, nav: '无锡灵山胜境', branch: true },
  { id: 'nianhua', name: '拈花湾', region: 'wuxi', category: 'culture', coords: [120.077,31.420], ring: 24, duration: [150,240], cost: [140,180], tags: ['夜游','建筑','亲子'], seasons: ['spring','summer','autumn','winter'], tagline: '这一晚，就在马山慢下来', summary: '适合傍晚到夜间的园林小镇体验。更适合马山专线或留宿旅行，安排进当日大环湖会明显挤压后续时间。', tip: '演出和夜游不承诺固定场次。出发前看官网当日开放和演出安排。', source: S.nh, nav: '无锡拈花湾景区', branch: true },
  { id: 'xihe', name: '锡和无锡菜 · 景丽苑店', region: 'wuxi', category: 'food', coords: [120.279,31.531], ring: 14, duration: [50,80], cost: [80,120], tags: ['锡帮菜','午餐','雨天可选'], seasons: ['spring','summer','autumn','winter'], tagline: '这一顿，尝尝无锡的甜与鲜', summary: '三白油条、四喜面筋和玉兰饼，是一份容易组合的无锡风味午餐。位于蠡湖附近居民区，饭后再去湖边散步。', tip: '平台参考人均约83元；这里给的是点菜预算。午市收市资料存在差异，12点前后到更从容。', source: S.xihe, nav: '锡和无锡菜景丽苑店', hours: '平台午市10:30起，末单时间请询店', phone: '0510-85125977', dishes: ['三白油条','四喜面筋','玉兰饼'], featured: true },
  { id: 'jinyuan', name: '湖滨饭店 · 锦苑中餐厅', region: 'wuxi', category: 'food', coords: [120.262,31.520], ring: 15.5, duration: [60,90], cost: [150,220], tags: ['锡帮菜','湖边午餐','雨天可选'], seasons: ['spring','summer','autumn','winter'], tagline: '一顿锡帮菜，接一段蠡湖散步', summary: '位于环湖路1号君来湖滨饭店，适合看重用餐环境、想在蠡湖片区从容停留的一餐。', tip: '官网午市11:15—15:00，晚市17:30—22:00。锦苑在B楼一层，别与高层渔餐厅混淆；湖景座位询店确认。', source: S.hotel, nav: '无锡君来湖滨饭店锦苑中餐厅', hours: '官网11:15—15:00 / 17:30—22:00', phone: '0510-85107766', dishes: ['无锡肉骨头','二冬面筋','桂花芋艿'] },
  { id: 'fortune', name: '好福气 · 渔人码头店', region: 'huzhou', category: 'food', coords: [120.110,30.956], ring: 62, duration: [60,90], cost: [80,130], tags: ['湖鲜','晚餐','湖岸'], seasons: ['spring','summer','autumn','winter'], tagline: '把晚饭，放在南太湖边', summary: '渔人码头F1—F4号楼的江浙菜选择，可以接月亮广场夜间散步。适合从西岸一路南下后的晚饭落点。', tip: '平台资料10:00—20:00、人均约82元，建议18点左右到。电话确认晚市、停车与末单；蟹和称重湖鲜另问总价。', source: S.fortune, nav: '湖州好福气渔人码头店', hours: '平台10:00—20:00；非实时营业状态', phone: '0572-2053899', dishes: ['清蒸白鱼','银鱼蒸蛋','红烧河杂鱼'], featured: true },
  { id: 'dinglianfang', name: '衣裳街 · 丁莲芳与湖州小吃', region: 'huzhou', category: 'food', coords: [120.101,30.865], ring: 63, duration: [50,90], cost: [25,60], tags: ['千张包','小吃','老字号'], seasons: ['spring','summer','autumn','winter'], tagline: '换一顿小吃，把城市也尝一口', summary: '衣裳街一带适合千张包、馄饨等小吃组合。想换掉湖鲜正餐时，可以把这里作为湖州城市支线。', tip: '从湖岸需额外进城，不是渔人码头旁。各店分开营业，地图中确认具体分店再出发。', source: S.snacks, nav: '湖州衣裳街丁莲芳', branch: true, dishes: ['千张包','湖州馄饨','定胜糕'] },
  { id: 'yangrou', name: '藏书羊肉美食街', region: 'suzhou', category: 'food', coords: [120.424,31.277], ring: 95, duration: [50,80], cost: [60,110], tags: ['秋冬','羊肉','热汤'], seasons: ['autumn','winter'], tagline: '回到苏州，用一碗羊汤收尾', summary: '木渎藏书一带的羊肉风味，适合秋冬环湖后的热乎一餐。可以点羊肉锅仔，搭配粉丝、白菜等。', tip: '这是美食街区，不是一家固定店。导航后按当天开门情况选店，避开把旧榜单当现价。', source: S.yangrou, nav: '苏州藏书羊肉美食街', branch: true, dishes: ['羊肉锅仔','羊糕','红烧羊肉'] }
];

export const foodNotes = [
  { title: '太湖三白', subtitle: '白鱼 · 白虾 · 银鱼', region: '沿湖各地', icon: 'Fish', text: '白鱼清蒸、白虾盐水、银鱼蒸蛋。两个人选其中一两样就好，午晚餐留点变化。', tags: ['清蒸白鱼','盐水白虾','银鱼蒸蛋'], source: S.hotel },
  { title: '无锡味道', subtitle: '咸中带甜，浓而不腻', region: '无锡', icon: 'Utensils', text: '酱排骨、面筋和小笼之外，也能尝三白油条与玉兰饼。想清淡一点，点菜时说明。', tags: ['酱排骨','四喜面筋','玉兰饼'], source: S.xihe },
  { title: '湖州小吃', subtitle: '不必每顿都是大餐', region: '湖州', icon: 'Soup', text: '千张包、馄饨和定胜糕，适合做一顿轻巧的城市小吃餐。进城时间要另外算。', tags: ['千张包','馄饨','定胜糕'], source: S.snacks },
  { title: '秋冬一锅暖', subtitle: '藏书的一碗羊汤', region: '苏州', icon: 'Flame', text: '羊肉锅仔配白菜、粉丝，再添一道白切羊肉。适合木渎出发或回程，不必特意绕远。', tags: ['羊肉锅仔','白切羊肉','羊糕'], source: S.yangrou }
];

export const routeTemplates = [
  { id: 'loop', title: '第一次，把太湖绕一圈', subtitle: '木渎出发 · 经典主环线', duration: '一整天', km: '330—400', hours: '12—15', color: 'green', kind: '一日环湖', intro: '午饭在无锡，晚饭在湖州。湖岸短停为主，把大景区留给下一次。', ids: ['xihe','lihu','mingzhu','xiangshan','fortune','moon','qidu'], anchor: 'suzhou', drive: '纯驾驶约7—9小时', note: '建议早晨出发，停留取建议时长下限，七都可仅途经。不要再叠加东山、西山或大景区；湖州晚饭后预留2—3小时回苏州。' },
  { id: 'north', title: '无锡，像看海一样看湖', subtitle: '蠡湖 → 十八湾 → 马山', duration: '半天', km: '45—75', hours: '4—6', color: 'blue', kind: '北岸看湖', intro: '不赶门票景点，留给湖风、堤岸和一顿锡帮菜。', ids: ['xihe','yufu','shibawan','mingzhu','mashan'], anchor: 'wuxi', drive: '片区内驾驶约1.5—2.5小时', note: '若从苏州出发，往返交通另计。时间紧就把渔父岛和十八湾择一停留。' },
  { id: 'south', title: '沿着南岸，慢慢过一天', subtitle: '长兴公路 → 湖州夜色', duration: '一整天', km: '65—100', hours: '7—9', color: 'sand', kind: '南岸慢游', intro: '驿站歇脚、溇港古村、湖鲜晚餐，把一天留在南太湖。', ids: ['xiangshan','tuying','moon','fortune','yigao'], anchor: 'changxing', drive: '片区内驾驶约2—3小时', note: '图影湿地若乘船，需核对船班与码头；想看月亮酒店夜景，可把义皋先安排在下午。' },
  { id: 'island', title: '西山岛，另开一章', subtitle: '太湖大桥 → 石公山 → 明月湾', duration: '一整天', km: '50—80', hours: '6—8', color: 'green', kind: '岛屿支线', intro: '这次不环大湖，只在岛上逛山、看湖、走古村。', ids: ['taihubridge','shigong','mingyue'], anchor: 'suzhou', drive: '岛内及大桥驾驶约1.5—2.5小时', note: '岛屿支线，不是大环湖的顺路小停。古村、景区收费和日落能见度出发前确认。' },
  { id: 'pottery', title: '宜兴，雨天也有好去处', subtitle: '陶瓷馆 → 蜀山古南街', duration: '半天', km: '15—35', hours: '4—5', color: 'clay', kind: '陶都人文', intro: '从陶器认识一座城，雨势小时再走走老街。', ids: ['ceramics','shushan'], anchor: 'yixing', drive: '片区内驾驶约0.5—1小时', note: '预约和闭馆日先查展馆。老街是户外街区，雨天不是完全室内路线。' },
  { id: 'dongshan', title: '东山，一半古村一半湖', subtitle: '陆巷古村 → 启园 → 杨湾', duration: '一整天', km: '40—70', hours: '6—8', color: 'sand', kind: '古村支线', intro: '找一段老巷，坐一会儿湖边。春茶、夏果、秋色各有不同。', ids: ['luxiang','qiyuan','yangwan'], anchor: 'suzhou', drive: '片区内驾驶约1.5—2.5小时', note: '选择两个重点就很舒服，别把所有古建都塞满。古村内部步行，停车在入口附近。' },
  { id: 'spring', title: '无锡的春天，不必赶场', subtitle: '鼋头渚 → 蠡湖 → 锡帮午餐', duration: '一整天', km: '20—40', hours: '6—8', color: 'pink', kind: '春日花事', intro: '半天赏花，半天湖边。花期出发前查，下午留给松弛。', ids: ['yuantouzhu','jinyuan','lihu'], anchor: 'wuxi', drive: '片区内驾驶约1小时，花季拥堵另计', note: '花期不固定，船班和入园要求看官网。不与当日大环湖叠加。' },
  { id: 'two-days', title: '两天一晚，终于不用赶', subtitle: '北岸湖景 → 南岸古村 → 苏州', duration: '两天一晚', km: '350—430', hours: '分两天', color: 'blue', kind: '两日环湖', intro: '第一天到湖州休息，第二天看溇港、走七都，慢慢回苏州。', ids: ['xihe','mingzhu','xiangshan','moon','fortune','yigao','qidu','yangrou'], anchor: 'suzhou', drive: '两天合计驾驶约8—10小时', note: '建议湖州或长兴住一晚，自行预订住宿。费用未含酒店，第二天可按体力再加一个支线。' }
];
