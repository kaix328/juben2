import { useState } from 'react';
import { Wand2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { getAvailableTemplates } from '../utils/promptTemplates';

interface PromptTemplateSelectorProps {
  type: 'character' | 'scene' | 'prop' | 'costume';
  subType?: 'fullBody' | 'face' | 'wide' | 'medium' | 'closeup';
  onSelect: (template: string) => void;
  className?: string;
}

export function PromptTemplateSelector({
  type,
  subType,
  onSelect,
  className = '',
}: PromptTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 获取所有可用模板
  const allTemplates = getAvailableTemplates();
  
  // 根据类型筛选合适的模板
  const getTemplates = () => {
    if (type === 'character') {
      // 角色相关模板
      return allTemplates.filter(t => 
        ['standard', 'characterFocus', 'dialogue', 'emotional'].includes(t.name)
      );
    }
    if (type === 'scene') {
      // 场景相关模板
      return allTemplates.filter(t => 
        ['standard', 'establishing', 'emotional', 'technical'].includes(t.name)
      );
    }
    if (type === 'prop' || type === 'costume') {
      // 道具/服饰相关模板
      return allTemplates.filter(t => 
        ['standard', 'technical'].includes(t.name)
      );
    }
    return allTemplates;
  };

  const templates = getTemplates();

  const handleSelect = (templateName: string) => {
    onSelect(templateName);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Wand2 className="w-3 h-3" />
        使用模板
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉菜单 */}
          <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-gray-500 px-2 py-1 font-medium">
                选择提示词模板
              </div>
              {templates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => handleSelect(template.name)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm transition-colors"
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
                </button>
              ))}
              {templates.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  暂无可用模板
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
