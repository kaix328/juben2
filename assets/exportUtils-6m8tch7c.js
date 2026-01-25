var k=Object.defineProperty;var D=(l,t,e)=>t in l?k(l,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[t]=e;var h=(l,t,e)=>D(l,typeof t!="symbol"?t+"":t,e);import"./vendor-react-DtVZVXYF.js";const $=[{id:"save",name:"保存",description:"保存当前项目",category:"general",keys:["Ctrl","S"],action:"save",enabled:!0,isDefault:!0},{id:"save_as",name:"另存为",description:"将项目另存为新文件",category:"general",keys:["Ctrl","Shift","S"],action:"saveAs",enabled:!0,isDefault:!0},{id:"undo",name:"撤销",description:"撤销上一步操作",category:"general",keys:["Ctrl","Z"],action:"undo",enabled:!0,isDefault:!0},{id:"redo",name:"重做",description:"重做上一步撤销的操作",category:"general",keys:["Ctrl","Shift","Z"],action:"redo",enabled:!0,isDefault:!0},{id:"copy",name:"复制",description:"复制选中内容",category:"general",keys:["Ctrl","C"],action:"copy",enabled:!0,isDefault:!0},{id:"paste",name:"粘贴",description:"粘贴剪贴板内容",category:"general",keys:["Ctrl","V"],action:"paste",enabled:!0,isDefault:!0},{id:"cut",name:"剪切",description:"剪切选中内容",category:"general",keys:["Ctrl","X"],action:"cut",enabled:!0,isDefault:!0},{id:"select_all",name:"全选",description:"选择所有内容",category:"general",keys:["Ctrl","A"],action:"selectAll",enabled:!0,isDefault:!0},{id:"search",name:"搜索",description:"打开搜索面板",category:"general",keys:["Ctrl","F"],action:"search",enabled:!0,isDefault:!0},{id:"command_palette",name:"命令面板",description:"打开命令面板",category:"general",keys:["Ctrl","Shift","P"],action:"commandPalette",enabled:!0,isDefault:!0},{id:"nav_chapters",name:"章节编辑器",description:"切换到章节编辑器",category:"navigation",keys:["Ctrl","1"],action:"navChapters",enabled:!0,isDefault:!0},{id:"nav_script",name:"剧本编辑器",description:"切换到剧本编辑器",category:"navigation",keys:["Ctrl","2"],action:"navScript",enabled:!0,isDefault:!0},{id:"nav_storyboard",name:"分镜编辑器",description:"切换到分镜编辑器",category:"navigation",keys:["Ctrl","3"],action:"navStoryboard",enabled:!0,isDefault:!0},{id:"nav_assets",name:"素材库",description:"切换到素材库",category:"navigation",keys:["Ctrl","4"],action:"navAssets",enabled:!0,isDefault:!0},{id:"nav_style",name:"导演风格",description:"切换到导演风格",category:"navigation",keys:["Ctrl","5"],action:"navStyle",enabled:!0,isDefault:!0},{id:"nav_prev",name:"上一个",description:"切换到上一个分镜/场景",category:"navigation",keys:["Alt","ArrowLeft"],action:"navPrev",enabled:!0,isDefault:!0},{id:"nav_next",name:"下一个",description:"切换到下一个分镜/场景",category:"navigation",keys:["Alt","ArrowRight"],action:"navNext",enabled:!0,isDefault:!0},{id:"new_panel",name:"新建分镜",description:"在当前位置新建分镜",category:"storyboard",keys:["Ctrl","N"],action:"newPanel",enabled:!0,isDefault:!0},{id:"duplicate_panel",name:"复制分镜",description:"复制当前分镜",category:"storyboard",keys:["Ctrl","D"],action:"duplicatePanel",enabled:!0,isDefault:!0},{id:"delete_panel",name:"删除分镜",description:"删除当前分镜",category:"storyboard",keys:["Delete"],action:"deletePanel",enabled:!0,isDefault:!0},{id:"generate_image",name:"生成图片",description:"为当前分镜生成图片",category:"storyboard",keys:["Ctrl","G"],action:"generateImage",enabled:!0,isDefault:!0},{id:"regenerate_image",name:"重新生成",description:"重新生成当前分镜图片",category:"storyboard",keys:["Ctrl","Shift","G"],action:"regenerateImage",enabled:!0,isDefault:!0},{id:"edit_prompt",name:"编辑提示词",description:"编辑当前分镜的提示词",category:"storyboard",keys:["Ctrl","E"],action:"editPrompt",enabled:!0,isDefault:!0},{id:"check_continuity",name:"连贯性检测",description:"运行分镜连贯性检测",category:"storyboard",keys:["Ctrl","Shift","C"],action:"checkContinuity",enabled:!0,isDefault:!0},{id:"play_pause",name:"播放/暂停",description:"播放或暂停预览",category:"playback",keys:["Space"],action:"playPause",enabled:!0,isDefault:!0},{id:"stop",name:"停止",description:"停止播放并回到开始",category:"playback",keys:["Escape"],action:"stop",enabled:!0,isDefault:!0},{id:"frame_prev",name:"上一帧",description:"后退一帧",category:"playback",keys:["ArrowLeft"],action:"framePrev",enabled:!0,isDefault:!0},{id:"frame_next",name:"下一帧",description:"前进一帧",category:"playback",keys:["ArrowRight"],action:"frameNext",enabled:!0,isDefault:!0},{id:"go_start",name:"跳到开始",description:"跳转到时间轴开始",category:"playback",keys:["Home"],action:"goStart",enabled:!0,isDefault:!0},{id:"go_end",name:"跳到结束",description:"跳转到时间轴结束",category:"playback",keys:["End"],action:"goEnd",enabled:!0,isDefault:!0},{id:"zoom_in",name:"放大",description:"放大视图",category:"view",keys:["Ctrl","="],action:"zoomIn",enabled:!0,isDefault:!0},{id:"zoom_out",name:"缩小",description:"缩小视图",category:"view",keys:["Ctrl","-"],action:"zoomOut",enabled:!0,isDefault:!0},{id:"zoom_fit",name:"适应窗口",description:"缩放以适应窗口",category:"view",keys:["Ctrl","0"],action:"zoomFit",enabled:!0,isDefault:!0},{id:"fullscreen",name:"全屏",description:"切换全屏模式",category:"view",keys:["F11"],action:"fullscreen",enabled:!0,isDefault:!0},{id:"toggle_sidebar",name:"切换侧边栏",description:"显示/隐藏侧边栏",category:"view",keys:["Ctrl","B"],action:"toggleSidebar",enabled:!0,isDefault:!0},{id:"toggle_timeline",name:"切换时间轴",description:"显示/隐藏时间轴",category:"view",keys:["Ctrl","T"],action:"toggleTimeline",enabled:!0,isDefault:!0},{id:"ai_suggest",name:"AI建议",description:"获取AI分镜建议",category:"tools",keys:["Ctrl","Shift","A"],action:"aiSuggest",enabled:!0,isDefault:!0},{id:"style_mixer",name:"风格混合器",description:"打开风格混合器",category:"tools",keys:["Ctrl","Shift","M"],action:"styleMixer",enabled:!0,isDefault:!0},{id:"export",name:"导出",description:"导出项目",category:"tools",keys:["Ctrl","Shift","E"],action:"export",enabled:!0,isDefault:!0}];class C{constructor(){h(this,"bindings",new Map);h(this,"handlers",new Map);h(this,"storageKey","keyboard_shortcuts");h(this,"enabled",!0);this.loadBindings(),this.setupGlobalListener()}loadBindings(){$.forEach(t=>{this.bindings.set(t.id,{...t})});try{const t=localStorage.getItem(this.storageKey);t&&JSON.parse(t).forEach(n=>{if(n.id&&this.bindings.has(n.id)){const i=this.bindings.get(n.id);this.bindings.set(n.id,{...i,...n,isDefault:!1})}})}catch{}}saveBindings(){try{const t=Array.from(this.bindings.values()).filter(e=>!e.isDefault).map(e=>({id:e.id,keys:e.keys,enabled:e.enabled}));localStorage.setItem(this.storageKey,JSON.stringify(t))}catch{}}setupGlobalListener(){typeof window>"u"||window.addEventListener("keydown",t=>{if(!this.enabled)return;const e=t.target,n=e.tagName==="INPUT"||e.tagName==="TEXTAREA"||e.isContentEditable,i=this.normalizeEvent(t),c=this.findMatchingBinding(i);if(c){if(n&&!["save","undo","redo","command_palette"].includes(c.id))return;t.preventDefault(),this.executeAction(c.action,t)}})}normalizeEvent(t){return{key:t.key,code:t.code,ctrl:t.ctrlKey,shift:t.shiftKey,alt:t.altKey,meta:t.metaKey}}findMatchingBinding(t){for(const e of this.bindings.values())if(e.enabled&&this.matchesKeys(t,e.keys))return e;return null}matchesKeys(t,e){const n=e.map(d=>d.toLowerCase()),i=n.includes("ctrl")||n.includes("control"),c=n.includes("shift"),o=n.includes("alt"),m=n.includes("meta")||n.includes("cmd");if(t.ctrl!==i||t.shift!==c||t.alt!==o||t.meta!==m)return!1;const r=n.find(d=>!["ctrl","control","shift","alt","meta","cmd"].includes(d));if(!r)return!1;const s=t.key.toLowerCase(),a=t.code.toLowerCase();return s===r||a===r||a===`key${r}`||a===`digit${r}`}executeAction(t,e){const n=this.handlers.get(t);n&&n.forEach(i=>i(e))}registerHandler(t,e){return this.handlers.has(t)||this.handlers.set(t,new Set),this.handlers.get(t).add(e),()=>{var n;(n=this.handlers.get(t))==null||n.delete(e)}}getAllBindings(){return Array.from(this.bindings.values())}getBindingsByCategory(t){return this.getAllBindings().filter(e=>e.category===t)}updateBinding(t,e){const n=this.bindings.get(t);return!n||this.checkConflict(e,t)?!1:(n.keys=e,n.isDefault=!1,this.saveBindings(),!0)}resetBinding(t){const e=$.find(n=>n.id===t);e&&(this.bindings.set(t,{...e}),this.saveBindings())}resetAllBindings(){this.bindings.clear(),$.forEach(t=>{this.bindings.set(t.id,{...t})}),localStorage.removeItem(this.storageKey)}setBindingEnabled(t,e){const n=this.bindings.get(t);n&&(n.enabled=e,this.saveBindings())}checkConflict(t,e){for(const n of this.bindings.values())if(!(e&&n.id===e)&&n.enabled&&this.keysEqual(n.keys,t))return n;return null}keysEqual(t,e){if(t.length!==e.length)return!1;const n=t.map(c=>c.toLowerCase()).sort(),i=e.map(c=>c.toLowerCase()).sort();return n.every((c,o)=>c===i[o])}setEnabled(t){this.enabled=t}formatKeys(t){const e=typeof navigator<"u"&&/Mac/.test(navigator.platform);return t.map(n=>{const i=n.toLowerCase();return i==="ctrl"||i==="control"?e?"⌃":"Ctrl":i==="shift"?e?"⇧":"Shift":i==="alt"?e?"⌥":"Alt":i==="meta"||i==="cmd"?e?"⌘":"Win":i==="arrowleft"?"←":i==="arrowright"?"→":i==="arrowup"?"↑":i==="arrowdown"?"↓":i==="space"?"␣":i==="escape"?"Esc":i==="delete"?"Del":n.toUpperCase()}).join(e?"":"+")}}const _=new C;function E(l,t){const e=new Blob([l],{type:"text/plain;charset=utf-8"}),n=URL.createObjectURL(e),i=document.createElement("a");i.href=n,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n)}function A(l,t){var s;let e="";e+=`# ${((s=t.metadata)==null?void 0:s.title)||l.title}

`,t.metadata?(e+=`> **编剧**: ${t.metadata.author||"未署名"}  
`,e+=`> **稿号**: ${t.metadata.draft||"初稿"}  
`,e+=`> **日期**: ${t.metadata.draftDate||new Date().toLocaleDateString("zh-CN")}  
`,t.metadata.logline&&(e+=`> **故事概要**: ${t.metadata.logline}  
`)):e+=`> 导出时间：${new Date().toLocaleString("zh-CN")}
`,e+=`
---

`;const n=t.scenes.length,i=new Set(t.scenes.map(a=>a.episodeNumber||1)),c=t.scenes.reduce((a,d)=>a+(d.estimatedDuration||0),0),o=Math.floor(c/60),m=c%60,r=t.scenes.reduce((a,d)=>a+d.dialogues.length,0);return e+=`## 📊 统计信息

`,e+=`| 项目 | 数值 |
`,e+=`|------|------|
`,e+=`| 总场景数 | ${n} |
`,e+=`| 总集数 | ${i.size} |
`,e+=`| 总对白数 | ${r} |
`,e+=`| 预计时长 | ${o}分${m}秒 |

`,e+=`---

`,e+=`## 📝 剧本内容

`,t.scenes.forEach((a,d)=>{let g=`### 场景 ${a.sceneNumber}`;a.specialSceneType&&(g+=` [${a.specialSceneType}]`),e+=`${g}

`;let u=a.slugline||`${a.sceneType}. ${a.location}`;a.subLocation&&(u+=` - ${a.subLocation}`),u+=` - ${a.timeOfDay}`,a.continuity&&(u+=` (${a.continuity})`),e+=`**${u}**

`,e+=`- 集数：第${a.episodeNumber}集
`,e+=`- 预估时长：${a.estimatedDuration||0}秒
`,a.characters.length>0&&(e+=`- 出场角色：${a.characters.join("、")}
`),a.beat&&(e+=`- 🎭 **节拍**: ${a.beat}
`),e+=`
`,a.action&&(e+=`#### 动作描述

`,e+=`${a.action}

`),a.dialogues.length>0&&(e+=`#### 对话

`,a.dialogues.forEach(f=>{let y=f.character;f.isFirstAppearance&&(y=y.toUpperCase());let p="";f.extension?p=` (${f.extension})`:f.isContinued&&(p=" (CONT'D)"),e+=`**${y}${p}**`,f.parenthetical&&(e+=` *(${f.parenthetical})*`),e+=`

`,e+=`> ${f.lines}

`})),a.notes&&(e+=`> 💡 **编剧备注**: ${a.notes}

`),a.transition&&d<t.scenes.length-1&&(e+=`*${a.transition}*

`),e+=`---

`}),e+=`
**剧终**
`,e}function L(l,t){var s;let e="";const i=(a,d=60)=>{const g=Math.max(0,Math.floor((d-a.length)/2));return" ".repeat(g)+a},c=(a,d=60)=>{const g=Math.max(0,d-a.length);return" ".repeat(g)+a};e+=`


`,e+=i(((s=t.metadata)==null?void 0:s.title)||l.title)+`

`,e+=i("剧本")+`


`,t.metadata?(t.metadata.author&&(e+=i(`编剧：${t.metadata.author}`)+`
`),e+=i(`${t.metadata.draft||"初稿"} - ${t.metadata.draftDate||new Date().toLocaleDateString("zh-CN")}`)+`
`):e+=i(`导出时间：${new Date().toLocaleString("zh-CN")}`)+`
`,e+=`



`;const o=t.scenes.reduce((a,d)=>a+(d.estimatedDuration||0),0),m=Math.floor(o/60),r=o%60;return e+=`统计信息：
`,e+=`总场景数：${t.scenes.length}  `,e+=`总时长：${m}分${r}秒
`,e+=`

`,e+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`,t.scenes.forEach((a,d)=>{let g=`${a.sceneNumber}. ${a.sceneType}. ${a.location.toUpperCase()}`;if(a.subLocation&&(g+=` - ${a.subLocation.toUpperCase()}`),g+=` - ${a.timeOfDay.toUpperCase()}`,a.continuity&&(g+=` (${a.continuity})`),a.specialSceneType&&(e+=`${a.specialSceneType}:
`),e+=`${g}

`,a.action&&(e+=`${a.action}

`),a.dialogues.forEach(u=>{let f=u.character.toUpperCase();if(u.isFirstAppearance&&(f=f),u.extension?f+=` (${u.extension})`:u.isContinued&&(f+=" (CONT'D)"),e+=i(f)+`
`,u.parenthetical){const b=`(${u.parenthetical})`;e+=i(b)+`
`}const y=10;u.lines.split(`
`).forEach(b=>{b.trim()&&(e+=" ".repeat(y)+b+`
`)}),e+=`
`}),a.transition&&d<t.scenes.length-1){const u=`${a.transition}：`;e+=c(u)+`

`}e+=`
`}),e+=`

`+i("剧终")+`
`,e}function N(l,t,e="未命名项目"){let n="";const i=new Date().toLocaleString("zh-CN");v(e,t);const c={kling:{header:`# 可灵AI视频提示词
# 项目: ${e}
# 导出时间: ${i}
# 建议: 每条提示词150字以内，时长4-6秒最佳

`,format:r=>{const s=[];return r.shotSize&&s.push(r.shotSize),r.cameraMovement&&r.cameraMovement!=="静止"&&s.push(r.cameraMovement),r.description&&s.push(r.description.substring(0,100)),r.startFrame&&s.push(`从${r.startFrame}`),r.endFrame&&s.push(`到${r.endFrame}`),s.join("，")}},runway:{header:`# Runway Gen-3 视频提示词
# 项目: ${e}
# 导出时间: ${i}
# 建议: 使用英文效果更好，时长4-16秒

`,format:r=>{var a;const s=[];return r.description&&s.push(r.description),r.cameraMovement&&r.cameraMovement!=="静止"&&s.push(`camera: ${r.cameraMovement}`),r.motionSpeed&&s.push(`speed: ${r.motionSpeed}`),(a=r.soundEffects)!=null&&a.length&&s.push(`atmosphere: ${r.soundEffects.slice(0,2).join(", ")}`),s.join(". ")}},pika:{header:`# Pika Labs 视频提示词
# 项目: ${e}
# 导出时间: ${i}
# 建议: 3秒短视频，动作简洁

`,format:r=>{var a;const s=[];return r.description&&s.push(r.description.substring(0,80)),(a=r.characterActions)!=null&&a.length&&s.push(r.characterActions[0]),s.join("，")}},generic:{header:`# 通用视频提示词
# 项目: ${e}
# 导出时间: ${i}

`,format:r=>r.aiVideoPrompt||r.description||""}},{header:o,format:m}=c[t];return n+=o,l.forEach((r,s)=>{n+=`--- 分镜 ${r.panelNumber||s+1} ---
`,n+=`时长: ${r.duration||4}秒
`,n+=`提示词:
${m(r)}

`}),n}function v(l,t,e="txt"){const n=new Date,i=`${n.getFullYear()}${String(n.getMonth()+1).padStart(2,"0")}${String(n.getDate()).padStart(2,"0")}`;return`${l.replace(/[<>:"/\\|?*]/g,"_").substring(0,30)}_${t}_${i}.${e}`}function B(l,t="未命名项目"){const e=["分镜号","集数","场景","景别","角度","运镜","时长(秒)","画面描述","对白","角色","道具","音效","音乐","镜头","光圈","景深","起始帧","结束帧","备注","图像提示词","视频提示词"],n=l.map(o=>[o.panelNumber||"",o.episodeNumber||1,o.sceneId||"",o.shot||o.shotSize||"",o.angle||o.cameraAngle||"",o.cameraMovement||"",o.duration||3,(o.description||"").replace(/"/g,'""'),(o.dialogue||"").replace(/"/g,'""'),(o.characters||[]).join("、"),(o.props||[]).join("、"),(o.soundEffects||[]).join("、"),o.music||"",o.lens||"",o.fStop||"",o.depthOfField||"",(o.startFrame||"").replace(/"/g,'""'),(o.endFrame||"").replace(/"/g,'""'),(o.notes||"").replace(/"/g,'""'),(o.aiPrompt||"").replace(/"/g,'""'),(o.aiVideoPrompt||"").replace(/"/g,'""')]);return"\uFEFF"+[e.join(","),...n.map(o=>o.map(m=>`"${m}"`).join(","))].join(`
`)}function M(l,t){const e=new Blob([l],{type:"text/csv;charset=utf-8"}),n=URL.createObjectURL(e),i=document.createElement("a");i.href=n,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n)}export{L as a,B as b,M as c,E as d,A as e,N as f,v as g,_ as k};
