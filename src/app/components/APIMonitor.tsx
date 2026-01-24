/**
 * API 状态监控组件
 * 显示 API 调用状态、统计信息和健康检查
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Wifi, WifiOff, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Clock, Zap, TrendingUp
} from 'lucide-react';
import { apiStats, textService, type APIResponse } from '../services/aiService';
import { useConfigStore } from '../stores';

// ============ 类型定义 ============

interface ProviderStatus {
  name: string;
  status: 'online' | 'offline' | 'checking' | 'error';
  latency?: number;
  lastCheck?: string;
  error?: string;
}

interface APIMonitorProps {
  compact?: boolean;
  showStats?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ============ 状态指示器 ============

function StatusIndicator({ status }: { status: ProviderStatus['status'] }) {
  const config = {
    online: { color: 'bg-green-500', pulse: true, icon: CheckCircle },
    offline: { color: 'bg-gray-400', pulse: false, icon: WifiOff },
    checking: { color: 'bg-yellow-500', pulse: true, icon: RefreshCw },
    error: { color: 'bg-red-500', pulse: false, icon: XCircle },
  };

  const { color, pulse, icon: Icon } = config[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`relative flex h-2.5 w-2.5`}>
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
      </span>
      <Icon className={`w-3.5 h-3.5 ${status === 'online' ? 'text-green-600' :
        status === 'error' ? 'text-red-600' :
          status === 'checking' ? 'text-yellow-600 animate-spin' :
            'text-gray-400'
        }`} />
    </div>
  );
}

// ============ 紧凑模式组件 ============

function CompactMonitor({ providers }: { providers: ProviderStatus[] }) {
  const onlineCount = providers.filter(p => p.status === 'online').length;
  const hasError = providers.some(p => p.status === 'error');

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${hasError ? 'bg-red-100 text-red-700' :
      onlineCount > 0 ? 'bg-green-100 text-green-700' :
        'bg-gray-100 text-gray-600'
      }`}>
      {hasError ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : onlineCount > 0 ? (
        <Wifi className="w-3.5 h-3.5" />
      ) : (
        <WifiOff className="w-3.5 h-3.5" />
      )}
      <span>
        {hasError ? 'API 异常' : onlineCount > 0 ? `${onlineCount} 服务在线` : '离线'}
      </span>
    </div>
  );
}

// ============ 详细统计组件 ============

function StatsPanel() {
  const [stats, setStats] = useState(apiStats.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(apiStats.getStats());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const successRate = stats.totalCalls > 0
    ? ((stats.successCalls / stats.totalCalls) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">{stats.totalCalls}</div>
        <div className="text-xs text-gray-500">总调用</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-green-600">{stats.successCalls}</div>
        <div className="text-xs text-gray-500">成功</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-red-600">{stats.failedCalls}</div>
        <div className="text-xs text-gray-500">失败</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-blue-600">{successRate}%</div>
        <div className="text-xs text-gray-500">成功率</div>
      </div>
    </div>
  );
}

// ============ 主组件 ============

export function APIMonitor({
  compact = false,
  showStats = true,
  autoRefresh = true,
  refreshInterval = 60000
}: APIMonitorProps) {
  const { apiSettings } = useConfigStore();
  const [providers, setProviders] = useState<ProviderStatus[]>([
    { name: '火山引擎', status: 'offline' },
  ]);
  const [isChecking, setIsChecking] = useState(false);

  // 健康检查
  const checkHealth = useCallback(async () => {
    setIsChecking(true);

    const newProviders: ProviderStatus[] = [];

    // 检查火山引擎
    if (apiSettings.volcApiKey) {
      setProviders(prev => prev.map(p =>
        p.name === '火山引擎' ? { ...p, status: 'checking' } : p
      ));

      const startTime = Date.now();
      try {
        // 发送一个简单的测试请求
        const result = await textService.callVolcEngine({
          prompt: '你好',
          maxTokens: 5,
        });

        const latency = Date.now() - startTime;
        newProviders.push({
          name: '火山引擎',
          status: result.success ? 'online' : 'error',
          latency,
          lastCheck: new Date().toISOString(),
          error: result.error,
        });
      } catch (error) {
        // 静默处理健康检查错误，不触发全局 Toast
        console.warn('[APIMonitor] 健康检查失败:', error);
        newProviders.push({
          name: '火山引擎',
          status: 'error',
          lastCheck: new Date().toISOString(),
          error: (error as Error).message,
        });
      }
    } else {
      newProviders.push({
        name: '火山引擎',
        status: 'offline',
        lastCheck: new Date().toISOString(),
      });
    }

    setProviders(newProviders);
    setIsChecking(false);
  }, [apiSettings]);

  // 初始检查和自动刷新
  useEffect(() => {
    // 初始状态设置（不发送实际请求）
    setProviders([{
      name: '火山引擎',
      status: apiSettings.volcApiKey ? 'online' : 'offline',
    }]);

    if (autoRefresh) {
      const interval = setInterval(checkHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [apiSettings.volcApiKey, autoRefresh, refreshInterval]);

  // 紧凑模式
  if (compact) {
    return <CompactMonitor providers={providers} />;
  }

  // 完整模式
  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">API 状态监控</h3>
        </div>
        <button
          onClick={checkHealth}
          disabled={isChecking}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? '检查中...' : '刷新'}
        </button>
      </div>

      {/* 提供商列表 */}
      <div className="space-y-2">
        {providers.map((provider) => (
          <div
            key={provider.name}
            className="flex items-center justify-between p-3 bg-white border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <StatusIndicator status={provider.status} />
              <div>
                <div className="font-medium text-gray-900">{provider.name}</div>
                {provider.error && (
                  <div className="text-xs text-red-500 mt-0.5">{provider.error}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {provider.latency !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{provider.latency}ms</span>
                </div>
              )}
              {provider.status === 'online' && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  在线
                </span>
              )}
              {provider.status === 'offline' && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  未配置
                </span>
              )}
              {provider.status === 'error' && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                  异常
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 统计面板 */}
      {showStats && <StatsPanel />}
    </div>
  );
}

// ============ 浮动状态指示器 ============

export function FloatingAPIStatus() {
  const { apiSettings } = useConfigStore();
  const [stats, setStats] = useState(apiStats.getStats());
  const [isExpanded, setIsExpanded] = useState(false);
  const isConfigured = !!apiSettings.volcApiKey;

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(apiStats.getStats());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const successRate = stats.totalCalls > 0
    ? Math.round((stats.successCalls / stats.totalCalls) * 100)
    : 100;

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${!isConfigured ? 'bg-gray-800/90 text-gray-300 hover:bg-gray-800' :
          successRate >= 90 ? 'bg-green-800/90 text-green-100 hover:bg-green-800' :
            successRate >= 70 ? 'bg-yellow-800/90 text-yellow-100 hover:bg-yellow-800' :
              'bg-red-800/90 text-red-100 hover:bg-red-800'
          }`}
        onClick={() => setIsExpanded(!isExpanded)}
        title={isConfigured ? "点击查看详情" : "点击前往配置"}
      >
        <div className="relative">
          <Zap className="w-4 h-4" />
          {isConfigured && (
            <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${successRate >= 90 ? 'bg-green-400' :
              successRate >= 70 ? 'bg-yellow-400' :
                'bg-red-400'
              } animate-pulse`} />
          )}
        </div>
        <span className="text-xs font-medium whitespace-nowrap">
          {!isConfigured ? 'API 未配置' : `${stats.totalCalls} 调用 · ${successRate}%`}
        </span>
      </div>

      {/* 展开的详细信息 */}
      {isExpanded && isConfigured && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px] animate-slide-up">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">总调用</span>
              <span className="font-semibold text-gray-900">{stats.totalCalls}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">成功</span>
              <span className="font-semibold text-green-600">{stats.successCalls}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">失败</span>
              <span className="font-semibold text-red-600">{stats.failedCalls}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t">
              <span className="text-gray-600">成功率</span>
              <span className={`font-bold ${successRate >= 90 ? 'text-green-600' :
                successRate >= 70 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>{successRate}%</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.hash = '#/settings';
              setIsExpanded(false);
            }}
            className="w-full mt-3 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            前往设置
          </button>
        </div>
      )}

      {/* 未配置时的提示 */}
      {isExpanded && !isConfigured && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px] animate-slide-up">
          <p className="text-xs text-gray-600 mb-3">
            请先配置 API 密钥以使用 AI 功能
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.hash = '#/settings';
              setIsExpanded(false);
            }}
            className="w-full px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            立即配置
          </button>
        </div>
      )}
    </div>
  );
}

// ============ Hook: 使用 API 状态 ============

export function useAPIStatus() {
  const { apiSettings } = useConfigStore();
  const [stats, setStats] = useState(apiStats.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(apiStats.getStats());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return {
    isConfigured: !!apiSettings.volcApiKey,
    stats,
    successRate: stats.totalCalls > 0
      ? (stats.successCalls / stats.totalCalls) * 100
      : 100,
    resetStats: () => {
      apiStats.resetStats();
      setStats(apiStats.getStats());
    },
  };
}

export default APIMonitor;
