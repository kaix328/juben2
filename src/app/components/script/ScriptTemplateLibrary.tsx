/**
 * 剧本模板库
 * 提供各种类型的剧本模板，快速开始创作
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Film,
  Tv,
  Video,
  Globe,
  Heart,
  Swords,
  Laugh,
  Ghost,
  Sparkles,
  BookOpen,
  Search,
  Star,
  Clock,
  Users,
  Rocket,
  Skull,
  Camera,
  Zap,
  Mountain,
  Baby,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ScriptScene } from '../../pages/ScriptEditor/types';
import { generateId } from '../../utils/storage';

interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'movie' | 'tv' | 'short' | 'web';
  genre: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  sceneCount: number;
  tags: string[];
  scenes: Partial<ScriptScene>[];
}

const TEMPLATES: ScriptTemplate[] = [
  // 电影模板
  {
    id: 'movie-action',
    name: '动作片标准结构',
    description: '经典三幕式动作片结构，包含开场动作戏、中段转折、高潮对决',
    category: 'movie',
    genre: '动作',
    icon: Swords,
    duration: '90-120分钟',
    sceneCount: 45,
    tags: ['三幕式', '动作戏', '英雄之旅'],
    scenes: [
      {
        sceneNumber: 1,
        location: '城市街道',
        timeOfDay: '夜晚',
        sceneType: 'EXT',
        action: '开场动作戏：主角展示能力，建立角色形象',
        characters: ['主角'],
        dialogues: [],
        estimatedDuration: 180,
      },
      {
        sceneNumber: 2,
        location: '主角公寓',
        timeOfDay: '清晨',
        sceneType: 'INT',
        action: '日常生活场景：展示主角的普通生活和内心渴望',
        characters: ['主角'],
        dialogues: [],
        estimatedDuration: 120,
      },
      {
        sceneNumber: 3,
        location: '警察局',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '触发事件：主角接到任务或遭遇危机',
        characters: ['主角', '上司'],
        dialogues: [],
        estimatedDuration: 180,
      },
    ],
  },
  {
    id: 'movie-romance',
    name: '爱情片经典结构',
    description: '浪漫爱情故事模板，包含相遇、误会、和解的经典桥段',
    category: 'movie',
    genre: '爱情',
    icon: Heart,
    duration: '90-110分钟',
    sceneCount: 40,
    tags: ['浪漫', '情感', '误会'],
    scenes: [
      {
        sceneNumber: 1,
        location: '咖啡厅',
        timeOfDay: '下午',
        sceneType: 'INT',
        action: '命运般的相遇：男女主角第一次见面，留下深刻印象',
        characters: ['男主', '女主'],
        dialogues: [],
        estimatedDuration: 240,
      },
      {
        sceneNumber: 2,
        location: '公园',
        timeOfDay: '傍晚',
        sceneType: 'EXT',
        action: '偶然重逢：两人再次相遇，开始交流',
        characters: ['男主', '女主'],
        dialogues: [],
        estimatedDuration: 180,
      },
    ],
  },
  {
    id: 'movie-comedy',
    name: '喜剧片结构',
    description: '轻松幽默的喜剧结构，注重笑点设计和角色反差',
    category: 'movie',
    genre: '喜剧',
    icon: Laugh,
    duration: '90-100分钟',
    sceneCount: 35,
    tags: ['幽默', '反差', '误会'],
    scenes: [
      {
        sceneNumber: 1,
        location: '办公室',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '开场笑点：主角遭遇尴尬情况，建立喜剧基调',
        characters: ['主角'],
        dialogues: [],
        estimatedDuration: 150,
      },
    ],
  },
  {
    id: 'movie-thriller',
    name: '悬疑惊悚片',
    description: '紧张刺激的悬疑结构，层层递进的谜团设计',
    category: 'movie',
    genre: '悬疑',
    icon: Ghost,
    duration: '100-120分钟',
    sceneCount: 50,
    tags: ['悬疑', '反转', '紧张'],
    scenes: [
      {
        sceneNumber: 1,
        location: '废弃工厂',
        timeOfDay: '深夜',
        sceneType: 'INT',
        action: '神秘开场：发现尸体或异常事件，引发调查',
        characters: ['侦探'],
        dialogues: [],
        estimatedDuration: 200,
      },
    ],
  },
  {
    id: 'movie-scifi',
    name: '科幻片结构',
    description: '未来世界观设定，科技与人性的探讨',
    category: 'movie',
    genre: '科幻',
    icon: Rocket,
    duration: '110-140分钟',
    sceneCount: 55,
    tags: ['科幻', '未来', '科技'],
    scenes: [
      {
        sceneNumber: 1,
        location: '太空站观察舱',
        timeOfDay: '不适用',
        sceneType: 'INT',
        action: '世界观建立：展示未来科技和生活方式',
        characters: ['主角'],
        dialogues: [],
        estimatedDuration: 180,
      },
      {
        sceneNumber: 2,
        location: '实验室',
        timeOfDay: '不适用',
        sceneType: 'INT',
        action: '科技展示：介绍核心科技设定',
        characters: ['主角', '科学家'],
        dialogues: [],
        estimatedDuration: 200,
      },
      {
        sceneNumber: 3,
        location: '太空站走廊',
        timeOfDay: '不适用',
        sceneType: 'INT',
        action: '危机触发：科技失控或外星威胁出现',
        characters: ['主角', '船员们'],
        dialogues: [],
        estimatedDuration: 150,
      },
    ],
  },
  {
    id: 'movie-horror',
    name: '恐怖片结构',
    description: '恐怖氛围营造，惊吓点设计和心理恐惧',
    category: 'movie',
    genre: '恐怖',
    icon: Skull,
    duration: '85-100分钟',
    sceneCount: 40,
    tags: ['恐怖', '惊悚', '悬疑'],
    scenes: [
      {
        sceneNumber: 1,
        location: '老宅外景',
        timeOfDay: '黄昏',
        sceneType: 'EXT',
        action: '不祥预兆：主角们到达诡异的地点',
        characters: ['主角', '朋友们'],
        dialogues: [],
        estimatedDuration: 120,
      },
      {
        sceneNumber: 2,
        location: '老宅大厅',
        timeOfDay: '夜晚',
        sceneType: 'INT',
        action: '氛围营造：探索环境，发现异常迹象',
        characters: ['主角', '朋友们'],
        dialogues: [],
        estimatedDuration: 180,
      },
      {
        sceneNumber: 3,
        location: '地下室',
        timeOfDay: '深夜',
        sceneType: 'INT',
        action: '首次惊吓：遭遇超自然现象',
        characters: ['主角'],
        dialogues: [],
        estimatedDuration: 150,
      },
    ],
  },
  {
    id: 'movie-documentary',
    name: '纪录片结构',
    description: '真实记录，采访与画面结合的叙事方式',
    category: 'movie',
    genre: '纪录片',
    icon: Camera,
    duration: '60-90分钟',
    sceneCount: 30,
    tags: ['纪实', '采访', '真实'],
    scenes: [
      {
        sceneNumber: 1,
        location: '主题场景',
        timeOfDay: '白天',
        sceneType: 'EXT',
        action: '开场画面：建立主题和视觉风格',
        characters: [],
        dialogues: [],
        estimatedDuration: 120,
      },
      {
        sceneNumber: 2,
        location: '采访室',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '专家采访：介绍背景和核心观点',
        characters: ['专家A'],
        dialogues: [],
        estimatedDuration: 180,
      },
      {
        sceneNumber: 3,
        location: '现场',
        timeOfDay: '白天',
        sceneType: 'EXT',
        action: '实地拍摄：展示真实场景和细节',
        characters: ['当事人'],
        dialogues: [],
        estimatedDuration: 200,
      },
    ],
  },
  {
    id: 'movie-adventure',
    name: '冒险片结构',
    description: '探险旅程，未知世界的探索与发现',
    category: 'movie',
    genre: '冒险',
    icon: Mountain,
    duration: '100-130分钟',
    sceneCount: 48,
    tags: ['冒险', '探险', '旅程'],
    scenes: [
      {
        sceneNumber: 1,
        location: '博物馆',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '任务开始：发现古老地图或神秘线索',
        characters: ['探险家', '教授'],
        dialogues: [],
        estimatedDuration: 180,
      },
      {
        sceneNumber: 2,
        location: '丛林',
        timeOfDay: '白天',
        sceneType: 'EXT',
        action: '踏上旅程：进入未知领域',
        characters: ['探险家', '向导'],
        dialogues: [],
        estimatedDuration: 200,
      },
      {
        sceneNumber: 3,
        location: '古代遗迹',
        timeOfDay: '傍晚',
        sceneType: 'EXT',
        action: '重大发现：找到目标或遭遇危险',
        characters: ['探险家', '团队'],
        dialogues: [],
        estimatedDuration: 220,
      },
    ],
  },
  {
    id: 'movie-family',
    name: '家庭片结构',
    description: '温馨感人的家庭故事，适合全年龄观众',
    category: 'movie',
    genre: '家庭',
    icon: Baby,
    duration: '90-110分钟',
    sceneCount: 38,
    tags: ['家庭', '温馨', '成长'],
    scenes: [
      {
        sceneNumber: 1,
        location: '家中客厅',
        timeOfDay: '早晨',
        sceneType: 'INT',
        action: '家庭日常：展示家庭成员关系和生活状态',
        characters: ['父亲', '母亲', '孩子'],
        dialogues: [],
        estimatedDuration: 150,
      },
      {
        sceneNumber: 2,
        location: '学校',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '冲突引入：孩子遇到问题或挑战',
        characters: ['孩子', '老师'],
        dialogues: [],
        estimatedDuration: 180,
      },
      {
        sceneNumber: 3,
        location: '公园',
        timeOfDay: '下午',
        sceneType: 'EXT',
        action: '亲子互动：家人共同面对问题',
        characters: ['父亲', '孩子'],
        dialogues: [],
        estimatedDuration: 200,
      },
    ],
  },

  // 电视剧模板
  {
    id: 'tv-drama',
    name: '都市情感剧',
    description: '多线叙事的都市情感剧，适合长篇连续剧',
    category: 'tv',
    genre: '都市',
    icon: Tv,
    duration: '45分钟/集',
    sceneCount: 30,
    tags: ['多线叙事', '情感', '职场'],
    scenes: [
      {
        sceneNumber: 1,
        location: '写字楼大堂',
        timeOfDay: '早晨',
        sceneType: 'INT',
        action: '群像开场：介绍多个主要角色，展示各自生活状态',
        characters: ['角色A', '角色B', '角色C'],
        dialogues: [],
        estimatedDuration: 180,
      },
    ],
  },
  {
    id: 'tv-period',
    name: '古装历史剧',
    description: '宏大的历史背景，权谋与情感交织',
    category: 'tv',
    genre: '古装',
    icon: BookOpen,
    duration: '45分钟/集',
    sceneCount: 35,
    tags: ['历史', '权谋', '史诗'],
    scenes: [
      {
        sceneNumber: 1,
        location: '皇宫大殿',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '朝堂之上：展示权力格局和主要矛盾',
        characters: ['皇帝', '大臣们'],
        dialogues: [],
        estimatedDuration: 240,
      },
    ],
  },
  {
    id: 'tv-crime',
    name: '刑侦悬疑剧',
    description: '单元剧结构，每集一个案件，主线贯穿',
    category: 'tv',
    genre: '刑侦',
    icon: Zap,
    duration: '45分钟/集',
    sceneCount: 32,
    tags: ['刑侦', '推理', '悬疑'],
    scenes: [
      {
        sceneNumber: 1,
        location: '案发现场',
        timeOfDay: '清晨',
        sceneType: 'EXT',
        action: '案件开场：发现案件，警方到场',
        characters: ['警探', '法医'],
        dialogues: [],
        estimatedDuration: 180,
      },
      {
        sceneNumber: 2,
        location: '警局会议室',
        timeOfDay: '上午',
        sceneType: 'INT',
        action: '案情分析：团队讨论线索和嫌疑人',
        characters: ['警探', '队长', '技术员'],
        dialogues: [],
        estimatedDuration: 200,
      },
    ],
  },
  {
    id: 'tv-medical',
    name: '医疗剧',
    description: '医院背景，医患故事与医生成长',
    category: 'tv',
    genre: '医疗',
    icon: Heart,
    duration: '45分钟/集',
    sceneCount: 30,
    tags: ['医疗', '人性', '成长'],
    scenes: [
      {
        sceneNumber: 1,
        location: '急诊室',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '紧急救治：展示医生的专业和压力',
        characters: ['医生', '护士', '患者'],
        dialogues: [],
        estimatedDuration: 200,
      },
      {
        sceneNumber: 2,
        location: '医生办公室',
        timeOfDay: '下午',
        sceneType: 'INT',
        action: '医患沟通：探讨医疗伦理和人性',
        characters: ['医生', '患者家属'],
        dialogues: [],
        estimatedDuration: 180,
      },
    ],
  },

  // 短视频模板
  {
    id: 'short-viral',
    name: '爆款短视频',
    description: '3分钟内抓住眼球，适合社交媒体传播',
    category: 'short',
    genre: '创意',
    icon: Video,
    duration: '1-3分钟',
    sceneCount: 5,
    tags: ['快节奏', '反转', '情感'],
    scenes: [
      {
        sceneNumber: 1,
        location: '街头',
        timeOfDay: '白天',
        sceneType: 'EXT',
        action: '开场钩子：3秒内吸引注意力的强烈画面或冲突',
        characters: ['主角'],
        dialogues: [],
        estimatedDuration: 15,
      },
      {
        sceneNumber: 2,
        location: '同一地点',
        timeOfDay: '白天',
        sceneType: 'EXT',
        action: '快速发展：矛盾升级或情节推进',
        characters: ['主角', '配角'],
        dialogues: [],
        estimatedDuration: 30,
      },
      {
        sceneNumber: 3,
        location: '同一地点',
        timeOfDay: '白天',
        sceneType: 'EXT',
        action: '反转结局：出人意料的结局或情感升华',
        characters: ['主角', '配角'],
        dialogues: [],
        estimatedDuration: 20,
      },
    ],
  },
  {
    id: 'short-tutorial',
    name: '教学短视频',
    description: '清晰的教学结构，适合知识分享',
    category: 'short',
    genre: '教学',
    icon: Sparkles,
    duration: '2-5分钟',
    sceneCount: 4,
    tags: ['教学', '实用', '清晰'],
    scenes: [
      {
        sceneNumber: 1,
        location: '工作室',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '开场：介绍今天要教的内容和价值',
        characters: ['讲师'],
        dialogues: [],
        estimatedDuration: 20,
      },
    ],
  },
  {
    id: 'short-vlog',
    name: 'Vlog日常记录',
    description: '生活记录型短视频，真实自然的叙事',
    category: 'short',
    genre: 'Vlog',
    icon: Camera,
    duration: '3-8分钟',
    sceneCount: 6,
    tags: ['日常', '真实', '生活'],
    scenes: [
      {
        sceneNumber: 1,
        location: '家中',
        timeOfDay: '早晨',
        sceneType: 'INT',
        action: '早安问候：开场打招呼，介绍今天计划',
        characters: ['博主'],
        dialogues: [],
        estimatedDuration: 30,
      },
      {
        sceneNumber: 2,
        location: '咖啡店',
        timeOfDay: '上午',
        sceneType: 'INT',
        action: '日常活动：展示生活片段',
        characters: ['博主'],
        dialogues: [],
        estimatedDuration: 60,
      },
    ],
  },
  {
    id: 'short-comedy',
    name: '搞笑短剧',
    description: '快节奏喜剧，密集笑点设计',
    category: 'short',
    genre: '搞笑',
    icon: Laugh,
    duration: '1-3分钟',
    sceneCount: 4,
    tags: ['搞笑', '夸张', '反转'],
    scenes: [
      {
        sceneNumber: 1,
        location: '办公室',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '设置情境：建立正常场景',
        characters: ['主角', '同事'],
        dialogues: [],
        estimatedDuration: 20,
      },
      {
        sceneNumber: 2,
        location: '办公室',
        timeOfDay: '白天',
        sceneType: 'INT',
        action: '笑点爆发：夸张表演和意外情况',
        characters: ['主角', '同事'],
        dialogues: [],
        estimatedDuration: 40,
      },
    ],
  },

  // 网络剧模板
  {
    id: 'web-youth',
    name: '青春校园网剧',
    description: '轻松活泼的校园故事，适合年轻观众',
    category: 'web',
    genre: '青春',
    icon: Globe,
    duration: '20-30分钟/集',
    sceneCount: 20,
    tags: ['校园', '青春', '轻松'],
    scenes: [
      {
        sceneNumber: 1,
        location: '教室',
        timeOfDay: '早晨',
        sceneType: 'INT',
        action: '校园日常：展示主角们的学校生活',
        characters: ['学生A', '学生B'],
        dialogues: [],
        estimatedDuration: 120,
      },
    ],
  },
  {
    id: 'web-fantasy',
    name: '玄幻网剧',
    description: '奇幻世界观，适合网络平台的快节奏叙事',
    category: 'web',
    genre: '玄幻',
    icon: Sparkles,
    duration: '25-35分钟/集',
    sceneCount: 25,
    tags: ['玄幻', '升级', '热血'],
    scenes: [
      {
        sceneNumber: 1,
        location: '修炼场',
        timeOfDay: '清晨',
        sceneType: 'EXT',
        action: '主角修炼：展示世界观和主角初始状态',
        characters: ['主角'],
        dialogues: [],
        estimatedDuration: 150,
      },
    ],
  },
  {
    id: 'web-romance',
    name: '甜宠网剧',
    description: '轻松甜蜜的爱情故事，高糖分内容',
    category: 'web',
    genre: '甜宠',
    icon: Heart,
    duration: '20-25分钟/集',
    sceneCount: 18,
    tags: ['甜宠', '爱情', '轻松'],
    scenes: [
      {
        sceneNumber: 1,
        location: '公司大厅',
        timeOfDay: '早晨',
        sceneType: 'INT',
        action: '命中注定：男女主角意外相遇',
        characters: ['女主', '男主'],
        dialogues: [],
        estimatedDuration: 120,
      },
      {
        sceneNumber: 2,
        location: '电梯',
        timeOfDay: '早晨',
        sceneType: 'INT',
        action: '甜蜜互动：近距离接触，心动时刻',
        characters: ['女主', '男主'],
        dialogues: [],
        estimatedDuration: 100,
      },
    ],
  },
  {
    id: 'web-suspense',
    name: '悬疑推理网剧',
    description: '烧脑剧情，适合网络观众的快节奏推理',
    category: 'web',
    genre: '悬疑',
    icon: Ghost,
    duration: '30-40分钟/集',
    sceneCount: 28,
    tags: ['悬疑', '推理', '烧脑'],
    scenes: [
      {
        sceneNumber: 1,
        location: '密室',
        timeOfDay: '夜晚',
        sceneType: 'INT',
        action: '谜题开始：主角被困或发现谜团',
        characters: ['主角'],
        dialogues: [],
        estimatedDuration: 180,
      },
      {
        sceneNumber: 2,
        location: '密室',
        timeOfDay: '夜晚',
        sceneType: 'INT',
        action: '线索收集：寻找破解谜题的关键',
        characters: ['主角', '其他被困者'],
        dialogues: [],
        estimatedDuration: 200,
      },
    ],
  },
];

interface ScriptTemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (scenes: ScriptScene[]) => void;
}

export function ScriptTemplateLibrary({
  open,
  onOpenChange,
  onSelectTemplate,
}: ScriptTemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null);

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: ScriptTemplate) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    // 生成完整的场景数据
    const scenes: ScriptScene[] = selectedTemplate.scenes.map((scene, index) => ({
      id: generateId(),
      sceneNumber: index + 1,
      episodeNumber: 1,
      location: scene.location || '',
      timeOfDay: scene.timeOfDay || '白天',
      sceneType: scene.sceneType || 'INT',
      characters: scene.characters || [],
      action: scene.action || '',
      dialogues: scene.dialogues || [],
      estimatedDuration: scene.estimatedDuration || 60,
      notes: `基于模板：${selectedTemplate.name}`,
    }));

    onSelectTemplate(scenes);
    toast.success(`已应用模板：${selectedTemplate.name}`);
    onOpenChange(false);
    setSelectedTemplate(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'movie':
        return Film;
      case 'tv':
        return Tv;
      case 'short':
        return Video;
      case 'web':
        return Globe;
      default:
        return BookOpen;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            剧本模板库
          </DialogTitle>
          <DialogDescription>
            选择合适的模板快速开始创作，所有模板都可以自由修改
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* 搜索和筛选 */}
          <div className="flex gap-3 flex-shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索模板名称、类型、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 分类标签 */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-shrink-0">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="gap-2">
                <Star className="w-4 h-4" />
                全部
              </TabsTrigger>
              <TabsTrigger value="movie" className="gap-2">
                <Film className="w-4 h-4" />
                电影
              </TabsTrigger>
              <TabsTrigger value="tv" className="gap-2">
                <Tv className="w-4 h-4" />
                电视剧
              </TabsTrigger>
              <TabsTrigger value="short" className="gap-2">
                <Video className="w-4 h-4" />
                短视频
              </TabsTrigger>
              <TabsTrigger value="web" className="gap-2">
                <Globe className="w-4 h-4" />
                网络剧
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 模板列表 */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                const CategoryIcon = getCategoryIcon(template.category);
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CategoryIcon className="w-3 h-3" />
                          <span>{template.genre}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {template.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {template.sceneCount} 场景
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Search className="w-12 h-12 mb-3" />
                <p>未找到匹配的模板</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            应用模板
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
