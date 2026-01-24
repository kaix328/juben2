
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * 导出 DOM 元素为 PDF
 * @param element 目标元素
 * @param fileName 导出文件名
 */
export async function exportToPdf(element: HTMLElement, fileName: string = 'report.pdf') {
    if (!element) return false;

    try {
        // 1. 生成图片 (使用 html-to-image，支持 oklch 等现代 CSS)
        const dataUrl = await toPng(element, {
            quality: 0.95,
            backgroundColor: '#ffffff', // 强制白底
            // 过滤不需要的元素（如按钮等，如果有特定类名）
            filter: (node) => {
                return (node.tagName !== 'BUTTON');
            }
        });

        // 2. 计算 PDF 尺寸 (A4)
        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const contentWidth = img.width;
        const contentHeight = img.height;

        // A4 尺寸 (mm)
        const pdfPageWidth = 210;
        const pdfPageHeight = 297;

        // 内容在 PDF 页面的宽度 (A4 - 左右边距)
        const imgWidth = pdfPageWidth;
        const imgHeight = (pdfPageWidth / contentWidth) * contentHeight;

        const pdf = new jsPDF('p', 'mm', 'a4');
        let position = 0;

        // 3. 处理分页
        if (imgHeight > pdfPageHeight) {
            let heightLeft = imgHeight;

            pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfPageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight; // 下一页的起始位置
                pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfPageHeight;
            }
        } else {
            // 单页
            pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
        }

        // 4. 保存
        pdf.save(fileName);
        return true;
    } catch (error) {
        console.error('导出 PDF 失败:', error);
        return false;
    }
}
