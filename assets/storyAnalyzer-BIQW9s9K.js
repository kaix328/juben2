var O=Object.defineProperty;var N=(g,n,r)=>n in g?O(g,n,{enumerable:!0,configurable:!0,writable:!0,value:r}):g[n]=r;var b=(g,n,r)=>N(g,typeof n!="symbol"?n+"":n,r);import{g as d,m as p}from"./index-D2OUPcrK.js";import{a as M,s as $}from"./utils-B3jl-4bE.js";function h(g){let n=g.trim();n=n.replace(/```json\s*/g,"").replace(/```\s*/g,""),n=n.replace(/"/g,'"').replace(/"/g,'"').replace(/'/g,"'").replace(/'/g,"'").replace(/，/g,",").replace(/：/g,":");try{return JSON.parse(n)}catch{}try{const r=n.indexOf("{"),c=n.indexOf("[");let e=-1;if(r!==-1&&c!==-1?e=Math.min(r,c):r!==-1?e=r:c!==-1&&(e=c),e!==-1){n=n.substring(e);const s=n.lastIndexOf("}"),t=n.lastIndexOf("]"),o=Math.max(s,t);if(o!==-1)return n=n.substring(0,o+1),JSON.parse(n)}}catch{}try{return n=n.replace(/,(\s*[}\]])/g,"$1"),n=n.replace(/\n/g," "),n=n.replace(/[\x00-\x1F\x7F]/g,""),JSON.parse(n)}catch{}return null}class k{constructor(n){b(this,"onProgress");this.onProgress=n}updateProgress(n){var r;(r=this.onProgress)==null||r.call(this,n)}async analyzeAll(n){const{projectId:r,chapterId:c,scriptContent:e}=n;try{this.updateProgress({step:"genre",progress:10,message:"分析题材类型..."});const s=await this.analyzeGenre(e);this.updateProgress({step:"synopsis",progress:30,message:"生成故事梗概..."});const t=await this.analyzeSynopsisMR(e);this.updateProgress({step:"characters",progress:50,message:"全书扫描：分析人物小传..."});const o=await this.analyzeCharactersMR(e,n.existingCharacters);this.updateProgress({step:"relationships",progress:70,message:"全书扫描：分析人物关系..."});const l=await this.analyzeRelationshipsMR(e,o);this.updateProgress({step:"plotPoints",progress:90,message:"梳理大情节点..."});const i=await this.analyzePlotPointsMR(e);this.updateProgress({step:"themes",progress:95,message:"深度分析：主题与意象..."});const{themes:u,symbols:m}=await this.analyzeThemes(e);return this.updateProgress({step:"complete",progress:100,message:"分析完成！"}),{id:d(),projectId:r,chapterId:c,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),genre:s,synopsis:t,characterBios:o,relationships:l,plotPoints:i,themes:u,symbols:m,analysisSource:"ai",confidence:85}}catch(s){throw this.updateProgress({step:"error",progress:0,message:"分析失败: "+s.message}),s}}async analyzeGenre(n){const r=`分析剧本题材类型，返回纯JSON（不要markdown标记）。

所有字段必须使用中文：
- era: 古代/现代/未来
- eraDetail: 详细时代描述（中文）
- style: 喜剧/悲剧/正剧/悬疑
- content: 数组，如["爱情","复仇","动作"]

JSON格式：
{"era":"古代","eraDetail":"古代背景","style":"正剧","content":["复仇","动作"],"coreConceptOneLine":"核心概念","creativeElements":["元素1"],"styleFeatures":["特点1"],"uniquePoints":["卖点1"]}

剧本：
${n.substring(0,5e3)}`,c=await p([{role:"system",content:"你是JSON生成器，只返回纯JSON，所有字段值必须使用中文。"},{role:"user",content:r}],.2,4096),e=h(c);return{era:(e==null?void 0:e.era)||"现代",eraDetail:(e==null?void 0:e.eraDetail)||"现代",style:(e==null?void 0:e.style)||"正剧",content:Array.isArray(e==null?void 0:e.content)?e.content:["成长"],coreConceptOneLine:(e==null?void 0:e.coreConceptOneLine)||"待分析",creativeElements:Array.isArray(e==null?void 0:e.creativeElements)?e.creativeElements:[],styleFeatures:Array.isArray(e==null?void 0:e.styleFeatures)?e.styleFeatures:[],uniquePoints:Array.isArray(e==null?void 0:e.uniquePoints)?e.uniquePoints:[]}}async analyzeSynopsis(n){const r=`生成剧本梗概，返回纯JSON（不要markdown标记）。

所有字段必须使用中文，不要使用英文引号包裹中文内容。

JSON格式：
{"oneLine":"一句话梗概","short":"简短梗概","full":"完整梗概","protagonist":"主角","goal":"目标","obstacle":"障碍","resolution":"解决方式","outcome":"结果"}

剧本：
${n.substring(0,8e3)}`,c=await p([{role:"system",content:"你是JSON生成器，只返回纯JSON，所有字段值必须使用中文。"},{role:"user",content:r}],.2,8192),e=h(c);return!e||typeof e!="object"||Array.isArray(e)?{oneLine:"待分析",short:"待分析",full:"待分析",protagonist:"待分析",goal:"待分析",obstacle:"待分析",resolution:"待分析",outcome:"待分析"}:{oneLine:e.oneLine||"待分析",short:e.short||"待分析",full:e.full||"待分析",protagonist:e.protagonist||"待分析",goal:e.goal||"待分析",obstacle:e.obstacle||"待分析",resolution:e.resolution||"待分析",outcome:e.outcome||"待分析"}}async analyzeCharacters(n,r){const e=`分析剧本主要角色（最多5个），返回纯JSON数组（不要markdown标记）。${r!=null&&r.length?`
已知角色：${r.join("、")}`:""}

JSON格式：
[{"name":"角色名","gender":"性别","age":"年龄","height":"身高","bodyType":"体型","identity":"身份","appearance":"外貌特征","hairStyle":"发型","hairColor":"发色","clothing":"服饰","accessories":"配饰","personality":["性格1"],"background":"背景","keyExperiences":["经历1"],"behaviorPattern":"行为模式","speechStyle":"语言风格","motivation":"动机","arc":{"start":"开始","change":"变化","end":"结束"},"isProtagonist":true}]

剧本：
${n.substring(0,6e3)}`,s=await p([{role:"system",content:"你是JSON生成器，只返回纯JSON数组，所有字段值必须使用中文。"},{role:"user",content:e}],.2,12288);let t=h(s);return t&&!Array.isArray(t)&&(t=t.characters||t.characterBios||[]),Array.isArray(t)?t.map((o,l)=>{var i,u,m;return{id:d(),name:o.name||`角色${l+1}`,gender:o.gender||"",age:o.age||"",height:o.height||"",bodyType:o.bodyType||"",identity:o.identity||"未知",appearance:o.appearance||"",hairStyle:o.hairStyle||"",hairColor:o.hairColor||"",clothing:o.clothing||"",accessories:o.accessories||"",personality:Array.isArray(o.personality)?o.personality:[],background:o.background||"",keyExperiences:Array.isArray(o.keyExperiences)?o.keyExperiences:[],behaviorPattern:o.behaviorPattern||"",speechStyle:o.speechStyle||"",motivation:o.motivation||"",arc:{start:((i=o.arc)==null?void 0:i.start)||"",change:((u=o.arc)==null?void 0:u.change)||"",end:((m=o.arc)==null?void 0:m.end)||""},isProtagonist:o.isProtagonist||l===0}}):[]}async analyzeRelationships(n,r){if(r.length===0)return[];const e=`分析角色关系，返回纯JSON数组（不要markdown标记）。

角色：${r.map(o=>o.name).join("、")}

JSON格式：
[{"fromCharacter":"角色A","toCharacter":"角色B","relationType":"enemy","relationLabel":"死敌","strength":"strong","tension":"conflict","description":"关系描述","development":"发展","isCore":true}]

类型：family/romance/friendship/rivalry/enemy/mentor/colleague/alliance/subordinate/other
强度：strong/medium/weak
张力：conflict/competition/complement/dependence/neutral

剧本：
${n.substring(0,5e3)}`,s=await p([{role:"system",content:"你是JSON生成器，只返回纯JSON数组。"},{role:"user",content:e}],.2,8192);let t=h(s);return t&&!Array.isArray(t)&&(t=t.relationships||[]),Array.isArray(t)?t.map(o=>({id:d(),fromCharacter:o.fromCharacter||"",toCharacter:o.toCharacter||"",relationType:o.relationType||"other",relationLabel:o.relationLabel||"未知",strength:o.strength||"medium",tension:o.tension||"neutral",description:o.description||"",development:o.development||"",isCore:o.isCore||!1})):[]}async analyzePlotPoints(n){const r=`梳理主要情节点（8-12个），并尝试对应经典剧作结构节拍（如《救猫咪》）。

    返回纯JSON数组（不要markdown标记）：
    [
      {
        "order":1,
        "title":"情节点标题",
        "type":"setup",
        "stage":"early",
        "description":"描述",
        "characters":["角色1"],
        "consequence":"后果",
        "emotionalTone":"基调",
        "beat":"Inciting Incident"
      }
    ]

    beat (节拍): Opening Image, Theme Stated, Set-up, Catalyst (Inciting Incident), Debate, Break into Two, B Story, Fun and Games, Midpoint, Bad Guys Close In, All is Lost, Dark Night of the Soul, Break into Three, Finale, Final Image. 如果不确定，可填空字符串。

    类型：setup/development/turning/climax/resolution
    阶段：early/middle/late

    剧本：
    ${n.substring(0,8e3)}`,c=await p([{role:"system",content:"你是JSON生成器，只返回纯JSON数组。"},{role:"user",content:r}],.2,8192);let e=h(c);return e&&!Array.isArray(e)&&(e=e.plotPoints||[]),Array.isArray(e)?e.map((s,t)=>({id:d(),order:s.order||t+1,title:s.title||`情节点${t+1}`,type:s.type||"development",stage:s.stage||"middle",description:s.description||"",characters:Array.isArray(s.characters)?s.characters:[],consequence:s.consequence||"",emotionalTone:s.emotionalTone||"",beat:s.beat||""})):[]}async analyzeEmotionCurve(n){const c=`分析剧本的场景情感节奏，返回纯JSON数组（不要markdown标记）。
请按场景顺序逐一分析每一个场景，不要遗漏。即使场景很短也要包含。
请确保数值有起伏变化，反映出故事的节奏感，不要全部返回相同的值。

JSON格式：
[{"sceneOrder":1,"sceneLocation":"场景地点","tension":5,"energy":5,"mood":"情感标签","description":"简短描述"}]

数值说明：
tension (紧张度): 0(平静) - 10(极度紧绷)
energy (能量值): 0(低沉/静止) - 10(爆发/激烈)

剧本：
${n.substring(0,3e4)}`;try{const e=await p([{role:"system",content:"你是JSON生成器，只返回纯JSON数组。"},{role:"user",content:c}],.2,8192);let s=h(e);if(s&&!Array.isArray(s)&&(s=s.beats||s.scenes||s.curve||[]),!Array.isArray(s)||s.length===0)throw new Error("Parsed data is empty or invalid");return s.map((t,o)=>({sceneId:d(),sceneOrder:t.sceneOrder||o+1,sceneLocation:t.sceneLocation||`场景${o+1}`,tension:Number(t.tension)||5,energy:Number(t.energy)||5,mood:t.mood||"中性",description:t.description||""}))}catch{const s=n.split(/第[一二三四五六七八九十0-9]+场/g).filter(o=>o.trim().length>10),t=Math.max(s.length,10);return Array.from({length:t}).map((o,l)=>{const i=5+Math.round(Math.sin(l*.5)*3)+Math.round(Math.random()*2),u=5+Math.round(Math.cos(l*.5)*3)+Math.round(Math.random()*2);return{sceneId:d(),sceneOrder:l+1,sceneLocation:`场景${l+1} (模拟)`,tension:Math.max(1,Math.min(10,i)),energy:Math.max(1,Math.min(10,u)),mood:"未分析",description:"AI分析超时，使用模拟数据展示",isMock:!0}})}}async analyzeEmotionCurveMR(n){if(n.length<=1e4)return this.analyzeEmotionCurve(n);const c=M(n,1e4),e=[];let s=0;for(let t=0;t<c.length;t++){const o=c[t];try{const l=await this.analyzeEmotionCurve(o);l.forEach(i=>{s++,i.sceneOrder=s}),e.push(...l)}catch{}}return e.length===0?this.generateMockEmotionBeats(n):e}generateMockEmotionBeats(n){const r=n.split(/第[一二三四五六七八九十0-9]+场/g).filter(e=>e.trim().length>10),c=Math.max(r.length,10);return Array.from({length:c}).map((e,s)=>{const t=5+Math.round(Math.sin(s*.5)*3)+Math.round(Math.random()*2),o=5+Math.round(Math.cos(s*.5)*3)+Math.round(Math.random()*2);return{sceneId:d(),sceneOrder:s+1,sceneLocation:`场景${s+1} (模拟)`,tension:Math.max(1,Math.min(10,t)),energy:Math.max(1,Math.min(10,o)),mood:"未分析",description:"AI分析超时，使用模拟数据展示",isMock:!0}})}async analyzeThemes(n){const r=`分析剧本的核心主题（Themes）和关键意象/符号（Symbols/Motifs）。
    
    返回纯JSON对象（不要markdown标记）：
    {
      "themes": [
        {"name":"主题名","description":"描述","evidence":["体现1","体现2"]}
      ],
      "symbols": [
        {"name":"符号名","meaning":"象征意义","occurrences":["出现场景1"]}
      ]
    }
    
    剧本内容：
    ${n.substring(0,15e3)}`;try{const c=await p([{role:"system",content:"你是JSON生成器"},{role:"user",content:r}],.2,4096),e=h(c);return{themes:Array.isArray(e==null?void 0:e.themes)?e.themes:[],symbols:Array.isArray(e==null?void 0:e.symbols)?e.symbols:[]}}catch{return{themes:[],symbols:[]}}}async analyzeSynopsisMR(n){if(n.length<=8e3)return this.analyzeSynopsisDirect(n);const c=$(n,6e3,200),e=[];for(let t=0;t<c.length;t++){const o=c[t],l=`请简要概括这段剧本内容（300字以内），保留核心情节和关键转折。
        
这段内容是全剧本的第 ${t+1}/${c.length} 部分。

剧本片段：
${o.substring(0,7e3)}`,i=await p([{role:"user",content:l}],.2,2048);e.push(`【第${t+1}部分】：${i}`)}const s=e.join(`

`);return this.analyzeSynopsisDirect(s)}async analyzeSynopsisDirect(n){const r=`生成剧本梗概，返回纯JSON（不要markdown标记）。

所有字段必须使用中文，不要使用英文引号包裹中文内容。

JSON格式：
{"oneLine":"一句话梗概","short":"简短梗概","full":"完整梗概","protagonist":"主角","goal":"目标","obstacle":"障碍","resolution":"解决方式","outcome":"结果"}

剧本/摘要内容：
${n.substring(0,15e3)}`,c=await p([{role:"system",content:"你是JSON生成器，只返回纯JSON，所有字段值必须使用中文。"},{role:"user",content:r}],.2,8192),e=h(c);return!e||typeof e!="object"||Array.isArray(e)?{oneLine:"待分析",short:"待分析",full:"待分析",protagonist:"待分析",goal:"待分析",obstacle:"待分析",resolution:"待分析",outcome:"待分析"}:{oneLine:e.oneLine||"待分析",short:e.short||"待分析",full:e.full||"待分析",protagonist:e.protagonist||"待分析",goal:e.goal||"待分析",obstacle:e.obstacle||"待分析",resolution:e.resolution||"待分析",outcome:e.outcome||"待分析"}}async analyzePlotPointsMR(n){if(n.length<=8e3)return this.analyzePlotPointsDirect(n);const c=$(n,6e3,200),e=[];for(let t=0;t<c.length;t++){const o=c[t],l=`提取这段剧本中的关键事件（Key Events），按发生顺序排列，简明扼要。
        
剧本片段 ${t+1}/${c.length}：
${o.substring(0,7e3)}`,i=await p([{role:"user",content:l}],.2,2048);e.push(`【片段 ${t+1} 关键事件】：
${i}`)}const s=e.join(`

`);return this.analyzePlotPointsDirect(s)}async analyzePlotPointsDirect(n){const r=`基于以下内容，梳理全剧的核心情节点（8-12个），确保覆盖开头、发展、高潮和结尾。返回纯JSON数组。

JSON格式：
[{"order":1,"title":"情节点标题","type":"setup","stage":"early","description":"描述","characters":["角色1"],"consequence":"后果","emotionalTone":"基调"}]

类型：setup/development/turning/climax/resolution
阶段：early/middle/late

内容：
${n.substring(0,15e3)}`,c=await p([{role:"system",content:"你是JSON生成器，只返回纯JSON数组。"},{role:"user",content:r}],.2,8192);let e=h(c);return e&&!Array.isArray(e)&&(e=e.plotPoints||[]),Array.isArray(e)?e.map((s,t)=>({id:d(),order:s.order||t+1,title:s.title||`情节点${t+1}`,type:s.type||"development",stage:s.stage||"middle",description:s.description||"",characters:Array.isArray(s.characters)?s.characters:[],consequence:s.consequence||"",emotionalTone:s.emotionalTone||""})):[]}async analyzeCharactersMR(n,r){if(n.length<=8e3)return this.analyzeCharacters(n,r);const e=$(n,6e3,200),s=[];for(let a=0;a<e.length;a++){const f=`扫描这段剧本，列出所有出现的"有名字的角色"。
        
        JSON格式：
        [{"name":"角色名","identity":"身份","isMajor":true/false,"actions":"本段简要行为"}]
        
        剧本片段：
        ${e[a].substring(0,7e3)}`;try{const S=await p([{role:"user",content:f}],.2,2048),A=h(S);Array.isArray(A)&&s.push(...A)}catch{}}const t={};s.forEach(a=>{if(!a||!a.name)return;const y=a.name.trim();t[y]||(t[y]={count:0,identities:new Set,actions:[]}),t[y].count++,a.identity&&t[y].identities.add(a.identity),a.actions&&t[y].actions.push(a.actions)});const o=Object.entries(t).sort(([,a],[,y])=>y.count-a.count).slice(0,8).map(([a])=>a),i=`基于以下全书角色行为汇总，生成详细的人物小传（纯JSON数组）。
    
    JSON格式：
    [{"name":"角色名","gender":"性别","age":"年龄","height":"身高","bodyType":"体型","identity":"身份","appearance":"外貌特征","hairStyle":"发型","hairColor":"发色","clothing":"服饰","accessories":"配饰","personality":["性格1"],"background":"背景","keyExperiences":["经历1"],"behaviorPattern":"行为模式","speechStyle":"语言风格","motivation":"动机","arc":{"start":"开始","change":"变化","end":"结束"},"isProtagonist":true}]
    
    角色行为汇总：
    ${o.map(a=>{const y=t[a];return`角色：${a}
身份：${Array.from(y.identities).join("/")}
全书行为摘要：${y.actions.join("; ")}`}).join(`

`)}`,u=await p([{role:"system",content:"你是JSON生成器"},{role:"user",content:i}],.2,8192);let m=h(u);return Array.isArray(m)||(m=[]),m.map((a,y)=>{var f,S,A;return{id:d(),name:a.name||o[y]||`角色${y+1}`,gender:a.gender||"",age:a.age||"",height:a.height||"",bodyType:a.bodyType||"",identity:a.identity||"未知",appearance:a.appearance||"",hairStyle:a.hairStyle||"",hairColor:a.hairColor||"",clothing:a.clothing||"",accessories:a.accessories||"",personality:Array.isArray(a.personality)?a.personality:[],background:a.background||"",keyExperiences:Array.isArray(a.keyExperiences)?a.keyExperiences:[],behaviorPattern:a.behaviorPattern||"",speechStyle:a.speechStyle||"",motivation:a.motivation||"",arc:{start:((f=a.arc)==null?void 0:f.start)||"",change:((S=a.arc)==null?void 0:S.change)||"",end:((A=a.arc)==null?void 0:A.end)||""},isProtagonist:a.isProtagonist||y===0}})}async analyzeRelationshipsMR(n,r){if(r.length<2)return[];if(n.length<=8e3)return this.analyzeRelationships(n,r);const e=3e4,s=$(n,1e4,200),t=[],o=r.map(a=>a.name).join("、");for(let a=0;a<s.length;a++){const y=s[a];let f=0;r.forEach(S=>{y.includes(S.name)&&f++}),!(f<2)&&t.push(y.substring(0,2e3))}const l=t.join(`
...
`).substring(0,e),i=`分析以下剧本片段中，这些角色之间的关系：${o}。
    
    返回纯JSON数组：
    [{"fromCharacter":"角色A","toCharacter":"角色B","relationType":"类型","relationLabel":"标签","strength":"strong/medium/weak","tension":"conflict/competition/neutral","description":"关系描述","development":"发展过程","isCore":true}]
    
    剧本采样片段：
    ${l}`,u=await p([{role:"system",content:"你是JSON生成器"},{role:"user",content:i}],.2,8192);let m=h(u);return Array.isArray(m)||(m=[]),m.map(a=>({id:d(),fromCharacter:a.fromCharacter||"",toCharacter:a.toCharacter||"",relationType:a.relationType||"other",relationLabel:a.relationLabel||"未知",strength:a.strength||"medium",tension:a.tension||"neutral",description:a.description||"",development:a.development||"",isCore:a.isCore||!1}))}}async function C(g,n){return new k(n).analyzeAll(g)}function E(g){const{genre:n,synopsis:r,characterBios:c,relationships:e,plotPoints:s}=g;let t=`【故事五元素分析报告】

`;t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,t+=`一、题材类型与创意提炼
`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`,t+=`【时代】${n.eraDetail}
`,t+=`【风格】${n.style}
`,t+=`【类型】${n.content.join("、")}
`,t+=`【核心概念】${n.coreConceptOneLine}
`,n.creativeElements.length>0&&(t+=`【创意元素】${n.creativeElements.join("、")}
`),n.styleFeatures.length>0&&(t+=`【风格特点】${n.styleFeatures.join("、")}
`),n.uniquePoints.length>0&&(t+=`【独特卖点】${n.uniquePoints.join("、")}
`),t+=`
`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,t+=`二、故事梗概
`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`,t+=`【一句话】${r.oneLine}

`,t+=`【简短梗概】
${r.short}

`,t+=`【完整梗概】
${r.full}

`,t+=`【主角】${r.protagonist}
`,t+=`【目标】${r.goal}
`,t+=`【障碍】${r.obstacle}
`,t+=`【解决】${r.resolution}
`,t+=`【结果】${r.outcome}

`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,t+=`三、人物小传
`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`,c.forEach((i,u)=>{t+=`【${u+1}. ${i.name}】${i.isProtagonist?"（主角）":""}
`,t+=`身份：${i.identity}
`,i.personality.length>0&&(t+=`性格：${i.personality.join("、")}
`),i.background&&(t+=`背景：${i.background}
`),i.motivation&&(t+=`动机：${i.motivation}
`),(i.arc.start||i.arc.change||i.arc.end)&&(t+=`弧线：${i.arc.start} → ${i.arc.change} → ${i.arc.end}
`),t+=`
`}),t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,t+=`四、人物关系
`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`,e.forEach((i,u)=>{const m=i.isCore?"【核心】":"";t+=`${u+1}. ${i.fromCharacter} ↔ ${i.toCharacter}：${i.relationLabel} ${m}
`,i.description&&(t+=`   ${i.description}
`),i.development&&(t+=`   发展：${i.development}
`),t+=`
`}),t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,t+=`五、大情节点
`,t+=`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;const o={early:"【前期】",middle:"【中期】",late:"【后期】"},l={setup:"建立",development:"发展",turning:"转折",climax:"高潮",resolution:"结局"};return s.forEach(i=>{t+=`${i.order}. ${o[i.stage]||""} ${i.title} [${l[i.type]||i.type}]
`,i.description&&(t+=`   ${i.description}
`),i.characters.length>0&&(t+=`   涉及：${i.characters.join("、")}
`),i.consequence&&(t+=`   影响：${i.consequence}
`),i.emotionalTone&&(t+=`   基调：${i.emotionalTone}
`),t+=`
`}),t}export{k as S,C as a,E as f};
