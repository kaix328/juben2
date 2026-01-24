import { Link, Outlet, useLocation } from 'react-router-dom';
import { Book, House, ArrowLeft, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { MobileNav, MobileBottomSpacer } from './MobileNav';
import { FloatingAPIStatus } from './APIMonitor';

export function Layout() {
  const location = useLocation();

  // 计算返回目标路径(用于Link组件)
  const getBackPath = (): string => {
    const path = location.pathname;

    // 导演风格页面 -> 项目详情
    if (path.includes('/style')) {
      const projectId = path.split('/')[2];
      return `/projects/${projectId}`;
    }

    // 项目详情页 -> 首页
    if (path.match(/^\/projects\/[^/]+$/)) {
      return '/';
    }

    // 章节/剧本/分镜/资源页面 -> 项目详情
    if (path.includes('/projects/')) {
      const projectId = path.split('/')[2];
      return `/projects/${projectId}`;
    }

    // 设置页面 -> 首页
    if (path.includes('/settings')) {
      return '/';
    }

    // 默认返回首页
    return '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* 渐变光晕 */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-pink-200/20 rounded-full blur-3xl" />
        
        {/* 网格背景 */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/50 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {/* 使用 Link 组件确保 HashRouter 正确处理导航 */}
              <Link
                to={getBackPath()}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="返回"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <Book className="w-8 h-8 text-purple-600" />
                  <Sparkles className="w-4 h-4 text-pink-500 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    AI漫剧制作平台
                  </span>
                  <span className="text-[10px] text-gray-400 -mt-1 tracking-wider">COMIC STUDIO</span>
                </div>
              </Link>
            </div>

            <nav className="flex gap-2">
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  location.pathname === '/' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-200' 
                    : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <House className="w-5 h-5" />
                <span className="font-medium">书架</span>
              </Link>
              <Link
                to="/settings"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  location.pathname === '/settings' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-200' 
                    : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="font-medium">设置</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容区域 - 移除页面切换动画 */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Outlet />
      </main>

      {/* 底部信息 */}
      <footer className="mt-16 py-8 border-t border-gray-100 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI漫剧全流程制作平台</span>
            <span className="text-gray-300">|</span>
            <span className="text-purple-500">让创作更简单</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Powered by AI · Built with ❤️
          </p>
        </div>
      </footer>

      {/* 移动端底部导航 */}
      <MobileNav />
      <MobileBottomSpacer />

      {/* 🆕 全局 API 状态浮动指示器 */}
      <FloatingAPIStatus />
    </div>
  );
}
