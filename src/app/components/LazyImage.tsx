import { useState, useEffect, useRef } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { imageStorage } from '../utils/storage';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  placeholder?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt = '',
  className = '',
  placeholder,
  threshold = 0.1,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // 当 src 变化时，重置加载状态
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className="relative w-full h-full">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
          加载失败
        </div>
      )}

      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}

/**
 * 带模糊效果的懒加载图片
 */
interface LazyImageWithBlurProps extends LazyImageProps {
  blurDataURL?: string;
}

export function LazyImageWithBlur({
  src,
  alt = '',
  className = '',
  blurDataURL,
  threshold = 0.1,
  onLoad,
  onError,
}: LazyImageWithBlurProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className="relative w-full h-full overflow-hidden">
      {/* 模糊占位图 */}
      {blurDataURL && !isLoaded && !hasError && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
        />
      )}

      {/* 加载指示器 */}
      {!isLoaded && !hasError && !blurDataURL && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
          加载失败
        </div>
      )}

      {/* 实际图片 */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

/**
 * 渐进式加载图片（先加载低质量，再加载高质量）
 */
interface ProgressiveImageProps {
  lowQualitySrc: string;
  highQualitySrc: string;
  alt?: string;
  className?: string;
  threshold?: number;
}

export function ProgressiveImage({
  lowQualitySrc,
  highQualitySrc,
  alt = '',
  className = '',
  threshold = 0.1,
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  useEffect(() => {
    if (!isInView) return;

    // 预加载高质量图片
    const img = new Image();
    img.src = highQualitySrc;
    img.onload = () => {
      setCurrentSrc(highQualitySrc);
      setIsHighQualityLoaded(true);
    };
  }, [isInView, highQualitySrc]);

  return (
    <div ref={imgRef} className="relative w-full h-full">
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${!isHighQualityLoaded ? 'blur-sm' : ''} transition-all duration-500`}
      />
      {!isHighQualityLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin drop-shadow-lg" />
        </div>
      )}
    </div>
  );
}

/**
 * 专门用于加载存储在 IndexedDB 中的 blob 图片的组件
 */
export function BlobImage({
  blobId,
  alt = '',
  className = '',
  placeholder,
  threshold = 0.1,
  immediate = false,
  onLoad,
  onError,
}: BlobImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function resolveBlob() {
      if (!blobId) {
        setIsResolving(false);
        return;
      }

      if (!blobId.startsWith('blob:')) {
        setResolvedSrc(blobId);
        setIsResolving(false);
        return;
      }

      setIsResolving(true);
      try {
        const data = await imageStorage.get(blobId);
        if (isMounted) {
          setResolvedSrc(data);
        }
      } catch (err) {
        console.error('Failed to resolve blob image:', err);
      } finally {
        if (isMounted) {
          setIsResolving(false);
        }
      }
    }

    resolveBlob();

    return () => {
      isMounted = false;
    };
  }, [blobId]);

  if (isResolving) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!resolvedSrc) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 text-xs gap-1 ${className}`}>
        <ImageOff className="w-5 h-5" />
        {placeholder || '无图片'}
      </div>
    );
  }

  return (
    <LazyImage
      src={resolvedSrc}
      alt={alt}
      className={className}
      threshold={immediate ? 0 : threshold}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

// 定义 BlobImageProps
interface BlobImageProps extends Omit<LazyImageProps, 'src'> {
  blobId: string | undefined;
  immediate?: boolean;
}
