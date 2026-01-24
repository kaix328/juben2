/**
 * 优化的图片组件
 * 支持懒加载、响应式图片、WebP 格式、占位符
 */
import React, { useState, useEffect } from 'react';
import { cn } from '../utils/classnames';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'auto';
}

/**
 * 生成不同尺寸的图片 URL
 */
function generateSrcSet(src: string): string {
  // 如果是外部 URL 或已经包含参数，直接返回
  if (src.startsWith('http') || src.includes('?')) {
    return src;
  }
  
  const sizes = [320, 640, 1024, 1920];
  return sizes
    .map(size => `${src}?w=${size} ${size}w`)
    .join(', ');
}

/**
 * 检查是否支持 WebP
 */
function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * 优化的图片组件
 */
export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  sizes = '100vw',
  priority = false,
  onLoad,
  onError,
  aspectRatio = 'auto',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    checkWebPSupport().then(setSupportsWebP);
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const aspectRatioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  // 生成 WebP 版本的 URL
  const webpSrc = supportsWebP && !src.endsWith('.svg')
    ? src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    : null;

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-gray-100',
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {/* 加载占位符 */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {/* 图片 */}
      {!hasError && (
        <picture>
          {/* WebP 格式（如果支持） */}
          {webpSrc && (
            <source
              srcSet={generateSrcSet(webpSrc)}
              type="image/webp"
              sizes={sizes}
            />
          )}
          
          {/* 原始格式 */}
          <img
            src={src}
            srcSet={generateSrcSet(src)}
            sizes={sizes}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
          />
        </picture>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <svg
            className="w-12 h-12 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm">图片加载失败</span>
        </div>
      )}
    </div>
  );
}

/**
 * 带模糊占位符的图片组件
 */
export function BlurImage({
  src,
  blurDataURL,
  ...props
}: OptimizedImageProps & { blurDataURL?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative">
      {/* 模糊占位符 */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* 实际图片 */}
      <OptimizedImage
        {...props}
        src={src}
        onLoad={() => {
          setIsLoaded(true);
          props.onLoad?.();
        }}
      />
    </div>
  );
}

/**
 * 背景图片组件
 */
export function BackgroundImage({
  src,
  children,
  className,
  overlay = false,
  overlayOpacity = 0.5,
}: {
  src: string;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}) {
  return (
    <div className={cn('relative', className)}>
      <OptimizedImage
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        containerClassName="absolute inset-0"
      />
      
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;
