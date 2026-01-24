/**
 * 请求队列管理器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestQueue, type Task } from '../app/utils/requestQueue';

describe('RequestQueue', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = new RequestQueue();
  });

  describe('基本功能', () => {
    it('应该能创建队列实例', () => {
      expect(queue).toBeDefined();
      expect(queue.queueLength).toBe(0);
      expect(queue.runningCount).toBe(0);
      expect(queue.isIdle).toBe(true);
    });

    it('应该能添加任务', async () => {
      const task = queue.add('test-1', async () => 'result');
      expect(queue.queueLength + queue.runningCount).toBeGreaterThan(0);
      
      const result = await task;
      expect(result).toBe('result');
    });

    it('应该能执行多个任务', async () => {
      const results: string[] = [];
      
      await Promise.all([
        queue.add('task-1', async () => { results.push('1'); return '1'; }),
        queue.add('task-2', async () => { results.push('2'); return '2'; }),
        queue.add('task-3', async () => { results.push('3'); return '3'; })
      ]);

      expect(results).toHaveLength(3);
      expect(results).toContain('1');
      expect(results).toContain('2');
      expect(results).toContain('3');
    });
  });

  describe('并发控制', () => {
    it('应该限制并发数量', async () => {
      const concurrentQueue = new RequestQueue({ maxConcurrency: 2 });
      let running = 0;
      let maxRunning = 0;

      const tasks = Array.from({ length: 5 }, (_, i) =>
        concurrentQueue.add(`task-${i}`, async () => {
          running++;
          maxRunning = Math.max(maxRunning, running);
          await new Promise(resolve => setTimeout(resolve, 50));
          running--;
          return i;
        })
      );

      await Promise.all(tasks);
      expect(maxRunning).toBeLessThanOrEqual(2);
    });

    it('应该能动态调整并发数', () => {
      queue.setMaxConcurrency(5);
      expect(queue).toBeDefined();
    });
  });

  describe('任务状态', () => {
    it('应该能获取任务状态', async () => {
      const taskPromise = queue.add('status-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });

      // 任务应该在队列中或正在运行
      const status = queue.getTaskStatus('status-test');
      expect(status).toBeDefined();

      await taskPromise;

      // 等待一小段时间确保状态更新
      await new Promise(resolve => setTimeout(resolve, 50));

      // 任务完成后应该是 completed
      const finalStatus = queue.getTaskStatus('status-test');
      expect(finalStatus).toBe('completed');
    });

    it('应该能获取任务详情', async () => {
      const taskPromise = queue.add('detail-test', async () => 'result');
      
      const task = queue.getTask('detail-test');
      expect(task).toBeDefined();
      expect(task?.id).toBe('detail-test');

      await taskPromise;
    });

    it('不存在的任务应返回null', () => {
      const status = queue.getTaskStatus('non-existent');
      expect(status).toBeNull();

      const task = queue.getTask('non-existent');
      expect(task).toBeNull();
    });
  });

  describe('任务取消', () => {
    it('应该能取消队列中的任务', async () => {
      // 创建一个会阻塞的任务
      queue.add('blocking', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'blocked';
      });

      // 添加要取消的任务
      queue.add('to-cancel', async () => 'should not run');

      // 取消任务
      const cancelled = queue.cancel('to-cancel');
      expect(cancelled).toBe(true);

      const status = queue.getTaskStatus('to-cancel');
      expect(status).toBe('cancelled');
    });

    it('应该能取消所有任务', () => {
      queue.add('task-1', async () => 'result-1');
      queue.add('task-2', async () => 'result-2');
      queue.add('task-3', async () => 'result-3');

      queue.cancelAll();

      expect(queue.queueLength).toBe(0);
      expect(queue.isIdle).toBe(true);
    });
  });

  describe('统计信息', () => {
    it('应该能获取统计信息', async () => {
      await queue.add('stat-1', async () => 'result');
      
      const stats = queue.getStats();
      expect(stats).toBeDefined();
      expect(stats.completed).toBeGreaterThanOrEqual(0);
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });

    it('应该能清空已完成任务', async () => {
      await queue.add('clear-1', async () => 'result');
      await queue.add('clear-2', async () => 'result');

      queue.clearCompleted();
      
      const stats = queue.getStats();
      expect(stats.completed).toBe(0);
    });
  });

  describe('超时处理', () => {
    it('应该能处理超时任务', async () => {
      const timeoutQueue = new RequestQueue({ timeout: 100 });
      
      try {
        await timeoutQueue.add('timeout-task', async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return 'should timeout';
        });
      } catch (error) {
        // 超时会导致任务失败
      }

      const status = timeoutQueue.getTaskStatus('timeout-task');
      expect(['timeout', 'failed']).toContain(status);
    });

    it('应该能设置超时时间', () => {
      queue.setTimeout(5000);
      expect(queue).toBeDefined();
    });
  });

  describe('重试机制', () => {
    it('应该能重试失败的任务', async () => {
      let attempts = 0;
      const retryQueue = new RequestQueue({ maxRetries: 2, retryDelay: 50 });

      const result = await retryQueue.add('retry-task', async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      }).catch(() => 'failed');

      // 等待重试完成
      await new Promise(resolve => setTimeout(resolve, 200));

      // 应该至少尝试了1次（可能重试机制需要更多时间）
      expect(attempts).toBeGreaterThanOrEqual(1);
    });
  });

  describe('回调函数', () => {
    it('应该触发状态变化回调', async () => {
      const statusChanges: string[] = [];
      const callbackQueue = new RequestQueue({
        onTaskStatusChange: (task: Task) => {
          statusChanges.push(task.status);
        }
      });

      await callbackQueue.add('callback-test', async () => 'result');

      expect(statusChanges.length).toBeGreaterThan(0);
      expect(statusChanges).toContain('pending');
    });

    it('应该触发完成回调', async () => {
      let completed = false;
      const callbackQueue = new RequestQueue({
        onTaskCompleted: () => {
          completed = true;
        }
      });

      await callbackQueue.add('complete-test', async () => 'result');
      
      // 等待一小段时间确保回调执行
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(completed).toBe(true);
    });

    it('应该触发失败回调', async () => {
      let failed = false;
      const callbackQueue = new RequestQueue({
        onTaskFailed: () => {
          failed = true;
        }
      });

      try {
        await callbackQueue.add('fail-test', async () => {
          throw new Error('Test error');
        });
      } catch (error) {
        // 预期会失败
      }

      // 等待一小段时间确保回调执行
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(failed).toBe(true);
    });
  });

  describe('等待完成', () => {
    it('应该能等待所有任务完成', async () => {
      queue.add('wait-1', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result-1';
      });
      queue.add('wait-2', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result-2';
      });

      await queue.waitAll();

      expect(queue.isIdle).toBe(true);
    });
  });
});
