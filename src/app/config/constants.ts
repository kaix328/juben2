/**
 * 应用配置常量
 * 集中管理所有魔法数字和配置项
 */

/**
 * AI 相关配置
 */
export const AI_CONFIG = {
  /** DeepSeek API 单次请求最大字符数 */
  MAX_CHUNK_SIZE: 8000,
  
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  
  /** 重试延迟（毫秒） */
  RETRY_DELAY: 1000,
  
  /** 请求超时时间（毫秒） */
  TIMEOUT: 30000,
  
  /** 默认温度参数 */
  DEFAULT_TEMPERATURE: 0.7,
  
  /** 最大tokens */
  MAX_TOKENS: 4000,
} as const;

/**
 * 备份相关配置
 */
export const BACKUP_CONFIG = {
  /** 自动备份间隔（毫秒，默认1分钟） */
  AUTO_INTERVAL: 60000,
  
  /** 最大历史记录数 */
  MAX_HISTORY: 50,
  
  /** 备份保留天数 */
  RETENTION_DAYS: 30,
  
  /** 自动保存延迟（毫秒） */
  AUTO_SAVE_DELAY: 2000,
} as const;

/**
 * 性能相关配置
 */
export const PERFORMANCE_CONFIG = {
  /** 防抖延迟（毫秒） */
  DEBOUNCE_DELAY: 300,
  
  /** 节流延迟（毫秒） */
  THROTTLE_DELAY: 1000,
  
  /** 虚拟滚动预渲染项数 */
  VIRTUAL_SCROLL_OVERSCAN: 5,
  
  /** 长列表阈值（超过此数量使用虚拟滚动） */
  LONG_LIST_THRESHOLD: 50,
  
  /** 图片懒加载阈值（像素） */
  IMAGE_LAZY_THRESHOLD: 200,
  
  /** 最大渲染时间警告阈值（毫秒） */
  MAX_RENDER_TIME: 16,
} as const;

/**
 * 存储相关配置
 */
export const STORAGE_CONFIG = {
  /** IndexedDB 数据库名称 */
  DB_NAME: 'screenplay-creator-db',
  
  /** 数据库版本 */
  DB_VERSION: 1,
  
  /** LocalStorage 键前缀 */
  STORAGE_PREFIX: 'screenplay_',
  
  /** 最大存储大小（字节，约50MB） */
  MAX_STORAGE_SIZE: 50 * 1024 * 1024,
} as const;

/**
 * UI 相关配置
 */
export const UI_CONFIG = {
  /** Toast 默认显示时间（毫秒） */
  TOAST_DURATION: 3000,
  
  /** Toast 错误显示时间（毫秒） */
  TOAST_ERROR_DURATION: 5000,
  
  /** Toast 严重错误显示时间（毫秒） */
  TOAST_CRITICAL_DURATION: 10000,
  
  /** 模态框动画时间（毫秒） */
  MODAL_ANIMATION_DURATION: 200,
  
  /** 页面切换动画时间（毫秒） */
  PAGE_TRANSITION_DURATION: 300,
  
  /** 默认分页大小 */
  DEFAULT_PAGE_SIZE: 20,
  
  /** 最大分页大小 */
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * 验证相关配置
 */
export const VALIDATION_CONFIG = {
  /** 项目名称最小长度 */
  PROJECT_NAME_MIN_LENGTH: 1,
  
  /** 项目名称最大长度 */
  PROJECT_NAME_MAX_LENGTH: 100,
  
  /** 剧本文本最大长度 */
  SCRIPT_TEXT_MAX_LENGTH: 100000,
  
  /** 场景描述最大长度 */
  SCENE_DESCRIPTION_MAX_LENGTH: 5000,
  
  /** 对白最大长度 */
  DIALOGUE_MAX_LENGTH: 1000,
  
  /** 角色名最大长度 */
  CHARACTER_NAME_MAX_LENGTH: 50,
} as const;

/**
 * 导出相关配置
 */
export const EXPORT_CONFIG = {
  /** PDF 默认页边距（毫米） */
  PDF_MARGIN: 20,
  
  /** PDF 默认字体大小 */
  PDF_FONT_SIZE: 12,
  
  /** Word 默认页边距（磅） */
  WORD_MARGIN: 72,
  
  /** 图片导出默认质量 */
  IMAGE_QUALITY: 0.9,
  
  /** 图片导出默认格式 */
  IMAGE_FORMAT: 'png' as const,
} as const;

/**
 * 分镜相关配置
 */
export const STORYBOARD_CONFIG = {
  /** 默认分镜时长（秒） */
  DEFAULT_PANEL_DURATION: 3,
  
  /** 最小分镜时长（秒） */
  MIN_PANEL_DURATION: 1,
  
  /** 最大分镜时长（秒） */
  MAX_PANEL_DURATION: 30,
  
  /** 默认画面比例 */
  DEFAULT_ASPECT_RATIO: '16:9' as const,
  
  /** 支持的画面比例 */
  SUPPORTED_ASPECT_RATIOS: ['16:9', '4:3', '21:9', '1:1', '9:16'] as const,
  
  /** 默认景别 */
  DEFAULT_SHOT_SIZE: '中景' as const,
} as const;

/**
 * 质量检查相关配置
 */
export const QUALITY_CONFIG = {
  /** 质量分数权重 */
  SCORE_WEIGHTS: {
    continuity: 0.25,    // 连贯性 25%
    duration: 0.15,      // 时长 15%
    character: 0.15,     // 角色 15%
    shot: 0.15,          // 镜头 15%
    dialogue: 0.15,      // 对话 15%
    logic: 0.15,         // 逻辑 15%
  },
  
  /** 质量等级阈值 */
  QUALITY_THRESHOLDS: {
    excellent: 90,
    good: 75,
    fair: 60,
    poor: 0,
  },
  
  /** 最大问题数量（超过此数量停止检查） */
  MAX_ISSUES: 100,
} as const;

/**
 * 网络相关配置
 */
export const NETWORK_CONFIG = {
  /** API 请求超时（毫秒） */
  API_TIMEOUT: 30000,
  
  /** 最大并发请求数 */
  MAX_CONCURRENT_REQUESTS: 3,
  
  /** 请求重试次数 */
  REQUEST_RETRY_COUNT: 2,
  
  /** 请求重试延迟（毫秒） */
  REQUEST_RETRY_DELAY: 1000,
} as const;

/**
 * 开发相关配置
 */
export const DEV_CONFIG = {
  /** 是否启用调试模式 */
  DEBUG_MODE: import.meta.env.DEV,
  
  /** 是否启用性能监控 */
  ENABLE_PERFORMANCE_MONITOR: import.meta.env.DEV,
  
  /** 是否启用详细日志 */
  VERBOSE_LOGGING: import.meta.env.DEV,
} as const;

/**
 * 统一导出所有配置
 */
export const CONFIG = {
  AI: AI_CONFIG,
  BACKUP: BACKUP_CONFIG,
  PERFORMANCE: PERFORMANCE_CONFIG,
  STORAGE: STORAGE_CONFIG,
  UI: UI_CONFIG,
  VALIDATION: VALIDATION_CONFIG,
  EXPORT: EXPORT_CONFIG,
  STORYBOARD: STORYBOARD_CONFIG,
  QUALITY: QUALITY_CONFIG,
  NETWORK: NETWORK_CONFIG,
  DEV: DEV_CONFIG,
} as const;

export default CONFIG;
