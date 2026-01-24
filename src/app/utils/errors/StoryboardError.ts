/**
 * 自定义错误类系统
 * 提供详细的错误信息和解决建议
 */

export enum ErrorCode {
    // ============ AI 相关错误 ============
    AI_TIMEOUT = 'AI_TIMEOUT',
    AI_RATE_LIMIT = 'AI_RATE_LIMIT',
    AI_INVALID_RESPONSE = 'AI_INVALID_RESPONSE',
    AI_NETWORK_ERROR = 'AI_NETWORK_ERROR',
    AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
    AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
    
    // ============ 数据相关错误 ============
    DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',
    DATA_NOT_FOUND = 'DATA_NOT_FOUND',
    DATA_SAVE_FAILED = 'DATA_SAVE_FAILED',
    DATA_LOAD_FAILED = 'DATA_LOAD_FAILED',
    DATA_CORRUPTED = 'DATA_CORRUPTED',
    
    // ============ 业务逻辑错误 ============
    INVALID_PANEL_COUNT = 'INVALID_PANEL_COUNT',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
    SCENE_NOT_FOUND = 'SCENE_NOT_FOUND',
    CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND',
    INVALID_OPERATION = 'INVALID_OPERATION',
    
    // ============ 系统错误 ============
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
}

export interface ErrorSuggestion {
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export interface ErrorDetails {
    code: ErrorCode;
    originalError?: Error;
    context?: Record<string, any>;
    timestamp: string;
}

/**
 * 分镜错误基类
 */
export class StoryboardError extends Error {
    public readonly code: ErrorCode;
    public readonly details: ErrorDetails;
    public readonly suggestions: ErrorSuggestion[];
    
    constructor(
        message: string,
        code: ErrorCode,
        suggestions: ErrorSuggestion[] = [],
        context?: Record<string, any>,
        originalError?: Error
    ) {
        super(message);
        this.name = 'StoryboardError';
        this.code = code;
        this.suggestions = suggestions;
        this.details = {
            code,
            originalError,
            context,
            timestamp: new Date().toISOString(),
        };
        
        // 维护正确的堆栈跟踪
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StoryboardError);
        }
    }
    
    /**
     * 转换为用户友好的消息
     */
    toUserMessage(): string {
        const lines = [this.message];
        if (this.suggestions.length > 0) {
            lines.push('');
            lines.push('建议：');
            this.suggestions.forEach((s, i) => {
                lines.push(`${i + 1}. ${s.title}: ${s.description}`);
            });
        }
        return lines.join('\n');
    }
    
    /**
     * 转换为日志格式
     */
    toLogFormat(): string {
        return JSON.stringify({
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            stack: this.stack,
        }, null, 2);
    }
    
    // ============ 静态工厂方法 ============
    
    /**
     * AI 请求超时错误
     */
    static timeout(context?: Record<string, any>): StoryboardError {
        return new StoryboardError(
            'AI 请求超时',
            ErrorCode.AI_TIMEOUT,
            [
                {
                    title: '减少场景数量',
                    description: '尝试一次处理更少的场景（3-5个）',
                },
                {
                    title: '检查网络连接',
                    description: '确保网络连接稳定，避免使用 VPN',
                },
                {
                    title: '稍后重试',
                    description: 'AI 服务可能繁忙，请等待 2-5 分钟后重试',
                },
                {
                    title: '使用 Fallback 模式',
                    description: '系统会自动使用智能 Fallback 生成分镜',
                },
            ],
            context
        );
    }
    
    /**
     * API 速率限制错误
     */
    static rateLimit(retryAfter?: number, context?: Record<string, any>): StoryboardError {
        const waitTime = retryAfter || 60;
        return new StoryboardError(
            'API 请求频率超限',
            ErrorCode.AI_RATE_LIMIT,
            [
                {
                    title: '等待后重试',
                    description: `请等待 ${waitTime} 秒后重试`,
                },
                {
                    title: '减少并发请求',
                    description: '避免同时生成多个分镜或批量操作',
                },
                {
                    title: '升级 API 配额',
                    description: '考虑升级 API 服务以获得更高的请求限制',
                },
            ],
            { ...context, retryAfter }
        );
    }
    
    /**
     * 数据验证失败错误
     */
    static validation(errors: Array<{ field: string; message: string }>, context?: Record<string, any>): StoryboardError {
        const errorList = errors.map(e => `${e.field}: ${e.message}`).join('\n');
        return new StoryboardError(
            '数据验证失败',
            ErrorCode.DATA_VALIDATION_FAILED,
            [
                {
                    title: '检查必填字段',
                    description: '确保所有必填字段都已正确填写',
                },
                {
                    title: '查看详细错误',
                    description: errorList,
                },
                {
                    title: '使用自动修复',
                    description: '系统可以自动修复部分常见问题',
                },
            ],
            { ...context, errors }
        );
    }
    
    /**
     * AI 响应无效错误
     */
    static invalidResponse(reason: string, context?: Record<string, any>): StoryboardError {
        return new StoryboardError(
            'AI 返回的数据无效',
            ErrorCode.AI_INVALID_RESPONSE,
            [
                {
                    title: '重新生成',
                    description: '点击重试按钮重新生成分镜',
                },
                {
                    title: '使用 Fallback',
                    description: '系统会自动使用智能 Fallback 生成分镜',
                },
                {
                    title: '检查剧本内容',
                    description: '确保剧本场景描述完整且格式正确',
                },
            ],
            { ...context, reason }
        );
    }
    
    /**
     * 网络错误
     */
    static network(originalError?: Error, context?: Record<string, any>): StoryboardError {
        return new StoryboardError(
            '网络连接失败',
            ErrorCode.AI_NETWORK_ERROR,
            [
                {
                    title: '检查网络连接',
                    description: '确保设备已连接到互联网',
                },
                {
                    title: '检查防火墙设置',
                    description: '确保应用未被防火墙阻止',
                },
                {
                    title: '稍后重试',
                    description: '网络可能暂时不稳定，请稍后重试',
                },
            ],
            context,
            originalError
        );
    }
    
    /**
     * 数据保存失败错误
     */
    static saveFailed(originalError?: Error, context?: Record<string, any>): StoryboardError {
        return new StoryboardError(
            '数据保存失败',
            ErrorCode.DATA_SAVE_FAILED,
            [
                {
                    title: '检查存储空间',
                    description: '确保设备有足够的存储空间',
                },
                {
                    title: '检查权限',
                    description: '确保应用有写入权限',
                },
                {
                    title: '导出备份',
                    description: '建议先导出数据作为备份',
                },
            ],
            context,
            originalError
        );
    }
    
    /**
     * 场景未找到错误
     */
    static sceneNotFound(sceneId: string, context?: Record<string, any>): StoryboardError {
        return new StoryboardError(
            `场景未找到: ${sceneId}`,
            ErrorCode.SCENE_NOT_FOUND,
            [
                {
                    title: '检查剧本',
                    description: '确保剧本中包含该场景',
                },
                {
                    title: '重新生成分镜',
                    description: '尝试重新生成分镜以修复引用',
                },
            ],
            { ...context, sceneId }
        );
    }
    
    /**
     * 角色未找到错误
     */
    static characterNotFound(characterName: string, context?: Record<string, any>): StoryboardError {
        return new StoryboardError(
            `角色未找到: ${characterName}`,
            ErrorCode.CHARACTER_NOT_FOUND,
            [
                {
                    title: '添加角色',
                    description: '在资产库中添加该角色',
                },
                {
                    title: '检查拼写',
                    description: '确保角色名称拼写正确',
                },
                {
                    title: '更新分镜',
                    description: '手动更新分镜中的角色信息',
                },
            ],
            { ...context, characterName }
        );
    }
    
    /**
     * 配额超限错误
     */
    static quotaExceeded(context?: Record<string, any>): StoryboardError {
        return new StoryboardError(
            'API 配额已用尽',
            ErrorCode.AI_QUOTA_EXCEEDED,
            [
                {
                    title: '等待配额重置',
                    description: '配额通常在每月初重置',
                },
                {
                    title: '升级套餐',
                    description: '考虑升级到更高级别的 API 套餐',
                },
                {
                    title: '使用 Fallback',
                    description: '使用智能 Fallback 模式继续工作',
                },
            ],
            context
        );
    }
}

/**
 * 错误处理辅助函数
 */
export class ErrorHandler {
    /**
     * 将任意错误转换为 StoryboardError
     */
    static normalize(error: unknown): StoryboardError {
        if (error instanceof StoryboardError) {
            return error;
        }
        
        if (error instanceof Error) {
            // 根据错误消息判断类型
            const message = error.message.toLowerCase();
            
            if (message.includes('timeout')) {
                return StoryboardError.timeout({ originalMessage: error.message });
            }
            if (message.includes('rate limit') || message.includes('too many requests')) {
                return StoryboardError.rateLimit(undefined, { originalMessage: error.message });
            }
            if (message.includes('network') || message.includes('fetch')) {
                return StoryboardError.network(error);
            }
            if (message.includes('quota') || message.includes('exceeded')) {
                return StoryboardError.quotaExceeded({ originalMessage: error.message });
            }
            
            // 默认未知错误
            return new StoryboardError(
                error.message || '发生未知错误',
                ErrorCode.UNKNOWN_ERROR,
                [
                    {
                        title: '查看详细信息',
                        description: '请查看控制台获取更多信息',
                    },
                    {
                        title: '联系支持',
                        description: '如果问题持续，请联系技术支持',
                    },
                ],
                { originalError: error.message },
                error
            );
        }
        
        // 非 Error 对象
        return new StoryboardError(
            String(error) || '发生未知错误',
            ErrorCode.UNKNOWN_ERROR,
            [],
            { rawError: error }
        );
    }
    
    /**
     * 记录错误到控制台
     */
    static log(error: StoryboardError): void {
        console.error(`[${error.code}] ${error.message}`);
        console.error('Details:', error.details);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
    
    /**
     * 判断错误是否可重试
     */
    static isRetryable(error: StoryboardError): boolean {
        const retryableCodes = [
            ErrorCode.AI_TIMEOUT,
            ErrorCode.AI_NETWORK_ERROR,
            ErrorCode.AI_SERVICE_UNAVAILABLE,
        ];
        return retryableCodes.includes(error.code);
    }
    
    /**
     * 获取重试延迟（毫秒）
     */
    static getRetryDelay(error: StoryboardError, attemptNumber: number): number {
        // 指数退避：2^attemptNumber * 1000ms
        const baseDelay = 1000;
        const maxDelay = 30000; // 最大 30 秒
        const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
        
        // 添加随机抖动（±20%）
        const jitter = delay * 0.2 * (Math.random() - 0.5);
        return Math.floor(delay + jitter);
    }
}
