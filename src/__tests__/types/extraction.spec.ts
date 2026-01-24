/**
 * 分镜提取进度反馈类型测试
 */
import { describe, it, expect } from 'vitest';
import {
    ExtractErrorType,
    getStageDescription,
    calculatePercentage,
    createProgress,
    createExtractError,
    type ExtractStage
} from '../../app/types/extraction';

describe('extraction types', () => {
    describe('getStageDescription', () => {
        it('应该返回正确的阶段描述', () => {
            expect(getStageDescription('preparing')).toBe('准备场景数据');
            expect(getStageDescription('extracting')).toBe('调用 AI 生成分镜');
            expect(getStageDescription('processing')).toBe('处理分镜数据');
            expect(getStageDescription('validating')).toBe('验证场景覆盖');
            expect(getStageDescription('complete')).toBe('提取完成');
        });
    });

    describe('calculatePercentage', () => {
        it('准备阶段应该返回 0-10%', () => {
            expect(calculatePercentage('preparing', 0, 10)).toBe(0);
            expect(calculatePercentage('preparing', 5, 10)).toBe(5);
            expect(calculatePercentage('preparing', 10, 10)).toBe(10);
        });

        it('提取阶段应该返回 10-60%', () => {
            expect(calculatePercentage('extracting', 0, 1)).toBe(10);
            expect(calculatePercentage('extracting', 1, 1)).toBe(60);
        });

        it('处理阶段应该返回 60-90%', () => {
            expect(calculatePercentage('processing', 0, 10)).toBe(60);
            expect(calculatePercentage('processing', 10, 10)).toBe(90);
        });

        it('验证阶段应该返回 90-98%', () => {
            expect(calculatePercentage('validating', 0, 5)).toBe(90);
            expect(calculatePercentage('validating', 5, 5)).toBe(98);
        });

        it('完成阶段应该返回 100%', () => {
            expect(calculatePercentage('complete', 1, 1)).toBe(100);
        });

        it('百分比不应超过 100%', () => {
            const percentage = calculatePercentage('complete', 100, 100);
            expect(percentage).toBeLessThanOrEqual(100);
        });
    });

    describe('createProgress', () => {
        it('应该创建正确的进度对象', () => {
            const progress = createProgress('extracting', 5, 10);
            
            expect(progress.stage).toBe('extracting');
            expect(progress.current).toBe(5);
            expect(progress.total).toBe(10);
            expect(progress.message).toBe('调用 AI 生成分镜');
            expect(progress.percentage).toBeGreaterThanOrEqual(0);
            expect(progress.percentage).toBeLessThanOrEqual(100);
        });

        it('应该支持自定义消息', () => {
            const progress = createProgress('processing', 3, 10, '正在处理第 3 个场景');
            
            expect(progress.message).toBe('正在处理第 3 个场景');
        });

        it('应该处理 total 为 0 的情况', () => {
            const progress = createProgress('preparing', 0, 0);
            
            expect(progress.percentage).toBeGreaterThanOrEqual(0);
            expect(progress.percentage).toBeLessThanOrEqual(100);
        });
    });

    describe('createExtractError', () => {
        it('应该识别超时错误', () => {
            const error = new Error('Request timeout after 30s');
            const extractError = createExtractError(error);
            
            expect(extractError.type).toBe(ExtractErrorType.TIMEOUT);
            expect(extractError.message).toContain('超时');
            expect(extractError.suggestion).toContain('精简模式');
        });

        it('应该识别解析错误', () => {
            const error = new Error('JSON parse error at position 10');
            const extractError = createExtractError(error);
            
            expect(extractError.type).toBe(ExtractErrorType.PARSE_ERROR);
            expect(extractError.message).toContain('格式错误');
            expect(extractError.suggestion).toContain('Fallback');
        });

        it('应该识别 API 错误', () => {
            const error = new Error('API call failed: network error');
            const extractError = createExtractError(error);
            
            expect(extractError.type).toBe(ExtractErrorType.API_ERROR);
            expect(extractError.message).toContain('API');
            expect(extractError.suggestion).toContain('网络');
        });

        it('应该识别验证错误', () => {
            const error = new Error('Validation failed: missing required field');
            const extractError = createExtractError(error);
            
            expect(extractError.type).toBe(ExtractErrorType.VALIDATION_ERROR);
            expect(extractError.message).toContain('验证');
        });

        it('应该处理未知错误', () => {
            const error = new Error('Something went wrong');
            const extractError = createExtractError(error);
            
            expect(extractError.type).toBe(ExtractErrorType.UNKNOWN);
            expect(extractError.message).toContain('Something went wrong');
            expect(extractError.suggestion).toContain('重试');
        });

        it('应该支持添加上下文', () => {
            const error = new Error('Failed');
            const extractError = createExtractError(error, '场景提取');
            
            expect(extractError.message).toContain('场景提取');
        });

        it('应该保存错误详情', () => {
            const error = new Error('Test error');
            const extractError = createExtractError(error);
            
            expect(extractError.details).toBe(error);
        });
    });
});
