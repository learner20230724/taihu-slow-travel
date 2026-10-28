import React, { useMemo, useRef, useState } from 'react';
import { Minus, Plus, LocateFixed, MoveUpRight } from 'lucide-react';
import shoreline from './shoreline.json';
import { categories, regions, placeById } from './data.js';

const project = ([lng,lat]) => [(lng-119.64)*820,(31.68-lat)*950];
const lake = shoreline.map(ring => ring.map((p,i) => `${i?'L':'M'}${project(p).map(v=>v.toFixed(1)).join(',')}`).join(' ')+'Z').join(' ');
const ringCoords = [[120.49,31.31],[120.40,31.40],[120.38,31.48],[120.30,31.55],[120.19,31.58],[120.09,31.55],[120.07,31.48],[120.04,31.41],[119.94,31.36],[119.88,31.27],[119.92,31.16],[119.97,31.06],[120.07,30.98],[120.22,30.96],[120.39,30.99],[120.49,31.05],[120.57,31.16],[120.51,31.22],[120.49,31.31]];
const ringLine = ringCoords.map((p,i)=>`${i?'L':'M'}${project(p).join(',')}`).join(' ');
const labels = [
  {id:'wuxi',p:[120.30,31.60],en:'WUXI'}, {id:'changzhou',p:[119.98,31.57],en:'CHANGZHOU'},
  {id:'yixing',p:[119.79,31.36],en:'YIXING'}, {id:'changxing',p:[119.84,31.04],en:'CHANGXING'},
  {id:'huzhou',p:[120.16,30.84],en:'HUZHOU'}, {id:'suzhou',p:[120.65,31.29],en:'SUZHOU'}
];
export default function LakeMap({ places, selected, onSelect, region, onRegion, direction, plan }) {
  const [zoom,setZoom]=useState(1); const [pan,setPan]=useState([0,0]); const drag=useRef(null); const svg=useRef(null);
  const small=typeof window!=='undefined'&&window.innerWidth<760;
  const view=useMemo(()=>{ const w=980/zoom,h=850/zoom;return [490-w/2+pan[0],425-h/2+pan[1],w,h]; },[zoom,pan]);
  const changeZoom = amount => setZoom(z=>Math.max(1,Math.min(2.8,z+amount)));
  function down(e){if(e.target.closest('[data-point]') || e.target.closest('[data-city]') || (e.pointerType==='touch'&&zoom===1))return; drag.current={x:e.clientX,y:e.clientY,pan:[...pan],moved:false};}
  function move(e){if(!drag.current)return; const box=svg.current.getBoundingClientRect();const dx=(e.clientX-drag.current.x)*view[2]/box.width,dy=(e.clientY-drag.current.y)*view[3]/box.height;if(Math.abs(dx)+Math.abs(dy)>5)drag.current.moved=true;setPan([Math.max(-280,Math.min(280,drag.current.pan[0]-dx)),Math.max(-240,Math.min(240,drag.current.pan[1]-dy))]);}
  const points=[...places].sort((a,b)=>(a.id===selected?2:a.featured?1:0)-(b.id===selected?2:b.featured?1:0));
  return <div className="map-wrap">
    <div className="map-heading"><span className="map-heading-dot"/> <span>环湖发现地图</span><span className="map-sublabel">点击圆点，发现下一站</span></div>
    <div className="map-canvas">
      <svg ref={svg} className="lake-map" viewBox={view.join(' ')} aria-label="太湖旅行分布示意图，可点击地点圆点" onPointerDown={down} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerLeave={()=>{drag.current=null;}}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M 80 0 L 0 0 0 80" fill="none" stroke="#bbc7b7" strokeWidth=".6" opacity=".4"/></pattern>
          <pattern id="water" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M3 19q8-5 16 0t16 0" fill="none" stroke="#85b7b0" strokeWidth=".6" opacity=".32"/></pattern>
          <linearGradient id="lake-fill" x2=".8" y2="1"><stop stopColor="#c4ded9"/><stop offset="1" stopColor="#dbe9df"/></linearGradient>
          <filter id="land-shadow"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#6d8d74" floodOpacity=".12"/></filter>
        </defs>
        <rect x="-500" y="-500" width="2000" height="1900" fill="#eef0e5"/><rect x="-500" y="-500" width="2000" height="1900" fill="url(#grid)"/>
        <g fill="none" stroke="#c7d3bc" strokeWidth="1" opacity=".55"><path d="M5 110Q150 30 290 120T380 390T200 600T20 700"/><path d="M-20 140Q160 80 250 155T320 390T180 570T-20 650"/><path d="M5 170Q140 110 220 180T280 390T140 540T-20 610"/><path d="M15 200Q130 140 190 210T240 390T100 510T-20 570"/><path d="M720 110Q950 90 940 350T1000 620"/><path d="M750 140Q920 130 910 350T980 660"/></g>
        <path d={lake} fill="url(#lake-fill)" stroke="#9abbab" strokeWidth="1.5" filter="url(#land-shadow)"/>
        <path d={lake} fill="url(#water)"/>
        <path d="M534 507 Q552 467 591 489 Q621 489 631 515 Q648 525 635 552 Q651 572 617 585 Q586 604 559 583 Q529 568 534 542 Q517 528 534 507Z" fill="#dbe3cf" stroke="#b5c6a9"/>
        <path d="M550 527Q584 499 617 528M548 544Q588 516 628 544M561 563Q592 540 623 560" fill="none" stroke="#bfcdb3" strokeWidth="1"/>
        <text x="581" y="551" textAnchor="middle" fill="#6d826a" fontSize="16">西山岛</text>
        <g transform="translate(462 358)" fill="#6a9791" textAnchor="middle"><text fontSize="57" letterSpacing="19" fontFamily="serif">太湖</text><text y="34" fontSize="14" letterSpacing="6">LAKE TAIHU</text><path d="M-22 60q11-9 22 0t22 0" fill="none" stroke="#8ab3a8" strokeWidth="2"/></g>
        <path d={ringLine} fill="none" stroke="#b4bfa3" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round"/>
        <g transform="translate(338 214) rotate(-18)"><rect x="-6" y="-25" width="112" height="31" rx="15" fill="#f9faf3" opacity=".9"/><text x="50" y="-5" fontSize="15" fill="#6f8265" textAnchor="middle">{direction==='ccw'?'↶ 逆时针':'↷ 顺时针'}</text></g>
        {labels.map(label=>{const [x,y]=project(label.p);const r=regions.find(r=>r.id===label.id);return <g key={label.id} data-city="true" role="button" tabIndex="0" aria-label={`筛选${r.name}`} onClick={()=>onRegion(region===r.id?'all':r.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onRegion(r.id);}}} className="city-label"><rect x={x-57} y={y-30} width="114" height="62" rx="15" fill={region===r.id?'#fff':'transparent'}/><text x={x} y={y-3} textAnchor="middle" fontSize={small?36:25} fontWeight="600" fill={region===r.id?'#235c4b':'#536456'}>{r.name}</text><text x={x} y={y+20} textAnchor="middle" fontSize={small?14:11} letterSpacing="2" fill="#7c8978">{label.en}</text></g>})}
        {points.map(p=>{const [x,y]=project(p.coords);const active=selected===p.id;const inPlan=plan.indexOf(p.id);const color=categories.find(c=>c.id===p.category)?.color;return <g key={p.id} data-point={p.id} className={`map-point ${active?'active':''}`} tabIndex="0" role="button" aria-label={`在地图上查看${p.name}`} onClick={()=>onSelect(p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p.id);}}}>
          <title>{p.name} · {p.city}</title><circle cx={x} cy={y} r="22" fill="transparent"/>
          {active&&<circle cx={x} cy={y} r="23" fill={color} opacity=".15"/>}
          <circle cx={x} cy={y} r={active?12:inPlan>=0?10:p.featured?7:5} fill={inPlan>=0?'#235c4b':color} stroke="#fffef8" strokeWidth={active?4:2}/>
          {inPlan>=0&&<text x={x} y={y+4} fill="white" textAnchor="middle" fontSize="11" fontWeight="600">{inPlan+1}</text>}
          {(active || !small&&['mingzhu','xiangshan','yigao','moon','mingyue'].includes(p.id)&&region==='all')&&<g pointerEvents="none"><rect x={x+16} y={y-(small?23:15)} width={Math.min(p.name.length*(small?26:14)+20,small?360:210)} height={small?46:30} rx="9" fill="#fffffa" stroke={active?'#a1b7a3':'#e0e3d7'}/><text x={x+26} y={y+(small?8:5)} fontSize={small?26:14} fontWeight={active?600:400} fill="#40574a">{p.name}</text></g>}
        </g>})}
      </svg>
      <div className="map-compass"><span>N</span><MoveUpRight size={20} strokeWidth={1.3}/></div>
      <div className="map-scale"><span/><small>10 km 左右 · 分布示意</small></div>
      <div className="map-controls"><button aria-label="放大地图" onClick={()=>changeZoom(.35)} disabled={zoom>=2.8}><Plus size={18}/></button><button aria-label="缩小地图" onClick={()=>changeZoom(-.35)} disabled={zoom<=1}><Minus size={18}/></button><button aria-label="复位地图" onClick={()=>{setZoom(1);setPan([0,0]);}}><LocateFixed size={18}/></button></div>
    </div>
    <div className="map-footer"><span><i/> 湖岸风景</span><span><i className="orange"/> 美食歇脚</span><small>位置与环线为示意，出行请打开地点导航</small></div>
  </div>;
}
