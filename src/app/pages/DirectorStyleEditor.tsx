/**
 * 导演风格编辑器（重构版）
 * 使用提取的 hooks 和组件简化代码
 */

import { useParams } from 'react-router-dom';
import { Palette, Save, Sparkles, Wand2, RotateCcw, RefreshCw, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { StyleApplicationSettingsPanel } from '../components/StyleApplicationSettings';
import { StyleSelect } from '../components/StyleSelect';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";

// Hooks
import { useDirectorStyle, useStyleBatchApply } from '../utils/hooks/useDirectorStyle';

// 常量
import {
  ART_STYLE_OPTIONS,
  COLOR_TONE_OPTIONS,
  LIGHTING_STYLE_OPTIONS,
  CAMERA_STYLE_OPTIONS,
  MOOD_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  FRAME_RATE_OPTIONS,
  MOTION_INTENSITY_OPTIONS,
  MOTION_INTENSITY_LABELS,
} from '../constants/director-style-options';

// 预设
import { DIRECTOR_STYLE_PRESETS } from '../utils/promptGenerator';

export function DirectorStyleEditor() {
  const { projectId } = useParams<{ projectId: string }>();

  // 使用提取的 hooks 管理状态
  const {
    style,
    setStyle,
    styleSettings,
    currentProject,
    isMountedRef,
    safeToast,
    safeUpdateStyle,
    safeUpdateStyleSettings,
    resetStyle,
    handleSave,
  } = useDirectorStyle(projectId);

  // 批量应用风格
  const { isApplyingToAll, handleApplyStyleToAllPanels } = useStyleBatchApply(
    projectId,
    style,
    handleSave,
    isMountedRef
  );

  // 应用预设
  const handleApplyPreset = (presetName: string) => {
    if (!isMountedRef.current) return;
    const preset = DIRECTOR_STYLE_PRESETS[presetName];
    if (preset) {
      setStyle(preset);
      safeToast(`已应用 ${presetName}`);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载项目配置中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">首页</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/projects/${projectId}`}>{currentProject.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>导演风格</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题和操作按钮 */}
      <PageHeader
        onReset={resetStyle}
        onSave={handleSave}
        onApplyToAll={handleApplyStyleToAllPanels}
        isApplyingToAll={isApplyingToAll}
      />

      {/* 风格预设 */}
      <StylePresetSelector onApplyPreset={handleApplyPreset} />

      {/* 风格参数设置 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StyleSelect
          label="艺术风格"
          description="定义画面的整体艺术表现形式"
          value={style.artStyle}
          onChange={(value) => safeUpdateStyle('artStyle', value)}
          options={ART_STYLE_OPTIONS}
        />

        <StyleSelect
          label="色调设定"
          description="设定画面的主色调和色彩倾向"
          value={style.colorTone}
          onChange={(value) => safeUpdateStyle('colorTone', value)}
          options={COLOR_TONE_OPTIONS}
        />

        <StyleSelect
          label="光照风格"
          description="控制画面的光影效果和氛围"
          value={style.lightingStyle}
          onChange={(value) => safeUpdateStyle('lightingStyle', value)}
          options={LIGHTING_STYLE_OPTIONS}
        />

        <StyleSelect
          label="镜头风格"
          description="定义镜头的拍摄风格和视角"
          value={style.cameraStyle}
          onChange={(value) => safeUpdateStyle('cameraStyle', value)}
          options={CAMERA_STYLE_OPTIONS}
        />

        <StyleSelect
          label="情绪氛围"
          description="设定画面传递的整体情绪"
          value={style.mood}
          onChange={(value) => safeUpdateStyle('mood', value)}
          options={MOOD_OPTIONS}
        />

        <StyleSelect
          label="画面比例"
          description="定义生成图片和视频的宽高比"
          value={style.aspectRatio || '16:9'}
          onChange={(value) => safeUpdateStyle('aspectRatio', value as any)}
          options={ASPECT_RATIO_OPTIONS}
        />

        <StyleSelect
          label="视频帧率"
          description="视频的帧率设置，影响流畅度"
          value={style.videoFrameRate || '24'}
          onChange={(value) => safeUpdateStyle('videoFrameRate', value as any)}
          options={FRAME_RATE_OPTIONS}
        />

        <StyleSelect
          label="运动强度"
          description="控制视频中的运动幅度和动态感"
          value={style.motionIntensity || 'normal'}
          onChange={(value) => safeUpdateStyle('motionIntensity', value as any)}
          options={MOTION_INTENSITY_OPTIONS}
        />

        {/* 自定义提示词 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">自定义提示词</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>额外的风格描述（英文效果更佳）</Label>
            <Textarea
              value={style.customPrompt}
              onChange={(e) => safeUpdateStyle('customPrompt', e.target.value)}
              rows={4}
              placeholder="例如：Studio Ghibli style, hand-drawn animation, watercolor aesthetic, nature elements..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              可以添加更具体的风格描述，这些内容会自动添加到所有AI提示词中
            </p>
          </CardContent>
        </Card>

        {/* 负面提示词 */}
        <Card className="lg:col-span-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg text-red-700">负面提示词（Negative Prompt）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>需要避免的元素（英文）</Label>
            <Textarea
              value={style.negativePrompt || ''}
              onChange={(e) => safeUpdateStyle('negativePrompt', e.target.value)}
              rows={3}
              placeholder="deformed, distorted, bad anatomy, extra fingers, missing limbs, blurry, lowres, watermark, text..."
              className="font-mono text-sm bg-white"
            />
            <p className="text-xs text-red-600">
              💡 这些描述会告诉AI需要避免生成的内容，如变形、多余手指、模糊等常见问题
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 风格预览 */}
      <StylePreview style={style} />

      {/* 风格应用设置 */}
      <StyleApplicationSettingsPanel
        settings={styleSettings}
        onSettingsChange={safeUpdateStyleSettings}
      />
    </div>
  );
}

// ============ 子组件 ============

/**
 * 页面头部组件
 */
function PageHeader({
  onReset,
  onSave,
  onApplyToAll,
  isApplyingToAll,
}: {
  onReset: () => void;
  onSave: () => void;
  onApplyToAll: () => void;
  isApplyingToAll: boolean;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Palette className="w-8 h-8" />
          导演风格设定
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">为整个项目设定统一的视觉风格，将自动应用到所有AI提示词</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          重置
        </Button>
        <Button onClick={onSave} className="gap-2">
          <Save className="w-4 h-4" />
          保存风格
        </Button>
        <Button
          variant="secondary"
          onClick={onApplyToAll}
          disabled={isApplyingToAll}
          className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
        >
          {isApplyingToAll ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Layers className="w-4 h-4" />
          )}
          {isApplyingToAll ? '正在应用...' : '应用到所有分镜'}
        </Button>
      </div>
    </div>
  );
}

/**
 * 风格预设选择器
 */
function StylePresetSelector({ onApplyPreset }: { onApplyPreset: (name: string) => void }) {
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-600" />
          风格预设模板
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.keys(DIRECTOR_STYLE_PRESETS).map(presetName => (
            <Button
              key={presetName}
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 hover:bg-purple-100 hover:border-purple-400"
              onClick={() => onApplyPreset(presetName)}
            >
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">{presetName}</span>
            </Button>
          ))}
        </div>
        <p className="text-sm text-purple-700 mt-4">
          💡 点击预设模板可快速应用经典电影风格，也可以自定义修改
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * 风格预览组件
 */
function StylePreview({ style }: { style: import('../types').DirectorStyle }) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          当前风格预览
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreviewItem label="艺术风格" value={style.artStyle} color="blue" />
            <PreviewItem label="色调" value={style.colorTone} color="green" />
            <PreviewItem label="光照" value={style.lightingStyle} color="orange" />
            <PreviewItem label="镜头" value={style.cameraStyle} color="purple" />
            <PreviewItem label="情绪" value={style.mood} color="pink" />
            <PreviewItem label="画面比例" value={style.aspectRatio || '16:9'} color="indigo" />
            <PreviewItem label="帧率" value={`${style.videoFrameRate || '24'}fps`} color="cyan" />
            <PreviewItem
              label="运动强度"
              value={MOTION_INTENSITY_LABELS[style.motionIntensity || 'normal'] || '正常'}
              color="amber"
            />
          </div>

          {style.customPrompt && (
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 mb-2">自定义提示词</p>
              <p className="text-sm font-mono bg-gray-50 p-3 rounded border">
                {style.customPrompt}
              </p>
            </div>
          )}
        </div>

        {/* 应用说明 */}
        <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
          <p className="text-sm text-blue-900">
            <Sparkles className="w-4 h-4 inline mr-2" />
            这些风格设定将自动应用到：
          </p>
          <ul className="text-sm text-blue-800 mt-2 ml-6 list-disc space-y-1">
            <li>项目库中的角色AI提示词生成</li>
            <li>项目库中的场景AI提示词生成</li>
            <li>分镜的AI绘画提示词生成</li>
            <li>分镜的AI视频提示词生成</li>
          </ul>
        </div>

        {/* 示例预览 */}
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <p className="text-sm font-medium text-purple-900 mb-3">
            📸 示例分镜提示词预览（基于当前风格）
          </p>
          <div className="bg-white rounded-md p-4 border">
            <p className="text-xs text-gray-500 mb-2">示例场景：森林中奔跑的少年</p>
            <p className="text-sm font-mono text-gray-700 leading-relaxed">
              中景镜头，年轻少年在森林小径上奔跑
              {style.artStyle && `，${style.artStyle}风格`}
              {style.colorTone && `，${style.colorTone}`}
              {style.lightingStyle && `，${style.lightingStyle}照明`}
              {style.cameraStyle && `，${style.cameraStyle}镜头`}
              {style.mood && `，${style.mood}的氛围`}
              ，高质量渲染，分镜级别细节
              {style.customPrompt && `，${style.customPrompt}`}
            </p>
          </div>
          {style.negativePrompt && (
            <div className="mt-3 bg-red-50 rounded-md p-3 border border-red-200">
              <p className="text-xs text-red-600 mb-1">负面提示词：</p>
              <p className="text-xs font-mono text-red-700">{style.negativePrompt}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 预览项组件
 */
function PreviewItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    indigo: 'text-indigo-600',
    cyan: 'text-cyan-600',
    amber: 'text-amber-600',
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-medium ${colorClasses[color] || 'text-gray-600'}`}>
        {value || '未设置'}
      </p>
    </div>
  );
}