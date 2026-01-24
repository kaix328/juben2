/**
 * 功能增强模块统一导出
 * 包含所有新增的专业功能
 */

// ============ 分镜相关 ============

// 智能分镜连贯性检测
export {
  continuityChecker,
  ContinuityChecker,
  CONTINUITY_RULES,
  getSeverityColor,
  getSeverityIcon,
  formatReportAsText,
  type ContinuityIssue,
  type ContinuityReport,
  type ContinuityRule,
  type ContinuitySeverity
} from './continuityChecker';

// AI智能分镜建议
export {
  storyboardSuggester,
  analyzeScene,
  generateShotSuggestions,
  generateAlternativeApproaches,
  generateStoryboardSuggestion,
  type SceneAnalysis,
  type ShotSuggestion,
  type StoryboardSuggestion,
  type AlternativeApproach
} from './storyboardSuggester';

// ============ 角色管理 ============

// 角色一致性管理
export {
  characterManager,
  CharacterConsistencyManager,
  APPEARANCE_PRESETS,
  generateCharacterSummary,
  type CharacterProfile,
  type CharacterAppearance,
  type CharacterAIConfig,
  type ReferenceImage,
  type ConsistencySettings,
  type ConsistencyCheckResult
} from './characterConsistency';

// ============ 风格系统 ============

// 风格混合引擎
export {
  styleMixEngine,
  StyleMixEngine,
  BUILT_IN_STYLES,
  STYLE_CATEGORIES,
  LIGHTING_STYLES,
  RENDERING_STYLES,
  type StylePreset,
  type StyleParameters,
  type StyleMix,
  type StyleMixItem,
  type StyleCategory,
  type LightingStyle,
  type RenderingStyle
} from './styleMixEngine';

// ============ AI模型管理 ============

// 多模型支持
export {
  multiModelManager,
  MultiModelManager,
  BUILT_IN_MODELS,
  PROVIDER_INFO,
  CAPABILITY_INFO,
  type AIModelConfig,
  type AIModelProvider,
  type AIModelCapability,
  type AIRequest,
  type AIResponse,
  type ChatMessage,
  type ModelSelectionStrategy
} from './multiModelManager';

// ============ 剧本格式 ============

// 专业剧本格式支持
export {
  scriptConverter,
  ScriptFormatConverter,
  FountainParser,
  FountainGenerator,
  FDXParser,
  FDXGenerator,
  FORMAT_INFO,
  downloadScript,
  importScriptFromFile,
  type ScriptFormat,
  type ScriptElement,
  type ParsedScript,
  type ExportOptions
} from './scriptFormats';

// ============ 导出功能 ============

// 专业导出格式
export {
  ProfessionalExporter,
  FCPXMLExporter,
  EDLExporter,
  PremiereXMLExporter,
  DaVinciXMLExporter,
  PSDLayerExporter,
  EXPORT_FORMAT_INFO,
  EXPORT_PRESETS,
  type ExportFormat,
  type ExportConfig,
  type TimelineClip
} from './professionalExport';

// ============ 快捷键系统 ============

// 键盘快捷键
export {
  keyboardManager,
  useKeyboardShortcut,
  useKeyboardShortcuts,
  DEFAULT_KEY_BINDINGS,
  CATEGORY_INFO as SHORTCUT_CATEGORIES,
  type KeyBinding,
  type KeyBindingCategory,
  type KeyHandler
} from './keyboardShortcuts';

// ============ 项目模板 ============

// 项目模板系统
export {
  templateManager,
  TemplateManager,
  BUILT_IN_TEMPLATES,
  CATEGORY_INFO as TEMPLATE_CATEGORIES,
  type ProjectTemplate,
  type TemplateCategory,
  type TemplateConfig,
  type TemplatePresets
} from './projectTemplates';

// ============ 第三方集成 ============

// 第三方工具集成
export {
  integrationManager,
  IntegrationManager,
  AVAILABLE_INTEGRATIONS,
  INTEGRATION_TYPE_INFO,
  generateOAuthUrl,
  handleOAuthCallback,
  type Integration,
  type IntegrationType,
  type IntegrationConfig,
  type IntegrationFeature,
  type SyncResult
} from './integrations';
