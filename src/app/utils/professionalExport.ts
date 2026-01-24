/**
 * 专业导出格式支持
 * 支持 FCPXML (Final Cut Pro)、EDL、PSD 分层等专业格式
 */

import type { StoryboardPanel } from '../types';

// ============ 类型定义 ============

export type ExportFormat = 'fcpxml' | 'edl' | 'psd_layers' | 'premiere_xml' | 'davinci_xml';

export interface ExportConfig {
  format: ExportFormat;
  projectName: string;
  frameRate: number;
  resolution: { width: number; height: number };
  includeAudio?: boolean;
  includeMarkers?: boolean;
  colorSpace?: string;
}

export interface TimelineClip {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  duration: number;
  sourceFile?: string;
  effects?: ClipEffect[];
}

export interface ClipEffect {
  type: string;
  parameters: Record<string, any>;
}

// ============ FCPXML 导出器 (Final Cut Pro) ============

export class FCPXMLExporter {
  private config: ExportConfig;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  /**
   * 生成 FCPXML
   */
  export(panels: StoryboardPanel[]): string {
    const { projectName, frameRate, resolution } = this.config;
    const totalDuration = panels.reduce((sum, p) => sum + (p.duration || 3), 0);
    const totalFrames = Math.round(totalDuration * frameRate);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="FFVideoFormat${resolution.height}p${frameRate}" 
            frameDuration="${this.frameDuration(frameRate)}s" 
            width="${resolution.width}" height="${resolution.height}"/>
`;

    // 添加媒体资源
    panels.forEach((panel, index) => {
      if (panel.imageUrl) {
        xml += `    <asset id="asset${index}" name="Panel_${panel.panelNumber}" 
                src="${panel.imageUrl}" start="0s" duration="${panel.duration || 3}s" hasVideo="1"/>
`;
      }
    });

    xml += `  </resources>
  <library>
    <event name="${projectName}">
      <project name="${projectName}_Timeline">
        <sequence format="r1" duration="${totalFrames}/${frameRate}s" tcStart="0s" tcFormat="NDF">
          <spine>
`;

    // 添加片段
    let currentOffset = 0;
    panels.forEach((panel, index) => {
      const duration = panel.duration || 3;
      const durationFrames = Math.round(duration * frameRate);

      if (panel.imageUrl) {
        xml += `            <asset-clip name="Panel_${panel.panelNumber}" 
                          ref="asset${index}" 
                          offset="${currentOffset}/${frameRate}s" 
                          duration="${durationFrames}/${frameRate}s" 
                          start="0s">
`;
        // 添加标记
        if (this.config.includeMarkers && panel.description) {
          xml += `              <marker start="0s" duration="1/${frameRate}s" value="${this.escapeXml(panel.description.slice(0, 50))}"/>
`;
        }
        xml += `            </asset-clip>
`;
      } else {
        // 占位符（生成器）
        xml += `            <gap name="Panel_${panel.panelNumber}" 
                     offset="${currentOffset}/${frameRate}s" 
                     duration="${durationFrames}/${frameRate}s">
              <note>${this.escapeXml(panel.description || '')}</note>
            </gap>
`;
      }

      currentOffset += durationFrames;
    });

    xml += `          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;

    return xml;
  }

  private frameDuration(fps: number): string {
    // 常见帧率的帧时长
    const durations: Record<number, string> = {
      24: '1001/24000',
      25: '1/25',
      30: '1001/30000',
      60: '1001/60000'
    };
    return durations[fps] || `1/${fps}`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ============ EDL 导出器 (Edit Decision List) ============

export class EDLExporter {
  private config: ExportConfig;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  /**
   * 生成 EDL (CMX 3600 格式)
   */
  export(panels: StoryboardPanel[]): string {
    const { projectName, frameRate } = this.config;
    const lines: string[] = [];

    // EDL 头部
    lines.push(`TITLE: ${projectName}`);
    lines.push(`FCM: NON-DROP FRAME`);
    lines.push('');

    let currentTimecode = this.framesToTimecode(0, frameRate);
    let editNumber = 1;

    panels.forEach((panel) => {
      const duration = panel.duration || 3;
      const durationFrames = Math.round(duration * frameRate);
      const endTimecode = this.framesToTimecode(
        this.timecodeToFrames(currentTimecode, frameRate) + durationFrames,
        frameRate
      );

      // 标准 EDL 行格式
      // 编号 | 卷号 | 轨道 | 编辑类型 | 源入点 | 源出点 | 录制入点 | 录制出点
      const editNum = editNumber.toString().padStart(3, '0');
      const reelName = `Panel_${panel.panelNumber}`.padEnd(8).slice(0, 8);
      
      lines.push(`${editNum}  ${reelName} V     C        00:00:00:00 ${this.framesToTimecode(durationFrames, frameRate)} ${currentTimecode} ${endTimecode}`);
      
      // 添加注释（分镜描述）
      if (panel.description) {
        lines.push(`* FROM CLIP NAME: Panel_${panel.panelNumber}`);
        lines.push(`* COMMENT: ${panel.description.slice(0, 60)}`);
      }

      // 添加场景信息
      if (panel.sceneId) {
        lines.push(`* SCENE: ${panel.sceneId}`);
      }

      lines.push('');

      currentTimecode = endTimecode;
      editNumber++;
    });

    return lines.join('\n');
  }

  private framesToTimecode(frames: number, fps: number): string {
    const totalSeconds = frames / fps;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const remainingFrames = Math.round(frames % fps);

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
      remainingFrames.toString().padStart(2, '0')
    ].join(':');
  }

  private timecodeToFrames(timecode: string, fps: number): number {
    const parts = timecode.split(':').map(Number);
    const [hours, minutes, seconds, frames] = parts;
    return (hours * 3600 + minutes * 60 + seconds) * fps + frames;
  }
}

// ============ Premiere Pro XML 导出器 ============

export class PremiereXMLExporter {
  private config: ExportConfig;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  /**
   * 生成 Premiere Pro XML
   */
  export(panels: StoryboardPanel[]): string {
    const { projectName, frameRate, resolution } = this.config;
    const totalDuration = panels.reduce((sum, p) => sum + (p.duration || 3), 0);
    const totalFrames = Math.round(totalDuration * frameRate);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <project>
    <name>${projectName}</name>
    <children>
      <sequence>
        <name>${projectName}_Sequence</name>
        <duration>${totalFrames}</duration>
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
                <pixelaspectratio>square</pixelaspectratio>
                <rate>
                  <timebase>${frameRate}</timebase>
                </rate>
              </samplecharacteristics>
            </format>
            <track>
`;

    let currentFrame = 0;
    panels.forEach((panel, index) => {
      const duration = panel.duration || 3;
      const durationFrames = Math.round(duration * frameRate);

      xml += `              <clipitem id="clipitem-${index + 1}">
                <name>Panel_${panel.panelNumber}</name>
                <duration>${durationFrames}</duration>
                <rate>
                  <timebase>${frameRate}</timebase>
                </rate>
                <start>${currentFrame}</start>
                <end>${currentFrame + durationFrames}</end>
                <in>0</in>
                <out>${durationFrames}</out>
`;

      if (panel.imageUrl) {
        xml += `                <file id="file-${index + 1}">
                  <name>Panel_${panel.panelNumber}</name>
                  <pathurl>${panel.imageUrl}</pathurl>
                  <rate>
                    <timebase>${frameRate}</timebase>
                  </rate>
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
`;
      }

      // 添加标记
      if (this.config.includeMarkers && panel.description) {
        xml += `                <marker>
                  <name>${this.escapeXml(panel.description.slice(0, 30))}</name>
                  <in>0</in>
                  <out>-1</out>
                </marker>
`;
      }

      xml += `              </clipitem>
`;

      currentFrame += durationFrames;
    });

    xml += `            </track>
          </video>
        </media>
      </sequence>
    </children>
  </project>
</xmeml>`;

    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ============ DaVinci Resolve XML 导出器 ============

export class DaVinciXMLExporter {
  private config: ExportConfig;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  /**
   * 生成 DaVinci Resolve 兼容的 XML
   */
  export(panels: StoryboardPanel[]): string {
    const { projectName, frameRate, resolution } = this.config;
    const totalDuration = panels.reduce((sum, p) => sum + (p.duration || 3), 0);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<DaVinciResolveProject version="1.0">
  <Project>
    <Name>${projectName}</Name>
    <FrameRate>${frameRate}</FrameRate>
    <Width>${resolution.width}</Width>
    <Height>${resolution.height}</Height>
    <Timeline>
      <Name>${projectName}_Timeline</Name>
      <Duration>${totalDuration}</Duration>
      <VideoTracks>
        <Track index="1">
`;

    let currentTime = 0;
    panels.forEach((panel, index) => {
      const duration = panel.duration || 3;

      xml += `          <Clip>
            <Name>Panel_${panel.panelNumber}</Name>
            <StartTime>${currentTime}</StartTime>
            <Duration>${duration}</Duration>
            <SourcePath>${panel.imageUrl || ''}</SourcePath>
            <Description>${this.escapeXml(panel.description || '')}</Description>
            <SceneId>${panel.sceneId || ''}</SceneId>
            <ShotType>${panel.shotSize || panel.shot || ''}</ShotType>
            <CameraAngle>${panel.cameraAngle || panel.angle || ''}</CameraAngle>
          </Clip>
`;

      currentTime += duration;
    });

    xml += `        </Track>
      </VideoTracks>
`;

    // 添加标记轨道
    if (this.config.includeMarkers) {
      xml += `      <Markers>
`;
      let markerTime = 0;
      panels.forEach((panel) => {
        if (panel.description) {
          xml += `        <Marker>
          <Time>${markerTime}</Time>
          <Name>Panel_${panel.panelNumber}</Name>
          <Note>${this.escapeXml(panel.description.slice(0, 100))}</Note>
          <Color>Blue</Color>
        </Marker>
`;
        }
        markerTime += panel.duration || 3;
      });
      xml += `      </Markers>
`;
    }

    xml += `    </Timeline>
  </Project>
</DaVinciResolveProject>`;

    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ============ PSD 分层导出信息生成器 ============

export class PSDLayerExporter {
  private config: ExportConfig;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  /**
   * 生成 PSD 分层导出的 JSON 配置
   * 实际 PSD 生成需要后端支持或使用 psd.js 等库
   */
  generateLayerConfig(panels: StoryboardPanel[]): object {
    const { projectName, resolution } = this.config;

    return {
      document: {
        name: projectName,
        width: resolution.width,
        height: resolution.height,
        resolution: 72,
        colorMode: 'RGB',
        bitDepth: 8
      },
      layers: panels.map((panel, index) => ({
        name: `Panel_${panel.panelNumber}`,
        type: 'image',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        position: { x: 0, y: 0 },
        source: panel.imageUrl,
        metadata: {
          panelNumber: panel.panelNumber,
          sceneId: panel.sceneId,
          description: panel.description,
          duration: panel.duration,
          shotType: panel.shotSize || panel.shot,
          cameraAngle: panel.cameraAngle || panel.angle
        }
      })),
      groups: this.groupByScene(panels)
    };
  }

  private groupByScene(panels: StoryboardPanel[]): object[] {
    const scenes = new Map<string, StoryboardPanel[]>();
    
    panels.forEach(panel => {
      const sceneId = panel.sceneId || 'default';
      if (!scenes.has(sceneId)) {
        scenes.set(sceneId, []);
      }
      scenes.get(sceneId)!.push(panel);
    });

    return Array.from(scenes.entries()).map(([sceneId, scenePanels]) => ({
      name: `Scene_${sceneId}`,
      layers: scenePanels.map(p => `Panel_${p.panelNumber}`)
    }));
  }
}

// ============ 统一导出接口 ============

export class ProfessionalExporter {
  /**
   * 导出为指定格式
   */
  static export(
    panels: StoryboardPanel[],
    config: ExportConfig
  ): string | object {
    switch (config.format) {
      case 'fcpxml':
        return new FCPXMLExporter(config).export(panels);
      case 'edl':
        return new EDLExporter(config).export(panels);
      case 'premiere_xml':
        return new PremiereXMLExporter(config).export(panels);
      case 'davinci_xml':
        return new DaVinciXMLExporter(config).export(panels);
      case 'psd_layers':
        return new PSDLayerExporter(config).generateLayerConfig(panels);
      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }
  }

  /**
   * 下载导出文件
   */
  static download(
    panels: StoryboardPanel[],
    config: ExportConfig
  ): void {
    const content = this.export(panels, config);
    const formatInfo = EXPORT_FORMAT_INFO[config.format];
    
    let blob: Blob;
    if (typeof content === 'string') {
      blob = new Blob([content], { type: formatInfo.mime });
    } else {
      blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.projectName}${formatInfo.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ============ 格式信息 ============

export const EXPORT_FORMAT_INFO: Record<ExportFormat, {
  name: string;
  ext: string;
  mime: string;
  description: string;
  software: string[];
}> = {
  fcpxml: {
    name: 'Final Cut Pro XML',
    ext: '.fcpxml',
    mime: 'application/xml',
    description: 'Final Cut Pro X 原生交换格式',
    software: ['Final Cut Pro X', 'DaVinci Resolve']
  },
  edl: {
    name: 'Edit Decision List',
    ext: '.edl',
    mime: 'text/plain',
    description: '通用剪辑决策列表，兼容性最广',
    software: ['Premiere Pro', 'Avid', 'DaVinci Resolve', 'Final Cut Pro']
  },
  premiere_xml: {
    name: 'Premiere Pro XML',
    ext: '.xml',
    mime: 'application/xml',
    description: 'Adobe Premiere Pro 交换格式',
    software: ['Premiere Pro', 'After Effects']
  },
  davinci_xml: {
    name: 'DaVinci Resolve XML',
    ext: '.xml',
    mime: 'application/xml',
    description: 'DaVinci Resolve 项目格式',
    software: ['DaVinci Resolve']
  },
  psd_layers: {
    name: 'PSD 分层配置',
    ext: '.json',
    mime: 'application/json',
    description: 'Photoshop 分层导出配置',
    software: ['Photoshop', 'GIMP', 'Affinity Photo']
  }
};

// ============ 预设配置 ============

export const EXPORT_PRESETS: Record<string, Partial<ExportConfig>> = {
  'hd_24': {
    frameRate: 24,
    resolution: { width: 1920, height: 1080 }
  },
  'hd_25': {
    frameRate: 25,
    resolution: { width: 1920, height: 1080 }
  },
  'hd_30': {
    frameRate: 30,
    resolution: { width: 1920, height: 1080 }
  },
  '4k_24': {
    frameRate: 24,
    resolution: { width: 3840, height: 2160 }
  },
  '4k_30': {
    frameRate: 30,
    resolution: { width: 3840, height: 2160 }
  },
  'cinema_24': {
    frameRate: 24,
    resolution: { width: 4096, height: 2160 }
  }
};
