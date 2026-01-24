/**
 * Service Worker Hook
 */
import { useState, useEffect } from 'react';
import {
  registerServiceWorker,
  updateServiceWorker,
  skipWaiting,
  clearCache,
  getServiceWorkerVersion,
  isOnline,
  onOnlineStatusChange,
} from '../utils/serviceWorker';

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  version: string | null;
}

/**
 * 使用 Service Worker Hook
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: isOnline(),
    hasUpdate: false,
    version: null,
  });

  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    // 注册 Service Worker
    registerServiceWorker({
      onSuccess: async (registration) => {
        setState(prev => ({ ...prev, isRegistered: true }));
        
        // 获取版本
        const version = await getServiceWorkerVersion();
        setState(prev => ({ ...prev, version }));
      },
      onUpdate: () => {
        setState(prev => ({ ...prev, hasUpdate: true }));
      },
      onError: (error) => {
        console.error('Service Worker 错误:', error);
      },
    });

    // 监听在线状态
    const cleanup = onOnlineStatusChange((online) => {
      setState(prev => ({ ...prev, isOnline: online }));
    });

    return cleanup;
  }, [state.isSupported]);

  const handleUpdate = () => {
    skipWaiting();
    window.location.reload();
  };

  const handleClearCache = async () => {
    await clearCache();
    window.location.reload();
  };

  const handleCheckUpdate = async () => {
    await updateServiceWorker();
  };

  return {
    ...state,
    update: handleUpdate,
    clearCache: handleClearCache,
    checkUpdate: handleCheckUpdate,
  };
}

/**
 * 在线状态 Hook
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    return onOnlineStatusChange(setOnline);
  }, []);

  return online;
}

export default useServiceWorker;
