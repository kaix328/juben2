import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并多个 className，智能处理 Tailwind CSS 类名冲突
 * 
 * 使用示例:
 * ```tsx
 * cn('bg-red-500', isActive && 'bg-blue-500') // 条件类名
 * cn('px-4 py-2', className) // 允许外部覆盖
 * cn(['flex', 'items-center'], { 'opacity-50': disabled }) // 对象语法
 * ```
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 重新导出类型，方便其他模块使用
export type { ClassValue };
