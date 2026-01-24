/**
 * 请求队列管理器
 * 支持并发控制、超时、重试等功能
 */

// ============ 类型定义 ============

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';

export interface Task<T = any> {
  id: string;
  fn: () => Promise<T>;
  status: TaskStatus;
  result?: T;
  error?: Error;
  startTime?: number;
  endTime?: number;
  retryCount: number;
}

export interface RequestQueueOptions {
  maxConcurrency?: number;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  onTaskStatusChange?: (task: Task) => void;
  onTaskTimeout?: (task: Task) => void;
  onTaskFailed?: (task: Task, error: Error) => void;
  onTaskCompleted?: (task: Task) => void;
}

// ============ 请求队列 ============

export class RequestQueue {
  private queue: Task[] = [];
  private running: Map<string, Task> = new Map();
  private completed: Map<string, Task> = new Map();
  private maxConcurrency: number;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private onTaskStatusChange?: (task: Task) => void;
  private onTaskTimeout?: (task: Task) => void;
  private onTaskFailed?: (task: Task, error: Error) => void;
  private onTaskCompleted?: (task: Task) => void;

  constructor(options: RequestQueueOptions = {}) {
    this.maxConcurrency = options.maxConcurrency || 3;
    this.timeout = options.timeout || 60000; // 默认60秒
    this.maxRetries = options.maxRetries || 0;
    this.retryDelay = options.retryDelay || 1000;
    this.onTaskStatusChange = options.onTaskStatusChange;
    this.onTaskTimeout = options.onTaskTimeout;
    this.onTaskFailed = options.onTaskFailed;
    this.onTaskCompleted = options.onTaskCompleted;
  }

  /**
   * 添加任务到队列
   */
  add<T>(id: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: Task<T> = {
        id,
        fn: async () => {
          try {
            const result = await fn();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        status: 'pending',
        retryCount: 0
      };

      this.queue.push(task);
      this.updateTaskStatus(task, 'pending');
      this.processQueue();
    });
  }

  /**
   * 处理队列
   */
  private async processQueue() {
    while (this.queue.length > 0 && this.running.size < this.maxConcurrency) {
      const task = this.queue.shift();
      if (!task) break;

      this.running.set(task.id, task);
      this.executeTask(task);
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: Task) {
    task.startTime = Date.now();
    this.updateTaskStatus(task, 'running');

    try {
      // 创建超时Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Task timeout'));
        }, this.timeout);
      });

      // 执行任务或超时
      const result = await Promise.race([
        task.fn(),
        timeoutPromise
      ]);

      task.result = result;
      task.endTime = Date.now();
      this.updateTaskStatus(task, 'completed');
      this.onTaskCompleted?.(task);
      this.completeTask(task);
    } catch (error) {
      const err = error as Error;

      // 检查是否超时
      if (err.message === 'Task timeout') {
        task.endTime = Date.now();
        this.updateTaskStatus(task, 'timeout');
        this.onTaskTimeout?.(task);
        this.completeTask(task);
        return;
      }

      // 检查是否需要重试
      if (task.retryCount < this.maxRetries) {
        task.retryCount++;
        console.log(`[RequestQueue] Retrying task ${task.id} (${task.retryCount}/${this.maxRetries})`);

        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));

        // 重新加入队列
        this.running.delete(task.id);
        this.queue.unshift(task);
        this.processQueue();
        return;
      }

      // 失败
      task.error = err;
      task.endTime = Date.now();
      this.updateTaskStatus(task, 'failed');
      this.onTaskFailed?.(task, err);
      this.completeTask(task);
    }
  }

  /**
   * 完成任务
   */
  private completeTask(task: Task) {
    this.running.delete(task.id);
    this.completed.set(task.id, task);
    this.processQueue();
  }

  /**
   * 更新任务状态
   */
  private updateTaskStatus(task: Task, status: TaskStatus) {
    task.status = status;
    this.onTaskStatusChange?.(task);
  }

  /**
   * 取消任务
   */
  cancel(id: string): boolean {
    // 从队列中移除
    const queueIndex = this.queue.findIndex(t => t.id === id);
    if (queueIndex !== -1) {
      const task = this.queue[queueIndex];
      this.queue.splice(queueIndex, 1);
      this.updateTaskStatus(task, 'cancelled');
      return true;
    }

    // 取消正在运行的任务（注意：无法真正中断Promise）
    const runningTask = this.running.get(id);
    if (runningTask) {
      this.updateTaskStatus(runningTask, 'cancelled');
      this.running.delete(id);
      this.completed.set(id, runningTask);
      this.processQueue();
      return true;
    }

    return false;
  }

  /**
   * 取消所有任务
   */
  cancelAll() {
    // 取消队列中的任务
    this.queue.forEach(task => {
      this.updateTaskStatus(task, 'cancelled');
    });
    this.queue = [];

    // 取消正在运行的任务
    this.running.forEach(task => {
      this.updateTaskStatus(task, 'cancelled');
      this.completed.set(task.id, task);
    });
    this.running.clear();
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(id: string): TaskStatus | null {
    // 检查队列
    const queueTask = this.queue.find(t => t.id === id);
    if (queueTask) return queueTask.status;

    // 检查运行中
    const runningTask = this.running.get(id);
    if (runningTask) return runningTask.status;

    // 检查已完成
    const completedTask = this.completed.get(id);
    if (completedTask) return completedTask.status;

    return null;
  }

  /**
   * 获取任务
   */
  getTask(id: string): Task | null {
    const queueTask = this.queue.find(t => t.id === id);
    if (queueTask) return queueTask;

    const runningTask = this.running.get(id);
    if (runningTask) return runningTask;

    const completedTask = this.completed.get(id);
    if (completedTask) return completedTask;

    return null;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      pending: this.queue.length,
      running: this.running.size,
      completed: Array.from(this.completed.values()).filter(t => t.status === 'completed').length,
      failed: Array.from(this.completed.values()).filter(t => t.status === 'failed').length,
      timeout: Array.from(this.completed.values()).filter(t => t.status === 'timeout').length,
      cancelled: Array.from(this.completed.values()).filter(t => t.status === 'cancelled').length,
      total: this.queue.length + this.running.size + this.completed.size
    };
  }

  /**
   * 清空已完成的任务
   */
  clearCompleted() {
    this.completed.clear();
  }

  /**
   * 等待所有任务完成
   */
  async waitAll(): Promise<void> {
    while (this.queue.length > 0 || this.running.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * 获取队列长度
   */
  get queueLength(): number {
    return this.queue.length;
  }

  /**
   * 获取运行中任务数
   */
  get runningCount(): number {
    return this.running.size;
  }

  /**
   * 是否空闲
   */
  get isIdle(): boolean {
    return this.queue.length === 0 && this.running.size === 0;
  }

  /**
   * 设置并发数
   */
  setMaxConcurrency(max: number) {
    this.maxConcurrency = Math.max(1, max);
    this.processQueue();
  }

  /**
   * 设置超时时间
   */
  setTimeout(timeout: number) {
    this.timeout = Math.max(1000, timeout);
  }

  /**
   * 暂停队列
   */
  pause() {
    // 简单实现：清空队列但保留任务
    // 实际应用中可能需要更复杂的暂停/恢复机制
  }

  /**
   * 恢复队列
   */
  resume() {
    this.processQueue();
  }

  /**
   * 批量添加任务
   */
  async addTasks(tasks: { id: string; execute: () => Promise<any> }[]) {
    return Promise.all(tasks.map(t => this.add(t.id, t.execute)));
  }

  /**
   * 等待指定批次任务完成
   */
  async waitForBatch(ids: Set<string>): Promise<void> {
    const check = () => {
      const allDone = Array.from(ids).every(id => {
        const status = this.getTaskStatus(id);
        return status === 'completed' || status === 'failed' || status === 'timeout' || status === 'cancelled';
      });
      return allDone;
    };

    while (!check()) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  /**
   * 获取所有任务
   */
  getTasks(): Task[] {
    return [
      ...Array.from(this.completed.values()),
      ...Array.from(this.running.values()),
      ...this.queue
    ];
  }

  /**
   * 重试失败的任务
   */
  async retryFailed(ids?: Set<string>) {
    const failedTasks = Array.from(this.completed.values()).filter(t =>
      t.status === 'failed' || t.status === 'timeout'
    );

    const toRetry = ids
      ? failedTasks.filter(t => ids.has(t.id))
      : failedTasks;

    // 将失败任务从完成列表中移除，重置状态并重新添加到队列
    toRetry.forEach(task => {
      this.completed.delete(task.id);
      task.status = 'pending';
      task.retryCount = 0;
      task.error = undefined;
      task.result = undefined;
      this.queue.push(task);
      this.updateTaskStatus(task, 'pending');
    });

    this.processQueue();
  }
}

export default RequestQueue;
