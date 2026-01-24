import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect, Suspense, lazy } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as Sentry from '@sentry/react';
import { Layout } from './components/Layout';
import { ProjectLayout } from './components/ProjectLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Skeleton } from './components/ui/skeleton';
import { RouteTransition } from './components/PageTransition'; // 🆕 页面过渡动画
import { initializeDemoData } from './utils/initData';
import { initPerformanceMonitoring } from './utils/performance'; // 🆕 性能监控
import { ThemeProvider } from './utils/theme'; // 🆕 主题提供者
import { queryClient } from '../lib/queryClient'; // 🆕 React Query 客户端
import { initSentry } from '../lib/sentry'; // 🆕 Sentry错误监控
import { setupGlobalErrorHandlers } from './utils/errorHandler'; // 🆕 全局错误处理

// ============ 懒加载页面组件 ============

// 主要页面
const Bookshelf = lazy(() => import('./pages/Bookshelf').then(m => ({ default: m.Bookshelf })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

// 项目相关页面
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })));
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard').then(m => ({ default: m.ProjectDashboard })));
const DirectorStyleEditor = lazy(() => import('./pages/DirectorStyleEditor').then(m => ({ default: m.DirectorStyleEditor })));
const AdvancedTools = lazy(() => import('./pages/AdvancedTools').then(m => ({ default: m.AdvancedTools })));

// 编辑器页面（较大的组件）
const ChapterEditor = lazy(() => import('./pages/ChapterEditor').then(m => ({ default: m.ChapterEditor })));
const ScriptEditor = lazy(() => import('./pages/ScriptEditor').then(m => ({ default: m.ScriptEditor })));
const StoryboardEditor = lazy(() => import('./pages/StoryboardEditor').then(m => ({ default: m.StoryboardEditor })));
const AssetLibrary = lazy(() => import('./pages/AssetLibrary').then(m => ({ default: m.AssetLibrary })));

// ============ 加载状态组件 ============

// 全局错误页面
function GlobalErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">应用程序出错了</h1>
        <p className="text-gray-600 mb-6">很抱歉，应用程序遇到了意外错误。</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          刷新页面
        </button>
      </div>
    </div>
  );
}

// 页面加载骨架屏
function PageSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

// 编辑器加载骨架屏
function EditorSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-xl overflow-hidden bg-white">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 书架加载骨架屏
function BookshelfSkeleton() {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      {/* 标题区域 */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-12 w-32 rounded-lg" />
        </div>
      </div>
      
      {/* 项目卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-xl overflow-hidden bg-white shadow-sm">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ 懒加载包装组件 ============

function LazyPage({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || <PageSkeleton />}>
        <RouteTransition type="fade" duration={200}>
          {children}
        </RouteTransition>
      </Suspense>
    </ErrorBoundary>
  );
}

// ============ 主应用组件 ============

// 使用Sentry包装的HashRouter
const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

export default function App() {
  useEffect(() => {
    // 🆕 初始化Sentry错误监控
    initSentry();
    
    // 🆕 设置全局错误处理
    setupGlobalErrorHandlers();
    
    // 初始化示例数据
    initializeDemoData();
    
    // 🆕 初始化性能监控
    if (process.env.NODE_ENV === 'production') {
      initPerformanceMonitoring();
    }
  }, []);

  return (
    <ErrorBoundary fallback={<GlobalErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <HashRouter>
            <Toaster position="top-center" richColors />
            <SentryRoutes>
          <Route path="/" element={<Layout />}>
            {/* 书架页面 */}
            <Route index element={
              <LazyPage fallback={<BookshelfSkeleton />}>
                <Bookshelf />
              </LazyPage>
            } />
            
            {/* 设置页面 */}
            <Route path="settings" element={
              <LazyPage>
                <Settings />
              </LazyPage>
            } />
            
            {/* 项目相关路由 */}
            <Route path="projects/:projectId" element={<ProjectLayout />}>
              {/* 项目详情 */}
              <Route index element={
                <LazyPage>
                  <ProjectDetail />
                </LazyPage>
              } />
              
              {/* 数据统计 */}
              <Route path="dashboard" element={
                <LazyPage>
                  <ProjectDashboard />
                </LazyPage>
              } />
              
              {/* 导演风格 */}
              <Route path="style" element={
                <LazyPage>
                  <DirectorStyleEditor />
                </LazyPage>
              } />
              
              {/* 章节编辑器 */}
              <Route path="chapter/:chapterId" element={
                <LazyPage fallback={<EditorSkeleton />}>
                  <ChapterEditor />
                </LazyPage>
              } />
              
              {/* 剧本编辑器 */}
              <Route path="script/:chapterId" element={
                <LazyPage fallback={<EditorSkeleton />}>
                  <ScriptEditor />
                </LazyPage>
              } />
              
              {/* 分镜编辑器 */}
              <Route path="storyboard/:chapterId" element={
                <LazyPage fallback={<EditorSkeleton />}>
                  <StoryboardEditor />
                </LazyPage>
              } />
              
              {/* 资源库 */}
              <Route path="assets" element={
                <LazyPage fallback={<EditorSkeleton />}>
                  <AssetLibrary />
                </LazyPage>
              } />
              
              {/* 高级工具 */}
              <Route path="tools" element={
                <LazyPage>
                  <AdvancedTools />
                </LazyPage>
              } />
            </Route>
            
            {/* 兼容旧路由 - 重定向 */}
            <Route path="project/:id" element={<Navigate to="/projects/:id" replace />} />
            <Route path="project/:id/chapter/:chapterId" element={<Navigate to="/projects/:id/chapter/:chapterId" replace />} />
            <Route path="project/:id/script/:chapterId" element={<Navigate to="/projects/:id/script/:chapterId" replace />} />
            <Route path="project/:id/storyboard/:chapterId" element={<Navigate to="/projects/:id/storyboard/:chapterId" replace />} />
            <Route path="project/:id/assets" element={<Navigate to="/projects/:id/assets" replace />} />
            
            {/* 404 重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          </SentryRoutes>
          </HashRouter>
        </ThemeProvider>
        {/* React Query DevTools - 仅在开发环境显示 */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
