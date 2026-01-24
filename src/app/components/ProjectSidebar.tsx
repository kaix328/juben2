import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Users, Palette, ChevronLeft, ChevronRight, LayoutDashboard, Layers, ChevronDown, Wand2, BarChart3 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { chapterStorage } from '../utils/storage';
import { useRoutePrefetch } from '../hooks/useRoutePrefetch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from './ui/dropdown-menu';

interface ProjectSidebarProps {
    projectId: string;
    chapterId?: string;
    collapsed: boolean;
    onToggle: () => void;
}

// 完全禁用动画的样式
const noAnimationStyle: React.CSSProperties = {
    transform: 'none',
    transition: 'none',
    animation: 'none',
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    outline: 'none',
    boxShadow: 'none',
};

export function ProjectSidebar({ projectId, chapterId, collapsed, onToggle }: ProjectSidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { prefetchChapterEditor, prefetchAssets, prefetchByRoute } = useRoutePrefetch();

    // 获取项目的所有章节
    const chapters = useLiveQuery(
        () => chapterStorage.getByProjectId(projectId),
        [projectId]
    );

    // 判断当前是否在某个功能模块中
    const isInModule = (module: string): boolean => {
        const pathParts = location.pathname.split('/');
        return pathParts.includes(module);
    };

    // 处理需要章节的导航项点击
    const handleChapterRequiredClick = (module: 'script' | 'storyboard', targetChapterId?: string) => {
        const chapId = targetChapterId || chapterId;
        if (chapId) {
            navigate(`/projects/${projectId}/${module}/${chapId}`);
        }
    };

    // 基础导航项（不需要章节）
    const basicNavItems = [
        {
            label: '项目概览',
            path: `/projects/${projectId}`,
            icon: LayoutDashboard,
            isActive: () => location.pathname === `/projects/${projectId}` || location.pathname === `/projects/${projectId}/`
        },
    ];

    // 需要章节的导航项
    const chapterNavItems = [
        {
            label: '剧本编辑',
            module: 'script' as const,
            icon: FileText,
            isActive: () => isInModule('script')
        },
        {
            label: '分镜制作',
            module: 'storyboard' as const,
            icon: Layers,
            isActive: () => isInModule('storyboard')
        },
    ];

    // 其他导航项
    const otherNavItems = [
        {
            label: '项目资源',
            path: `/projects/${projectId}/assets`,
            icon: Users,
            isActive: () => isInModule('assets')
        },
        {
            label: '导演风格',
            path: `/projects/${projectId}/style`,
            icon: Palette,
            isActive: () => isInModule('style')
        },
        {
            label: '高级工具',
            path: `/projects/${projectId}/tools`,
            icon: Wand2,
            isActive: () => isInModule('tools')
        },
        {
            label: '数据统计',
            path: `/projects/${projectId}/dashboard`,
            icon: BarChart3,
            isActive: () => isInModule('dashboard')
        }
    ];

    // 获取链接样式
    const getLinkStyle = (active: boolean): React.CSSProperties => ({
        ...noAnimationStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: collapsed ? '10px 8px' : '10px 12px',
        margin: collapsed ? '2px 4px' : '2px 8px',
        borderRadius: '8px',
        minHeight: '42px',
        textDecoration: 'none',
        cursor: 'pointer',
        userSelect: 'none',
        justifyContent: collapsed ? 'center' : 'flex-start',
        backgroundColor: active ? 'rgba(71, 85, 105, 0.6)' : 'transparent',
        color: active ? '#ffffff' : '#cbd5e1',
        border: 'none',
    });

    // 获取按钮样式
    const getButtonStyle = (active: boolean, enabled: boolean): React.CSSProperties => ({
        ...noAnimationStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: collapsed ? '10px 8px' : '10px 12px',
        margin: collapsed ? '2px 4px' : '2px 8px',
        borderRadius: '8px',
        minHeight: '42px',
        border: 'none',
        background: active ? 'rgba(71, 85, 105, 0.6)' : 'transparent',
        cursor: enabled ? 'pointer' : 'not-allowed',
        userSelect: 'none',
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: active ? '#ffffff' : (enabled ? '#cbd5e1' : '#64748b'),
        textAlign: 'left' as const,
        width: collapsed ? 'auto' : 'calc(100% - 16px)',
    });

    // 图标样式
    const iconStyle: React.CSSProperties = {
        width: '20px',
        height: '20px',
        flexShrink: 0,
        ...noAnimationStyle,
    };

    // 渲染基础导航项
    const renderBasicNavItem = (item: typeof basicNavItems[0], index: number) => {
        const Icon = item.icon;
        const active = item.isActive();

        return (
            <Link
                key={`basic-${index}`}
                to={item.path}
                draggable={false}
                style={getLinkStyle(active)}
                title={collapsed ? item.label : undefined}
                onMouseEnter={() => {
                    // 预加载项目数据
                    prefetchByRoute(item.path);
                }}
            >
                <Icon style={iconStyle} />
                {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500, ...noAnimationStyle }}>{item.label}</span>}
            </Link>
        );
    };

    // 渲染需要章节的导航项（带下拉菜单）
    const renderChapterNavItem = (item: typeof chapterNavItems[0], index: number) => {
        const Icon = item.icon;
        const active = item.isActive();
        const hasChapters = chapters && chapters.length > 0;

        // 如果已有当前章节，直接作为链接
        if (chapterId) {
            return (
                <Link
                    key={`chapter-${index}`}
                    to={`/projects/${projectId}/${item.module}/${chapterId}`}
                    draggable={false}
                    style={getLinkStyle(active)}
                    title={collapsed ? item.label : undefined}
                >
                    <Icon style={iconStyle} />
                    {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500, ...noAnimationStyle }}>{item.label}</span>}
                </Link>
            );
        }

        // 没有当前章节时，显示下拉菜单选择章节
        return (
            <DropdownMenu key={`chapter-${index}`}>
                <DropdownMenuTrigger asChild>
                    <button
                        disabled={!hasChapters}
                        style={getButtonStyle(active, hasChapters)}
                        title={collapsed ? (hasChapters ? `${item.label} - 选择章节` : `${item.label} - 暂无章节`) : undefined}
                    >
                        <Icon style={iconStyle} />
                        {!collapsed && (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, ...noAnimationStyle }}>
                                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                                    <span style={{ 
                                        fontSize: '12px', 
                                        color: hasChapters ? '#94a3b8' : '#64748b',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {hasChapters ? "选择章节" : "暂无章节"}
                                    </span>
                                </div>
                                {hasChapters && (
                                    <ChevronDown style={{ width: '16px', height: '16px', flexShrink: 0, color: '#94a3b8', ...noAnimationStyle }} />
                                )}
                            </>
                        )}
                    </button>
                </DropdownMenuTrigger>
                {hasChapters && (
                    <DropdownMenuContent 
                        side="right" 
                        align="start"
                        sideOffset={8}
                        style={{ ...noAnimationStyle }}
                        className="w-56 bg-slate-800/95 backdrop-blur-xl border-slate-700/30 shadow-lg rounded-xl"
                    >
                        <DropdownMenuLabel className="text-slate-400 text-xs uppercase tracking-wider">
                            选择章节
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-700/30" />
                        {chapters?.map((chapter) => (
                            <DropdownMenuItem
                                key={chapter.id}
                                onClick={() => handleChapterRequiredClick(item.module, chapter.id)}
                                onMouseEnter={() => {
                                    // 预加载章节编辑器数据
                                    prefetchChapterEditor(chapter.id);
                                }}
                                style={{ ...noAnimationStyle }}
                                className="text-slate-300 focus:bg-slate-700/50 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"
                            >
                                <FileText className="w-4 h-4 mr-2 text-slate-500" />
                                <span className="truncate">{chapter.title}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                )}
            </DropdownMenu>
        );
    };

    // 渲染其他导航项
    const renderOtherNavItem = (item: typeof otherNavItems[0], index: number) => {
        const Icon = item.icon;
        const active = item.isActive();

        return (
            <Link
                key={`other-${index}`}
                to={item.path}
                draggable={false}
                style={getLinkStyle(active)}
                title={collapsed ? item.label : undefined}
                onMouseEnter={() => {
                    // 预加载路由数据
                    if (item.path.includes('/assets')) {
                        // 资产库需要预加载项目资产
                        prefetchAssets(projectId);
                    } else {
                        // 其他路由使用通用预加载
                        prefetchByRoute(item.path);
                    }
                }}
            >
                <Icon style={iconStyle} />
                {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500, ...noAnimationStyle }}>{item.label}</span>}
            </Link>
        );
    };

    return (
        <aside
            style={{
                position: 'fixed',
                left: 0,
                top: '64px',
                height: 'calc(100vh - 64px)',
                zIndex: 40,
                backgroundColor: 'rgba(51, 65, 85, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRight: '1px solid rgba(71, 85, 105, 0.3)',
                borderTopRightRadius: '16px',
                borderBottomRightRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                width: collapsed ? '56px' : '208px',
                ...noAnimationStyle,
            }}
        >
            {/* 侧边栏标题 */}
            {!collapsed && (
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
                }}>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#94a3b8',
                    }}>
                        导航菜单
                    </span>
                </div>
            )}

            {/* 导航列表 */}
            <nav style={{
                flex: 1,
                padding: '16px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                overflowY: 'auto',
                overflowX: 'hidden',
            }}>
                {/* 基础导航 */}
                {basicNavItems.map(renderBasicNavItem)}
                
                {/* 分隔线 */}
                <div style={{
                    margin: collapsed ? '12px 8px' : '12px 16px',
                    borderTop: '1px solid rgba(71, 85, 105, 0.3)',
                }} />
                
                {/* 需要章节的导航 */}
                {chapterNavItems.map(renderChapterNavItem)}
                
                {/* 分隔线 */}
                <div style={{
                    margin: collapsed ? '12px 8px' : '12px 16px',
                    borderTop: '1px solid rgba(71, 85, 105, 0.3)',
                }} />
                
                {/* 其他导航 */}
                {otherNavItems.map(renderOtherNavItem)}
            </nav>

            {/* 底部折叠按钮 */}
            <div style={{
                padding: '8px',
                borderTop: '1px solid rgba(71, 85, 105, 0.3)',
            }}>
                <button
                    onClick={onToggle}
                    style={{
                        ...noAnimationStyle,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        padding: collapsed ? '10px' : '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                    title={collapsed ? "展开侧边栏" : "收起侧边栏"}
                >
                    {!collapsed && <span style={{ fontSize: '12px', color: '#94a3b8' }}>收起菜单</span>}
                    {collapsed ? (
                        <ChevronRight style={{ width: '20px', height: '20px', ...noAnimationStyle }} />
                    ) : (
                        <ChevronLeft style={{ width: '20px', height: '20px', ...noAnimationStyle }} />
                    )}
                </button>
            </div>
        </aside>
    );
}
