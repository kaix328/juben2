/**
 * 关系图谱相关类型定义
 * 独立文件，避免循环依赖
 */

export type RelationType =
  | 'appears_in'      // 出现在（角色-场景）
  | 'uses'            // 使用（角色-道具）
  | 'wears'           // 穿着（角色-服装）
  | 'friend'          // 朋友
  | 'enemy'           // 敌人
  | 'family'          // 家人
  | 'lover'           // 恋人
  | 'colleague'       // 同事
  | 'master_student'  // 师徒
  | 'related_to';     // 相关

export interface AssetRelation {
  id: string;
  projectId: string;
  fromId: string;
  fromType: 'character' | 'scene' | 'prop' | 'costume';
  toId: string;
  toType: 'character' | 'scene' | 'prop' | 'costume';
  relationType: RelationType;
  description?: string;
  strength?: number; // 关系强度 0-1
  createdAt: string;
}
