import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageOrientation, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';
import type { Script, ScriptScene } from '../../pages/ScriptEditor/types';

/**
 * 导出剧本为 Word (.docx) 格式
 * 遵循标准剧本格式规范 (Standard Screenplay Format)
 */
export async function exportScriptToWord(script: Script, title: string) {
    // 1. 创建文档对象
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.PORTRAIT,
                    },
                    margin: {
                        top: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.5), // 剧本左边距通常较大 (1.5英寸) 以便装订
                        right: convertInchesToTwip(1),
                    },
                },
            },
            children: [
                // 标题页
                new Paragraph({
                    text: title,
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: {
                        before: convertInchesToTwip(3), // 标题下沉
                        after: convertInchesToTwip(1),
                    },
                    run: {
                        font: "Courier New", // 剧本标准字体
                        bold: true,
                        size: 48, // 24pt
                    },
                }),

                new Paragraph({
                    text: `剧本模式: ${getModeLabel(script.mode)}`,
                    alignment: AlignmentType.CENTER,
                    run: {
                        font: "Courier New",
                        size: 24, // 12pt
                    },
                }),

                new Paragraph({
                    text: `导出日期: ${new Date().toLocaleDateString()}`,
                    alignment: AlignmentType.CENTER,
                    spacing: {
                        after: convertInchesToTwip(4), // 分页
                    },
                    run: {
                        font: "Courier New",
                        size: 24,
                    },
                    pageBreakBefore: false,
                }),

                // 正文开始（分页）
                new Paragraph({
                    text: "",
                    pageBreakBefore: true,
                }),

                ...script.scenes.flatMap(scene => formatSceneToDocx(scene))
            ],
        }],
        styles: {
            default: {
                document: {
                    run: {
                        font: "Courier New",
                        size: 24, // 12pt
                    },
                },
            },
        }
    });

    // 2. 生成 Blob 并下载
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title}_剧本.docx`);
}

/**
 * 将单个场景转换为文档段落数组
 */
function formatSceneToDocx(scene: ScriptScene): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // 1. 场景标题 (SCENE HEADING)
    // 格式: 1. INT. 地点 - 时间
    paragraphs.push(new Paragraph({
        children: [
            new TextRun({
                text: `${scene.sceneNumber}. ${scene.sceneType}. ${scene.location} - ${scene.timeOfDay}`,
                bold: true,
                allCaps: true,
            })
        ],
        spacing: {
            before: convertInchesToTwip(0.2), // 场景间空两行
            after: convertInchesToTwip(0.1),
        },
        keepNext: true, // 标题不孤立
    }));

    // 2. 动作描述 (ACTION)
    if (scene.action) {
        paragraphs.push(new Paragraph({
            text: scene.action,
            spacing: {
                after: convertInchesToTwip(0.1),
            },
            alignment: AlignmentType.LEFT,
        }));
    }

    // 3. 对白 (DIALOGUE)
    scene.dialogues.forEach(dialogue => {
        // 角色名 (CHARACTER) - 居中 (实际上是左缩进)
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({
                    text: dialogue.character.toUpperCase(),
                    bold: true,
                })
            ],
            indent: {
                left: convertInchesToTwip(2.2), // 角色名缩进
            },
            spacing: {
                before: convertInchesToTwip(0.1),
            },
            keepNext: true,
        }));

        // 括号/情绪 (PARENTHETICAL) - 如果有的话 (目前数据结构里暂无 explicit field，假设在lines里处理)

        // 台词 (DIALOGUE) - 缩进
        paragraphs.push(new Paragraph({
            text: dialogue.lines,
            indent: {
                left: convertInchesToTwip(1.5), // 台词左缩进
                right: convertInchesToTwip(1.5), // 台词右缩进
            },
            spacing: {
                after: convertInchesToTwip(0.1),
            },
        }));
    });

    return paragraphs;
}

function getModeLabel(mode: string): string {
    const map: Record<string, string> = {
        movie: '电影剧本',
        tv_drama: '电视剧剧本',
        short_video: '短视频剧本',
        web_series: '网络剧剧本',
    };
    return map[mode] || '剧本';
}
