import { BarChart3, PieChart as PieIcon, TrendingUp, AlertCircle, Download } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { AssetAnalytics } from '../hooks/useAssetAnalytics';

interface AnalyticsDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analytics: AssetAnalytics | null;
  onExportReport?: () => void;
  onAssetClick?: (id: string, type: 'character' | 'scene' | 'prop' | 'costume') => void;
}

export function AnalyticsDashboardDialog({
  open,
  onOpenChange,
  analytics,
  onExportReport,
  onAssetClick,
}: AnalyticsDashboardDialogProps) {
  if (!analytics) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              项目库数据分析
            </div>
            {onExportReport && (
              <Button variant="outline" size="sm" onClick={onExportReport}>
                <Download className="w-4 h-4 mr-2" />
                导出报表
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="usage">使用统计</TabsTrigger>
            <TabsTrigger value="quality">质量分析</TabsTrigger>
            <TabsTrigger value="tags">标签分析</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            {/* 概览 */}
            <TabsContent value="overview" className="space-y-6">
              {/* 基础统计 */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  title="总资产"
                  value={analytics.totalAssets}
                  icon={<BarChart3 className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  title="角色"
                  value={analytics.characterCount}
                  icon={<BarChart3 className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="场景"
                  value={analytics.sceneCount}
                  icon={<BarChart3 className="w-5 h-5" />}
                  color="orange"
                />
                <StatCard
                  title="道具+服装"
                  value={analytics.propCount + analytics.costumeCount}
                  icon={<BarChart3 className="w-5 h-5" />}
                  color="purple"
                />
              </div>

              {/* 图片生成率与分布 */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-blue-600" />
                    资源生成率与分布
                  </h3>
                  <Badge variant="outline" className="font-mono">{analytics.imageGenerationRate}% 总进度</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 左侧：环形图 */}
                  <div className="h-[240px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '角色', value: analytics.characterCount * (analytics.characterImagesRate / 100), color: '#3b82f6' },
                            { name: '场景', value: analytics.sceneCount * (analytics.sceneImagesRate / 100), color: '#10b981' },
                            { name: '道具', value: analytics.propCount * (analytics.propImagesRate / 100), color: '#f59e0b' },
                            { name: '服装', value: analytics.costumeCount * (analytics.costumeImagesRate / 100), color: '#8b5cf6' },
                            { name: '待生成', value: analytics.totalAssets - analytics.imagesGenerated, color: '#f3f4f6' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f3f4f6'].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [Math.round(value) + ' 个', '数量']}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-gray-900">{analytics.imageGenerationRate}%</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">已完成</span>
                    </div>
                  </div>

                  {/* 右侧：详细进度条 */}
                  <div className="space-y-4 flex flex-col justify-center">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>角色</span>
                        <span className="font-medium">{analytics.characterImagesRate}%</span>
                      </div>
                      <Progress value={analytics.characterImagesRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>场景</span>
                        <span className="font-medium">{analytics.sceneImagesRate}%</span>
                      </div>
                      <Progress value={analytics.sceneImagesRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>道具</span>
                        <span className="font-medium">{analytics.propImagesRate}%</span>
                      </div>
                      <Progress value={analytics.propImagesRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>服装</span>
                        <span className="font-medium">{analytics.costumeImagesRate}%</span>
                      </div>
                      <Progress value={analytics.costumeImagesRate} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 完整度 */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  资产完整度
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>完整度</span>
                      <span className="font-medium">{analytics.completionRate}%</span>
                    </div>
                    <Progress value={analytics.completionRate} className="h-2" />
                  </div>
                  {analytics.incompleteAssets.length > 0 && (
                    <div className="bg-orange-50 rounded p-3">
                      <p className="text-sm text-orange-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {analytics.incompleteAssets.length} 个资产信息不完整
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* 使用统计 */}
            <TabsContent value="usage" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* 最常用角色 */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold mb-4">最常用角色 Top 10</h3>
                  <div className="space-y-3">
                    {analytics.mostUsedCharacters.map((char, index) => (
                      <button
                        key={char.id}
                        onClick={() => onAssetClick?.(char.id, 'character')}
                        className="flex items-center gap-3 w-full text-left hover:bg-gray-50 p-1 rounded transition-colors group"
                      >
                        <Badge variant={index < 3 ? "default" : "secondary"} className="w-8 text-center shrink-0">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-blue-600 transition-colors">{char.name}</p>
                          <Progress value={(char.count / (analytics.mostUsedCharacters[0]?.count || 1)) * 100} className="h-1 mt-1" />
                        </div>
                        <span className="text-sm text-gray-500 shrink-0">{char.count}次</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 最常用场景 */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold mb-4">最常用场景 Top 10</h3>
                  <div className="space-y-3">
                    {analytics.mostUsedScenes.map((scene, index) => (
                      <button
                        key={scene.id}
                        onClick={() => onAssetClick?.(scene.id, 'scene')}
                        className="flex items-center gap-3 w-full text-left hover:bg-gray-50 p-1 rounded transition-colors group"
                      >
                        <Badge variant={index < 3 ? "default" : "secondary"} className="w-8 text-center shrink-0">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-blue-600 transition-colors">{scene.name}</p>
                          <Progress value={(scene.count / (analytics.mostUsedScenes[0]?.count || 1)) * 100} className="h-1 mt-1" />
                        </div>
                        <span className="text-sm text-gray-500 shrink-0">{scene.count}次</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 最少使用资产 */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  最少使用资产（可能需要优化或删除）
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {analytics.leastUsedAssets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => onAssetClick?.(asset.id, asset.type as any)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-blue-600 transition-colors">{asset.name}</p>
                        <p className="text-xs text-gray-500">{getTypeLabel(asset.type)}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">{asset.count}次</Badge>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* 质量分析 */}
            <TabsContent value="quality" className="space-y-6">
              {/* 提示词统计 */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4">提示词分析</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded">
                    <span className="text-sm font-medium">平均提示词长度</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {analytics.averagePromptLength}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <p className="text-2xl font-bold text-gray-700">
                        {analytics.promptLengthDistribution.short}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">短提示词 (&lt;100)</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <p className="text-2xl font-bold text-gray-700">
                        {analytics.promptLengthDistribution.medium}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">中等 (100-500)</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <p className="text-2xl font-bold text-gray-700">
                        {analytics.promptLengthDistribution.long}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">长提示词 (&gt;500)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 不完整资产列表 */}
              {analytics.incompleteAssets.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    需要完善的资产
                  </h3>
                  <div className="space-y-2">
                    {analytics.incompleteAssets.slice(0, 10).map(asset => (
                      <button
                        key={asset.id}
                        onClick={() => onAssetClick?.(asset.id, asset.type as any)}
                        className="flex items-start justify-between p-3 bg-orange-50 rounded hover:bg-orange-100 transition-colors w-full text-left group"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium group-hover:text-orange-900 transition-colors">{asset.name}</p>
                          <p className="text-xs text-gray-500">{getTypeLabel(asset.type)}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                          {asset.missingFields.map(field => (
                            <Badge key={field} variant="outline" className="text-[10px] h-4 px-1 border-orange-200 text-orange-700 bg-white/50">
                              缺少{field}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 标签分析 */}
            <TabsContent value="tags" className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4">热门标签 Top 10</h3>
                <div className="space-y-3">
                  {analytics.topTags.map((tag, index) => (
                    <div key={tag.tag} className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "secondary"} className="w-8 text-center">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{tag.tag}</span>
                          <span className="text-sm text-gray-500">{tag.count} 次</span>
                        </div>
                        <Progress value={(tag.count / analytics.topTags[0].count) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    character: '角色',
    scene: '场景',
    prop: '道具',
    costume: '服装',
  };
  return labels[type] || type;
}
