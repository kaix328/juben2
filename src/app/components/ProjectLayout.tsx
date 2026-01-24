import { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { ProjectSidebar } from './ProjectSidebar';
import { cn } from '../utils/classnames';

export function ProjectLayout() {
    const { projectId, chapterId } = useParams<{ projectId: string; chapterId?: string }>();
    const [collapsed, setCollapsed] = useState(false);

    if (!projectId) return <Outlet />;

    return (
        <div className="relative min-h-[calc(100vh-64px)]">
            <ProjectSidebar
                projectId={projectId}
                chapterId={chapterId}
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            <div
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    collapsed ? "ml-14" : "ml-52"
                )}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
