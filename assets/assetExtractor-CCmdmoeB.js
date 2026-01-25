import{m as F,g as m}from"./index-D2OUPcrK.js";import{p as I}from"./json-parser-CXOZlHMe.js";import{P as E}from"./promptEngine-C4udPgCW.js";async function B(C,x,$){const f=new Set;x.forEach(u=>{var i;u.characters&&Array.isArray(u.characters)&&u.characters.forEach(l=>f.add(l)),(i=u.dialogues)==null||i.forEach(l=>f.add(l.character))});const d=new E($,{includeNegative:!1}),O=C.substring(0,3e4),T=`你是一个专业的剧本分析助手。请严格按照以下 JSON Schema 提取信息，确保字段名完全一致。

**JSON Schema（必须严格遵守）：**
{
  "characters": [
    {
      "name": "角色名（必填）",
      "gender": "性别（男/女/其他，选填）",
      "age": "年龄（如：25岁，选填）",
      "height": "身高（如：180cm，选填）",
      "bodyType": "体型（如：健壮/纤瘦/匀称，选填）",
      "hairStyle": "发型（如：短发/长发/卷发，选填）",
      "hairColor": "发色（如：黑色/棕色/金色，选填）",
      "facialFeatures": "五官特征（如：剑眉星目，选填）",
      "clothing": "典型服饰（如：黑色长袍，选填）",
      "accessories": "配饰（如：玉佩，选填）",
      "appearance": "完整外貌描述（必填）",
      "personality": "性格特征（必填）",
      "description": "角色综合描述（必填）"
    }
  ],
  "scenes": [
    {
      "name": "场景名（必填）",
      "location": "地点（必填）",
      "spaceType": "室内/室外（选填）",
      "lighting": "光线（如：明亮/昏暗，选填）",
      "era": "时代（如：现代/古代，选填）",
      "atmosphere": "氛围（如：紧张/温馨，选填）",
      "environment": "环境详细描述（必填）",
      "description": "场景综合描述（必填）"
    }
  ],
  "props": [
    {
      "name": "道具名（必填）",
      "category": "类别（如：武器/工具，选填）",
      "material": "材质（如：金属/木质，选填）",
      "description": "详细描述（必填）",
      "significance": "重要性（选填）"
    }
  ],
  "costumes": [
    {
      "characterName": "所属角色（必填）",
      "name": "服装名（必填）",
      "style": "款式（如：古装/现代，选填）",
      "color": "颜色（选填）",
      "material": "材质（选填）",
      "description": "详细描述（必填）"
    }
  ]
}

**重要规则：**
1. 必须返回纯 JSON，不要使用 Markdown 代码块
2. 字段名必须与 Schema 完全一致（如：hairStyle 而非 hair）
3. 选填字段如果没有信息，填空字符串 ""
4. 不要填写"不详"、"未提及"、"未知"等占位符
5. 字符串中不要包含换行符，用空格代替
6. 必须包含 characters、scenes、props、costumes 四个数组

**示例输出：**
{"characters":[{"name":"张三","gender":"男","age":"25岁","height":"180cm","bodyType":"健壮","hairStyle":"短发","hairColor":"黑色","facialFeatures":"剑眉星目","clothing":"黑色长袍","accessories":"玉佩","appearance":"25岁男性，身高180cm，健壮体型，黑色短发，剑眉星目，身穿黑色长袍，佩戴玉佩","personality":"沉稳冷静，武艺高强","description":"主角，江湖侠客"}],"scenes":[{"name":"客栈大堂","location":"江南某客栈","spaceType":"室内","lighting":"昏暗","era":"古代","atmosphere":"热闹","environment":"木质结构，红灯笼高挂，人声鼎沸","description":"江南某客栈的大堂，木质结构，红灯笼高挂，人声鼎沸"}],"props":[{"name":"长剑","category":"武器","material":"精钢","description":"三尺青锋，寒光闪烁","significance":"主角的随身武器"}],"costumes":[{"characterName":"张三","name":"黑色长袍","style":"古装","color":"黑色","material":"丝绸","description":"黑色丝绸长袍，绣有暗纹"}]}

已知角色：${Array.from(f).join("、")||"待提取"}

文本内容：
${O}

请严格按照 Schema 返回完整的 JSON 对象。`;try{const u=await F([{role:"user",content:T}],.1,16384);let i=I(u);if(Array.isArray(i)){const e={characters:[],scenes:[],props:[],costumes:[]};i.forEach((r,s)=>{if(!(!r||!r.name))if(r.age||r.hair||r.facialFeatures||r.personality||r.appearance||r.gender)e.characters.push(r);else if(r.location||r.spaceType||r.lighting||r.atmosphere||r.environment)e.scenes.push(r);else if(r.characterName||r.material&&r.style&&r.color)e.costumes.push(r);else if(r.category||r.significance||r.material&&!r.style)e.props.push(r);else{const t=(r.description||"").toLowerCase(),n=(r.name||"").toLowerCase();t.includes("室内")||t.includes("室外")||t.includes("场景")||t.includes("大厅")||t.includes("房间")||t.includes("街道")||n.includes("场")||n.includes("室")||n.includes("厅")?e.scenes.push(r):t.includes("武器")||t.includes("道具")||t.includes("物品")||t.includes("剑")||t.includes("盒")||t.includes("卷轴")||n.includes("剑")||n.includes("盒")||n.includes("卷")?e.props.push(r):e.characters.push(r)}}),i=e}i.characters||(i.characters=[]),i.scenes||(i.scenes=[]),i.props||(i.props=[]),i.costumes||(i.costumes=[]);const l=new Map,g=new Set,P=(i.characters||[]).map(e=>{const r=m();let s=String(e.name||"未命名");const t=s.indexOf('"');t>0&&(s=s.substring(0,t).trim()),l.set(s,r),g.add(s);const b=`char_${s.split("").map(o=>o.charCodeAt(0)>255?"c":o.toLowerCase()).join("").substring(0,8)}_${r.slice(-4)}`,a=o=>{if(!o)return!1;const S=String(o).trim();return S&&S!=="不详"&&S!=="未提及"&&S!=="未知"&&S!=="N/A"},h=e.hairStyle||e.hair||"",p=e.hairColor||"",c=[];a(e.gender)&&c.push(e.gender),a(e.age)&&c.push(e.age),a(e.height)&&c.push(e.height),a(e.bodyType)&&c.push(e.bodyType),a(h)&&c.push(h),a(p)&&c.push(p),a(e.facialFeatures)&&c.push(e.facialFeatures),a(e.clothing)&&c.push(e.clothing);const A=c.length>0?c.join(", "):"";let N="";a(e.description)?N=e.description:N=c.join("，")||"待补充角色描述";let v="";if(a(e.appearance))v=e.appearance;else{const o=[];a(h)&&o.push(h),a(p)&&o.push(p),a(e.facialFeatures)&&o.push(e.facialFeatures),a(e.bodyType)&&o.push(e.bodyType),a(e.clothing)&&o.push(e.clothing),a(e.accessories)&&o.push(e.accessories),v=o.length>0?o.join("，"):"待补充外貌特征"}const y={id:r,name:s,gender:a(e.gender)?e.gender:"",age:a(e.age)?e.age:"",height:a(e.height)?e.height:"",bodyType:a(e.bodyType)?e.bodyType:"",hairStyle:a(h)?h:"",hairColor:a(p)?p:"",clothing:a(e.clothing)?e.clothing:"",accessories:a(e.accessories)?e.accessories:"",description:N,appearance:v,personality:a(e.personality)?e.personality:"待补充性格特征",avatar:"",triggerWord:b,standardAppearance:A,fullBodyPrompt:"",facePrompt:""},w=d.forCharacterFullBody(y),j=d.forCharacterFace(y);return y.fullBodyPrompt=w.positive,y.facePrompt=j.positive,y});return f.forEach(e=>{if(!g.has(e)){const r=m();l.set(e,r),P.push({id:r,name:e,description:"从剧本自动识别的角色",appearance:"待进一步详细描述",personality:"待设定",avatar:"",triggerWord:`char_gen_${r.slice(-4)}`,standardAppearance:"默认外貌"})}}),{characters:P,scenes:(i.scenes||[]).map(e=>{const r=m();let s=String(e.name||"未命名场景");const t=s.indexOf('"');t>0&&(s=s.substring(0,t).trim());const n={id:r,name:s,description:e.description||e.environment||e.environmentDescription,location:e.location||s,environment:e.environment||e.environmentDescription||`${e.spaceType||""}, ${e.lighting||""}, ${e.atmosphere||""}, ${e.era||""}`.trim(),image:"",widePrompt:"",mediumPrompt:"",closeupPrompt:""};return n.widePrompt=d.forSceneWide(n).positive,n.mediumPrompt=d.forSceneMedium(n).positive,n.closeupPrompt=d.forSceneCloseup(n).positive,n}),props:(i.props||[]).map(e=>{const r=m();let s=String(e.name||"未命名道具");const t=s.indexOf('"');t>0&&(s=s.substring(0,t).trim());const n={id:r,name:s,description:e.description||`${e.material||""} ${s}, ${e.significance||""}`.trim(),category:e.category,image:"",aiPrompt:""};return n.aiPrompt=d.forProp(n).positive,n}),costumes:(i.costumes||[]).map(e=>{const r=m();let s=String(e.characterName||""),t=String(e.name||"未命名服装");const n=s.indexOf('"');n>0&&(s=s.substring(0,n).trim());const b=t.indexOf('"');b>0&&(t=t.substring(0,b).trim());const a=l.get(s)||m(),h=P.find(c=>c.id===a),p={id:r,characterId:a,characterName:s,name:t,description:e.description||`${e.style||""}, ${e.color||""}, ${e.material||""}`.trim(),style:e.style||"默认",image:"",aiPrompt:""};return p.aiPrompt=d.forCostume(p,h).positive,p})}}catch{return{characters:Array.from(f).map(l=>{const g=m();return{id:g,name:l,description:"从剧本自动识别的角色(提取失败回退)",appearance:"待设定",personality:"待设定",avatar:"",triggerWord:`char_fb_${g.slice(-4)}`,standardAppearance:"默认外貌"}}),scenes:[],props:[],costumes:[]}}}export{B as e};
