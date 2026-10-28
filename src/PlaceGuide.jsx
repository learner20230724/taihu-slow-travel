import React from "react";
import {
  MapPin,
  ExternalLink,
  Footprints,
  Utensils,
  Clock3,
  CarFront,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { precisionLabels } from "./geo.js";

const text = (value) =>
  typeof value === "string"
    ? value
    : value?.text || value?.description || value?.detail || "";
function GuideList({ items, ordered = false }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {items.map((item, i) => (
        <li key={i}>
          {typeof item === "object" && item.title && (
            <strong>{item.title}</strong>
          )}
          {text(item)}
        </li>
      ))}
    </Tag>
  );
}

export function LocationEvidence({ p, compact = false }) {
  const source = p.coordinateSource;
  if (p.roadGeometry)
    return (
      <section className={`location-evidence ${compact ? "compact" : ""}`}>
        <div className="evidence-heading">
          <MapPin size={17} />
          <strong>道路范围已核实</strong>
          <span>实际道路，非单一入口</span>
        </div>
        <p>{p.address}</p>
        <p>
          地图展示OpenStreetMap原始道路几何，不用附近公园或估计点代替整段道路。具体停留入口需单独选择。
        </p>
        {p.roadGeometry.features.slice(0, compact ? 1 : 3).map((feature) => (
          <a
            key={
              feature.properties.osmId || feature.id || feature.properties.id
            }
            href={
              feature.properties.url ||
              feature.properties.sourceUrl ||
              `https://www.openstreetmap.org/way/${feature.properties.osmId || feature.properties.id}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            查看原始道路要素
            <ExternalLink size={12} />
          </a>
        ))}
      </section>
    );
  return (
    <section className={`location-evidence ${compact ? "compact" : ""}`}>
      <div className="evidence-heading">
        <MapPin size={17} />
        <strong>{p.coords ? "有来源的地点定位" : "此地点暂不落点"}</strong>
        <span>
          {p.coords ? precisionLabels[source.precision] : "定位待核实"}
        </span>
      </div>
      {p.address && <p className="place-address">{p.address}</p>}
      {p.coords ? (
        <>
          <p>
            {source.precision === "area"
              ? "地图点表示该区域的中心，不能当作停车场或入口。"
              : source.precision === "entrance"
                ? "原始地图标注指向入口；实际通行按现场标志。"
                : "原始地图POI标注点；具体入口、停车另看下方说明。"}
          </p>
          {!compact && (
            <div className="coordinate-facts">
              <span>
                原始坐标：{source.lng.toFixed(6)}, {source.lat.toFixed(6)} ·{" "}
                {source.system}
              </span>
              <span>匹配名称：{source.matchedName}</span>
            </div>
          )}
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            查看原始地图记录
            <ExternalLink size={12} />
          </a>
        </>
      ) : (
        <p>
          没有用区域估计值替代位置。可以阅读攻略，并按名称在地图中进一步核对。
        </p>
      )}
    </section>
  );
}

export default function PlaceGuide({ p }) {
  const g = p.guide;
  if (!g)
    return (
      <div className="detail-tip">
        <AlertCircle size={17} />
        <p>这一站正在补充逐项核实的游览资料。</p>
      </div>
    );
  const blocks = [
    ["highlights", "为什么值得停", "看点与地点特点", BookOpen],
    [
      "walk",
      "到这里怎么玩",
      "下面是建议玩法，按体力和现场开放调整",
      Footprints,
    ],
    ["bestTime", "什么时间来", "建议时段与季节", Clock3],
    ["parking", "入口、交通与停车", "未确认的停车信息会明确标出", CarFront],
    ["food", "这一带怎么吃", "选择与预算建议", Utensils],
    ["pairing", "附近怎么搭配", "避免把支线全部塞进一日环湖", MapPin],
    ["watchOut", "还有什么要留意", "开放、预约与实际游览边界", AlertCircle],
  ];
  return (
    <div className="practical-guide">
      {blocks
        .filter(([key]) => g[key])
        .map(([key, title, hint, Icon]) => (
          <section className={`guide-section guide-${key}`} key={key}>
            <div className="guide-section-heading">
              <Icon size={18} />
              <h3>{title}</h3>
            </div>
            <small>{hint}</small>
            {Array.isArray(g[key]) ? (
              <GuideList items={g[key]} ordered={key === "walk"} />
            ) : (
              <p>{text(g[key])}</p>
            )}
          </section>
        ))}
      <div className="guide-editor-note">
        游览步骤、停留时长和搭配是行程建议；地点与事实资料见下方来源，临时开放状态以当日公告为准。
      </div>
    </div>
  );
}
