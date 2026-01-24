import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Book, Calendar, Trash2, AlertTriangle, Search, SortDesc, Sparkles, Film, Upload, Download } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { projectStorage, generateId } from '../utils/storage';
import type { Project } from '../types';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ImportExportDialog } from '../components/ImportExportDialog';
import { FadeIn, StaggerChildren, ScaleOnHover } from '../components/Animations';

export function Bookshelf() {
  const projects = useLiveQuery(() => projectStorage.getAll());
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
  });

  // 🆕 搜索和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🆕 导入对话框状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // 🆕 过滤和排序项目
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let result = projects.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      const dateA = new Date(sortBy === 'updatedAt' ? (a.updatedAt || a.createdAt) : a.createdAt);
      const dateB = new Date(sortBy === 'updatedAt' ? (b.updatedAt || b.createdAt) : b.createdAt);
      return dateB.getTime() - dateA.getTime(); // 降序
    });

    return result;
  }, [projects, searchQuery, sortBy]);

  const handleCreateProject = async () => {
    if (!newProject.title) return;

    const project: Project = {
      id: generateId(),
      title: newProject.title,
      description: newProject.description,
      cover: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await projectStorage.save(project);
    setNewProject({ title: '', description: '' });
    setIsDialogOpen(false);
    toast.success('项目创建成功');
  };

  // 打开删除确认对话框
  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault(); // 阻止 Link 导航
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await projectStorage.delete(projectToDelete.id);
      toast.success(`已删除项目"${projectToDelete.title}"`);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      toast.error('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 - 增强版 */}
      <div className="flex justify-between items-start">
        <FadeIn direction="up" duration={400}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-200">
              <Film className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
              我的书架
            </h1>
          </div>
          <p className="text-gray-500 ml-14">管理您的AI漫剧作品，开启创作之旅</p>
        </FadeIn>

        {/* 🆕 搜索和排序 */}
        <FadeIn direction="left" duration={400} delay={100}>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            <Input
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px] border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[130px] border-gray-200">
              <SortDesc className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">最近修改</SelectItem>
              <SelectItem value="createdAt">创建时间</SelectItem>
              <SelectItem value="title">项目名称</SelectItem>
            </SelectContent>
          </Select>

          {/* 🆕 导入项目按钮 */}
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="gap-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
          >
            <Upload className="w-4 h-4" />
            导入
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                新建项目
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  创建新项目
                </DialogTitle>
                <DialogDescription>填写项目基本信息，创建新的AI漫剧项目</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">项目名称</Label>
                  <Input
                    id="title"
                    placeholder="请输入项目名称"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">项目简介</Label>
                  <Textarea
                    id="description"
                    placeholder="请输入项目简介"
                    rows={4}
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>
                <Button 
                  onClick={handleCreateProject} 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  创建项目
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </FadeIn>
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              确认删除项目
            </DialogTitle>
            <DialogDescription>
              您确定要删除项目"{projectToDelete?.title}"吗？
              <br />
              <span className="text-red-500 font-medium">此操作不可撤销，项目相关的所有章节、剧本、分镜和资源都将被删除。</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>删除中...</>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  确认删除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 项目列表 */}
      {!projects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[300px] border rounded-xl overflow-hidden bg-white shadow-sm space-y-3">
              <Skeleton className="h-[180px] w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <FadeIn direction="up" duration={400}>
          <EmptyState
            icon={Book}
            title={searchQuery ? '没有找到匹配的项目' : '还没有项目'}
            description={searchQuery ? '尝试使用其他关键词搜索' : '创建一个新项目，开始您的创作之旅'}
            actionLabel={searchQuery ? undefined : '新建项目'}
            onAction={searchQuery ? undefined : () => setIsDialogOpen(true)}
          />
        </FadeIn>
      ) : (
        <StaggerChildren staggerDelay={80} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="relative group"
            >
              <ScaleOnHover scale={1.02}>
              <Link to={`/projects/${project.id}`}>
                <Card className="h-full overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-purple-100 border-gray-100 hover:border-purple-200 bg-white/80 backdrop-blur-sm">
                  {/* 顶部渐变装饰条 */}
                  <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  
                  <div className="aspect-video bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center relative overflow-hidden">
                    {project.cover ? (
                      <img 
                        src={project.cover} 
                        alt={project.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl scale-150 group-hover:scale-175 transition-transform duration-500" />
                        <Book className="w-16 h-16 text-purple-400 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}
                    
                    {/* 悬停遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* 悬停提示 */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-purple-700 shadow-lg">
                        点击进入项目 →
                      </span>
                    </div>
                  </div>
                  
                  <CardContent className="pt-4">
                    <h3 className="text-gray-900 mb-2 truncate font-semibold text-lg group-hover:text-purple-700 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
                      {project.description || '暂无简介...'}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="text-gray-400 text-sm flex items-center gap-2 pt-2 border-t border-gray-50 mt-4">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.updatedAt || project.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    {project.stats && (
                      <>
                        <span className="text-gray-200">|</span>
                        <span>{project.stats.totalChapters || 0} 章节</span>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </Link>
              </ScaleOnHover>

              {/* 删除按钮 - 悬停时显示 */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110 active:scale-95"
                onClick={(e) => handleDeleteClick(e, project)}
                title="删除项目"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </StaggerChildren>
      )}

      {/* 🆕 导入项目对话框 */}
      <ImportExportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        mode="import"
        onImportSuccess={(result) => {
          setImportDialogOpen(false);
          if (result.projectId) {
            navigate(`/projects/${result.projectId}`);
          }
        }}
      />
    </div>
  );
}