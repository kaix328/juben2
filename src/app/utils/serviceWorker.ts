/**
 * Service Worker 注册和管理工具
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * 注册 Service Worker
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
  // 检查浏览器是否支持 Service Worker
  if (!('serviceWorker' in navigator)) {
    console.warn('当前浏览器不支持 Service Worker');
    return null;
  }

  try {
    // 注册 Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker 注册成功:', registration.scope);

    // 检查更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 有新版本可用
            console.log('发现新版本 Service Worker');
            config.onUpdate?.(registration);
          }
        });
      }
    });

    // 成功回调
    if (registration.active) {
      config.onSuccess?.(registration);
    }

    return registration;
  } catch (error) {
    console.error('Service Worker 注册失败:', error);
    config.onError?.(error as Error);
    return null;
  }
}

/**
 * 注销 Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      const success = await registration.unregister();
      console.log('Service Worker 注销成功');
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('Service Worker 注销失败:', error);
    return false;
  }
}

/**
 * 更新 Service Worker
 */
export async function updateServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      await registration.update();
      console.log('Service Worker 更新检查完成');
    }
  } catch (error) {
    console.error('Service Worker 更新失败:', error);
  }
}

/**
 * 跳过等待，立即激活新的 Service Worker
 */
export function skipWaiting(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * 清除所有缓存
 */
export async function clearCache(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
    
    // 同时清除浏览器缓存
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('缓存已清除');
    }
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
}

/**
 * 获取 Service Worker 版本
 */
export async function getServiceWorkerVersion(): Promise<string | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
      };
      
      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
      
      // 超时处理
      setTimeout(() => resolve(null), 1000);
    });
  } catch (error) {
    console.error('获取版本失败:', error);
    return null;
  }
}

/**
 * 检查是否在线
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 监听在线状态变化
 */
export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * 请求后台同步
 */
export async function requestBackgroundSync(tag: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.warn('当前浏览器不支持后台同步');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log('后台同步已注册:', tag);
  } catch (error) {
    console.error('后台同步注册失败:', error);
  }
}

/**
 * 请求推送通知权限
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('当前浏览器不支持通知');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * 显示通知
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('通知权限未授予');
    return;
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  } else {
    new Notification(title, options);
  }
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  updateServiceWorker,
  skipWaiting,
  clearCache,
  getServiceWorkerVersion,
  isOnline,
  onOnlineStatusChange,
  requestBackgroundSync,
  requestNotificationPermission,
  showNotification,
};
