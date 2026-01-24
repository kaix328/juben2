/**
 * 动画工具函数和配置
 */

/**
 * 淡入动画
 */
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
};

/**
 * 从上滑入
 */
export const slideInFromTop = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
};

/**
 * 从下滑入
 */
export const slideInFromBottom = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
};

/**
 * 从右滑入
 */
export const slideInFromRight = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
};

/**
 * 从左滑入
 */
export const slideInFromLeft = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
};

/**
 * 缩放动画
 */
export const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeOut' }
};

/**
 * 弹跳动画
 */
export const bounceIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
        opacity: 1, 
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20
        }
    },
    exit: { opacity: 0, scale: 0.8 }
};

/**
 * 列表项交错动画
 */
export const staggerChildren = {
    animate: {
        transition: {
            staggerChildren: 0.05
        }
    }
};

/**
 * 列表项动画
 */
export const listItem = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
    transition: { duration: 0.2 }
};

/**
 * 悬停缩放
 */
export const hoverScale = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.15 }
};

/**
 * 悬停提升
 */
export const hoverLift = {
    whileHover: { y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
    transition: { duration: 0.2 }
};

/**
 * 脉冲动画（用于加载状态）
 */
export const pulse = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1]
    },
    transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
    }
};

/**
 * 旋转动画（用于加载图标）
 */
export const rotate = {
    animate: {
        rotate: 360
    },
    transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
    }
};

/**
 * 抖动动画（用于错误提示）
 */
export const shake = {
    animate: {
        x: [0, -10, 10, -10, 10, 0]
    },
    transition: {
        duration: 0.5
    }
};

/**
 * 渐变背景动画
 */
export const gradientAnimation = {
    animate: {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
    },
    transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear'
    }
};

/**
 * CSS类名动画辅助函数
 */
export const animationClasses = {
    // 淡入
    fadeIn: 'animate-fade-in',
    // 滑入
    slideInUp: 'animate-slide-in-up',
    slideInDown: 'animate-slide-in-down',
    slideInLeft: 'animate-slide-in-left',
    slideInRight: 'animate-slide-in-right',
    // 缩放
    scaleIn: 'animate-scale-in',
    // 弹跳
    bounce: 'animate-bounce',
    // 脉冲
    pulse: 'animate-pulse',
    // 旋转
    spin: 'animate-spin'
};

/**
 * 延迟动画
 */
export const withDelay = (animation: any, delay: number) => ({
    ...animation,
    transition: {
        ...animation.transition,
        delay
    }
});

/**
 * 平滑滚动到元素
 */
export const smoothScrollTo = (element: HTMLElement, offset = 0) => {
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
};

/**
 * 平滑滚动到顶部
 */
export const smoothScrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};
