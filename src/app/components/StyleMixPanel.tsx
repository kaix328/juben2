/**
 * 风格混合面板
 * 可视化风格选择、混合和预览
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  styleMixEngine,
  StylePreset,
  StyleMix,
  StyleMixItem,
  StyleParameters,
  STYLE_CATEGORIES,
  LIGHTING_STYLES,
  RENDERING_STYLES
} from '../utils/styleMixEngine';

interface StyleMixPanelProps {
  onApplyStyle?: (prompt: string, negativePrompt: string, params: StyleParameters) => void;
  className?: string;
}

export const StyleMixPanel: React.FC<StyleMixPanelProps> = ({
  onApplyStyle,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyles, setSelectedStyles] = useState<StyleMixItem[]>([]);
  const [mixedParams, setMixedParams] = useState<StyleParameters | null>(null);
  const [mixedPrompt, setMixedPrompt] = useState<{ positive: string; negative: string } | null>(null);
  const [savedMixes, setSavedMixes] = useState<StyleMix[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [mixName, setMixName] = useState('');
  const [activeTab, setActiveTab] = useState<'presets' | 'mixer' | 'saved'>('presets');

  // 加载保存的混合
  useEffect(() => {
    setSavedMixes(styleMixEngine.getAllMixes());
  }, []);

  // 获取所有风格
  const allStyles = useMemo(() => styleMixEngine.getAllStyles(), []);

  // 过滤风格
  const filteredStyles = useMemo(() => {
    if (selectedCategory === 'all') return allStyles;
    return allStyles.filter(s => s.category === selectedCategory);
  }, [allStyles, selectedCategory]);

  // 计算混合结果
  useEffect(() => {
    if (selectedStyles.length > 0) {
      const params = styleMixEngine.mixStyles(selectedStyles);
      const prompts = styleMixEngine.mixPrompts(selectedStyles, '{场景描述}');
      setMixedParams(params);
      setMixedPrompt(prompts);
    } else {
      setMixedParams(null);
      setMixedPrompt(null);
    }
  }, [selectedStyles]);

  // 添加风格
  const addStyle = useCallback((styleId: string) => {
    if (selectedStyles.find(s => s.styleId === styleId)) return;
    if (selectedStyles.length >= 4) {
      alert('最多只能混合4种风格');
      return;
    }
    setSelectedStyles(prev => [...prev, { styleId, weight: 1 }]);
  }, [selectedStyles]);

  // 移除风格
  const removeStyle = useCallback((styleId: string) => {
    setSelectedStyles(prev => prev.filter(s => s.styleId !== styleId));
  }, []);

  // 更新权重
  const updateWeight = useCallback((styleId: string, weight: number) => {
    setSelectedStyles(prev => prev.map(s =>
      s.styleId === styleId ? { ...s, weight } : s
    ));
  }, []);

  // 保存混合
  const saveMix = useCallback(() => {
    if (!mixName.trim() || selectedStyles.length === 0) return;

    // 使用 saveMix 方法，参数为 (name, description, items)
    styleMixEngine.saveMix(mixName, '', selectedStyles);
    setSavedMixes(styleMixEngine.getAllMixes());
    setShowSaveDialog(false);
    setMixName('');
  }, [mixName, selectedStyles]);

  // 加载混合
  const loadMix = useCallback((mix: StyleMix) => {
    setSelectedStyles(mix.items);
    setActiveTab('mixer');
  }, []);

  // 删除混合
  const deleteMix = useCallback((id: string) => {
    if (confirm('确定要删除这个风格混合吗？')) {
      styleMixEngine.deleteMix(id);
      setSavedMixes(styleMixEngine.getAllMixes());
    }
  }, []);

  // 应用风格
  const handleApply = useCallback(() => {
    if (!mixedParams || !mixedPrompt) return;
    onApplyStyle?.(mixedPrompt.positive, mixedPrompt.negative, mixedParams);
  }, [mixedParams, mixedPrompt, onApplyStyle]);

  // 快速应用单个风格
  const quickApply = useCallback((style: StylePreset) => {
    const params = style.parameters;
    const positive = (style.promptTemplate || style.positivePrompt).replace('{content}', '{场景描述}');
    onApplyStyle?.(positive, style.negativePrompt, params);
  }, [onApplyStyle]);

  // 渲染风格卡片
  const renderStyleCard = (style: StylePreset, isSelected: boolean) => (
    <div
      key={style.id}
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
        ? 'border-blue-500 bg-blue-50 shadow-lg'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
      onClick={() => isSelected ? removeStyle(style.id) : addStyle(style.id)}
    >
      {/* 缩略图/预览 */}
      <div
        className="w-full h-24 rounded-lg mb-3 flex items-center justify-center text-4xl"
        style={{
          background: style.category === 'noir'
            ? 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)'
            : style.category === 'anime'
              ? 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
              : style.category === 'cinematic'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : style.category === 'vintage'
                  ? 'linear-gradient(135deg, #d4a574 0%, #c9a66b 100%)'
                  : style.category === 'fantasy'
                    ? 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        {STYLE_CATEGORIES.find(c => c.id === style.category)?.icon || '🎨'}
      </div>

      {/* 信息 */}
      <h4 className="font-medium text-sm mb-1 truncate">{style.name}</h4>
      <p className="text-xs text-gray-500 line-clamp-2">{style.description}</p>

      {/* 标签 */}
      <div className="mt-2 flex items-center gap-1">
        <span className={`px-2 py-0.5 text-xs rounded-full ${style.isBuiltIn ? 'bg-gray-100 text-gray-600' : 'bg-purple-100 text-purple-600'
          }`}>
          {style.isBuiltIn ? '内置' : '自定义'}
        </span>
      </div>

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
          ✓
        </div>
      )}

      {/* 快速应用按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          quickApply(style);
        }}
        className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 hover:opacity-100 transition-opacity"
      >
        快速应用
      </button>
    </div>
  );

  // 渲染混合器
  const renderMixer = () => (
    <div className="space-y-4">
      {selectedStyles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">🎨</span>
          <p>从预设中选择风格开始混合</p>
          <p className="text-sm mt-1">最多可混合4种风格</p>
        </div>
      ) : (
        <>
          {/* 已选风格 */}
          <div className="space-y-3">
            {selectedStyles.map((item, index) => {
              const style = styleMixEngine.getStyle(item.styleId);
              if (!style) return null;

              return (
                <div
                  key={item.styleId}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">权重:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={item.weight}
                        onChange={(e) => updateWeight(item.styleId, Number(e.target.value))}
                        className="flex-1 h-1"
                      />
                      <span className="text-xs font-medium w-8">{item.weight.toFixed(1)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStyle(item.styleId)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* 混合预览 */}
          {mixedParams && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h4 className="font-medium text-sm mb-3">混合结果预览</h4>

              {/* 参数预览 */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">饱和度</span>
                  <span>{((mixedParams.colorSaturation ?? 1) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">对比度</span>
                  <span>{((mixedParams.contrast ?? 1) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">光影风格</span>
                  <span>{LIGHTING_STYLES.find(l => l.id === mixedParams.lighting?.style)?.name || '默认'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">渲染风格</span>
                  <span>{RENDERING_STYLES.find(r => r.id === mixedParams.rendering?.style)?.name || '默认'}</span>
                </div>
              </div>

              {/* 提示词预览 */}
              {mixedPrompt && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-500 mb-1">生成的提示词:</div>
                  <p className="text-xs bg-white p-2 rounded border max-h-20 overflow-y-auto">
                    {mixedPrompt.positive}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex-1 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
            >
              💾 保存混合
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              ✨ 应用风格
            </button>
          </div>
        </>
      )}
    </div>
  );

  // 渲染保存的混合
  const renderSavedMixes = () => (
    <div className="space-y-3">
      {savedMixes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2 block">📁</span>
          <p>暂无保存的风格混合</p>
          <p className="text-sm mt-1">在混合器中创建并保存</p>
        </div>
      ) : (
        savedMixes.map(mix => (
          <div
            key={mix.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium">{mix.name}</h4>
                <p className="text-xs text-gray-500">
                  {mix.items.length} 种风格混合
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => loadMix(mix)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                >
                  加载
                </button>
                <button
                  onClick={() => deleteMix(mix.id)}
                  className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  删除
                </button>
              </div>
            </div>

            {/* 包含的风格 */}
            <div className="flex flex-wrap gap-1">
              {mix.items.map((item: StyleMixItem) => {
                const style = styleMixEngine.getStyle(item.styleId);
                return style ? (
                  <span
                    key={item.styleId}
                    className="px-2 py-0.5 bg-gray-100 text-xs rounded"
                  >
                    {style.name} ({(item.weight * 100).toFixed(0)}%)
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b bg-gradient-to-r from-pink-500 to-purple-500">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🎨</span>
          风格混合引擎
        </h3>
        <p className="text-sm text-white/80 mt-1">
          选择并混合多种视觉风格
        </p>
      </div>

      {/* 标签页 */}
      <div className="flex border-b">
        {[
          { id: 'presets', label: '风格预设', icon: '🎬' },
          { id: 'mixer', label: '混合器', icon: '🔀', badge: selectedStyles.length },
          { id: 'saved', label: '已保存', icon: '💾', badge: savedMixes.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
            {tab.badge ? (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'presets' && (
          <>
            {/* 分类筛选 */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${selectedCategory === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                全部
              </button>
              {STYLE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${selectedCategory === cat.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* 风格网格 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredStyles.map(style =>
                renderStyleCard(
                  style,
                  selectedStyles.some(s => s.styleId === style.id)
                )
              )}
            </div>
          </>
        )}

        {activeTab === 'mixer' && renderMixer()}
        {activeTab === 'saved' && renderSavedMixes()}
      </div>

      {/* 保存对话框 */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">保存风格混合</h3>
            <input
              type="text"
              value={mixName}
              onChange={(e) => setMixName(e.target.value)}
              placeholder="输入名称..."
              className="w-full px-3 py-2 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={saveMix}
                disabled={!mixName.trim()}
                className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleMixPanel;
