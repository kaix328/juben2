/**
 * 时间轴导出器
 * 支持导出为 DaVinci Resolve XML、Premiere Pro XML、FCPXML 格式
 */

import type { StoryboardPanel, Project } from '../types';

export type TimelineExportFormat = 'davinci' | 'premiere' | 'fcpxml' | 'edl';

interface TimelineExportOptions {
    format: TimelineExportFormat;
    projectName: string;
    frameRate: number;
    resolution: { width: number; height: number };
    panels: StoryboardPanel[];
}

/**
 * 导出时间轴为专业剪辑软件格式
 */
export function exportTimeline(options: TimelineExportOptions): string {
    switch (options.format) {
        case 'davinci':
            return exportDaVinciResolveXML(options);
        case 'premiere':
            return exportPremiereProXML(options);
        case 'fcpxml':
            return exportFCPXML(options);
        case 'edl':
            return exportEDL(options);
        default:
            throw new Error(`Unsupported format: ${options.format}`);
    }
}

/**
 * DaVinci Resolve XML 格式
 */
function exportDaVinciResolveXML(options: TimelineExportOptions): string {
    const { projectName, frameRate, resolution, panels } = options;

    let currentFrame = 0;
    const clipDefs: string[] = [];
    const clipRefs: string[] = [];

    panels.forEach((panel, index) => {
        const durationFrames = Math.round((panel.duration || 3) * frameRate);
        const clipId = `clip-${index + 1}`;
        const mediaPath = panel.generatedImage || `placeholder_${index + 1}.png`;

        // Clip 定义
        clipDefs.push(`
    <clip id="${clipId}" name="分镜${panel.panelNumber}">
      <duration>${durationFrames}</duration>
      <rate><timebase>${frameRate}</timebase></rate>
      <file id="file-${index + 1}">
        <name>分镜${panel.panelNumber}</name>
        <pathurl>file://${mediaPath}</pathurl>
      </file>
    </clip>`);

        // 时间轴引用
        clipRefs.push(`
      <clipitem id="clipitem-${index + 1}">
        <name>分镜${panel.panelNumber}</name>
        <duration>${durationFrames}</duration>
        <start>${currentFrame}</start>
        <end>${currentFrame + durationFrames}</end>
        <in>0</in>
        <out>${durationFrames}</out>
        <file id="file-${index + 1}"/>
      </clipitem>`);

        currentFrame += durationFrames;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <project>
    <name>${projectName}</name>
    <children>
      <sequence id="sequence-1">
        <name>${projectName} 时间轴</name>
        <duration>${currentFrame}</duration>
        <rate>
          <timebase>${frameRate}</timebase>
          <ntsc>FALSE</ntsc>
        </rate>
        <media>
          <video>
            <format>
              <samplecharacteristics>
                <width>${resolution.width}</width>
                <height>${resolution.height}</height>
              </samplecharacteristics>
            </format>
            <track>
              ${clipRefs.join('\n')}
            </track>
          </video>
        </media>
      </sequence>
      ${clipDefs.join('\n')}
    </children>
  </project>
</xmeml>`;
}

/**
 * Adobe Premiere Pro XML 格式
 */
function exportPremiereProXML(options: TimelineExportOptions): string {
    const { projectName, frameRate, resolution, panels } = options;

    let currentFrame = 0;
    const tracks: string[] = [];

    panels.forEach((panel, index) => {
        const durationFrames = Math.round((panel.duration || 3) * frameRate);
        const mediaPath = panel.generatedImage || `placeholder_${index + 1}.png`;

        tracks.push(`
        <trackitem>
          <clipitem id="clipitem-${index + 1}">
            <masterclipid>masterclip-${index + 1}</masterclipid>
            <name>分镜${panel.panelNumber} - ${panel.shot || '中景'}</name>
            <enabled>TRUE</enabled>
            <duration>${durationFrames}</duration>
            <rate><timebase>${frameRate}</timebase><ntsc>FALSE</ntsc></rate>
            <start>${currentFrame}</start>
            <end>${currentFrame + durationFrames}</end>
            <in>0</in>
            <out>${durationFrames}</out>
            <file id="file-${index + 1}">
              <name>分镜${panel.panelNumber}</name>
              <pathurl>${mediaPath}</pathurl>
              <rate><timebase>${frameRate}</timebase></rate>
              <duration>${durationFrames}</duration>
              <media>
                <video>
                  <samplecharacteristics>
                    <width>${resolution.width}</width>
                    <height>${resolution.height}</height>
                  </samplecharacteristics>
                </video>
              </media>
            </file>
            <!-- 备注：${panel.description?.substring(0, 50) || ''} -->
          </clipitem>
        </trackitem>`);

        currentFrame += durationFrames;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence>
    <name>${projectName}</name>
    <duration>${currentFrame}</duration>
    <rate><timebase>${frameRate}</timebase><ntsc>FALSE</ntsc></rate>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>${resolution.width}</width>
            <height>${resolution.height}</height>
            <pixelaspectratio>square</pixelaspectratio>
            <fielddominance>none</fielddominance>
          </samplecharacteristics>
        </format>
        <track>
          ${tracks.join('\n')}
        </track>
      </video>
    </media>
  </sequence>
</xmeml>`;
}

/**
 * Final Cut Pro X XML 格式
 */
function exportFCPXML(options: TimelineExportOptions): string {
    const { projectName, frameRate, resolution, panels } = options;

    let currentFrame = 0;
    const assets: string[] = [];
    const clips: string[] = [];

    panels.forEach((panel, index) => {
        const durationFrames = Math.round((panel.duration || 3) * frameRate);
        const durationTC = framesToTimecode(durationFrames, frameRate);
        const startTC = framesToTimecode(currentFrame, frameRate);
        const mediaPath = panel.generatedImage || `placeholder_${index + 1}.png`;
        const assetId = `r${index + 1}`;

        assets.push(`
    <asset id="${assetId}" name="分镜${panel.panelNumber}" src="${mediaPath}" start="0s" duration="${durationTC}" hasVideo="1"/>`);

        clips.push(`
      <asset-clip name="分镜${panel.panelNumber}" ref="${assetId}" offset="${startTC}" duration="${durationTC}" start="0s"/>`);

        currentFrame += durationFrames;
    });

    const totalDuration = framesToTimecode(currentFrame, frameRate);

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r0" name="FFVideoFormat${resolution.height}p${frameRate}" frameDuration="1/${frameRate}s" width="${resolution.width}" height="${resolution.height}"/>
    ${assets.join('\n')}
  </resources>
  <library>
    <event name="${projectName}">
      <project name="${projectName} 时间轴">
        <sequence format="r0" duration="${totalDuration}">
          <spine>
            ${clips.join('\n')}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}

/**
 * EDL (Edit Decision List) 格式
 */
function exportEDL(options: TimelineExportOptions): string {
    const { projectName, frameRate, panels } = options;

    let currentFrame = 0;
    const events: string[] = [];

    events.push(`TITLE: ${projectName}`);
    events.push(`FCM: NON-DROP FRAME`);
    events.push('');

    panels.forEach((panel, index) => {
        const durationFrames = Math.round((panel.duration || 3) * frameRate);
        const startTC = framesToTimecodeEDL(currentFrame, frameRate);
        const endTC = framesToTimecodeEDL(currentFrame + durationFrames, frameRate);
        const eventNum = String(index + 1).padStart(3, '0');

        events.push(`${eventNum}  AX       V     C        00:00:00:00 ${framesToTimecodeEDL(durationFrames, frameRate)} ${startTC} ${endTC}`);
        events.push(`* FROM CLIP NAME: 分镜${panel.panelNumber}`);
        events.push(`* COMMENT: ${panel.shot || '中景'} - ${panel.description?.substring(0, 30) || ''}`);
        events.push('');

        currentFrame += durationFrames;
    });

    return events.join('\n');
}

// 工具函数
function framesToTimecode(frames: number, fps: number): string {
    const totalSeconds = frames / fps;
    return `${totalSeconds.toFixed(3)}s`;
}

function framesToTimecodeEDL(frames: number, fps: number): string {
    const totalSeconds = Math.floor(frames / fps);
    const remainingFrames = frames % fps;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(remainingFrames).padStart(2, '0')}`;
}

/**
 * 下载时间轴文件
 */
export function downloadTimeline(options: TimelineExportOptions): void {
    const content = exportTimeline(options);
    const extensions: Record<TimelineExportFormat, string> = {
        davinci: 'xml',
        premiere: 'xml',
        fcpxml: 'fcpxml',
        edl: 'edl'
    };

    const blob = new Blob([content], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.projectName}_timeline.${extensions[options.format]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
