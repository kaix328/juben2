// ScriptEditor 对话框集合组件
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { StoryFiveElementsAnalyzer } from '../../../components/StoryFiveElementsAnalyzer';
import { BackupManagerDialog } from './BackupManagerDialog';
import type { Script } from '../types';

interface ScriptEditorDialogsProps {
    // 查找替换对话框
    showReplaceDialog: boolean;
    onReplaceDialogChange: (show: boolean) => void;
    findText: string;
    onFindTextChange: (text: string) => void;
    replaceText: string;
    onReplaceTextChange: (text: string) => void;
    onGlobalReplace: () => void;

    // 五元素分析对话框
    showFiveElementsDialog: boolean;
    onFiveElementsDialogChange: (show: boolean) => void;
    projectId: string;
    chapterId: string;
    script: Script | null;
    chapterOriginalText: string;
    onAnalysisComplete: (analysis: any) => void;

    // 备份管理对话框
    showBackupDialog: boolean;
    onBackupDialogChange: (show: boolean) => void;
    onRestoreBackup: (script: any) => void;
}

export function ScriptEditorDialogs({
    showReplaceDialog,
    onReplaceDialogChange,
    findText,
    onFindTextChange,
    replaceText,
    onReplaceTextChange,
    onGlobalReplace,
    showFiveElementsDialog,
    onFiveElementsDialogChange,
    projectId,
    chapterId,
    script,
    chapterOriginalText,
    onAnalysisComplete,
    showBackupDialog,
    onBackupDialogChange,
    onRestoreBackup,
}: ScriptEditorDialogsProps) {
    return (
        <>
            {/* 查找替换对话框 */}
            <Dialog open={showReplaceDialog} onOpenChange={onReplaceDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>全局查找替换</DialogTitle>
                        <DialogDescription>
                            在所有场景的角色名、对白和动作描述中查找并替换文本
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>查找内容</Label>
                            <Input
                                value={findText}
                                onChange={(e) => onFindTextChange(e.target.value)}
                                placeholder="输入要查找的内容"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>替换为</Label>
                            <Input
                                value={replaceText}
                                onChange={(e) => onReplaceTextChange(e.target.value)}
                                placeholder="输入替换后的内容"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onReplaceDialogChange(false)}>
                            取消
                        </Button>
                        <Button onClick={onGlobalReplace}>
                            全部替换
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 五元素分析对话框 */}
            <Dialog open={showFiveElementsDialog} onOpenChange={onFiveElementsDialogChange}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>故事五元素分析</DialogTitle>
                        <DialogDescription>
                            分析剧本的人物、事件、时间、地点、原因五大要素
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <StoryFiveElementsAnalyzer
                            projectId={projectId}
                            chapterId={chapterId}
                            scriptContent={script ? script.scenes.map(s => 
                                `场景${s.sceneNumber}: ${s.location} - ${s.timeOfDay}\n${s.action || ''}\n${s.dialogues.map(d => `${d.character}: ${d.lines}`).join('\n')}`
                            ).join('\n\n') : chapterOriginalText}
                            existingCharacters={script ? [...new Set(script.scenes.flatMap(s => s.characters))] : []}
                            onAnalysisComplete={onAnalysisComplete}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* 备份管理对话框 */}
            {chapterId && (
                <BackupManagerDialog
                    open={showBackupDialog}
                    onOpenChange={onBackupDialogChange}
                    chapterId={chapterId}
                    onRestore={onRestoreBackup}
                />
            )}
        </>
    );
}
