/**
 * AI分镜建议面板
 * 根据场景内容智能推荐分镜方案
 */

import React, { useState, useCallback } from 'react';
import {
  generateStoryboardSuggestion,
  StoryboardSuggestion,
  ShotSuggestion,
  SceneAnalysis,
  AlternativeApproach
} from '../utils/storyboardSuggester';

interface SuggestionPanelProps {
  onApplySuggestion?: (suggestion: ShotSuggestion) => void;
  onApplyAll?: (suggestions: ShotSuggestion[]) => void;
  className?: string;
}

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  onApplySuggestion,
  onApplyAll,
  className = ''
}) => {
  const [description, setDescription] = useState('');
  const [dialogue, setDialogue] = useState('');
  const [characters, setCharacters] = useState('');
  const [panelCount, setPanelCount] = useState(4);
  const [result, setResult] = useState<StoryboardSuggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'alternatives' | 'tips'>('main');
  const [selectedApproach, setSelectedApproach] = useState<number>(0);

  // 生成建议
  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;
    
    setIsGenerating(true);
    
    // 模拟异步处理
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const characterList = characters
      .split(/[,，、\s]+/)
      .map(c => c.trim())
      .filter(Boolean);
    
    const suggestion = generateStoryboardSuggestion(
      description,
      dialogue || undefined,
      characterList.length > 0 ? characterList : undefined,
      panelCount
    );
    
    setResult(suggestion);
    setIsGenerating(false);
  }, [description, dialogue, characters, panelCount]);

  // 获取场景类型标签
  const getSceneTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dialogue: '对话场景',
      action: '动作场景',
      establishing: '建立场景',
      transition: '过渡场景',
      emotional: '情感场景',
      montage: '蒙太奇',
      chase: '追逐场景',
      revelation: '揭示场景',
      climax: '高潮场景'
    };
    return labels[type] || type;
  };

  // 获取情感标签
  const getEmotionLabel = (emotion: string) => {
    const labels: Record<string, string> = {
      neutral: '中性',
      happy: '快乐',
      sad: '悲伤',
      angry: '愤怒',
      fear: '恐惧',
      surprise: '惊讶',
      tension: '紧张',
      romantic: '浪漫',
      mysterious: '神秘'
    };
    return labels[emotion] || emotion;
  };

  // 获取情感颜色
  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      neutral: 'bg-gray-100 text-gray-700',
      happy: 'bg-yellow-100 text-yellow-700',
      sad: 'bg-blue-100 text-blue-700',
      angry: 'bg-red-100 text-red-700',
      fear: 'bg-purple-100 text-purple-700',
      surprise: 'bg-pink-100 text-pink-700',
      tension: 'bg-orange-100 text-orange-700',
      romantic: 'bg-rose-100 text-rose-700',
      mysterious: 'bg-indigo-100 text-indigo-700'
    };
    return colors[emotion] || 'bg-gray-100 text-gray-700';
  };

  // 渲染场景分析
  const renderAnalysis = (analysis: SceneAnalysis) => (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg mb-4">
      <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
        <span>🔍</span> 场景分析
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">类型:</span>
          <span className="px-2 py-1 bg-white rounded text-sm font-medium">
            {getSceneTypeLabel(analysis.sceneType)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">情感:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${getEmotionColor(analysis.emotion)}`}>
            {getEmotionLabel(analysis.emotion)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">节奏:</span>
          <span className="px-2 py-1 bg-white rounded text-sm">
            {analysis.pacing === 'fast' ? '快节奏 ⚡' : 
             analysis.pacing === 'slow' ? '慢节奏 🌊' : '中等节奏 ⏱️'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">强度:</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all"
              style={{ width: `${analysis.intensity * 100}%` }}
            />
          </div>
        </div>
      </div>
      {analysis.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {analysis.keywords.map((keyword, idx) => (
            <span 
              key={idx}
              className="px-2 py-0.5 bg-white/70 text-xs text-gray-600 rounded"
            >
              #{keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染单个建议
  const renderSuggestion = (suggestion: ShotSuggestion, index: number) => (
    <div 
      key={suggestion.id}
      className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
            {index + 1}
          </span>
          <div>
            <div className="font-medium">{suggestion.shotSize}</div>
            <div className="text-xs text-gray-500">{suggestion.cameraAngle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{suggestion.duration}s</span>
          <div 
            className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden"
            title={`置信度: ${Math.round(suggestion.confidence * 100)}%`}
          >
            <div 
              className="h-full bg-green-500"
              style={{ width: `${suggestion.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-2">{suggestion.description}</p>
      
      <div className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <span>💡</span>
        <span>{suggestion.reason}</span>
      </div>
      
      {suggestion.movement && (
        <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
          <span>🎥</span>
          <span>运镜: {suggestion.movement}</span>
        </div>
      )}
      
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {suggestion.tags.map((tag, idx) => (
            <span 
              key={idx}
              className="px-1.5 py-0.5 bg-gray-100 text-xs text-gray-500 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={() => onApplySuggestion?.(suggestion)}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          应用
        </button>
      </div>
    </div>
  );

  // 渲染替代方案
  const renderAlternatives = (approaches: AlternativeApproach[]) => (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {approaches.map((approach, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedApproach(idx)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedApproach === idx
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {approach.name}
          </button>
        ))}
      </div>
      
      {approaches[selectedApproach] && (
        <div className="space-y-3">
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700">
              {approaches[selectedApproach].description}
            </p>
          </div>
          
          <div className="grid gap-3">
            {approaches[selectedApproach].shots.map((shot, idx) => 
              renderSuggestion(shot, idx)
            )}
          </div>
          
          <button
            onClick={() => onApplyAll?.(approaches[selectedApproach].shots)}
            className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            应用此方案 ({approaches[selectedApproach].shots.length} 个分镜)
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-500">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🤖</span>
          AI 分镜建议
        </h3>
        <p className="text-sm text-white/80 mt-1">
          输入场景描述，AI 将智能推荐分镜方案
        </p>
      </div>

      {/* 输入区域 */}
      <div className="p-4 space-y-4 border-b">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            场景描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述场景内容，如：夜晚的咖啡馆，小明独自坐在角落，看着窗外的雨..."
            className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            对话内容 <span className="text-gray-400">(可选)</span>
          </label>
          <textarea
            value={dialogue}
            onChange={(e) => setDialogue(e.target.value)}
            placeholder="角色对话，如：小明：我等了你很久..."
            className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              角色 <span className="text-gray-400">(逗号分隔)</span>
            </label>
            <input
              type="text"
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              placeholder="小明, 小红"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              建议数量
            </label>
            <select
              value={panelCount}
              onChange={(e) => setPanelCount(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[2, 3, 4, 5, 6, 8].map(n => (
                <option key={n} value={n}>{n} 个分镜</option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            isGenerating || !description.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚙️</span>
              AI 分析中...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>✨</span>
              生成分镜建议
            </span>
          )}
        </button>
      </div>

      {/* 结果区域 */}
      {result && (
        <div className="p-4">
          {/* 场景分析 */}
          {renderAnalysis(result.sceneAnalysis)}
          
          {/* 标签页 */}
          <div className="flex border-b mb-4">
            {[
              { id: 'main', label: '推荐方案', icon: '🎬' },
              { id: 'alternatives', label: '替代风格', icon: '🎨' },
              { id: 'tips', label: '拍摄提示', icon: '💡' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* 主要建议 */}
          {activeTab === 'main' && (
            <div className="space-y-3">
              {result.suggestions.map((suggestion, idx) => 
                renderSuggestion(suggestion, idx)
              )}
              
              {result.suggestions.length > 0 && (
                <button
                  onClick={() => onApplyAll?.(result.suggestions)}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  应用全部建议 ({result.suggestions.length} 个分镜)
                </button>
              )}
            </div>
          )}
          
          {/* 替代方案 */}
          {activeTab === 'alternatives' && (
            renderAlternatives(result.alternativeApproaches)
          )}
          
          {/* 拍摄提示 */}
          {activeTab === 'tips' && (
            <div className="space-y-3">
              {result.tips.map((tip, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg"
                >
                  <span className="text-yellow-500 text-lg">💡</span>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!result && !isGenerating && (
        <div className="p-8 text-center text-gray-500">
          <span className="text-4xl mb-3 block">🎬</span>
          <p className="mb-2">输入场景描述开始</p>
          <p className="text-sm">AI 将分析场景并推荐专业分镜方案</p>
        </div>
      )}
    </div>
  );
};

export default SuggestionPanel;
