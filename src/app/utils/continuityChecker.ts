/**
 * 智能分镜连贯性检测系统
 * 提供专业级的分镜连贯性检查，包括轴线规则、30度规则、景别跳跃等
 */

import type { StoryboardPanel, ShotSize, CameraAngleType } from '../types';

// ============ 类型定义 ============

export type ContinuitySeverity = 'error' | 'warning' | 'info';

export interface ContinuityIssue {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: ContinuitySeverity;
  panelId: string;
  panelNumber: number;
  message: string;
  suggestion: string;
  relatedPanels?: string[];
}

export interface ContinuityRule {
  id: string;
  name: string;
  description: string;
  severity: ContinuitySeverity;
  enabled: boolean;
  check: (
    current: StoryboardPanel,
    prev?: StoryboardPanel,
    next?: StoryboardPanel,
    context?: ContinuityContext
  ) => ContinuityIssue | null;
}

export interface ContinuityContext {
  allPanels: StoryboardPanel[];
  currentIndex: number;
  sceneId?: string;
}

export interface ContinuityReport {
  totalPanels: number;
  checkedPanels: number;
  issues: ContinuityIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  score: number; // 0-100 连贯性评分
  timestamp: string;
}

// ============ 景别顺序定义 ============

const SHOT_SIZE_ORDER: ShotSize[] = [
  'ECU', 'CU', 'MCU', 'MS', 'MWS', 'WS', 'EWS'
];

const SHOT_SIZE_INDEX: Record<string, number> = {
  'ECU': 0, 'CU': 1, 'MCU': 2, 'MS': 3, 'MWS': 4, 'WS': 5, 'EWS': 6,
  'POV': 3, 'OTS': 2, 'TWO': 3, 'GROUP': 4, 'INSERT': 1, 'AERIAL': 6
};

// ============ 专业连贯性规则 ============

export const CONTINUITY_RULES: ContinuityRule[] = [
  // 1. 180度轴线规则
  {
    id: 'axis_180',
    name: '180度轴线规则',
    description: '对话场景中，摄影机应保持在假想轴线的同一侧，避免观众空间混乱',
    severity: 'error',
    enabled: true,
    check: (current, prev, next, context) => {
      // 检测对话场景
      if (!current.dialogue || !prev?.dialogue) return null;
      
      // 同一场景内的对话
      if (current.sceneId !== prev.sceneId) return null;
      
      // 检测角度突变（可能跨越轴线）
      const angleChanges: Record<string, string[]> = {
        'EYE_LEVEL': ['HIGH', 'LOW'],
        'HIGH': ['LOW'],
        'LOW': ['HIGH']
      };
      
      const prevAngle = prev.cameraAngle || 'EYE_LEVEL';
      const currAngle = current.cameraAngle || 'EYE_LEVEL';
      
      // 如果有轴线标注，跳过检测
      if (current.axisNote || prev.axisNote) return null;
      
      // 检测是否可能跨越轴线（OTS镜头切换时特别注意）
      if (prev.shotSize === 'OTS' && current.shotSize === 'OTS') {
        // 连续过肩镜头，需要标注轴线
        return {
          id: `axis_180_${current.id}`,
          ruleId: 'axis_180',
          ruleName: '180度轴线规则',
          severity: 'error',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: '连续过肩镜头需要注意轴线方向',
          suggestion: '请在分镜备注中标注轴线方向（如：轴线在角色A左侧），确保摄影机始终在轴线同一侧',
          relatedPanels: [prev.id]
        };
      }
      
      return null;
    }
  },

  // 2. 30度规则
  {
    id: 'rule_30_degree',
    name: '30度规则',
    description: '相邻镜头的摄影机角度变化应大于30度，否则会产生跳切感',
    severity: 'warning',
    enabled: true,
    check: (current, prev) => {
      if (!prev) return null;
      
      // 同一场景内检测
      if (current.sceneId !== prev.sceneId) return null;
      
      // 景别相同且角度相同
      const sameShot = current.shotSize === prev.shotSize || current.shot === prev.shot;
      const sameAngle = current.cameraAngle === prev.cameraAngle || current.angle === prev.angle;
      
      // 如果有运镜，可能是有意为之
      if (current.cameraMovement || current.movementType) return null;
      
      if (sameShot && sameAngle) {
        return {
          id: `30_degree_${current.id}`,
          ruleId: 'rule_30_degree',
          ruleName: '30度规则',
          severity: 'warning',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: '与上一镜头景别和角度相同，可能产生跳切',
          suggestion: '建议调整摄影机角度（变化>30度）或改变景别，避免跳切感',
          relatedPanels: [prev.id]
        };
      }
      
      return null;
    }
  },

  // 3. 景别跳跃规则
  {
    id: 'shot_jump',
    name: '景别跳跃检测',
    description: '相邻镜头景别跳跃不宜超过2级，否则视觉冲击过大',
    severity: 'warning',
    enabled: true,
    check: (current, prev) => {
      if (!prev) return null;
      
      // 同一场景内检测
      if (current.sceneId !== prev.sceneId) return null;
      
      const currShot = current.shotSize || current.shot;
      const prevShot = prev.shotSize || prev.shot;
      
      const currIdx = SHOT_SIZE_INDEX[currShot] ?? 3;
      const prevIdx = SHOT_SIZE_INDEX[prevShot] ?? 3;
      
      const jump = Math.abs(currIdx - prevIdx);
      
      if (jump > 2) {
        const direction = currIdx > prevIdx ? '拉远' : '推近';
        return {
          id: `shot_jump_${current.id}`,
          ruleId: 'shot_jump',
          ruleName: '景别跳跃检测',
          severity: 'warning',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: `景别跳跃过大（${prevShot} → ${currShot}，跨越${jump}级）`,
          suggestion: `建议在中间添加过渡镜头，或使用${direction}运镜平滑过渡`,
          relatedPanels: [prev.id]
        };
      }
      
      return null;
    }
  },

  // 4. 连续相同景别
  {
    id: 'consecutive_same_shot',
    name: '连续相同景别',
    description: '连续3个以上相同景别可能导致视觉疲劳',
    severity: 'info',
    enabled: true,
    check: (current, prev, next) => {
      if (!prev || !next) return null;
      
      const currShot = current.shotSize || current.shot;
      const prevShot = prev.shotSize || prev.shot;
      const nextShot = next.shotSize || next.shot;
      
      if (currShot === prevShot && currShot === nextShot) {
        return {
          id: `consecutive_shot_${current.id}`,
          ruleId: 'consecutive_same_shot',
          ruleName: '连续相同景别',
          severity: 'info',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: `连续3个镜头使用相同景别（${currShot}）`,
          suggestion: '考虑变换景别增加视觉层次，或确认这是有意的节奏设计',
          relatedPanels: [prev.id, next.id]
        };
      }
      
      return null;
    }
  },

  // 5. 镜头节奏分析
  {
    id: 'rhythm_analysis',
    name: '镜头节奏分析',
    description: '检测镜头时长是否过于极端',
    severity: 'info',
    enabled: true,
    check: (current, prev, next, context) => {
      if (!context?.allPanels || context.allPanels.length < 5) return null;
      
      const duration = current.duration || 3;
      
      // 计算平均时长
      const avgDuration = context.allPanels.reduce((sum, p) => sum + (p.duration || 3), 0) / context.allPanels.length;
      
      // 过短（小于平均的40%）
      if (duration < avgDuration * 0.4 && duration < 2) {
        return {
          id: `rhythm_short_${current.id}`,
          ruleId: 'rhythm_analysis',
          ruleName: '镜头节奏分析',
          severity: 'info',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: `镜头时长较短（${duration}秒），节奏偏快`,
          suggestion: '短镜头适合紧张场景，确认是否符合叙事需要'
        };
      }
      
      // 过长（大于平均的200%）
      if (duration > avgDuration * 2 && duration > 8) {
        return {
          id: `rhythm_long_${current.id}`,
          ruleId: 'rhythm_analysis',
          ruleName: '镜头节奏分析',
          severity: 'info',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: `镜头时长较长（${duration}秒），节奏偏慢`,
          suggestion: '长镜头适合抒情或建立场景，确认是否需要拆分'
        };
      }
      
      return null;
    }
  },

  // 6. 对话场景检测
  {
    id: 'dialogue_coverage',
    name: '对话场景覆盖',
    description: '对话场景应有足够的镜头覆盖说话者',
    severity: 'warning',
    enabled: true,
    check: (current, prev, next, context) => {
      if (!current.dialogue) return null;
      
      // 提取对话中的角色
      const dialogueMatch = current.dialogue.match(/^(.+?)[:：]/);
      if (!dialogueMatch) return null;
      
      const speaker = dialogueMatch[1].trim();
      
      // 检查角色是否在画面中
      if (!current.characters?.includes(speaker)) {
        return {
          id: `dialogue_coverage_${current.id}`,
          ruleId: 'dialogue_coverage',
          ruleName: '对话场景覆盖',
          severity: 'warning',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: `对白角色"${speaker}"未在画面角色列表中`,
          suggestion: '请将说话者添加到角色列表，或确认这是画外音设计'
        };
      }
      
      return null;
    }
  },

  // 7. 场景建立镜头
  {
    id: 'scene_establishing',
    name: '场景建立镜头',
    description: '新场景开始时建议使用远景或全景建立空间',
    severity: 'info',
    enabled: true,
    check: (current, prev, next, context) => {
      if (!prev) return null;
      
      // 检测场景切换
      if (current.sceneId === prev.sceneId) return null;
      
      const currShot = current.shotSize || current.shot;
      const shotIdx = SHOT_SIZE_INDEX[currShot] ?? 3;
      
      // 新场景第一镜不是远景/全景
      if (shotIdx < 4) { // MS 或更近
        return {
          id: `establishing_${current.id}`,
          ruleId: 'scene_establishing',
          ruleName: '场景建立镜头',
          severity: 'info',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: `新场景首镜使用${currShot}，未建立空间感`,
          suggestion: '建议新场景开始时使用远景(EWS/WS)建立环境，帮助观众理解空间'
        };
      }
      
      return null;
    }
  },

  // 8. 运镜连贯性
  {
    id: 'movement_continuity',
    name: '运镜连贯性',
    description: '相邻镜头的运动方向应保持一致或有明确过渡',
    severity: 'warning',
    enabled: true,
    check: (current, prev) => {
      if (!prev) return null;
      if (current.sceneId !== prev.sceneId) return null;
      
      const currMove = current.movementType || current.cameraMovement;
      const prevMove = prev.movementType || prev.cameraMovement;
      
      if (!currMove || !prevMove) return null;
      
      // 检测方向冲突
      const conflictPairs: [string, string][] = [
        ['PAN_L', 'PAN_R'],
        ['TILT_UP', 'TILT_DOWN'],
        ['DOLLY_IN', 'DOLLY_OUT'],
        ['TRACK_L', 'TRACK_R'],
        ['CRANE_UP', 'CRANE_DOWN'],
        ['ZOOM_IN', 'ZOOM_OUT']
      ];
      
      for (const [a, b] of conflictPairs) {
        if ((prevMove === a && currMove === b) || (prevMove === b && currMove === a)) {
          return {
            id: `movement_conflict_${current.id}`,
            ruleId: 'movement_continuity',
            ruleName: '运镜连贯性',
            severity: 'warning',
            panelId: current.id,
            panelNumber: current.panelNumber,
            message: `运镜方向突变（${prevMove} → ${currMove}）`,
            suggestion: '相邻镜头运动方向相反可能造成视觉不适，建议添加静止镜头过渡'
          };
        }
      }
      
      return null;
    }
  },

  // 9. 转场合理性
  {
    id: 'transition_check',
    name: '转场合理性',
    description: '检测转场效果是否与场景切换匹配',
    severity: 'info',
    enabled: true,
    check: (current, prev) => {
      if (!prev) return null;
      
      const transition = current.transition;
      const sameScene = current.sceneId === prev.sceneId;
      
      // 同场景内使用溶解/淡出
      if (sameScene && (transition === '溶至' || transition === '淡出' || transition === '淡入')) {
        return {
          id: `transition_${current.id}`,
          ruleId: 'transition_check',
          ruleName: '转场合理性',
          severity: 'info',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: `同场景内使用"${transition}"转场`,
          suggestion: '溶解/淡出通常用于场景切换或时间跳跃，同场景内建议使用"切至"'
        };
      }
      
      // 不同场景使用硬切
      if (!sameScene && (!transition || transition === '切至')) {
        // 这可能是有意为之，只给info提示
        return {
          id: `transition_hard_${current.id}`,
          ruleId: 'transition_check',
          ruleName: '转场合理性',
          severity: 'info',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: '场景切换使用硬切',
          suggestion: '硬切适合快节奏或紧张场景，如需平滑过渡可考虑使用"溶至"'
        };
      }
      
      return null;
    }
  },

  // 10. 角色连贯性
  {
    id: 'character_continuity',
    name: '角色连贯性',
    description: '检测角色在连续镜头中的出现是否合理',
    severity: 'warning',
    enabled: true,
    check: (current, prev, next, context) => {
      if (!prev || !current.characters?.length) return null;
      if (current.sceneId !== prev.sceneId) return null;
      
      // 检测角色突然出现
      const newCharacters = current.characters.filter(
        c => !prev.characters?.includes(c)
      );
      
      // 如果有新角色且没有相关描述
      if (newCharacters.length > 0 && !current.description?.includes('进入') && 
          !current.description?.includes('出现') && !current.description?.includes('走来')) {
        return {
          id: `char_appear_${current.id}`,
          ruleId: 'character_continuity',
          ruleName: '角色连贯性',
          severity: 'warning',
          panelId: current.id,
          panelNumber: current.panelNumber,
          message: `角色"${newCharacters.join('、')}"突然出现在画面中`,
          suggestion: '建议在画面描述中说明角色如何进入场景，或添加角色入场镜头'
        };
      }
      
      return null;
    }
  }
];

// ============ 检测引擎 ============

/**
 * 连贯性检测引擎
 */
export class ContinuityChecker {
  private rules: ContinuityRule[];
  
  constructor(customRules?: ContinuityRule[]) {
    // 创建规则的深拷贝，避免多个实例共享状态
    this.rules = customRules 
      ? customRules.map(r => ({ ...r }))
      : CONTINUITY_RULES.map(r => ({ ...r }));
  }
  
  /**
   * 启用/禁用规则
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }
  
  /**
   * 获取所有规则
   */
  getRules(): ContinuityRule[] {
    return this.rules;
  }
  
  /**
   * 检查单个分镜
   */
  checkPanel(
    panel: StoryboardPanel,
    prev?: StoryboardPanel,
    next?: StoryboardPanel,
    context?: ContinuityContext
  ): ContinuityIssue[] {
    const issues: ContinuityIssue[] = [];
    
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      try {
        const issue = rule.check(panel, prev, next, context);
        if (issue) {
          issues.push(issue);
        }
      } catch (error) {
        console.error(`Rule ${rule.id} check failed:`, error);
      }
    }
    
    return issues;
  }
  
  /**
   * 检查所有分镜
   */
  checkAllPanels(panels: StoryboardPanel[]): ContinuityReport {
    const issues: ContinuityIssue[] = [];
    
    for (let i = 0; i < panels.length; i++) {
      const current = panels[i];
      const prev = i > 0 ? panels[i - 1] : undefined;
      const next = i < panels.length - 1 ? panels[i + 1] : undefined;
      
      const context: ContinuityContext = {
        allPanels: panels,
        currentIndex: i,
        sceneId: current.sceneId
      };
      
      const panelIssues = this.checkPanel(current, prev, next, context);
      issues.push(...panelIssues);
    }
    
    // 统计
    const summary = {
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      infos: issues.filter(i => i.severity === 'info').length
    };
    
    // 计算评分 (100分制)
    const errorPenalty = summary.errors * 10;
    const warningPenalty = summary.warnings * 3;
    const infoPenalty = summary.infos * 1;
    const totalPenalty = errorPenalty + warningPenalty + infoPenalty;
    const score = Math.max(0, Math.min(100, 100 - totalPenalty));
    
    return {
      totalPanels: panels.length,
      checkedPanels: panels.length,
      issues,
      summary,
      score,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 获取分镜的问题数量
   */
  getPanelIssueCount(panelId: string, issues: ContinuityIssue[]): {
    errors: number;
    warnings: number;
    infos: number;
  } {
    const panelIssues = issues.filter(i => i.panelId === panelId);
    return {
      errors: panelIssues.filter(i => i.severity === 'error').length,
      warnings: panelIssues.filter(i => i.severity === 'warning').length,
      infos: panelIssues.filter(i => i.severity === 'info').length
    };
  }
}

// ============ 导出单例 ============

export const continuityChecker = new ContinuityChecker();

// ============ 辅助函数 ============

/**
 * 获取问题严重程度的颜色
 */
export function getSeverityColor(severity: ContinuitySeverity): string {
  switch (severity) {
    case 'error': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * 获取问题严重程度的图标
 */
export function getSeverityIcon(severity: ContinuitySeverity): string {
  switch (severity) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '•';
  }
}

/**
 * 格式化问题报告为文本
 */
export function formatReportAsText(report: ContinuityReport): string {
  const lines: string[] = [
    '# 分镜连贯性检测报告',
    '',
    `检测时间: ${report.timestamp}`,
    `总分镜数: ${report.totalPanels}`,
    `连贯性评分: ${report.score}/100`,
    '',
    `## 问题统计`,
    `- 错误: ${report.summary.errors}`,
    `- 警告: ${report.summary.warnings}`,
    `- 提示: ${report.summary.infos}`,
    ''
  ];
  
  if (report.issues.length > 0) {
    lines.push('## 问题详情', '');
    
    for (const issue of report.issues) {
      lines.push(`### 分镜 #${issue.panelNumber} - ${issue.ruleName}`);
      lines.push(`严重程度: ${issue.severity}`);
      lines.push(`问题: ${issue.message}`);
      lines.push(`建议: ${issue.suggestion}`);
      lines.push('');
    }
  } else {
    lines.push('✅ 未发现连贯性问题，分镜质量良好！');
  }
  
  return lines.join('\n');
}
