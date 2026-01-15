/**
 * 风格选择器组件
 * 可复用的 Select 组件，用于导演风格编辑器
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { StyleOption } from '../constants/director-style-options';

interface StyleSelectProps {
    /** 标签标题 */
    label: string;
    /** 描述文字 */
    description: string;
    /** 当前选中值 */
    value: string;
    /** 值变更回调 */
    onChange: (value: string) => void;
    /** 选项列表 */
    options: StyleOption[];
    /** 占位符文本 */
    placeholder?: string;
}

/**
 * 风格选择器卡片组件
 * 封装了 Card + Label + Select 的通用模式
 */
export function StyleSelect({
    label,
    description,
    value,
    onChange,
    options,
    placeholder,
}: StyleSelectProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Label>选择{label}</Label>
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger>
                        <SelectValue placeholder={placeholder || `选择${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * 风格选择器行内组件（无卡片包装）
 * 用于更紧凑的布局
 */
export function StyleSelectInline({
    label,
    value,
    onChange,
    options,
    placeholder,
}: Omit<StyleSelectProps, 'description'>) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder || `选择${label}`} />
                </SelectTrigger>
                <SelectContent>
                    {options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
