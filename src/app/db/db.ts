import Dexie, { Table } from 'dexie';
import type {
    Project,
    Chapter,
    Script,
    Storyboard,
    AssetLibrary,
    ProjectVersion,
    CharacterRelation,
    StoryboardTemplate,
    AssetRelation
} from '../types';

export class AppDatabase extends Dexie {
    projects!: Table<Project, string>;
    chapters!: Table<Chapter, string>;
    scripts!: Table<Script, string>;
    storyboards!: Table<Storyboard, string>;
    assets!: Table<AssetLibrary, string>;
    templates!: Table<StoryboardTemplate, string>;
    versions!: Table<ProjectVersion, string>;
    relations!: Table<CharacterRelation, string>;
    assetRelations!: Table<AssetRelation, string>;
    analyses!: Table<any, string>;
    imageBlobs!: Table<{ id: string; ownerId: string; type: string; data: string; createdAt: string }, string>;

    constructor() {
        super('AiComicDB');
        this.version(1).stores({
            projects: 'id, title, updatedAt',
            chapters: 'id, projectId, orderIndex',
            scripts: 'id, chapterId',
            storyboards: 'id, chapterId',
            assets: 'projectId',
            templates: 'id, category',
            versions: 'id, projectId, versionNumber',
            relations: 'id, projectId, fromCharacterId, toCharacterId',
        });

        // Version 2: Add assetRelations table
        this.version(2).stores({
            assetRelations: 'id, projectId, fromId, toId, relationType'
        });

        // Version 3: Add analyses table
        this.version(3).stores({
            analyses: 'id, projectId'
        });

        // Version 4: Add imageBlobs table for decoupled media storage
        this.version(4).stores({
            imageBlobs: 'id, ownerId, type'
        });
    }
}

export const db = new AppDatabase();
