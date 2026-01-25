var E=Object.defineProperty;var _=(o,t,e)=>t in o?E(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var p=(o,t,e)=>_(o,typeof t!="symbol"?t+"":t,e);import{a as C}from"./vendor-react-B6hsS57p.js";import{j as h}from"./vendor-ui-ByzV59FU.js";import{f as $,j as N,B as L}from"./index-DQsDvQJH.js";import{w as k,x as D,X as A}from"./vendor-utils-BrozDBOM.js";const w=[{id:"save",name:"保存",description:"保存当前项目",category:"general",keys:["Ctrl","S"],action:"save",enabled:!0,isDefault:!0},{id:"save_as",name:"另存为",description:"将项目另存为新文件",category:"general",keys:["Ctrl","Shift","S"],action:"saveAs",enabled:!0,isDefault:!0},{id:"undo",name:"撤销",description:"撤销上一步操作",category:"general",keys:["Ctrl","Z"],action:"undo",enabled:!0,isDefault:!0},{id:"redo",name:"重做",description:"重做上一步撤销的操作",category:"general",keys:["Ctrl","Shift","Z"],action:"redo",enabled:!0,isDefault:!0},{id:"copy",name:"复制",description:"复制选中内容",category:"general",keys:["Ctrl","C"],action:"copy",enabled:!0,isDefault:!0},{id:"paste",name:"粘贴",description:"粘贴剪贴板内容",category:"general",keys:["Ctrl","V"],action:"paste",enabled:!0,isDefault:!0},{id:"cut",name:"剪切",description:"剪切选中内容",category:"general",keys:["Ctrl","X"],action:"cut",enabled:!0,isDefault:!0},{id:"select_all",name:"全选",description:"选择所有内容",category:"general",keys:["Ctrl","A"],action:"selectAll",enabled:!0,isDefault:!0},{id:"search",name:"搜索",description:"打开搜索面板",category:"general",keys:["Ctrl","F"],action:"search",enabled:!0,isDefault:!0},{id:"command_palette",name:"命令面板",description:"打开命令面板",category:"general",keys:["Ctrl","Shift","P"],action:"commandPalette",enabled:!0,isDefault:!0},{id:"nav_chapters",name:"章节编辑器",description:"切换到章节编辑器",category:"navigation",keys:["Ctrl","1"],action:"navChapters",enabled:!0,isDefault:!0},{id:"nav_script",name:"剧本编辑器",description:"切换到剧本编辑器",category:"navigation",keys:["Ctrl","2"],action:"navScript",enabled:!0,isDefault:!0},{id:"nav_storyboard",name:"分镜编辑器",description:"切换到分镜编辑器",category:"navigation",keys:["Ctrl","3"],action:"navStoryboard",enabled:!0,isDefault:!0},{id:"nav_assets",name:"素材库",description:"切换到素材库",category:"navigation",keys:["Ctrl","4"],action:"navAssets",enabled:!0,isDefault:!0},{id:"nav_style",name:"导演风格",description:"切换到导演风格",category:"navigation",keys:["Ctrl","5"],action:"navStyle",enabled:!0,isDefault:!0},{id:"nav_prev",name:"上一个",description:"切换到上一个分镜/场景",category:"navigation",keys:["Alt","ArrowLeft"],action:"navPrev",enabled:!0,isDefault:!0},{id:"nav_next",name:"下一个",description:"切换到下一个分镜/场景",category:"navigation",keys:["Alt","ArrowRight"],action:"navNext",enabled:!0,isDefault:!0},{id:"new_panel",name:"新建分镜",description:"在当前位置新建分镜",category:"storyboard",keys:["Ctrl","N"],action:"newPanel",enabled:!0,isDefault:!0},{id:"duplicate_panel",name:"复制分镜",description:"复制当前分镜",category:"storyboard",keys:["Ctrl","D"],action:"duplicatePanel",enabled:!0,isDefault:!0},{id:"delete_panel",name:"删除分镜",description:"删除当前分镜",category:"storyboard",keys:["Delete"],action:"deletePanel",enabled:!0,isDefault:!0},{id:"generate_image",name:"生成图片",description:"为当前分镜生成图片",category:"storyboard",keys:["Ctrl","G"],action:"generateImage",enabled:!0,isDefault:!0},{id:"regenerate_image",name:"重新生成",description:"重新生成当前分镜图片",category:"storyboard",keys:["Ctrl","Shift","G"],action:"regenerateImage",enabled:!0,isDefault:!0},{id:"edit_prompt",name:"编辑提示词",description:"编辑当前分镜的提示词",category:"storyboard",keys:["Ctrl","E"],action:"editPrompt",enabled:!0,isDefault:!0},{id:"check_continuity",name:"连贯性检测",description:"运行分镜连贯性检测",category:"storyboard",keys:["Ctrl","Shift","C"],action:"checkContinuity",enabled:!0,isDefault:!0},{id:"play_pause",name:"播放/暂停",description:"播放或暂停预览",category:"playback",keys:["Space"],action:"playPause",enabled:!0,isDefault:!0},{id:"stop",name:"停止",description:"停止播放并回到开始",category:"playback",keys:["Escape"],action:"stop",enabled:!0,isDefault:!0},{id:"frame_prev",name:"上一帧",description:"后退一帧",category:"playback",keys:["ArrowLeft"],action:"framePrev",enabled:!0,isDefault:!0},{id:"frame_next",name:"下一帧",description:"前进一帧",category:"playback",keys:["ArrowRight"],action:"frameNext",enabled:!0,isDefault:!0},{id:"go_start",name:"跳到开始",description:"跳转到时间轴开始",category:"playback",keys:["Home"],action:"goStart",enabled:!0,isDefault:!0},{id:"go_end",name:"跳到结束",description:"跳转到时间轴结束",category:"playback",keys:["End"],action:"goEnd",enabled:!0,isDefault:!0},{id:"zoom_in",name:"放大",description:"放大视图",category:"view",keys:["Ctrl","="],action:"zoomIn",enabled:!0,isDefault:!0},{id:"zoom_out",name:"缩小",description:"缩小视图",category:"view",keys:["Ctrl","-"],action:"zoomOut",enabled:!0,isDefault:!0},{id:"zoom_fit",name:"适应窗口",description:"缩放以适应窗口",category:"view",keys:["Ctrl","0"],action:"zoomFit",enabled:!0,isDefault:!0},{id:"fullscreen",name:"全屏",description:"切换全屏模式",category:"view",keys:["F11"],action:"fullscreen",enabled:!0,isDefault:!0},{id:"toggle_sidebar",name:"切换侧边栏",description:"显示/隐藏侧边栏",category:"view",keys:["Ctrl","B"],action:"toggleSidebar",enabled:!0,isDefault:!0},{id:"toggle_timeline",name:"切换时间轴",description:"显示/隐藏时间轴",category:"view",keys:["Ctrl","T"],action:"toggleTimeline",enabled:!0,isDefault:!0},{id:"ai_suggest",name:"AI建议",description:"获取AI分镜建议",category:"tools",keys:["Ctrl","Shift","A"],action:"aiSuggest",enabled:!0,isDefault:!0},{id:"style_mixer",name:"风格混合器",description:"打开风格混合器",category:"tools",keys:["Ctrl","Shift","M"],action:"styleMixer",enabled:!0,isDefault:!0},{id:"export",name:"导出",description:"导出项目",category:"tools",keys:["Ctrl","Shift","E"],action:"export",enabled:!0,isDefault:!0}];class M{constructor(){p(this,"bindings",new Map);p(this,"handlers",new Map);p(this,"storageKey","keyboard_shortcuts");p(this,"enabled",!0);this.loadBindings(),this.setupGlobalListener()}loadBindings(){w.forEach(t=>{this.bindings.set(t.id,{...t})});try{const t=localStorage.getItem(this.storageKey);t&&JSON.parse(t).forEach(a=>{if(a.id&&this.bindings.has(a.id)){const i=this.bindings.get(a.id);this.bindings.set(a.id,{...i,...a,isDefault:!1})}})}catch{}}saveBindings(){try{const t=Array.from(this.bindings.values()).filter(e=>!e.isDefault).map(e=>({id:e.id,keys:e.keys,enabled:e.enabled}));localStorage.setItem(this.storageKey,JSON.stringify(t))}catch{}}setupGlobalListener(){typeof window>"u"||window.addEventListener("keydown",t=>{if(!this.enabled)return;const e=t.target,a=e.tagName==="INPUT"||e.tagName==="TEXTAREA"||e.isContentEditable,i=this.normalizeEvent(t),l=this.findMatchingBinding(i);if(l){if(a&&!["save","undo","redo","command_palette"].includes(l.id))return;t.preventDefault(),this.executeAction(l.action,t)}})}normalizeEvent(t){return{key:t.key,code:t.code,ctrl:t.ctrlKey,shift:t.shiftKey,alt:t.altKey,meta:t.metaKey}}findMatchingBinding(t){for(const e of this.bindings.values())if(e.enabled&&this.matchesKeys(t,e.keys))return e;return null}matchesKeys(t,e){const a=e.map(d=>d.toLowerCase()),i=a.includes("ctrl")||a.includes("control"),l=a.includes("shift"),r=a.includes("alt"),f=a.includes("meta")||a.includes("cmd");if(t.ctrl!==i||t.shift!==l||t.alt!==r||t.meta!==f)return!1;const s=a.find(d=>!["ctrl","control","shift","alt","meta","cmd"].includes(d));if(!s)return!1;const c=t.key.toLowerCase(),n=t.code.toLowerCase();return c===s||n===s||n===`key${s}`||n===`digit${s}`}executeAction(t,e){const a=this.handlers.get(t);a&&a.forEach(i=>i(e))}registerHandler(t,e){return this.handlers.has(t)||this.handlers.set(t,new Set),this.handlers.get(t).add(e),()=>{var a;(a=this.handlers.get(t))==null||a.delete(e)}}getAllBindings(){return Array.from(this.bindings.values())}getBindingsByCategory(t){return this.getAllBindings().filter(e=>e.category===t)}updateBinding(t,e){const a=this.bindings.get(t);return!a||this.checkConflict(e,t)?!1:(a.keys=e,a.isDefault=!1,this.saveBindings(),!0)}resetBinding(t){const e=w.find(a=>a.id===t);e&&(this.bindings.set(t,{...e}),this.saveBindings())}resetAllBindings(){this.bindings.clear(),w.forEach(t=>{this.bindings.set(t.id,{...t})}),localStorage.removeItem(this.storageKey)}setBindingEnabled(t,e){const a=this.bindings.get(t);a&&(a.enabled=e,this.saveBindings())}checkConflict(t,e){for(const a of this.bindings.values())if(!(e&&a.id===e)&&a.enabled&&this.keysEqual(a.keys,t))return a;return null}keysEqual(t,e){if(t.length!==e.length)return!1;const a=t.map(l=>l.toLowerCase()).sort(),i=e.map(l=>l.toLowerCase()).sort();return a.every((l,r)=>l===i[r])}setEnabled(t){this.enabled=t}formatKeys(t){const e=typeof navigator<"u"&&/Mac/.test(navigator.platform);return t.map(a=>{const i=a.toLowerCase();return i==="ctrl"||i==="control"?e?"⌃":"Ctrl":i==="shift"?e?"⇧":"Shift":i==="alt"?e?"⌥":"Alt":i==="meta"||i==="cmd"?e?"⌘":"Win":i==="arrowleft"?"←":i==="arrowright"?"→":i==="arrowup"?"↑":i==="arrowdown"?"↓":i==="space"?"␣":i==="escape"?"Esc":i==="delete"?"Del":a.toUpperCase()}).join(e?"":"+")}}const G=new M;function x(o){return o<768?"mobile":o<1024?"tablet":"desktop"}function S(){return"ontouchstart"in window||navigator.maxTouchPoints>0||navigator.msMaxTouchPoints>0}function T(){const[o,t]=C.useState(()=>{const e=window.innerWidth,a=window.innerHeight,i=x(e);return{type:i,isMobile:i==="mobile",isTablet:i==="tablet",isDesktop:i==="desktop",width:e,height:a,isPortrait:a>e,isLandscape:e>a,isTouchDevice:S()}});return C.useEffect(()=>{const e=()=>{const l=window.innerWidth,r=window.innerHeight,f=x(l);t({type:f,isMobile:f==="mobile",isTablet:f==="tablet",isDesktop:f==="desktop",width:l,height:r,isPortrait:r>l,isLandscape:l>r,isTouchDevice:S()})};let a;const i=()=>{clearTimeout(a),a=setTimeout(e,150)};return window.addEventListener("resize",i),window.addEventListener("orientationchange",e),()=>{window.removeEventListener("resize",i),window.removeEventListener("orientationchange",e),clearTimeout(a)}},[]),o}const B=N("relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",{variants:{variant:{default:"bg-card text-card-foreground",destructive:"text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90"}},defaultVariants:{variant:"default"}});function I({className:o,variant:t,...e}){return h.jsx("div",{"data-slot":"alert",role:"alert",className:$(B({variant:t}),o),...e})}function j({className:o,...t}){return h.jsx("div",{"data-slot":"alert-title",className:$("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",o),...t})}function z({className:o,...t}){return h.jsx("div",{"data-slot":"alert-description",className:$("text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",o),...t})}function H({page:o="storyboard",onDismiss:t,dismissible:e=!0}){const a=T();if(a.isDesktop)return null;const l={storyboard:{title:"移动端提示",description:a.isMobile?"分镜编辑功能已针对手机优化。为获得最佳体验，建议使用平板或电脑进行复杂编辑。":"分镜编辑功能在平板上运行良好。横屏使用可获得更好的体验。",icon:a.isMobile?k:D},script:{title:"移动端提示",description:a.isMobile?"剧本编辑已优化移动端体验。长文本编辑建议使用平板或电脑。":"剧本编辑在平板上运行良好。",icon:a.isMobile?k:D},assets:{title:"移动端提示",description:a.isMobile?"资源库已针对触摸操作优化。点击资源可查看详情。":"资源库在平板上运行良好。",icon:a.isMobile?k:D}}[o],r=l.icon;return h.jsx(I,{className:"mb-4 border-blue-200 bg-blue-50",children:h.jsxs("div",{className:"flex items-start gap-3",children:[h.jsx(r,{className:"w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"}),h.jsxs("div",{className:"flex-1 min-w-0",children:[h.jsx(j,{className:"text-blue-900 font-semibold mb-1",children:l.title}),h.jsx(z,{className:"text-blue-700 text-sm",children:l.description})]}),e&&t&&h.jsx(L,{variant:"ghost",size:"icon",onClick:t,className:"w-8 h-8 flex-shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100",children:h.jsx(A,{className:"w-4 h-4"})})]})})}function V(o,t){const e=new Blob([o],{type:"text/plain;charset=utf-8"}),a=URL.createObjectURL(e),i=document.createElement("a");i.href=a,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(a)}function W(o,t){var c;let e="";e+=`# ${((c=t.metadata)==null?void 0:c.title)||o.title}

`,t.metadata?(e+=`> **编剧**: ${t.metadata.author||"未署名"}  
`,e+=`> **稿号**: ${t.metadata.draft||"初稿"}  
`,e+=`> **日期**: ${t.metadata.draftDate||new Date().toLocaleDateString("zh-CN")}  
`,t.metadata.logline&&(e+=`> **故事概要**: ${t.metadata.logline}  
`)):e+=`> 导出时间：${new Date().toLocaleString("zh-CN")}
`,e+=`
---

`;const a=t.scenes.length,i=new Set(t.scenes.map(n=>n.episodeNumber||1)),l=t.scenes.reduce((n,d)=>n+(d.estimatedDuration||0),0),r=Math.floor(l/60),f=l%60,s=t.scenes.reduce((n,d)=>n+d.dialogues.length,0);return e+=`## 📊 统计信息

`,e+=`| 项目 | 数值 |
`,e+=`|------|------|
`,e+=`| 总场景数 | ${a} |
`,e+=`| 总集数 | ${i.size} |
`,e+=`| 总对白数 | ${s} |
`,e+=`| 预计时长 | ${r}分${f}秒 |

`,e+=`---

`,e+=`## 📝 剧本内容

`,t.scenes.forEach((n,d)=>{let g=`### 场景 ${n.sceneNumber}`;n.specialSceneType&&(g+=` [${n.specialSceneType}]`),e+=`${g}

`;let u=n.slugline||`${n.sceneType}. ${n.location}`;n.subLocation&&(u+=` - ${n.subLocation}`),u+=` - ${n.timeOfDay}`,n.continuity&&(u+=` (${n.continuity})`),e+=`**${u}**

`,e+=`- 集数：第${n.episodeNumber}集
`,e+=`- 预估时长：${n.estimatedDuration||0}秒
`,n.characters.length>0&&(e+=`- 出场角色：${n.characters.join("、")}
`),n.beat&&(e+=`- 🎭 **节拍**: ${n.beat}
`),e+=`
`,n.action&&(e+=`#### 动作描述

`,e+=`${n.action}

`),n.dialogues.length>0&&(e+=`#### 对话

`,n.dialogues.forEach(m=>{let y=m.character;m.isFirstAppearance&&(y=y.toUpperCase());let b="";m.extension?b=` (${m.extension})`:m.isContinued&&(b=" (CONT'D)"),e+=`**${y}${b}**`,m.parenthetical&&(e+=` *(${m.parenthetical})*`),e+=`

`,e+=`> ${m.lines}

`})),n.notes&&(e+=`> 💡 **编剧备注**: ${n.notes}

`),n.transition&&d<t.scenes.length-1&&(e+=`*${n.transition}*

`),e+=`---

`}),e+=`
**剧终**
`,e}function X(o,t){var c;let e="";const i=(n,d=60)=>{const g=Math.max(0,Math.floor((d-n.length)/2));return" ".repeat(g)+n},l=(n,d=60)=>{const g=Math.max(0,d-n.length);return" ".repeat(g)+n};e+=`


`,e+=i(((c=t.metadata)==null?void 0:c.title)||o.title)+`

`,e+=i("剧本")+`


`,t.metadata?(t.metadata.author&&(e+=i(`编剧：${t.metadata.author}`)+`
`),e+=i(`${t.metadata.draft||"初稿"} - ${t.metadata.draftDate||new Date().toLocaleDateString("zh-CN")}`)+`
`):e+=i(`导出时间：${new Date().toLocaleString("zh-CN")}`)+`
`,e+=`



`;const r=t.scenes.reduce((n,d)=>n+(d.estimatedDuration||0),0),f=Math.floor(r/60),s=r%60;return e+=`统计信息：
`,e+=`总场景数：${t.scenes.length}  `,e+=`总时长：${f}分${s}秒
`,e+=`

`,e+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`,t.scenes.forEach((n,d)=>{let g=`${n.sceneNumber}. ${n.sceneType}. ${n.location.toUpperCase()}`;if(n.subLocation&&(g+=` - ${n.subLocation.toUpperCase()}`),g+=` - ${n.timeOfDay.toUpperCase()}`,n.continuity&&(g+=` (${n.continuity})`),n.specialSceneType&&(e+=`${n.specialSceneType}:
`),e+=`${g}

`,n.action&&(e+=`${n.action}

`),n.dialogues.forEach(u=>{let m=u.character.toUpperCase();if(u.isFirstAppearance&&(m=m),u.extension?m+=` (${u.extension})`:u.isContinued&&(m+=" (CONT'D)"),e+=i(m)+`
`,u.parenthetical){const v=`(${u.parenthetical})`;e+=i(v)+`
`}const y=10;u.lines.split(`
`).forEach(v=>{v.trim()&&(e+=" ".repeat(y)+v+`
`)}),e+=`
`}),n.transition&&d<t.scenes.length-1){const u=`${n.transition}：`;e+=l(u)+`

`}e+=`
`}),e+=`

`+i("剧终")+`
`,e}function q(o,t,e="未命名项目"){let a="";const i=new Date().toLocaleString("zh-CN");P(e,t);const l={kling:{header:`# 可灵AI视频提示词
# 项目: ${e}
# 导出时间: ${i}
# 建议: 每条提示词150字以内，时长4-6秒最佳

`,format:s=>{const c=[];return s.shotSize&&c.push(s.shotSize),s.cameraMovement&&s.cameraMovement!=="静止"&&c.push(s.cameraMovement),s.description&&c.push(s.description.substring(0,100)),s.startFrame&&c.push(`从${s.startFrame}`),s.endFrame&&c.push(`到${s.endFrame}`),c.join("，")}},runway:{header:`# Runway Gen-3 视频提示词
# 项目: ${e}
# 导出时间: ${i}
# 建议: 使用英文效果更好，时长4-16秒

`,format:s=>{var n;const c=[];return s.description&&c.push(s.description),s.cameraMovement&&s.cameraMovement!=="静止"&&c.push(`camera: ${s.cameraMovement}`),s.motionSpeed&&c.push(`speed: ${s.motionSpeed}`),(n=s.soundEffects)!=null&&n.length&&c.push(`atmosphere: ${s.soundEffects.slice(0,2).join(", ")}`),c.join(". ")}},pika:{header:`# Pika Labs 视频提示词
# 项目: ${e}
# 导出时间: ${i}
# 建议: 3秒短视频，动作简洁

`,format:s=>{var n;const c=[];return s.description&&c.push(s.description.substring(0,80)),(n=s.characterActions)!=null&&n.length&&c.push(s.characterActions[0]),c.join("，")}},generic:{header:`# 通用视频提示词
# 项目: ${e}
# 导出时间: ${i}

`,format:s=>s.aiVideoPrompt||s.description||""}},{header:r,format:f}=l[t];return a+=r,o.forEach((s,c)=>{a+=`--- 分镜 ${s.panelNumber||c+1} ---
`,a+=`时长: ${s.duration||4}秒
`,a+=`提示词:
${f(s)}

`}),a}function P(o,t,e="txt"){const a=new Date,i=`${a.getFullYear()}${String(a.getMonth()+1).padStart(2,"0")}${String(a.getDate()).padStart(2,"0")}`;return`${o.replace(/[<>:"/\\|?*]/g,"_").substring(0,30)}_${t}_${i}.${e}`}function J(o,t="未命名项目"){const e=["分镜号","集数","场景","景别","角度","运镜","时长(秒)","画面描述","对白","角色","道具","音效","音乐","镜头","光圈","景深","起始帧","结束帧","备注","图像提示词","视频提示词"],a=o.map(r=>[r.panelNumber||"",r.episodeNumber||1,r.sceneId||"",r.shot||r.shotSize||"",r.angle||r.cameraAngle||"",r.cameraMovement||"",r.duration||3,(r.description||"").replace(/"/g,'""'),(r.dialogue||"").replace(/"/g,'""'),(r.characters||[]).join("、"),(r.props||[]).join("、"),(r.soundEffects||[]).join("、"),r.music||"",r.lens||"",r.fStop||"",r.depthOfField||"",(r.startFrame||"").replace(/"/g,'""'),(r.endFrame||"").replace(/"/g,'""'),(r.notes||"").replace(/"/g,'""'),(r.aiPrompt||"").replace(/"/g,'""'),(r.aiVideoPrompt||"").replace(/"/g,'""')]);return"\uFEFF"+[e.join(","),...a.map(r=>r.map(f=>`"${f}"`).join(","))].join(`
`)}function Y(o,t){const e=new Blob([o],{type:"text/csv;charset=utf-8"}),a=URL.createObjectURL(e),i=document.createElement("a");i.href=a,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(a)}export{H as M,X as a,J as b,Y as c,V as d,W as e,q as f,P as g,G as k,T as u};
