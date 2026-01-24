/**
 * 功能增强组件统一导出
 * 统一使用命名导出，避免混合导出风格
 */

// 分镜连贯性检测面板
export { ContinuityPanel } from './ContinuityPanel';

// AI分镜建议面板
export { SuggestionPanel } from './SuggestionPanel';

// 角色一致性管理面板
export { CharacterManagerPanel } from './CharacterManagerPanel';

// 风格混合面板
export { StyleMixPanel } from './StyleMixPanel';

// 多模型管理面板
export { ModelManagerPanel } from './ModelManagerPanel';

// 分镜时间轴
export { StoryboardTimeline } from './StoryboardTimeline';

// 快捷键帮助
export { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

// 数据分析仪表盘
export { 
  AnalyticsDashboard,
  calculateProjectStats,
  generateSuggestions,
  type ProjectStats,
  type AnalysisSuggestion
} from './AnalyticsDashboard';

// 角色出场统计
export { CharacterAppearanceStats } from './CharacterAppearanceStats';

// 其他常用组件
export { ErrorBoundary } from './ErrorBoundary';
export { LazyImage } from './LazyImage';
export { ImageUploadBox } from './ImageUploadBox';
export { PromptTemplateSelector } from './PromptTemplateSelector';
export { ScriptDiffViewer } from './ScriptDiffViewer';
export { StoryboardTemplateLibrary } from './StoryboardTemplateLibrary';
export { StoryFiveElementsAnalyzer } from './StoryFiveElementsAnalyzer';
export { StyleApplicationDialog } from './StyleApplicationDialog';
export { StyleApplicationSettings } from './StyleApplicationSettings';
export { StyleSelect } from './StyleSelect';
export { AssetUsagePanel } from './AssetUsagePanel';
export { AIScriptRewrite } from './AIScriptRewrite';
export { CharacterReferenceUpload } from './CharacterReferenceUpload';
