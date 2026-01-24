/**
 * 图片上传组件
 */
import React, { useRef, useState } from 'react';
import { useImageUpload, UploadOptions } from '../hooks/useImageUpload';
import { formatFileSize } from '../utils/imageCompression';
import { cn } from '../utils/classnames';

export interface ImageUploadProps {
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  options?: UploadOptions;
  onUpload?: (images: any[]) => void;
  className?: string;
}

/**
 * 图片上传组件
 */
export function ImageUpload({
  multiple = true,
  accept = 'image/*',
  maxFiles = 10,
  options,
  onUpload,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, progress, error, images, uploadImages, removeImage, resetError } =
    useImageUpload(options);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 检查文件数量限制
    if (images.length + files.length > maxFiles) {
      alert(`最多只能上传 ${maxFiles} 张图片`);
      return;
    }

    try {
      const uploadedImages = await uploadImages(files);
      onUpload?.(uploadedImages);
    } catch (error) {
      console.error('上传失败:', error);
    }

    // 重置 input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // 检查文件数量限制
    if (images.length + files.length > maxFiles) {
      alert(`最多只能上传 ${maxFiles} 张图片`);
      return;
    }

    try {
      const uploadedImages = await uploadImages(files);
      onUpload?.(uploadedImages);
    } catch (error) {
      console.error('上传失败:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 上传区域 */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          uploading
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50',
          'cursor-pointer'
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">上传中... {progress.toFixed(0)}%</p>
            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="w-12 h-12 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">
              点击或拖拽图片到此处上传
            </p>
            <p className="text-xs text-gray-500">
              支持 JPG、PNG、GIF、WebP 格式，最多 {maxFiles} 张
            </p>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={resetError}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={image.thumbnail || image.url}
                alt={`上传图片 ${index + 1}`}
                className="w-full h-40 object-cover"
              />

              {/* 删除按钮 */}
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* 图片信息 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white">
                  {image.width} × {image.height}
                </p>
                <p className="text-xs text-white">
                  {formatFileSize(image.size)}
                  {image.compressionRatio > 0 && (
                    <span className="text-green-300 ml-1">
                      (-{image.compressionRatio.toFixed(0)}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
