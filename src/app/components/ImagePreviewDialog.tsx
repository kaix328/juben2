import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { imageStorage } from '../utils/storage';
import { BlobImage } from './LazyImage';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ImagePreviewDialogProps {
    src: string;
    alt?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImagePreviewDialog({ src, alt = '图片预览', open, onOpenChange }: ImagePreviewDialogProps) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [resolvedSrc, setResolvedSrc] = useState(src);

    useEffect(() => {
        if (src.startsWith('blob:')) {
            imageStorage.get(src).then(data => {
                if (data) setResolvedSrc(data);
            });
        } else {
            setResolvedSrc(src);
        }
    }, [src]);

    const handleDownload = async () => {
        try {
            const downloadUrl = resolvedSrc;
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('图片已下载');
        } catch (error) {
            console.error('下载失败:', error);
            toast.error('下载失败');
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 300));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 25));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleReset = () => {
        setZoom(100);
        setRotation(0);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/95">
                {/* 工具栏 */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            className="text-white hover:bg-white/20"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-white text-sm font-medium min-w-[60px] text-center">
                            {zoom}%
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            className="text-white hover:bg-white/20"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-6 bg-white/20 mx-2" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRotate}
                            className="text-white hover:bg-white/20"
                        >
                            <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-white hover:bg-white/20 text-xs"
                        >
                            重置
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="text-white hover:bg-white/20"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            下载
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-white hover:bg-white/20"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="w-full h-[90vh] flex items-center justify-center overflow-auto p-16">
                    <img
                        src={resolvedSrc}
                        alt={alt}
                        className="max-w-full max-h-full object-contain transition-all duration-300 cursor-move"
                        style={{
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        }}
                        draggable={false}
                    />
                </div>

                {/* 底部信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm text-center truncate">{alt}</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * 可点击的图片预览组件
 */
interface ClickableImageProps {
    src: string;
    alt?: string;
    className?: string;
    containerClassName?: string;
    immediate?: boolean;
}

export function ClickableImage({ src, alt, className, containerClassName, immediate }: ClickableImageProps) {
    const [open, setOpen] = useState(false);

    if (!src) return null;

    return (
        <>
            <div
                className={`relative group cursor-pointer ${containerClassName || ''}`}
                onClick={() => setOpen(true)}
            >
                <BlobImage
                    blobId={src}
                    alt={alt}
                    className={`transition-all duration-200 ${className || ''}`}
                    immediate={immediate}
                />
                {/* 悬停遮罩 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                        <div className="bg-white/90 rounded-full p-2">
                            <ZoomIn className="w-5 h-5 text-gray-800" />
                        </div>
                    </div>
                </div>
            </div>
            <ImagePreviewDialog
                src={src}
                alt={alt}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}
