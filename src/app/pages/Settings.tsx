import { useState, useEffect } from 'react';
import { 
  Save, Key, Server, RotateCcw, CheckCircle2, Plus, Trash2, 
  Eye, EyeOff, Shield, BarChart3, Zap, Globe, ChevronDown, ChevronUp,
  AlertCircle, ExternalLink, Palette
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useConfigStore } from '../stores';
import { secureKeyManager, secureConfigManager } from '../utils/secureKeys';
import { apiStats, type AIProvider } from '../services/aiService';
import { APIMonitor } from '../components/APIMonitor'; // 🆕 导入API监控组件
import { ThemeSelector } from '../utils/theme'; // 🆕 导入主题选择器

// ============ 类型定义 ============

interface ProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  icon: string;
  color: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    required: boolean;
    type?: 'text' | 'password';
  }[];
  docUrl?: string;
}

// ============ 提供商配置 ============

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'volcengine',
    name: '火山引擎',
    description: '支持 DeepSeek LLM 和 Doubao-Seedream 文生图',
    icon: '🌋',
    color: 'orange',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Ex: 443ba98a-...', required: true, type: 'password' },
      { key: 'llmEndpointId', label: 'LLM Endpoint ID', placeholder: 'Ex: ep-2025...', required: true },
      { key: 'imageEndpointId', label: 'Image Endpoint ID', placeholder: 'Ex: ep-2025...', required: true },
    ],
    docUrl: 'https://www.volcengine.com/docs/82379',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: '支持 GPT-4o 和 DALL-E 3',
    icon: '🤖',
    color: 'green',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', required: true, type: 'password' },
      { key: 'model', label: '模型 (可选)', placeholder: 'gpt-4o-mini', required: false },
      { key: 'baseUrl', label: 'Base URL (可选)', placeholder: 'https://api.openai.com/v1', required: false },
    ],
    docUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '高性价比的国产大模型',
    icon: '🔮',
    color: 'purple',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', required: true, type: 'password' },
      { key: 'model', label: '模型 (可选)', placeholder: 'deepseek-chat', required: false },
    ],
    docUrl: 'https://platform.deepseek.com/',
  },
  {
    id: 'qianwen',
    name: '通义千问',
    description: '阿里云大模型服务',
    icon: '☁️',
    color: 'blue',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', required: true, type: 'password' },
      { key: 'model', label: '模型 (可选)', placeholder: 'qwen-turbo', required: false },
    ],
    docUrl: 'https://dashscope.console.aliyun.com/',
  },
];

// ============ 组件 ============

interface ProviderCardProps {
  provider: ProviderConfig;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (data: Record<string, string>) => void;
  onDelete: () => void;
  savedData?: Record<string, string>;
  isConfigured: boolean;
}

function ProviderCard({ 
  provider, 
  isExpanded, 
  onToggle, 
  onSave, 
  onDelete,
  savedData,
  isConfigured 
}: ProviderCardProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (savedData) {
      setFormData(savedData);
    }
  }, [savedData]);

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // 验证必填字段
    const missingFields = provider.fields
      .filter(f => f.required && !formData[f.key]?.trim())
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast.error(`请填写必填字段: ${missingFields.join(', ')}`);
      return;
    }

    onSave(formData);
  };

  const colorClasses: Record<string, string> = {
    orange: 'border-orange-200 bg-orange-50/50',
    green: 'border-green-200 bg-green-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
    blue: 'border-blue-200 bg-blue-50/50',
  };

  const badgeClasses: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  return (
    <Card className={`transition-all duration-200 ${isExpanded ? colorClasses[provider.color] : ''}`}>
      <CardHeader 
        className="cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{provider.icon}</span>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {provider.name}
                {isConfigured && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClasses[provider.color]}`}>
                    已配置
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-sm">{provider.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {provider.docUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(provider.docUrl, '_blank');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`${provider.id}-${field.key}`} className="flex items-center gap-1">
                  {field.key === 'apiKey' && <Key className="w-3 h-3" />}
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id={`${provider.id}-${field.key}`}
                    type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="pr-10"
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords[field.key] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              保存配置
            </Button>
            {isConfigured && (
              <Button 
                variant="outline" 
                onClick={onDelete}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                删除配置
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============ API 统计卡片 ============

function APIStatsCard() {
  const [stats, setStats] = useState(apiStats.getStats());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // 定期刷新统计
    const interval = setInterval(() => {
      setStats(apiStats.getStats());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const successRate = stats.totalCalls > 0 
    ? ((stats.successCalls / stats.totalCalls) * 100).toFixed(1) 
    : '0';

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle className="text-lg">API 调用统计</CardTitle>
              <CardDescription>监控 API 使用情况</CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalCalls}</div>
              <div className="text-xs text-gray-500">总调用次数</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successCalls}</div>
              <div className="text-xs text-gray-500">成功次数</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failedCalls}</div>
              <div className="text-xs text-gray-500">失败次数</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
              <div className="text-xs text-gray-500">成功率</div>
            </div>
          </div>

          {Object.keys(stats.byProvider).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">按提供商统计</h4>
              <div className="space-y-2">
                {Object.entries(stats.byProvider).map(([provider, data]) => (
                  <div key={provider} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium">{provider}</span>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>调用: {data.calls}</span>
                      <span>Token: {data.tokens.toLocaleString()}</span>
                      <span className="text-red-500">错误: {data.errors}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-gray-400">
              最后更新: {new Date(stats.lastUpdated).toLocaleString()}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                apiStats.resetStats();
                setStats(apiStats.getStats());
                toast.success('统计数据已重置');
              }}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              重置统计
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============ 主组件 ============

export function Settings() {
  const { apiSettings, setApiSettings } = useConfigStore();
  const [expandedProvider, setExpandedProvider] = useState<string | null>('volcengine');
  const [configuredProviders, setConfiguredProviders] = useState<Set<string>>(new Set());

  // 加载已配置的提供商
  useEffect(() => {
    const configured = new Set<string>();
    
    // 检查火山引擎配置
    if (apiSettings.volcApiKey) {
      configured.add('volcengine');
    }
    
    // 检查其他提供商
    PROVIDERS.forEach(p => {
      if (p.id !== 'volcengine' && secureKeyManager.hasKey(p.id)) {
        configured.add(p.id);
      }
    });

    setConfiguredProviders(configured);
  }, [apiSettings]);

  // 获取已保存的配置数据
  const getSavedData = (providerId: string): Record<string, string> | undefined => {
    if (providerId === 'volcengine') {
      return {
        apiKey: apiSettings.volcApiKey || '',
        llmEndpointId: apiSettings.llmEndpointId || '',
        imageEndpointId: apiSettings.imageEndpointId || '',
      };
    }
    
    const config = secureConfigManager.getConfig(providerId);
    if (config) {
      return {
        apiKey: config.apiKey,
        model: config.model || '',
        baseUrl: config.baseUrl || '',
      };
    }
    
    return undefined;
  };

  // 保存配置
  const handleSaveProvider = (providerId: string, data: Record<string, string>) => {
    if (providerId === 'volcengine') {
      setApiSettings({
        volcApiKey: data.apiKey,
        llmEndpointId: data.llmEndpointId,
        imageEndpointId: data.imageEndpointId,
      });
    } else {
      secureConfigManager.setConfig({
        provider: providerId,
        apiKey: data.apiKey,
        model: data.model,
        baseUrl: data.baseUrl,
      });
    }

    setConfiguredProviders(prev => new Set([...prev, providerId]));
    toast.success(`${PROVIDERS.find(p => p.id === providerId)?.name} 配置已保存`);
  };

  // 删除配置
  const handleDeleteProvider = (providerId: string) => {
    if (!confirm('确定要删除此配置吗？')) return;

    if (providerId === 'volcengine') {
      setApiSettings({
        volcApiKey: '',
        llmEndpointId: '',
        imageEndpointId: '',
      });
    } else {
      secureConfigManager.deleteConfig(providerId);
    }

    setConfiguredProviders(prev => {
      const next = new Set(prev);
      next.delete(providerId);
      return next;
    });
    toast.success('配置已删除');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
        <p className="text-gray-600 mt-1">配置 AI 服务提供商和 API 密钥</p>
      </div>

      {/* 外观主题 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-purple-600" />
            <div>
              <CardTitle className="text-lg">外观主题</CardTitle>
              <CardDescription>选择您喜欢的界面主题风格</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
          <p className="text-sm text-gray-500 mt-4">
            💡 提示：深色主题可以减少眼睛疲劳，适合夜间使用
          </p>
        </CardContent>
      </Card>

      {/* 快速状态 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <Zap className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-2xl font-bold">{configuredProviders.size}</div>
          <div className="text-sm opacity-80">已配置提供商</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <Shield className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-2xl font-bold">{secureKeyManager.getAllKeys().length}</div>
          <div className="text-sm opacity-80">安全存储密钥</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white">
          <Server className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-2xl font-bold">{PROVIDERS.length}</div>
          <div className="text-sm opacity-80">支持的提供商</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
          <Globe className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-2xl font-bold">
            {configuredProviders.has('volcengine') ? '在线' : '离线'}
          </div>
          <div className="text-sm opacity-80">主服务状态</div>
        </div>
      </div>

      {/* API 统计和监控 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle className="text-lg">API 状态监控</CardTitle>
              <CardDescription>实时监控 API 调用状态和统计信息</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <APIMonitor showStats={true} autoRefresh={true} />
        </CardContent>
      </Card>

      {/* 详细统计 */}
      <APIStatsCard />

      {/* 提供商配置 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">AI 服务提供商</h2>
          <span className="text-sm text-gray-500">
            点击展开配置
          </span>
        </div>

        {PROVIDERS.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            isExpanded={expandedProvider === provider.id}
            onToggle={() => setExpandedProvider(
              expandedProvider === provider.id ? null : provider.id
            )}
            onSave={(data) => handleSaveProvider(provider.id, data)}
            onDelete={() => handleDeleteProvider(provider.id)}
            savedData={getSavedData(provider.id)}
            isConfigured={configuredProviders.has(provider.id)}
          />
        ))}
      </div>

      {/* 安全提示 */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-amber-900">安全提示</h4>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>API 密钥使用混淆加密存储在本地浏览器中</li>
                <li>请勿在公共设备上保存 API 密钥</li>
                <li>建议定期更换 API 密钥以确保安全</li>
                <li>生产环境建议使用后端代理转发 API 请求</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置说明 */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">配置说明</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>火山引擎 (推荐)</strong>：主要服务提供商，支持 DeepSeek LLM 和 Doubao-Seedream 文生图。</p>
                <p><strong>OpenAI</strong>：支持 GPT-4o 系列模型和 DALL-E 3 图像生成。</p>
                <p><strong>DeepSeek</strong>：高性价比的国产大模型，适合文本生成任务。</p>
                <p><strong>通义千问</strong>：阿里云大模型服务，支持多种模型选择。</p>
                <p className="pt-2 text-blue-600">
                  💡 系统会优先使用火山引擎，如果调用失败会自动回退到其他已配置的提供商。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
