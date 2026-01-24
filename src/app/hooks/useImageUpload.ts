/**
 * 图片上传和压缩 Hook
 */
import { useState, useCallback } from 'react';
import {
  compressImage,
  generateThumbnail,
  getImageDimensions,
  convertToWebP,
} from '../utils/imageCompression';

export interface UploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSize?: number; // KB
  convertToWebP?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
  onProgress?: (progress: number) => void;
}

export interface UploadedImage {
  file: File;
  url: string;
  thumbnail?: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  images: UploadedImage[];
}

/**
 * 使用图片上传 Hook
 */
export function useImageUpload(options: UploadOptions = {}) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    images: [],
  });

  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSize = 1024, // 1MB
    convertToWebP: shouldConvertToWebP = true,
    generateThumbnail: shouldGenerateThumbnail = true,
    thumbnailSize = 200,
    onProgress,
  } = options;

  /**
   * 上传图片
   */
  const uploadImages = useCallback(
    async (files: File[] | FileList) => {
      setState((prev) => ({
        ...prev,
        uploading: true,
        progress: 0,
        error: null,
      }));

      try {
        const fileArray = Array.from(files);
        const uploadedImages: UploadedImage[] = [];

        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const progress = ((i + 1) / fileArray.length) * 100;

          setState((prev) => ({ ...prev, progress }));
          onProgress?.(progress);

          // 验证文件类型
          if (!file.type.startsWith('image/')) {
            throw new Error(`文件 ${file.name} 不是图片格式`);
          }

          // 获取原始尺寸
          const originalDimensions = await getImageDimensions(file);
          const originalSize = file.size;

          // 压缩图片
          let compressedBlob = await compressImage(file, {
            maxWidth,
            maxHeight,
            quality,
            maxSize: maxSize * 1024, // 转换为字节
          });

          // 转换为 WebP（如果需要）
          if (shouldConvertToWebP && !file.type.includes('svg')) {
            try {
              compressedBlob = await convertToWebP(compressedBlob, quality);
            } catch (error) {
              console.warn('WebP 转换失败，使用原格式:', error);
            }
          }

          // 创建新文件
          const compressedFile = new File(
            [compressedBlob],
            file.name.replace(/\.[^.]+$/, shouldConvertToWebP ? '.webp' : '.jpg'),
            { type: shouldConvertToWebP ? 'image/webp' : 'image/jpeg' }
          );

          // 生成预览 URL
          const url = URL.createObjectURL(compressedFile);

          // 生成缩略图（如果需要）
          let thumbnail: string | undefined;
          if (shouldGenerateThumbnail) {
            thumbnail = await generateThumbnail(compressedFile, thumbnailSize);
          }

          // 获取压缩后的尺寸
          const dimensions = await getImageDimensions(compressedFile);

          uploadedImages.push({
            file: compressedFile,
            url,
            thumbnail,
            width: dimensions.width,
            height: dimensions.height,
            size: compressedFile.size,
            originalSize,
            compressionRatio: ((originalSize - compressedFile.size) / originalSize) * 100,
          });
        }

        setState((prev) => ({
          ...prev,
          uploading: false,
          progress: 100,
          images: [...prev.images, ...uploadedImages],
        }));

        return uploadedImages;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '上传失败';
        setState((prev) => ({
          ...prev,
          uploading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [
      maxWidth,
      maxHeight,
      quality,
      maxSize,
      shouldConvertToWebP,
      shouldGenerateThumbnail,
      thumbnailSize,
      onProgress,
    ]
  );

  /**
   * 移除图片
   */
  const removeImage = useCallback((index: number) => {
    setState((prev) => {
      const image = prev.images[index];
      if (image) {
        URL.revokeObjectURL(image.url);
        if (image.thumbnail) {
          URL.revokeObjectURL(image.thumbnail);
        }
      }

      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      };
    });
  }, []);

  /**
   * 清空所有图片
   */
  const clearImages = useCallback(() => {
    setState((prev) => {
      prev.images.forEach((image) => {
        URL.revokeObjectURL(image.url);
        if (image.thumbnail) {
          URL.revokeObjectURL(image.thumbnail);
        }
      });

      return {
        ...prev,
        images: [],
        error: null,
      };
    });
  }, []);

  /**
   * 重置错误
   */
  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    uploadImages,
    removeImage,
    clearImages,
    resetError,
  };
}

/**
 * 批量上传 Hook
 */
export function useBatchImageUpload(options: UploadOptions = {}) {
  const [batches, setBatches] = useState<UploadedImage[][]>([]);
  const upload = useImageUpload(options);

  const uploadBatch = useCallback(
    async (files: File[] | FileList) => {
      const images = await upload.uploadImages(files);
      setBatches((prev) => [...prev, images]);
      return images;
    },
    [upload]
  );

  const clearBatches = useCallback(() => {
    batches.forEach((batch) => {
      batch.forEach((image) => {
        URL.revokeObjectURL(image.url);
        if (image.thumbnail) {
          URL.revokeObjectURL(image.thumbnail);
        }
      });
    });
    setBatches([]);
  }, [batches]);

  return {
    ...upload,
    batches,
    uploadBatch,
    clearBatches,
  };
}

export default useImageUpload;
