/**
 * 图片压缩工具函数
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSize?: number; // 字节
  mimeType?: string;
}

/**
 * 压缩图片
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSize,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = async () => {
        try {
          let blob = await resizeImage(img, maxWidth, maxHeight, quality, mimeType);

          // 如果指定了最大大小，继续压缩直到满足要求
          if (maxSize && blob.size > maxSize) {
            blob = await compressToSize(img, maxWidth, maxHeight, maxSize, mimeType);
          }

          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 调整图片大小
 */
async function resizeImage(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  mimeType: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法获取 canvas context');
  }

  // 计算缩放比例
  let { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);

  width *= ratio;
  height *= ratio;

  canvas.width = width;
  canvas.height = height;

  // 使用高质量缩放
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 绘制图片
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('图片压缩失败'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * 压缩到指定大小
 */
async function compressToSize(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  maxSize: number,
  mimeType: string
): Promise<Blob> {
  let quality = 0.9;
  let blob: Blob;

  // 二分查找最佳质量
  let minQuality = 0.1;
  let maxQuality = 0.9;

  while (maxQuality - minQuality > 0.01) {
    quality = (minQuality + maxQuality) / 2;
    blob = await resizeImage(img, maxWidth, maxHeight, quality, mimeType);

    if (blob.size > maxSize) {
      maxQuality = quality;
    } else {
      minQuality = quality;
    }
  }

  blob = await resizeImage(img, maxWidth, maxHeight, minQuality, mimeType);
  return blob;
}

/**
 * 转换为 WebP 格式
 */
export async function convertToWebP(
  file: File | Blob,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('无法获取 canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('WebP 转换失败'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 生成缩略图
 */
export async function generateThumbnail(
  file: File | Blob,
  size = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('无法获取 canvas context'));
          return;
        }

        canvas.width = size;
        canvas.height = size;

        // 计算裁剪区域（居中裁剪）
        const scale = Math.max(size / img.width, size / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (size - scaledWidth) / 2;
        const y = (size - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 获取图片尺寸
 */
export async function getImageDimensions(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 批量压缩图片
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<Blob[]> {
  const results: Blob[] = [];

  for (let i = 0; i < files.length; i++) {
    const blob = await compressImage(files[i], options);
    results.push(blob);

    const progress = ((i + 1) / files.length) * 100;
    onProgress?.(progress);
  }

  return results;
}

/**
 * 验证图片文件
 */
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number; // MB
    allowedTypes?: string[];
    minWidth?: number;
    minHeight?: number;
  } = {}
): Promise<boolean> {
  const {
    maxSize = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    minWidth = 0,
    minHeight = 0,
  } = options;

  return new Promise((resolve, reject) => {
    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      reject(new Error(`不支持的文件类型: ${file.type}`));
      return;
    }

    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      reject(new Error(`文件大小超过限制: ${maxSize}MB`));
      return;
    }

    // 检查图片尺寸
    if (minWidth > 0 || minHeight > 0) {
      getImageDimensions(file)
        .then(({ width, height }) => {
          if (width < minWidth || height < minHeight) {
            reject(
              new Error(`图片尺寸过小: 最小 ${minWidth}x${minHeight}`)
            );
          } else {
            resolve(true);
          }
        })
        .catch(reject);
    } else {
      resolve(true);
    }
  });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default {
  compressImage,
  convertToWebP,
  generateThumbnail,
  getImageDimensions,
  compressImages,
  validateImageFile,
  formatFileSize,
};
