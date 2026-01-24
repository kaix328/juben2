/**
 * 数据库工具测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../app/utils/db';

describe('数据库工具', () => {
  beforeEach(async () => {
    // 清空数据库
    await db.projects.clear();
    await db.chapters.clear();
    await db.scenes.clear();
    await db.shots.clear();
  });

  afterEach(async () => {
    // 清理
    await db.projects.clear();
    await db.chapters.clear();
    await db.scenes.clear();
    await db.shots.clear();
  });

  describe('项目操作', () => {
    it('应该能创建项目', async () => {
      const project = {
        id: 'test-1',
        title: '测试项目',
        description: '测试描述',
        coverImage: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.projects.add(project);
      const saved = await db.projects.get('test-1');

      expect(saved).toBeDefined();
      expect(saved?.title).toBe('测试项目');
    });

    it('应该能更新项目', async () => {
      const project = {
        id: 'test-1',
        title: '原标题',
        description: '测试描述',
        coverImage: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.projects.add(project);
      await db.projects.update('test-1', { title: '新标题' });

      const updated = await db.projects.get('test-1');
      expect(updated?.title).toBe('新标题');
    });

    it('应该能删除项目', async () => {
      const project = {
        id: 'test-1',
        title: '测试项目',
        description: '测试描述',
        coverImage: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.projects.add(project);
      await db.projects.delete('test-1');

      const deleted = await db.projects.get('test-1');
      expect(deleted).toBeUndefined();
    });

    it('应该能获取所有项目', async () => {
      const projects = [
        {
          id: 'test-1',
          title: '项目1',
          description: '',
          coverImage: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'test-2',
          title: '项目2',
          description: '',
          coverImage: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await db.projects.bulkAdd(projects);
      const all = await db.projects.toArray();

      expect(all).toHaveLength(2);
    });
  });

  describe('章节操作', () => {
    it('应该能创建章节', async () => {
      const chapter = {
        id: 'chapter-1',
        projectId: 'test-1',
        title: '第一章',
        content: '章节内容',
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.chapters.add(chapter);
      const saved = await db.chapters.get('chapter-1');

      expect(saved).toBeDefined();
      expect(saved?.title).toBe('第一章');
    });

    it('应该能按项目ID查询章节', async () => {
      const chapters = [
        {
          id: 'chapter-1',
          projectId: 'project-1',
          title: '第一章',
          content: '',
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'chapter-2',
          projectId: 'project-1',
          title: '第二章',
          content: '',
          order: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'chapter-3',
          projectId: 'project-2',
          title: '第一章',
          content: '',
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await db.chapters.bulkAdd(chapters);
      const project1Chapters = await db.chapters
        .where('projectId')
        .equals('project-1')
        .toArray();

      expect(project1Chapters).toHaveLength(2);
    });

    it('应该能按顺序排序章节', async () => {
      const chapters = [
        {
          id: 'chapter-2',
          projectId: 'project-1',
          title: '第二章',
          content: '',
          order: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'chapter-1',
          projectId: 'project-1',
          title: '第一章',
          content: '',
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await db.chapters.bulkAdd(chapters);
      const sorted = await db.chapters
        .where('projectId')
        .equals('project-1')
        .sortBy('order');

      expect(sorted[0].title).toBe('第一章');
      expect(sorted[1].title).toBe('第二章');
    });
  });

  describe('场景操作', () => {
    it('应该能创建场景', async () => {
      const scene = {
        id: 'scene-1',
        chapterId: 'chapter-1',
        sceneNumber: 1,
        location: '室内-客厅',
        timeOfDay: '白天',
        characters: ['角色A'],
        description: '场景描述',
        dialogue: '对话',
        action: '动作',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.scenes.add(scene);
      const saved = await db.scenes.get('scene-1');

      expect(saved).toBeDefined();
      expect(saved?.location).toBe('室内-客厅');
    });

    it('应该能按章节ID查询场景', async () => {
      const scenes = [
        {
          id: 'scene-1',
          chapterId: 'chapter-1',
          sceneNumber: 1,
          location: '场景1',
          timeOfDay: '白天',
          characters: [],
          description: '',
          dialogue: '',
          action: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'scene-2',
          chapterId: 'chapter-1',
          sceneNumber: 2,
          location: '场景2',
          timeOfDay: '白天',
          characters: [],
          description: '',
          dialogue: '',
          action: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await db.scenes.bulkAdd(scenes);
      const chapter1Scenes = await db.scenes
        .where('chapterId')
        .equals('chapter-1')
        .toArray();

      expect(chapter1Scenes).toHaveLength(2);
    });
  });

  describe('分镜操作', () => {
    it('应该能创建分镜', async () => {
      const shot = {
        id: 'shot-1',
        sceneId: 'scene-1',
        shotNumber: 1,
        shotType: '特写',
        cameraAngle: '平视',
        cameraMovement: '固定',
        duration: 5,
        description: '分镜描述',
        imageUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.shots.add(shot);
      const saved = await db.shots.get('shot-1');

      expect(saved).toBeDefined();
      expect(saved?.shotType).toBe('特写');
    });

    it('应该能按场景ID查询分镜', async () => {
      const shots = [
        {
          id: 'shot-1',
          sceneId: 'scene-1',
          shotNumber: 1,
          shotType: '特写',
          cameraAngle: '平视',
          cameraMovement: '固定',
          duration: 5,
          description: '',
          imageUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'shot-2',
          sceneId: 'scene-1',
          shotNumber: 2,
          shotType: '中景',
          cameraAngle: '平视',
          cameraMovement: '固定',
          duration: 3,
          description: '',
          imageUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await db.shots.bulkAdd(shots);
      const scene1Shots = await db.shots
        .where('sceneId')
        .equals('scene-1')
        .toArray();

      expect(scene1Shots).toHaveLength(2);
    });
  });
});
