/**
 * 分镜建议生成器
 * 根据场景描述智能推荐分镜方案
 */

// ============ 类型定义 ============

export interface SceneAnalysis {
  sceneType: 'dialogue' | 'action' | 'establishing' | 'transition' | 'emotional' | 'montage' | 'chase' | 'revelation' | 'climax';
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'fear' | 'surprise' | 'tension' | 'romantic' | 'mysterious';
  pacing: 'slow' | 'medium' | 'fast';
  intensity: number; // 0-1
  keywords: string[];
}

export interface ShotSuggestion {
  id: string;
  shotSize: string; // 景别
  cameraAngle: string; // 机位
  description: string; // 描述
  duration: number; // 时长（秒）
  movement?: string; // 运镜
  reason: string; // 推荐理由
  confidence: number; // 置信度 0-1
  tags: string[];
}

export interface AlternativeApproach {
  name: string;
  description: string;
  shots: ShotSuggestion[];
}

export interface StoryboardSuggestion {
  sceneAnalysis: SceneAnalysis;
  suggestions: ShotSuggestion[];
  alternativeApproaches: AlternativeApproach[];
  tips: string[];
}

// ============ 场景分析 ============

function analyzeScene(
  description: string,
  dialogue?: string,
  characters?: string[]
): SceneAnalysis {
  const lowerDesc = description.toLowerCase();
  const lowerDialogue = dialogue?.toLowerCase() || '';
  
  // 分析场景类型
  let sceneType: SceneAnalysis['sceneType'] = 'dialogue';
  if (lowerDesc.includes('追') || lowerDesc.includes('跑') || lowerDesc.includes('打斗')) {
    sceneType = 'chase';
  } else if (lowerDesc.includes('建立') || lowerDesc.includes('全景') || lowerDesc.includes('远景')) {
    sceneType = 'establishing';
  } else if (lowerDesc.includes('动作') || lowerDesc.includes('移动')) {
    sceneType = 'action';
  } else if (lowerDesc.includes('揭示') || lowerDesc.includes('发现')) {
    sceneType = 'revelation';
  } else if (lowerDesc.includes('高潮') || lowerDesc.includes('冲突')) {
    sceneType = 'climax';
  } else if (dialogue && dialogue.length > 20) {
    sceneType = 'dialogue';
  } else if (lowerDesc.includes('情感') || lowerDesc.includes('回忆')) {
    sceneType = 'emotional';
  }
  
  // 分析情感
  let emotion: SceneAnalysis['emotion'] = 'neutral';
  if (lowerDesc.includes('快乐') || lowerDesc.includes('开心') || lowerDesc.includes('笑')) {
    emotion = 'happy';
  } else if (lowerDesc.includes('悲伤') || lowerDesc.includes('哭') || lowerDesc.includes('难过')) {
    emotion = 'sad';
  } else if (lowerDesc.includes('愤怒') || lowerDesc.includes('生气') || lowerDesc.includes('怒')) {
    emotion = 'angry';
  } else if (lowerDesc.includes('恐惧') || lowerDesc.includes('害怕') || lowerDesc.includes('惊恐')) {
    emotion = 'fear';
  } else if (lowerDesc.includes('惊讶') || lowerDesc.includes('震惊')) {
    emotion = 'surprise';
  } else if (lowerDesc.includes('紧张') || lowerDesc.includes('焦虑')) {
    emotion = 'tension';
  } else if (lowerDesc.includes('浪漫') || lowerDesc.includes('爱')) {
    emotion = 'romantic';
  } else if (lowerDesc.includes('神秘') || lowerDesc.includes('诡异')) {
    emotion = 'mysterious';
  }
  
  // 分析节奏
  let pacing: SceneAnalysis['pacing'] = 'medium';
  if (sceneType === 'chase' || sceneType === 'action' || sceneType === 'climax') {
    pacing = 'fast';
  } else if (sceneType === 'emotional' || sceneType === 'establishing') {
    pacing = 'slow';
  }
  
  // 计算强度
  let intensity = 0.5;
  if (emotion === 'angry' || emotion === 'fear' || sceneType === 'climax') {
    intensity = 0.9;
  } else if (emotion === 'tension' || sceneType === 'chase') {
    intensity = 0.8;
  } else if (emotion === 'happy' || emotion === 'romantic') {
    intensity = 0.6;
  } else if (emotion === 'sad' || sceneType === 'emotional') {
    intensity = 0.7;
  }
  
  // 提取关键词
  const keywords: string[] = [];
  const keywordPatterns = [
    '夜晚', '白天', '室内', '室外', '咖啡馆', '街道', '房间', '办公室',
    '雨', '雪', '阳光', '黑暗', '明亮',
    '独自', '两人', '人群',
    '回忆', '梦境', '现实'
  ];
  
  keywordPatterns.forEach(keyword => {
    if (lowerDesc.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return {
    sceneType,
    emotion,
    pacing,
    intensity,
    keywords
  };
}

// ============ 生成分镜建议 ============

export function generateStoryboardSuggestion(
  description: string,
  dialogue?: string,
  characters?: string[],
  panelCount: number = 4
): StoryboardSuggestion {
  const analysis = analyzeScene(description, dialogue, characters);
  const suggestions: ShotSuggestion[] = [];
  
  // 根据场景类型生成建议
  switch (analysis.sceneType) {
    case 'dialogue':
      suggestions.push(
        {
          id: '1',
          shotSize: '中景',
          cameraAngle: '平视',
          description: '建立场景，展示对话环境',
          duration: 3,
          reason: '对话场景需要先建立空间关系',
          confidence: 0.9,
          tags: ['建立镜头', '环境']
        },
        {
          id: '2',
          shotSize: '近景',
          cameraAngle: '平视',
          description: characters?.[0] ? `${characters[0]}说话特写` : '角色A说话特写',
          duration: 4,
          reason: '展示说话者的表情和情绪',
          confidence: 0.95,
          tags: ['对话', '特写']
        },
        {
          id: '3',
          shotSize: '近景',
          cameraAngle: '平视',
          description: characters?.[1] ? `${characters[1]}反应特写` : '角色B反应特写',
          duration: 3,
          reason: '捕捉听者的反应',
          confidence: 0.9,
          tags: ['反应', '特写']
        },
        {
          id: '4',
          shotSize: '中景',
          cameraAngle: '侧面',
          description: '双人镜头，展示互动',
          duration: 4,
          reason: '展示两人的关系和互动',
          confidence: 0.85,
          tags: ['双人', '互动']
        }
      );
      break;
      
    case 'action':
      suggestions.push(
        {
          id: '1',
          shotSize: '全景',
          cameraAngle: '高角度',
          description: '建立动作场景全貌',
          duration: 2,
          movement: '摇镜',
          reason: '展示动作发生的空间',
          confidence: 0.9,
          tags: ['建立', '全景']
        },
        {
          id: '2',
          shotSize: '中景',
          cameraAngle: '平视',
          description: '角色准备动作',
          duration: 2,
          reason: '展示动作前的准备',
          confidence: 0.85,
          tags: ['准备', '动作']
        },
        {
          id: '3',
          shotSize: '特写',
          cameraAngle: '低角度',
          description: '动作细节特写',
          duration: 1.5,
          movement: '跟镜',
          reason: '强调动作的力量感',
          confidence: 0.9,
          tags: ['特写', '动作']
        },
        {
          id: '4',
          shotSize: '中景',
          cameraAngle: '侧面',
          description: '动作结果展示',
          duration: 3,
          reason: '展示动作的结果和影响',
          confidence: 0.85,
          tags: ['结果', '反应']
        }
      );
      break;
      
    case 'establishing':
      suggestions.push(
        {
          id: '1',
          shotSize: '远景',
          cameraAngle: '高角度',
          description: '场景全景建立',
          duration: 4,
          movement: '缓慢推进',
          reason: '建立场景的整体氛围',
          confidence: 0.95,
          tags: ['建立', '全景']
        },
        {
          id: '2',
          shotSize: '全景',
          cameraAngle: '平视',
          description: '场景中景展示',
          duration: 3,
          reason: '展示场景的主要元素',
          confidence: 0.9,
          tags: ['环境', '细节']
        }
      );
      break;
      
    case 'emotional':
      suggestions.push(
        {
          id: '1',
          shotSize: '中景',
          cameraAngle: '平视',
          description: '角色情绪状态',
          duration: 3,
          reason: '展示角色的整体状态',
          confidence: 0.9,
          tags: ['情绪', '状态']
        },
        {
          id: '2',
          shotSize: '特写',
          cameraAngle: '平视',
          description: '面部表情特写',
          duration: 4,
          reason: '捕捉细微的情绪变化',
          confidence: 0.95,
          tags: ['特写', '表情']
        },
        {
          id: '3',
          shotSize: '特写',
          cameraAngle: '侧面',
          description: '眼神或手部特写',
          duration: 2,
          reason: '通过细节强化情绪',
          confidence: 0.85,
          tags: ['细节', '情绪']
        },
        {
          id: '4',
          shotSize: '中景',
          cameraAngle: '后方',
          description: '角色背影或环境',
          duration: 3,
          reason: '营造情绪氛围',
          confidence: 0.8,
          tags: ['氛围', '环境']
        }
      );
      break;
      
    default:
      // 默认通用方案
      suggestions.push(
        {
          id: '1',
          shotSize: '全景',
          cameraAngle: '平视',
          description: '建立场景',
          duration: 3,
          reason: '建立场景的基本信息',
          confidence: 0.8,
          tags: ['建立']
        },
        {
          id: '2',
          shotSize: '中景',
          cameraAngle: '平视',
          description: '主要动作或对话',
          duration: 4,
          reason: '展示场景的主要内容',
          confidence: 0.85,
          tags: ['主要内容']
        },
        {
          id: '3',
          shotSize: '近景',
          cameraAngle: '平视',
          description: '角色反应或细节',
          duration: 3,
          reason: '捕捉重要的反应或细节',
          confidence: 0.8,
          tags: ['细节']
        },
        {
          id: '4',
          shotSize: '中景',
          cameraAngle: '侧面',
          description: '场景结束或过渡',
          duration: 2,
          reason: '为下一场景做准备',
          confidence: 0.75,
          tags: ['过渡']
        }
      );
  }
  
  // 调整到指定数量
  while (suggestions.length < panelCount) {
    const lastShot = suggestions[suggestions.length - 1];
    suggestions.push({
      ...lastShot,
      id: String(suggestions.length + 1),
      description: `${lastShot.description}（延续）`,
      confidence: lastShot.confidence * 0.9
    });
  }
  
  if (suggestions.length > panelCount) {
    suggestions.splice(panelCount);
  }
  
  // 生成替代方案
  const alternativeApproaches: AlternativeApproach[] = [
    {
      name: '经典风格',
      description: '传统的电影叙事手法，注重连贯性和流畅性',
      shots: suggestions.map((s, i) => ({
        ...s,
        id: `classic-${i + 1}`,
        tags: [...s.tags, '经典']
      }))
    },
    {
      name: '艺术风格',
      description: '更具艺术性和实验性的镜头语言',
      shots: suggestions.map((s, i) => ({
        ...s,
        id: `artistic-${i + 1}`,
        cameraAngle: i % 2 === 0 ? '高角度' : '低角度',
        movement: i % 2 === 0 ? '缓慢推进' : '缓慢拉远',
        tags: [...s.tags, '艺术', '实验']
      }))
    },
    {
      name: '快节奏',
      description: '快速剪辑，适合动作或紧张场景',
      shots: suggestions.map((s, i) => ({
        ...s,
        id: `fast-${i + 1}`,
        duration: Math.max(1, s.duration * 0.6),
        movement: '快速运镜',
        tags: [...s.tags, '快节奏']
      }))
    }
  ];
  
  // 生成拍摄提示
  const tips: string[] = [
    '注意光线的方向和强度，确保符合场景氛围',
    '保持镜头的连贯性，遵循180度法则',
    '使用适当的景深来引导观众注意力',
    '考虑声音设计，环境音和对白的平衡',
    '预留足够的剪辑空间，每个镜头多拍几秒'
  ];
  
  // 根据场景类型添加特定提示
  if (analysis.sceneType === 'dialogue') {
    tips.push('对话场景注意眼神交流和反应镜头');
    tips.push('使用过肩镜头建立角色间的空间关系');
  } else if (analysis.sceneType === 'action') {
    tips.push('动作场景使用多角度拍摄增加冲击力');
    tips.push('注意动作的连贯性和节奏感');
  } else if (analysis.sceneType === 'emotional') {
    tips.push('情感场景多使用特写捕捉细微表情');
    tips.push('给演员足够的时间表达情绪');
  }
  
  return {
    sceneAnalysis: analysis,
    suggestions,
    alternativeApproaches,
    tips
  };
}

export default generateStoryboardSuggestion;
