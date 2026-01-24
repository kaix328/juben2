/**
 * 高级工具页面
 * 集成所有新增的专业功能
 * 注：数据分析功能已整合到 ProjectDashboard 页面
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import {
  Wand2,
  Users,
  Palette,
  Bot,
  Keyboard,
  BarChart3,
  Layers,
  Copy // 🆕
} from 'lucide-react';

// 导入 Dialog 组件
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";

// 导入新功能组件
import { ContinuityPanel } from '../components/ContinuityPanel';
import { SuggestionPanel } from '../components/SuggestionPanel';
import { CharacterManagerPanel } from '../components/CharacterManagerPanel';
import { StyleMixPanel } from '../components/StyleMixPanel';
import { ModelManagerPanel } from '../components/ModelManagerPanel';
import { KeyboardShortcutsHelp } from '../components/KeyboardShortcutsHelp';

// 导入工具函数
import { projectStorage, storyboardStorage, chapterStorage } from '../utils/storage';
import type { Project, StoryboardPanel } from '../types';

export function AdvancedTools() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('continuity');
  const [project, setProject] = React.useState<Project | null>(null);
  const [panels, setPanels] = React.useState<StoryboardPanel[]>([]);
  const [panelChapterMap, setPanelChapterMap] = React.useState<Record<string, string>>({});
  const [promptDialog, setPromptDialog] = useState({ open: false, positive: '', negative: '' }); // 🆕

  // 加载项目数据
  React.useEffect(() => {
    const loadData = async () => {
      if (projectId) {
        const proj = await projectStorage.getById(projectId);
        setProject(proj || null);

        // 加载所有分镜
        if (proj) {
          const allPanels: StoryboardPanel[] = [];
          const chapterMap: Record<string, string> = {};
          const chapters = await chapterStorage.getByProjectId(projectId);

          for (const chapter of chapters) {
            const storyboard = await storyboardStorage.getByChapterId(chapter.id);
            if (storyboard?.panels) {
              allPanels.push(...storyboard.panels);
              storyboard.panels.forEach(p => {
                chapterMap[p.id] = chapter.id;
              });
            }
          }
          setPanels(allPanels);
          setPanelChapterMap(chapterMap);
        }
      }
    };
    loadData();
  }, [projectId]);

  const tools = [
    { id: 'continuity', label: '连贯性检测', icon: Layers, color: 'text-blue-600' },
    { id: 'suggestion', label: 'AI分镜建议', icon: Wand2, color: 'text-purple-600' },
    { id: 'character', label: '角色管理', icon: Users, color: 'text-indigo-600' },
    { id: 'style', label: '风格混合', icon: Palette, color: 'text-pink-600' },
    { id: 'models', label: 'AI模型', icon: Bot, color: 'text-green-600' },
    { id: 'shortcuts', label: '快捷键', icon: Keyboard, color: 'text-gray-600' },
  ];

  // 跳转到分镜
  const handleNavigateToPanel = (panelId: string) => {
    const chapterId = panelChapterMap[panelId];
    if (chapterId) {
      navigate(`/projects/${projectId}/storyboard/${chapterId}?panelId=${panelId}`);
      toast.success('正在跳转到对应分镜...');
    } else {
      toast.error('无法定位分镜所属章节');
    }
  };


  // 应用分镜建议
  const handleApplySuggestions = async (suggestions: any[]) => {
    if (!project || !projectId) {
      toast.error('无法获取项目信息');
      return;
    }

    try {
      // 1. 确定目标章节（默认添加到最后一章，如果没有则创建）
      let targetChapterId = '';
      const chapters = await chapterStorage.getByProjectId(projectId);

      if (chapters && chapters.length > 0) {
        targetChapterId = chapters[chapters.length - 1].id;
      } else {
        // 创建新章节
        // 因为 AdvancedTools 是纯展示页面，这里暂时提示用户
        // 如果要支持创建，需要引入 chapterStorage.save 和 uuid 生成
        toast.error('请先在项目详情页创建一个章节');
        return;
      }

      // 2. 转换数据
      const newPanels = suggestions.map((s, index) => {
        const panelId = Date.now().toString() + Math.random().toString(36).substr(2, 5) + index;
        return {
          id: panelId,
          panelNumber: panels.length + index + 1, // 临时序号，实际应重新计算
          sceneId: s.sceneId || 'auto_generated',
          description: s.description,
          dialogue: '',
          shot: s.shotSize,
          angle: s.cameraAngle,
          duration: s.duration,
          characters: [],
          props: [],
          notes: `AI建议: ${s.reason}\n标签: ${s.tags.join(', ')}`,
          shotSize: s.shotSize as any,
          cameraAngle: s.cameraAngle as any,
          isGenerating: false
        } as StoryboardPanel;
      });

      // 3. 保存到分镜存储
      // 需要先获取该章节现有的分镜以确定正确的 panelNumber
      const currentStoryboard = await storyboardStorage.getByChapterId(targetChapterId);
      if (currentStoryboard) {
        // 追加
        const nextPanelNumber = (currentStoryboard.panels?.length || 0) + 1;
        newPanels.forEach((p, i) => p.panelNumber = nextPanelNumber + i);

        // 逐个添加 (storyboardStorage.addPanel 内部会处理保存)
        // 但为了性能，最好是批量。目前 storyboardStorage 似乎只暴露了 addPanel?
        // 检查 storage 源码，通常是 save(storyboard)。
        // 我们这里用 addPanel 循环调用，或者直接更新 storyboard 对象。

        // 更加稳妥的方式：直接操作 storyboard 对象并保存
        const updatedPanels = [...(currentStoryboard.panels || []), ...newPanels];
        currentStoryboard.panels = updatedPanels;
        currentStoryboard.updatedAt = new Date().toISOString();
        await storyboardStorage.save(currentStoryboard);

      } else {
        // 创建新的 storyboard 记录
        await storyboardStorage.save({
          id: Date.now().toString(),
          chapterId: targetChapterId,
          panels: newPanels,
          updatedAt: new Date().toISOString()
        });
      }

      // 4. 更新本地状态
      setPanels(prev => [...prev, ...newPanels]);
      toast.success(`已成功添加 ${newPanels.length} 个分镜到最新章节`);

    } catch (error) {
      console.error('Failed to apply suggestions:', error);
      toast.error('应用建议失败', { description: String(error) });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 面包屑导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">首页</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {project && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/projects/${projectId}`}>{project.title}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>高级工具</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wand2 className="w-8 h-8 text-purple-600" />
            高级工具
          </h1>
          <p className="text-gray-600 mt-1">专业级分镜制作工具集</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/projects/${projectId}/dashboard`)}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          数据统计
        </Button>
      </div>

      {/* 工具标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 bg-gray-100 p-1 rounded-lg">
          {tools.map(tool => (
            <TabsTrigger
              key={tool.id}
              value={tool.id}
              className="flex items-center gap-2 data-[state=active]:bg-white"
            >
              <tool.icon className={`w-4 h-4 ${tool.color}`} />
              <span className="hidden md:inline">{tool.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 连贯性检测 */}
        <TabsContent value="continuity" className="mt-6">
          {panels.length > 0 ? (
            <ContinuityPanel
              panels={panels}
              onPanelSelect={handleNavigateToPanel}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">暂无分镜数据</h3>
                <p className="text-gray-500 mb-4">请先在章节中创建分镜</p>
                <Button onClick={() => navigate(`/projects/${projectId}`)}>
                  前往创建分镜
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI分镜建议 */}
        <TabsContent value="suggestion" className="mt-6">
          <SuggestionPanel
            onApplySuggestion={(suggestion) => handleApplySuggestions([suggestion])}
            onApplyAll={(suggestions) => handleApplySuggestions(suggestions)}
          />
        </TabsContent>

        {/* 角色管理 */}
        <TabsContent value="character" className="mt-6">
          <CharacterManagerPanel
            onSelectCharacter={(character) => {
              console.log('Selected character:', character);
            }}
            onGeneratePrompt={(positive, negative) => {
              setPromptDialog({ open: true, positive, negative }); // 🆕 使用 Dialog
            }}
          />
        </TabsContent>

        {/* 风格混合 */}
        <TabsContent value="style" className="mt-6">
          <StyleMixPanel
            onApplyStyle={(prompt, negativePrompt, params) => {
              // 保存风格设置到 localStorage 供全局使用
              const styleSettings = {
                basePrompt: prompt,
                negativePrompt: negativePrompt,
                parameters: params,
                updatedAt: new Date().toISOString()
              };
              localStorage.setItem(`project_${projectId}_style_settings`, JSON.stringify(styleSettings));

              toast.success('风格已应用到项目', {
                description: '新生成的分镜图将使用此风格设置'
              });

              console.log('[StyleMix] Applied:', styleSettings);
            }}
          />
        </TabsContent>

        {/* AI模型管理 */}
        <TabsContent value="models" className="mt-6">
          <ModelManagerPanel
            onModelSelect={(modelId) => {
              // 保存选中的模型 ID 到 localStorage
              localStorage.setItem('default_ai_model', modelId);

              // 如果是项目级别，也可以保存到项目配置
              if (projectId) {
                localStorage.setItem(`project_${projectId}_ai_model`, modelId);
              }

              toast.success(`已设置默认模型: ${modelId}`, {
                description: '后续 AI 操作将优先使用此模型'
              });

              console.log('[ModelManager] Selected:', modelId);
            }}
          />
        </TabsContent>

        {/* 快捷键 */}
        <TabsContent value="shortcuts" className="mt-6">
          <KeyboardShortcutsHelp />
        </TabsContent>
      </Tabs>

      {/* 提示词预览 Dialog */}
      <Dialog open={promptDialog.open} onOpenChange={(open) => setPromptDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI 提示词生成结果</DialogTitle>
            <DialogDescription>
              检查并复制生成的提示词，可直接用于 AI 绘画工具。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex justify-between">
                正向提示词 (Positive)
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-blue-600 hover:text-blue-700 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(promptDialog.positive);
                    toast.success('正向提示词已复制');
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  复制
                </Button>
              </label>
              <textarea
                value={promptDialog.positive}
                onChange={(e) => setPromptDialog(prev => ({ ...prev, positive: e.target.value }))}
                className="w-full h-32 p-3 text-sm bg-gray-50 border rounded-lg resize-none font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex justify-between">
                负向提示词 (Negative)
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-red-600 hover:text-red-700 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(promptDialog.negative);
                    toast.success('负向提示词已复制');
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  复制
                </Button>
              </label>
              <textarea
                value={promptDialog.negative}
                onChange={(e) => setPromptDialog(prev => ({ ...prev, negative: e.target.value }))}
                className="w-full h-24 p-3 text-sm bg-gray-50 border rounded-lg resize-none font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptDialog(prev => ({ ...prev, open: false }))}>
              关闭
            </Button>
            <Button onClick={() => {
              navigator.clipboard.writeText(`Positive:\n${promptDialog.positive}\n\nNegative:\n${promptDialog.negative}`);
              toast.success('完整提示词已复制');
              setPromptDialog(prev => ({ ...prev, open: false }));
            }}>
              <Copy className="w-4 h-4 mr-2" />
              复制全部
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdvancedTools;
