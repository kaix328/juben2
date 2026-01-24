/**
 * 角色一致性管理面板
 * 管理角色档案、参考图片、AI配置等
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  characterManager,
  CharacterProfile,
  CharacterAppearance,
  ReferenceImage,
  APPEARANCE_PRESETS,
  generateCharacterSummary
} from '../utils/characterConsistency';

interface CharacterManagerPanelProps {
  onSelectCharacter?: (character: CharacterProfile) => void;
  onGeneratePrompt?: (positive: string, negative: string) => void;
  className?: string;
}

export const CharacterManagerPanel: React.FC<CharacterManagerPanelProps> = ({
  onSelectCharacter,
  onGeneratePrompt,
  className = ''
}) => {
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Partial<CharacterProfile> | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'appearance' | 'ai' | 'references'>('basic');
  const [searchQuery, setSearchQuery] = useState('');

  // 加载角色列表
  useEffect(() => {
    setCharacters(characterManager.getAllCharacters());
  }, []);

  // 获取选中的角色
  const selectedCharacter = selectedId ? characterManager.getCharacter(selectedId) : null;

  // 过滤角色
  const filteredCharacters = characters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 创建新角色
  const handleCreate = useCallback(() => {
    setEditingCharacter({
      name: '',
      aliases: [],
      description: ''
    });
    setIsEditing(true);
    setActiveTab('basic');
  }, []);

  // 编辑角色
  const handleEdit = useCallback((character: CharacterProfile) => {
    setEditingCharacter({ ...character });
    setIsEditing(true);
  }, []);

  // 保存角色
  const handleSave = useCallback(() => {
    if (!editingCharacter) return;

    if (editingCharacter.id) {
      // 更新
      characterManager.updateCharacter(editingCharacter.id, editingCharacter);
    } else {
      // 创建
      const newChar = characterManager.createCharacter(editingCharacter);
      setSelectedId(newChar.id);
    }

    setCharacters(characterManager.getAllCharacters());
    setIsEditing(false);
    setEditingCharacter(null);
  }, [editingCharacter]);

  // 删除角色
  const handleDelete = useCallback((id: string) => {
    if (confirm('确定要删除这个角色吗？')) {
      characterManager.deleteCharacter(id);
      setCharacters(characterManager.getAllCharacters());
      if (selectedId === id) {
        setSelectedId(null);
      }
    }
  }, [selectedId]);

  // 生成提示词
  const handleGeneratePrompt = useCallback(() => {
    if (!selectedId) return;
    const { positive, negative } = characterManager.generatePrompt(selectedId);
    onGeneratePrompt?.(positive, negative);
  }, [selectedId, onGeneratePrompt]);

  // 导出角色
  const handleExport = useCallback((id: string) => {
    const json = characterManager.exportCharacter(id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `character-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, []);

  // 导入角色
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          const imported = characterManager.importCharacter(json);
          if (imported) {
            setCharacters(characterManager.getAllCharacters());
            setSelectedId(imported.id);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  // 更新编辑中的角色
  const updateEditing = useCallback((updates: Partial<CharacterProfile>) => {
    setEditingCharacter(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // 更新外观
  const updateAppearance = useCallback((updates: Partial<CharacterAppearance>) => {
    setEditingCharacter(prev => {
      if (!prev) return null;
      return {
        ...prev,
        appearance: {
          ...prev.appearance,
          ...updates
        } as CharacterAppearance
      };
    });
  }, []);

  // 渲染角色列表
  const renderCharacterList = () => (
    <div className="w-64 border-r bg-gray-50 flex flex-col">
      {/* 搜索和操作 */}
      <div className="p-3 border-b space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索角色..."
          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="flex-1 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + 新建角色
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            title="导入角色"
          >
            📥
          </button>
        </div>
      </div>

      {/* 角色列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredCharacters.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchQuery ? '没有找到匹配的角色' : '暂无角色，点击上方按钮创建'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredCharacters.map(character => (
              <div
                key={character.id}
                onClick={() => {
                  setSelectedId(character.id);
                  onSelectCharacter?.(character);
                }}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedId === character.id
                    ? 'bg-blue-100 border-l-4 border-blue-500'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 头像 */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {character.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{character.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {generateCharacterSummary(character)}
                    </div>
                  </div>
                </div>
                {character.aiConfig.loraModel && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                      LoRA
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 渲染角色详情
  const renderCharacterDetail = () => {
    if (!selectedCharacter && !isEditing) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <span className="text-6xl mb-4 block">👤</span>
            <p>选择一个角色查看详情</p>
            <p className="text-sm mt-2">或创建新角色</p>
          </div>
        </div>
      );
    }

    const character = isEditing ? editingCharacter : selectedCharacter;
    if (!character) return null;

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                {(character.name || '?').charAt(0)}
              </div>
              <div className="text-white">
                {isEditing ? (
                  <input
                    type="text"
                    value={character.name || ''}
                    onChange={(e) => updateEditing({ name: e.target.value })}
                    placeholder="角色名称"
                    className="bg-white/20 text-white placeholder-white/60 px-3 py-1 rounded text-lg font-semibold"
                  />
                ) : (
                  <h2 className="text-xl font-semibold">{character.name}</h2>
                )}
                <p className="text-white/80 text-sm mt-1">
                  {character.aliases?.join(', ') || '无别名'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => handleEdit(selectedCharacter!)}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    onClick={handleGeneratePrompt}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    🎨 生成提示词
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingCharacter(null);
                    }}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    💾 保存
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex border-b">
          {[
            { id: 'basic', label: '基本信息', icon: '📋' },
            { id: 'appearance', label: '外观特征', icon: '👤' },
            { id: 'ai', label: 'AI配置', icon: '🤖' },
            { id: 'references', label: '参考图片', icon: '🖼️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'basic' && renderBasicTab(character)}
          {activeTab === 'appearance' && renderAppearanceTab(character)}
          {activeTab === 'ai' && renderAITab(character)}
          {activeTab === 'references' && renderReferencesTab(character)}
        </div>

        {/* 底部操作 */}
        {!isEditing && selectedCharacter && (
          <div className="p-4 border-t bg-gray-50 flex justify-between">
            <button
              onClick={() => handleExport(selectedCharacter.id)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              📤 导出角色
            </button>
            <button
              onClick={() => handleDelete(selectedCharacter.id)}
              className="px-4 py-2 text-sm text-red-500 hover:text-red-700"
            >
              🗑️ 删除角色
            </button>
          </div>
        )}
      </div>
    );
  };

  // 基本信息标签页
  const renderBasicTab = (character: Partial<CharacterProfile>) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">角色描述</label>
        {isEditing ? (
          <textarea
            value={character.description || ''}
            onChange={(e) => updateEditing({ description: e.target.value })}
            placeholder="描述角色的背景、性格等..."
            className="w-full px-3 py-2 border rounded-lg resize-none"
            rows={4}
          />
        ) : (
          <p className="text-gray-600">{character.description || '暂无描述'}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">别名/昵称</label>
        {isEditing ? (
          <input
            type="text"
            value={character.aliases?.join(', ') || ''}
            onChange={(e) => updateEditing({ 
              aliases: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)
            })}
            placeholder="用逗号分隔多个别名"
            className="w-full px-3 py-2 border rounded-lg"
          />
        ) : (
          <p className="text-gray-600">{character.aliases?.join(', ') || '无'}</p>
        )}
      </div>

      {!isEditing && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">创建时间</div>
            <div className="font-medium">
              {character.createdAt ? new Date(character.createdAt).toLocaleDateString() : '-'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">使用次数</div>
            <div className="font-medium">{character.usageCount || 0} 次</div>
          </div>
        </div>
      )}
    </div>
  );

  // 外观特征标签页
  const renderAppearanceTab = (character: Partial<CharacterProfile>) => {
    const appearance = character.appearance;
    if (!appearance) return <div>无外观数据</div>;

    const renderSelect = (
      label: string,
      value: string,
      options: string[],
      onChange: (value: string) => void
    ) => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {isEditing ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <p className="text-gray-600">{value}</p>
        )}
      </div>
    );

    return (
      <div className="space-y-6">
        {/* 基本信息 */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">基本信息</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
              {isEditing ? (
                <select
                  value={appearance.gender}
                  onChange={(e) => updateAppearance({ gender: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">其他</option>
                </select>
              ) : (
                <p className="text-gray-600">
                  {appearance.gender === 'male' ? '男性' : 
                   appearance.gender === 'female' ? '女性' : '其他'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年龄范围</label>
              {isEditing ? (
                <input
                  type="text"
                  value={appearance.ageRange}
                  onChange={(e) => updateAppearance({ ageRange: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <p className="text-gray-600">{appearance.ageRange}岁</p>
              )}
            </div>
            {renderSelect(
              '身高',
              appearance.body?.height || '中等',
              APPEARANCE_PRESETS.heights,
              (v) => updateAppearance({ body: { ...appearance.body, height: v } })
            )}
          </div>
        </div>

        {/* 面部特征 */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">面部特征</h4>
          <div className="grid grid-cols-3 gap-4">
            {renderSelect(
              '脸型',
              appearance.face?.shape || '椭圆形',
              APPEARANCE_PRESETS.faceShapes,
              (v) => updateAppearance({ face: { ...appearance.face, shape: v } })
            )}
            {renderSelect(
              '眼睛颜色',
              appearance.face?.eyeColor || '黑色',
              APPEARANCE_PRESETS.eyeColors,
              (v) => updateAppearance({ face: { ...appearance.face, eyeColor: v } })
            )}
            {renderSelect(
              '眼型',
              appearance.face?.eyeShape || '杏眼',
              APPEARANCE_PRESETS.eyeShapes,
              (v) => updateAppearance({ face: { ...appearance.face, eyeShape: v } })
            )}
            {renderSelect(
              '肤色',
              appearance.face?.skinTone || '自然肤色',
              APPEARANCE_PRESETS.skinTones,
              (v) => updateAppearance({ face: { ...appearance.face, skinTone: v } })
            )}
          </div>
        </div>

        {/* 发型 */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">发型</h4>
          <div className="grid grid-cols-3 gap-4">
            {renderSelect(
              '发色',
              appearance.hair?.color || '黑色',
              APPEARANCE_PRESETS.hairColors,
              (v) => updateAppearance({ hair: { ...appearance.hair, color: v } })
            )}
            {renderSelect(
              '长度',
              appearance.hair?.length || '中等',
              APPEARANCE_PRESETS.hairLengths,
              (v) => updateAppearance({ hair: { ...appearance.hair, length: v } })
            )}
            {renderSelect(
              '发型',
              appearance.hair?.style || '自然',
              APPEARANCE_PRESETS.hairStyles,
              (v) => updateAppearance({ hair: { ...appearance.hair, style: v } })
            )}
          </div>
        </div>

        {/* 体型 */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">体型</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderSelect(
              '体型',
              appearance.body?.build || '标准',
              APPEARANCE_PRESETS.bodyBuilds,
              (v) => updateAppearance({ body: { ...appearance.body, build: v } })
            )}
          </div>
        </div>
      </div>
    );
  };

  // AI配置标签页
  const renderAITab = (character: Partial<CharacterProfile>) => {
    const aiConfig = character.aiConfig;
    if (!aiConfig) return <div>无AI配置</div>;

    return (
      <div className="space-y-6">
        {/* LoRA 模型 */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-purple-500">🎨</span>
            LoRA 模型
          </h4>
          {aiConfig.loraModel ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">模型名称</span>
                <span className="font-medium">{aiConfig.loraModel.modelName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">触发词</span>
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                  {aiConfig.loraModel.triggerWord}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">权重</span>
                <span>{aiConfig.loraModel.weight}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>未配置 LoRA 模型</p>
              {isEditing && (
                <button className="mt-2 text-blue-500 hover:underline text-sm">
                  + 添加 LoRA 模型
                </button>
              )}
            </div>
          )}
        </div>

        {/* 提示词 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            正向提示词补充
          </label>
          {isEditing ? (
            <textarea
              value={aiConfig.positivePrompt || ''}
              onChange={(e) => updateEditing({
                aiConfig: { ...aiConfig, positivePrompt: e.target.value }
              })}
              placeholder="额外的正向提示词..."
              className="w-full px-3 py-2 border rounded-lg resize-none"
              rows={3}
            />
          ) : (
            <p className="text-gray-600 p-3 bg-gray-50 rounded-lg">
              {aiConfig.positivePrompt || '无'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            负向提示词
          </label>
          {isEditing ? (
            <textarea
              value={aiConfig.negativePrompt || ''}
              onChange={(e) => updateEditing({
                aiConfig: { ...aiConfig, negativePrompt: e.target.value }
              })}
              placeholder="负向提示词..."
              className="w-full px-3 py-2 border rounded-lg resize-none"
              rows={3}
            />
          ) : (
            <p className="text-gray-600 p-3 bg-gray-50 rounded-lg text-sm">
              {aiConfig.negativePrompt || '使用默认负向提示词'}
            </p>
          )}
        </div>

        {/* 一致性设置 */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">一致性设置</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">面部修复</span>
              <input
                type="checkbox"
                checked={aiConfig.faceRestoration}
                onChange={(e) => isEditing && updateEditing({
                  aiConfig: { ...aiConfig, faceRestoration: e.target.checked }
                })}
                disabled={!isEditing}
                className="rounded"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">一致性强度</span>
                <span className="text-sm font-medium">
                  {Math.round(aiConfig.faceConsistencyStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={aiConfig.faceConsistencyStrength * 100}
                onChange={(e) => isEditing && updateEditing({
                  aiConfig: { ...aiConfig, faceConsistencyStrength: Number(e.target.value) / 100 }
                })}
                disabled={!isEditing}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 参考图片标签页
  const renderReferencesTab = (character: Partial<CharacterProfile>) => {
    const references = character.referenceImages || [];

    return (
      <div className="space-y-4">
        {isEditing && (
          <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
            + 添加参考图片
          </button>
        )}

        {references.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">🖼️</span>
            <p>暂无参考图片</p>
            <p className="text-sm mt-1">添加参考图片可以提高角色一致性</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {references.map(ref => (
              <div key={ref.id} className="relative group">
                <img
                  src={ref.url}
                  alt="参考图片"
                  className="w-full aspect-square object-cover rounded-lg"
                />
                {ref.isPrimary && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                    主图
                  </span>
                )}
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                  {ref.type === 'face' ? '面部' :
                   ref.type === 'full_body' ? '全身' :
                   ref.type === 'outfit' ? '服装' : '表情'}
                </span>
                {isEditing && (
                  <button className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm flex h-[600px] ${className}`}>
      {renderCharacterList()}
      {renderCharacterDetail()}
    </div>
  );
};

export default CharacterManagerPanel;
