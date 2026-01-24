import{k as c}from"./index-HITnASlQ.js";const m=[{id:"minimalist",name:"极简白描 (海明威风)",description:"短句为主，克制修饰，强调动作与对话",prompt:"使用海明威式的极简风格。多用短句和动词，减少形容词和副词。通过动作和对话展现人物内心，避免直接的心理描写。保持客观、冷峻的叙事语调。"},{id:"wuxia",name:"古风武侠 (金庸/古龙)",description:"半文半白，意境深远，节奏感强",prompt:"使用经典武侠小说风格。语言半文半白，注重意境渲染。动作描写要行云流水，对话要简练且富有江湖气息。可以使用短句营造紧张感（古龙风）。"},{id:"conscious_flow",name:"意识流 (伍尔夫风)",description:"侧重内心独白，主观感受，时空交错",prompt:"使用意识流风格。深入角色的内心世界，记录细微的想法、感受和联想。打破线性时间，捕捉瞬间的印象和情绪流动。语言要有诗意和节奏感。"},{id:"magical_realism",name:"魔幻现实 (马尔克斯风)",description:"瑰丽奇幻，一本正经地胡说八道",prompt:"使用魔幻现实主义风格。将荒诞离奇的事物描写得像日常生活一样自然。使用华丽、繁复的长句，包含丰富的感官细节和隐喻。"},{id:"screenplay_action",name:"动作片剧本",description:"快节奏，强调视觉动作，极少心理描写",prompt:"使用好莱坞动作片剧本风格。极度强调视觉动作 (Shown, not told)。节奏紧凑，句子短促有力。完全剔除无法拍摄的内心独白。"},{id:"screenplay_noir",name:"黑色电影剧本",description:"阴郁冷峻，旁白感，光影描写",prompt:"使用黑色电影(Film Noir)风格。强调光影对比（百叶窗的阴影、霓虹灯光）。氛围阴郁、冷峻、愤世嫉俗。"},{id:"sitcom",name:"情景喜剧",description:"密集对白，包袱不断，轻松日常",prompt:'使用情景喜剧风格。以密集、机智的对白驱动剧情。加入幽默元素和"包袱"。节奏轻快，聚焦于人物之间的误会和互动。'},{id:"webnovel_cool",name:"网文爽文",description:"情绪铺垫强，直白通俗，快节奏",prompt:"使用商业网文风格。语言通俗直白，阅读门槛低。注重情绪价值和期待感（装逼打脸、升级）。节奏极快，每一段都要有信息量。"},{id:"suspense_thriller",name:"悬疑惊悚",description:"强调氛围，伏笔暗示，心理压迫",prompt:"使用悬疑惊悚风格。通过环境描写营造压抑、不安的氛围。多用暗示和伏笔，引导读者的恐惧感。着重描写感官细节（声音、气味）。"},{id:"romance_sweet",name:"甜宠言情",description:"细腻情感，唯美画面，重心理活动",prompt:"使用甜宠言情风格。着重描写细腻的情感互动和心理活动。画面感要唯美、浪漫。使用感性的语言，增强代入感。"}];function d(a){const r=m.find(e=>e.id===a);return r?r.prompt:""}class p{async refine(r,e,i){const n=this.buildPrompt(r,e,i);try{const t=await c.text.generate({prompt:n,temperature:i.creativity||.7,maxTokens:4e3});if(!t.success||!t.data)throw new Error(t.error||"生成失败");return this.cleanOutput(t.data)}catch(t){throw t}}buildPrompt(r,e,i){const n=i.styleId?d(i.styleId):"";let t="";e.characters&&e.characters.length>0&&(t=`
【涉及角色】
${e.characters.map(s=>`- ${s.name}: ${s.personality||"无性格描述"} (${s.gender||"未知"})`).join(`
`)}`);let o="";return e.summary&&(o+=`
【故事背景】
${e.summary}
`),e.previousText&&(o+=`
【前文情境】
${e.previousText}
`),`你是一位专业的剧本医生和资深小说编辑。请根据以下要求对选中的文本片段进行专业改写。

${t}
${o}

【改写目标】
1. 核心指令：${i.instruction||this.getModeInstruction(i.mode)}
2. 写作风格：${n||"保持原文风格，提升文笔质感"}
3. 约束条件：
   - 保持剧情核心逻辑不变
   - 符合角色性格设定 (不OOC)
   - 格式规范 (剧本/小说格式)
   - ⚠️ 必须完整改写整段文本，严禁中途截断或只改写一部分！
   - 仅输出改写后的正文，不要包含"好的"、"改写如下"等废话

【原始文本】
${r}
`}getModeInstruction(r){switch(r){case"expand":return"扩写这段内容，丰富动作描写和感官细节，增加画面感。";case"shorten":return"精简这段内容，去除冗余修饰，保留核心动作和对白，加快节奏。";case"polish":return"润色这段文字，优化词汇选择，提升文学性，修正语病。";default:return"优化这段内容，使其更自然流畅。"}}cleanOutput(r){return r.trim().replace(/^["']|["']$/g,"")}}const l=new p,h=Object.freeze(Object.defineProperty({__proto__:null,ScriptRefiner:p,scriptRefiner:l},Symbol.toStringTag,{value:"Module"}));export{m as W,h as a,l as s};
