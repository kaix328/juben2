/**
 * 多模型管理面板
 * 配置和管理多个AI模型
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  multiModelManager,
  AIModelConfig,
  AIModelCapability,
  ModelSelectionStrategy,
  PROVIDER_INFO,
  CAPABILITY_INFO
} from '../utils/multiModelManager';

interface ModelManagerPanelProps {
  onModelSelect?: (modelId: string) => void;
  className?: string;
}

export const ModelManagerPanel: React.FC<ModelManagerPanelProps> = ({
  onModelSelect,
  className = ''
}) => {
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [editingApiKey, setEditingApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [activeTab, setActiveTab] = useState<'models' | 'strategy' | 'stats'>('models');
  const [strategy, setStrategy] = useState<ModelSelectionStrategy>({ type: 'priority' });
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [isHealthChecking, setIsHealthChecking] = useState(false);

  // 加载模型
  useEffect(() => {
    setModels(multiModelManager.getAllModels());
  }, []);

  // 刷新模型列表
  const refreshModels = useCallback(() => {
    setModels(multiModelManager.getAllModels());
  }, []);

  // 切换模型启用状态
  const toggleModel = useCallback((id: string) => {
    const model = multiModelManager.getModel(id);
    if (model) {
      multiModelManager.enableModel(id, !model.enabled);
      refreshModels();
    }
  }, [refreshModels]);

  // 保存API Key
  const saveApiKey = useCallback((id: string) => {
    if (apiKeyInput.trim()) {
      multiModelManager.setApiKey(id, apiKeyInput.trim());
      refreshModels();
    }
    setEditingApiKey(null);
    setApiKeyInput('');
  }, [apiKeyInput, refreshModels]);

  // 更新优先级
  const updatePriority = useCallback((id: string, priority: number) => {
    multiModelManager.updateModel(id, { priority });
    refreshModels();
  }, [refreshModels]);

  // 健康检查
  const runHealthCheck = useCallback(async () => {
    setIsHealthChecking(true);
    await multiModelManager.healthCheckAll();
    refreshModels();
    setIsHealthChecking(false);
  }, [refreshModels]);

  // 更新策略
  const updateStrategy = useCallback((type: ModelSelectionStrategy['type']) => {
    const newStrategy = { type };
    setStrategy(newStrategy);
    multiModelManager.setStrategy(newStrategy);
  }, []);

  // 过滤模型
  const filteredModels = filterProvider === 'all' 
    ? models 
    : models.filter(m => m.provider === filterProvider);

  // 获取使用统计
  const stats = multiModelManager.getAllStats();
  const totalRequests = stats.reduce((sum, s) => sum + s.totalRequests, 0);
  const totalTokens = stats.reduce((sum, s) => sum + s.totalTokens, 0);
  const totalCost = stats.reduce((sum, s) => sum + s.totalCost, 0);

  // 渲染模型卡片
  const renderModelCard = (model: AIModelConfig) => {
    const providerInfo = PROVIDER_INFO[model.provider];
    const isEditing = editingApiKey === model.id;

    return (
      <div
        key={model.id}
        className={`p-4 rounded-xl border-2 transition-all ${
          model.enabled
            ? 'border-green-300 bg-green-50'
            : 'border-gray-200 bg-white'
        } ${selectedModel === model.id ? 'ring-2 ring-blue-500' : ''}`}
      >
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${providerInfo.color}-500 flex items-center justify-center text-white text-xl`}>
              {providerInfo.icon}
            </div>
            <div>
              <h4 className="font-medium">{model.name}</h4>
              <p className="text-xs text-gray-500">{providerInfo.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 健康状态 */}
            <span className={`w-2 h-2 rounded-full ${
              model.isHealthy ? 'bg-green-500' : 'bg-red-500'
            }`} title={model.isHealthy ? '健康' : '离线'} />
            {/* 启用开关 */}
            <button
              onClick={() => toggleModel(model.id)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                model.enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                model.enabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* 能力标签 */}
        <div className="flex flex-wrap gap-1 mb-3">
          {model.capabilities.map(cap => (
            <span
              key={cap}
              className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full"
              title={CAPABILITY_INFO[cap].name}
            >
              {CAPABILITY_INFO[cap].icon} {CAPABILITY_INFO[cap].name}
            </span>
          ))}
        </div>

        {/* 参数信息 */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-gray-500">上下文</span>
            <span>{model.maxTokens ? `${(model.maxTokens / 1000).toFixed(0)}K` : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">成本/1K</span>
            <span>${model.costPer1kTokens?.toFixed(3) || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">使用次数</span>
            <span>{model.usageCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">错误次数</span>
            <span className={model.errorCount > 0 ? 'text-red-500' : ''}>{model.errorCount}</span>
          </div>
        </div>

        {/* 优先级 */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">优先级</span>
            <span className="font-medium">{model.priority}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={model.priority}
            onChange={(e) => updatePriority(model.id, Number(e.target.value))}
            className="w-full h-1"
          />
        </div>

        {/* API Key */}
        <div className="pt-3 border-t">
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="输入 API Key..."
                className="flex-1 px-2 py-1 text-sm border rounded"
                autoFocus
              />
              <button
                onClick={() => saveApiKey(model.id)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditingApiKey(null);
                  setApiKeyInput('');
                }}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {model.apiKey ? '✓ API Key 已配置' : '⚠️ 未配置 API Key'}
              </span>
              <button
                onClick={() => {
                  setEditingApiKey(model.id);
                  setApiKeyInput(model.apiKey || '');
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                {model.apiKey ? '修改' : '配置'}
              </button>
            </div>
          )}
        </div>

        {/* 选择按钮 */}
        {model.enabled && (
          <button
            onClick={() => {
              setSelectedModel(model.id);
              onModelSelect?.(model.id);
            }}
            className={`w-full mt-3 py-2 text-sm rounded-lg transition-colors ${
              selectedModel === model.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {selectedModel === model.id ? '✓ 已选择' : '选择此模型'}
          </button>
        )}
      </div>
    );
  };

  // 渲染策略设置
  const renderStrategyTab = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-800">模型选择策略</h4>
      <p className="text-sm text-gray-500">
        当有多个模型可用时，系统将根据以下策略自动选择最合适的模型
      </p>

      <div className="space-y-3">
        {[
          { type: 'priority', name: '优先级优先', desc: '选择优先级最高的模型', icon: '⭐' },
          { type: 'round_robin', name: '轮询', desc: '依次使用每个模型，均衡负载', icon: '🔄' },
          { type: 'least_used', name: '最少使用', desc: '选择使用次数最少的模型', icon: '📊' },
          { type: 'cost_optimized', name: '成本优化', desc: '选择成本最低的模型', icon: '💰' }
        ].map(s => (
          <label
            key={s.type}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              strategy.type === s.type
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="strategy"
              checked={strategy.type === s.type}
              onChange={() => updateStrategy(s.type as any)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{s.icon}</span>
                <span className="font-medium">{s.name}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* 降级设置 */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h5 className="font-medium text-yellow-800 mb-2">⚠️ 自动降级</h5>
        <p className="text-sm text-yellow-700">
          当首选模型不可用时，系统将自动切换到下一个可用模型，确保服务不中断。
        </p>
      </div>
    </div>
  );

  // 渲染统计
  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* 总览 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600">{totalRequests}</div>
          <div className="text-sm text-blue-500">总请求数</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600">
            {(totalTokens / 1000).toFixed(1)}K
          </div>
          <div className="text-sm text-green-500">总Token数</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-orange-600">
            ${totalCost.toFixed(2)}
          </div>
          <div className="text-sm text-orange-500">预估成本</div>
        </div>
      </div>

      {/* 模型使用分布 */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">模型使用分布</h4>
        {stats.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">暂无使用数据</p>
        ) : (
          <div className="space-y-2">
            {stats
              .sort((a, b) => b.totalRequests - a.totalRequests)
              .map(stat => {
                const model = multiModelManager.getModel(stat.modelId);
                const percentage = totalRequests > 0 ? (stat.totalRequests / totalRequests) * 100 : 0;
                return (
                  <div key={stat.modelId} className="flex items-center gap-3">
                    <div className="w-24 text-sm truncate">{model?.name || stat.modelId}</div>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-sm text-right">{stat.totalRequests} 次</div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 模型健康状态 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-800">模型健康状态</h4>
          <button
            onClick={runHealthCheck}
            disabled={isHealthChecking}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isHealthChecking ? '检查中...' : '🔄 检查全部'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {models.filter(m => m.enabled).map(model => (
            <div
              key={model.id}
              className={`p-3 rounded-lg border ${
                model.isHealthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{model.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  model.isHealthy ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                }`}>
                  {model.isHealthy ? '正常' : '离线'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                上次使用: {model.lastUsed ? new Date(model.lastUsed).toLocaleString() : '从未使用'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b bg-gradient-to-r from-cyan-500 to-blue-500">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🤖</span>
          多模型管理
        </h3>
        <p className="text-sm text-white/80 mt-1">
          配置和管理多个AI模型，支持自动切换和负载均衡
        </p>
      </div>

      {/* 标签页 */}
      <div className="flex border-b">
        {[
          { id: 'models', label: '模型列表', icon: '📋' },
          { id: 'strategy', label: '选择策略', icon: '⚙️' },
          { id: 'stats', label: '使用统计', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
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

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'models' && (
          <>
            {/* 筛选器 */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterProvider('all')}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                  filterProvider === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {Object.entries(PROVIDER_INFO).map(([id, info]) => (
                <button
                  key={id}
                  onClick={() => setFilterProvider(id)}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                    filterProvider === id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {info.icon} {info.name}
                </button>
              ))}
            </div>

            {/* 模型网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
              {filteredModels.map(model => renderModelCard(model))}
            </div>
          </>
        )}

        {activeTab === 'strategy' && renderStrategyTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </div>
    </div>
  );
};

export default ModelManagerPanel;
