import React from 'react';
export default function Scene({type='lake',region='wuxi',className=''}) {
  const food=type==='food', village=type==='village', mountain=type==='nature',culture=type==='culture';
  const colors=food?['#f4e5d0','#e9c59a','#ad845c']:village?['#f1eadc','#c9c8a7','#7e8b6e']:mountain?['#e1e9d8','#abc1a1','#6e8c6a']:culture?['#e9e4df','#c8b9ad','#918575']:['#e3ede5','#bed7cd','#7ca291'];
  return <svg className={`scene ${className}`} viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="480" height="270" fill={colors[0]}/><circle cx="370" cy="60" r="28" fill="#dfb77b" opacity=".6"/>
    {food?<><ellipse cx="240" cy="202" rx="136" ry="27" fill={colors[1]} opacity=".6"/><path d="M125 127Q240 86 355 127L334 188Q240 225 146 188Z" fill="#faf8ed" stroke={colors[2]} strokeWidth="2"/><ellipse cx="240" cy="128" rx="115" ry="32" fill="#fffdf3" stroke={colors[2]} strokeWidth="2"/><path d="M159 127Q219 91 304 124L323 112L318 149L303 136Q229 166 159 127Z" fill={colors[1]} stroke={colors[2]} strokeWidth="1.5"/><circle cx="175" cy="126" r="3" fill={colors[2]}/><path d="M210 111l-5 27m28-28l-5 28m28-26l-5 25M160 64l-3-17m34 15l3-23M277 63q-15-14 0-29m24 29q-15-14 0-29" stroke={colors[2]} opacity=".5" fill="none" strokeWidth="2"/><path d="M342 55l45 141m-31-147l45 141" stroke={colors[2]} strokeWidth="4" strokeLinecap="round"/></>:<>
    <path d="M-10 185Q70 98 156 137T299 130T500 152V270H0Z" fill={colors[1]}/><path d="M-10 217Q112 165 214 184T500 173V270H0Z" fill={colors[2]} opacity=".35"/>
    <path d="M0 217Q140 200 250 223T500 218V270H0Z" fill="#d7e6dd"/>
    {[231,246,260].map((y,i)=><path key={y} d={`M${i*40} ${y}q25-6 50 0t50 0m40 0q25-6 50 0t50 0m40 0q25-6 50 0t50 0`} fill="none" stroke={colors[2]} opacity=".25"/>)}
    {(village||culture)&&<g><path d="M95 158h110v61H95Z" fill="#faf7e9"/><path d="M80 158l70-40 70 40Z" fill={colors[2]}/><path d="M205 177h82v42h-82Z" fill="#eee8d7"/><path d="M195 177l50-32 50 32Z" fill={colors[2]} opacity=".9"/><path d="M135 180h25v39h-25Z" fill={colors[2]} opacity=".6"/><rect x="105" y="172" width="14" height="17" fill={colors[2]} opacity=".5"/>{culture&&<g stroke={colors[2]} fill="#f6f2e4"><path d="M328 117h35v96h-35Z"/><path d="M310 119h72l-36-25Z"/><path d="M315 157h62l-31-20Z"/></g>}</g>}
    {!(village||culture)&&<g stroke={colors[2]} strokeWidth="2" fill="none"><path d="M80 232q8-35-8-64m8 43q18-32 16-49m-15 50q-20-19-31-20m45 47q2-23 15-35"/><path d="M352 206q20 19 44 0m-34 0v-14h22v14m-45 0h74"/>{region==='huzhou'&&<path d="M199 190q-3-84 40-84t40 84h-16q8-63-24-63t-24 63Z" fill="#f5f3e8"/>}</g>}
    </>}
    <path d="M42 45q10-8 20 0m10-8q10-8 20 0" fill="none" stroke={colors[2]} strokeWidth="1.5" opacity=".5"/>
  </svg>;
}
