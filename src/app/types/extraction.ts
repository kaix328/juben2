/**
 * 分镜提取进度反馈类型定义
 */

export type ExtractStage = 'preparing' | 'extracting' | 'processing' | 'validating' | 'complete';

export interface ExtractProgress {
    stage: ExtractStage;
    current: number;
    total: number;
    message: string;
    percentage?: number;
}

export enum ExtractErrorType {
    API_ERROR = 'api_error',
    TIMEOUT = 'timeout',
    PARSE_ERROR = 'parse_error',
    VALIDATION_ERROR = 'validation_error',
    UNKNOWN = 'unknown'
}

export interface ExtractError {
    type: ExtractErrorType;
    message: string;
    details?: any;
    suggestion?: string;
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: ExtractProgress) => void;

/**
 * 获取阶段的中文描述
 */
export function getStageDescription(stage: ExtractStage): string {
    const descriptions: Record<ExtractStage, string> = {
        preparing: '准备场景数据',
        extracting: '调用 AI 生成分镜',
        processing: '处理分镜数据',
        validating: '验证场景覆盖',
        complete: '提取完成'
    };
    return descriptions[stage];
}

/**
 * 计算进度百分比
 */
export function calculatePercentage(stage: ExtractStage, current: number, total: number): number {
    const stageWeights: Record<ExtractStage, number> = {
        preparing: 10,
        extracting: 50,
        processing: 30,
        validating: 8,
        complete: 2
    };
    
    const basePercentage = Object.entries(stageWeights)
        .filter(([s]) => {
            const stages: ExtractStage[] = ['preparing', 'extracting', 'processing', 'validating', 'complete'];
            return stages.indexOf(s as ExtractStage) < stages.indexOf(stage);
        })
        .reduce((sum, [, weight]) => sum + weight, 0);
    
    const currentStageWeight = stageWeights[stage];
    const stageProgress = total > 0 ? (current / total) * currentStageWeight : 0;
    
    return Math.min(100, Math.round(basePercentage + stageProgress));
}

/**
 * 创建进度对象
 */
export function createProgress(
    stage: ExtractStage,
    current: number,
    total: number,
    customMessage?: string
): ExtractProgress {
    const message = customMessage || getStageDescription(stage);
    const percentage = calculatePercentage(stage, current, total);
    
    return {
        stage,
        current,
        total,
        message,
        percentage
    };
}

/**
 * 创建错误对象
 */
export function createExtractError(
    error: any,
    context?: string
): ExtractError {
    let extractError: ExtractError;
    
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
        extractError = {
            type: ExtractErrorType.TIMEOUT,
            message: 'AI 响应超时',
            details: error,
            suggestion: '场景数量较多，建议使用精简模式或分批提取'
        };
    } else if (errorMessage.includes('parse') || errorMessage.includes('JSON') || errorMessage.includes('格式')) {
        extractError = {
            type: ExtractErrorType.PARSE_ERROR,
            message: 'AI 返回格式错误',
            details: error,
            suggestion: '已自动使用智能 Fallback 生成分镜'
        };
    } else if (errorMessage.includes('validation') || errorMessage.includes('验证') || errorMessage.includes('Validation')) {
        extractError = {
            type: ExtractErrorType.VALIDATION_ERROR,
            message: '数据验证失败',
            details: error,
            suggestion: '请检查剧本数据是否完整'
        };
    } else if (errorMessage.includes('API') || errorMessage.includes('network') || errorMessage.includes('网络')) {
        extractError = {
            type: ExtractErrorType.API_ERROR,
            message: 'API 调用失败',
            details: error,
            suggestion: '请检查网络连接或 API 配置，稍后重试'
        };
    } else {
        extractError = {
            type: ExtractErrorType.UNKNOWN,
            message: errorMessage || '未知错误',
            details: error,
            suggestion: '请稍后重试，或联系技术支持'
        };
    }
    
    if (context) {
        extractError.message = `${context}: ${extractError.message}`;
    }
    
    return extractError;
}
