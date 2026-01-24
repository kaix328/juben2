/**
 * Storage 工具函数测试
 * 测试 IndexedDB 存储层的核心功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Dexie
vi.mock('../app/db/db', () => {
  const mockProjects = new Map()
  const mockChapters = new Map()
  const mockScripts = new Map()
  const mockStoryboards = new Map()
  const mockAssets = new Map()

  return {
    db: {
      projects: {
        toArray: vi.fn(() => Promise.resolve(Array.from(mockProjects.values()))),
        get: vi.fn((id: string) => Promise.resolve(mockProjects.get(id))),
        put: vi.fn((project: any) => {
          mockProjects.set(project.id, project)
          return Promise.resolve()
        }),
        delete: vi.fn((id: string) => {
          mockProjects.delete(id)
          return Promise.resolve()
        }),
      },
      chapters: {
        toArray: vi.fn(() => Promise.resolve(Array.from(mockChapters.values()))),
        get: vi.fn((id: string) => Promise.resolve(mockChapters.get(id))),
        put: vi.fn((chapter: any) => {
          mockChapters.set(chapter.id, chapter)
          return Promise.resolve()
        }),
        delete: vi.fn((id: string) => {
          mockChapters.delete(id)
          return Promise.resolve()
        }),
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            sortBy: vi.fn(() => Promise.resolve(
              Array.from(mockChapters.values()).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
            )),
            delete: vi.fn(() => Promise.resolve()),
            toArray: vi.fn(() => Promise.resolve(Array.from(mockChapters.values()))),
          })),
        })),
      },
      scripts: {
        put: vi.fn((script: any) => {
          mockScripts.set(script.id, script)
          return Promise.resolve()
        }),
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(Array.from(mockScripts.values())[0])),
            delete: vi.fn(() => Promise.resolve()),
          })),
        })),
      },
      storyboards: {
        put: vi.fn((storyboard: any) => {
          mockStoryboards.set(storyboard.id, storyboard)
          return Promise.resolve()
        }),
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(Array.from(mockStoryboards.values())[0])),
            delete: vi.fn(() => Promise.resolve()),
          })),
        })),
      },
      assets: {
        get: vi.fn((id: string) => Promise.resolve(mockAssets.get(id))),
        put: vi.fn((asset: any) => {
          mockAssets.set(asset.projectId, asset)
          return Promise.resolve()
        }),
        add: vi.fn((asset: any) => {
          mockAssets.set(asset.projectId, asset)
          return Promise.resolve()
        }),
        delete: vi.fn((id: string) => {
          mockAssets.delete(id)
          return Promise.resolve()
        }),
      },
      templates: {
        toArray: vi.fn(() => Promise.resolve([])),
        get: vi.fn(() => Promise.resolve(undefined)),
        put: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
      },
      versions: {
        toArray: vi.fn(() => Promise.resolve([])),
        get: vi.fn(() => Promise.resolve(undefined)),
        put: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            delete: vi.fn(() => Promise.resolve()),
          })),
        })),
      },
      relations: {
        toArray: vi.fn(() => Promise.resolve([])),
        get: vi.fn(() => Promise.resolve(undefined)),
        put: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            delete: vi.fn(() => Promise.resolve()),
          })),
        })),
      },
      transaction: vi.fn((mode, tables, callback) => callback()),
    },
    // 用于测试的辅助方法
    __resetMocks: () => {
      mockProjects.clear()
      mockChapters.clear()
      mockScripts.clear()
      mockStoryboards.clear()
      mockAssets.clear()
    },
  }
})

import {
  projectStorage,
  chapterStorage,
  scriptStorage,
  storyboardStorage,
  assetStorage,
  generateId,
} from '../app/utils/storage'

describe('Storage Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // generateId 测试
  // ==========================================================================
  describe('generateId', () => {
    it('应该生成唯一的 ID', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('应该生成包含时间戳的 ID', () => {
      const id = generateId()
      const timestamp = id.split('-')[0]

      expect(Number(timestamp)).toBeGreaterThan(0)
    })

    it('应该生成字符串类型的 ID', () => {
      const id = generateId()

      expect(typeof id).toBe('string')
    })
  })

  // ==========================================================================
  // projectStorage 测试
  // ==========================================================================
  describe('projectStorage', () => {
    const mockProject = {
      id: 'project-1',
      title: '测试项目',
      description: '这是一个测试项目',
      cover: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    it('应该保存项目', async () => {
      await projectStorage.save(mockProject)

      const { db } = await import('../app/db/db')
      expect(db.projects.put).toHaveBeenCalledWith(mockProject)
    })

    it('应该获取所有项目', async () => {
      const projects = await projectStorage.getAll()

      const { db } = await import('../app/db/db')
      expect(db.projects.toArray).toHaveBeenCalled()
      expect(Array.isArray(projects)).toBe(true)
    })

    it('应该通过 ID 获取项目', async () => {
      await projectStorage.getById('project-1')

      const { db } = await import('../app/db/db')
      expect(db.projects.get).toHaveBeenCalledWith('project-1')
    })
  })

  // ==========================================================================
  // chapterStorage 测试
  // ==========================================================================
  describe('chapterStorage', () => {
    const mockChapter = {
      id: 'chapter-1',
      projectId: 'project-1',
      title: '第一章',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    it('应该保存章节', async () => {
      await chapterStorage.save(mockChapter)

      const { db } = await import('../app/db/db')
      expect(db.chapters.put).toHaveBeenCalledWith(mockChapter)
    })

    it('应该获取所有章节', async () => {
      const chapters = await chapterStorage.getAll()

      const { db } = await import('../app/db/db')
      expect(db.chapters.toArray).toHaveBeenCalled()
      expect(Array.isArray(chapters)).toBe(true)
    })

    it('应该通过项目 ID 获取章节', async () => {
      await chapterStorage.getByProjectId('project-1')

      const { db } = await import('../app/db/db')
      expect(db.chapters.where).toHaveBeenCalledWith('projectId')
    })
  })

  // ==========================================================================
  // assetStorage 测试
  // ==========================================================================
  describe('assetStorage', () => {
    const mockAssets = {
      projectId: 'project-1',
      characters: [],
      scenes: [],
      props: [],
      costumes: [],
    }

    it('应该保存资源库', async () => {
      await assetStorage.save(mockAssets)

      const { db } = await import('../app/db/db')
      expect(db.assets.put).toHaveBeenCalledWith(mockAssets)
    })

    it('应该通过项目 ID 获取资源库', async () => {
      await assetStorage.getByProjectId('project-1')

      const { db } = await import('../app/db/db')
      expect(db.assets.get).toHaveBeenCalledWith('project-1')
    })

    it('应该初始化项目资源库', async () => {
      const assets = await assetStorage.initForProject('new-project')

      expect(assets).toHaveProperty('projectId', 'new-project')
      expect(assets).toHaveProperty('characters')
      expect(assets).toHaveProperty('scenes')
      expect(assets).toHaveProperty('props')
      expect(assets).toHaveProperty('costumes')
    })
  })
})
