/**
 * 分镜后处理模块 - 智能填充音效、音乐、运镜等
 * 从 aiService.ts 拆分
 */
import type { ScriptScene, StoryboardPanel } from '../../types';
import {
    SOUND_PRESETS,
    MUSIC_PRESETS,
    EMOTIONAL_CAMERA_PRESETS,
    CAMERA_SPEED_KEYWORDS
} from '../promptGenerator';

/**
 * 智能后处理：自动填充音效、音乐、起始帧、结束帧（含上下文感知）
 */
export function smartFillPanel(
    panel: any,
    scene?: ScriptScene,
    prevPanel?: any,
    nextPanel?: any,
    allPanels?: any[]
): any {
    const desc = (panel.description || '').toLowerCase();
    const location = (scene?.location || '').toLowerCase();
    const beat = scene?.beat || '';
    const mood = (panel.atmosphere || panel.emotionalBeat || beat || '').toUpperCase();

    // 0. 上下文感知：开始帧承接上一镜结束帧
    if (prevPanel && prevPanel.endFrame && (!panel.startFrame || panel.startFrame === '')) {
        panel.startFrame = `承接上一镜：${prevPanel.endFrame}`;
    }

    // 0.1 场景级音乐统一：同sceneId使用相同音乐
    if (allPanels && allPanels.length > 0 && (!panel.music || panel.music === '')) {
        const sameScenePanels = allPanels.filter(p => p.sceneId === panel.sceneId && p.music);
        if (sameScenePanels.length > 0) {
            panel.music = sameScenePanels[0].music;
        }
    }

    // 0.2 集级调色统一：同episodeNumber使用相同基础调色
    if (allPanels && allPanels.length > 0 && (!panel.colorGrade || panel.colorGrade === '' || panel.colorGrade === '自然调色')) {
        const sameEpisodePanels = allPanels.filter(p => p.episodeNumber === panel.episodeNumber && p.colorGrade && p.colorGrade !== '自然调色');
        if (sameEpisodePanels.length > 0) {
            panel.colorGrade = sameEpisodePanels[0].colorGrade;
        }
    }

    // 1. 智能推断音效 (接入 SOUND_PRESETS)
    if (!panel.soundEffects || panel.soundEffects.length === 0) {
        const soundEffects: string[] = [];

        if (location.includes('战斗') || desc.includes('打斗') || desc.includes('击')) {
            soundEffects.push(...(SOUND_PRESETS['战斗'] || ['战斗音效']));
        } else if (location.includes('雨') || desc.includes('下雨')) {
            soundEffects.push(...(SOUND_PRESETS['雨景'] || ['雨声']));
        } else if (location.includes('森') || location.includes('山') || location.includes('野')) {
            soundEffects.push(...(SOUND_PRESETS['森林'] || ['森林环境音']));
        } else if (location.includes('市') || location.includes('街') || location.includes('路')) {
            soundEffects.push(...(SOUND_PRESETS['城市环境'] || ['城市背景音']));
        } else if (location.includes('海') || location.includes('水') || location.includes('湖')) {
            soundEffects.push(...(SOUND_PRESETS['水边'] || ['水声']));
        } else if (location.includes('科幻') || location.includes('机械') || location.includes('船')) {
            soundEffects.push(...(SOUND_PRESETS['科幻/机械'] || ['机械音效']));
        } else {
            soundEffects.push('环境背景音');
        }

        if (desc.includes('脚步') || desc.includes('走') || desc.includes('跑')) {
            soundEffects.push('规律脚步声');
        }
        if (desc.includes('门') || desc.includes('开') || desc.includes('关')) {
            soundEffects.push('木门转轴声');
        }
        if (desc.includes('说') || desc.includes('喊') || panel.dialogue) {
            soundEffects.push('清晰人声对白');
        }

        panel.soundEffects = [...new Set(soundEffects)].slice(0, 3);
    }

    // 2. 智能推断背景音乐 (接入 MUSIC_PRESETS)
    if (!panel.music || panel.music === '背景音乐') {
        if (mood.includes('TENSE') || mood.includes('紧张') || mood.includes('危险')) {
            panel.music = MUSIC_PRESETS['紧张']?.[0] || '紧张BGM';
        } else if (mood.includes('ROMANTIC') || mood.includes('浪漫') || mood.includes('温馨')) {
            panel.music = MUSIC_PRESETS['浪漫']?.[0] || '浪漫BGM';
        } else if (mood.includes('SAD') || mood.includes('悲伤') || mood.includes('忧郁')) {
            panel.music = MUSIC_PRESETS['悲伤']?.[0] || '悲伤BGM';
        } else if (mood.includes('HAPPY') || mood.includes('欢快') || mood.includes('轻松')) {
            panel.music = MUSIC_PRESETS['欢快']?.[0] || '欢快BGM';
        } else if (mood.includes('ACTION') || mood.includes('动作') || mood.includes('热血')) {
            panel.music = MUSIC_PRESETS['热血']?.[0] || '热血BGM';
        } else if (location.includes('古') || location.includes('武侠') || location.includes('庙')) {
            panel.music = MUSIC_PRESETS['古风']?.[0] || '古风BGM';
        } else {
            panel.music = '通用叙事背景音乐';
        }
    }

    // 3. 智能情绪运镜推荐 (上下文连贯性版)
    if (!panel.cameraMovement || panel.cameraMovement === '静止') {
        const prevMovement = prevPanel?.cameraMovement || '';
        const nextHasDialogue = nextPanel?.dialogue && nextPanel.dialogue.length > 10;
        const isSceneStart = panel.panelNumber === 1 || panel.sceneId !== prevPanel?.sceneId;
        const isSceneEnd = nextPanel && panel.sceneId !== nextPanel.sceneId;

        const getCoherentMovement = (): string => {
            if (isSceneStart) return '静止';
            if (isSceneEnd) return '抽离后拉';
            if (nextHasDialogue) return '静止';
            if (prevMovement === '聚焦推进' || prevMovement === '爆发急推' || prevMovement.includes('推')) {
                return '静止';
            }
            if (prevMovement === '抽离后拉' || prevMovement.includes('拉')) {
                return '聚焦推进';
            }
            if (prevMovement === '静止' || prevMovement === '') {
                if (mood.includes('TENSE') || mood.includes('ANGRY')) return '爆发急推';
                if (mood.includes('SAD') || mood.includes('LONELY')) return '压抑下降';
                if (mood.includes('REVEAL')) return '升华上升';
                return '陪伴平移';
            }
            return '静止';
        };

        if (mood.includes('TENSE') || mood.includes('ANGRY')) {
            panel.cameraMovement = isSceneStart ? '静止' : '手持抖动';
        } else if (mood.includes('SAD') || mood.includes('LONELY')) {
            panel.cameraMovement = getCoherentMovement();
        } else if (mood.includes('MYSTERY') || mood.includes('SUSPENSE')) {
            panel.cameraMovement = '探索横摇';
        } else if (mood.includes('REVEAL') || mood.includes('SUBLIME')) {
            panel.cameraMovement = isSceneEnd ? '抽离后拉' : '升华上升';
        } else if (mood.includes('ROMANTIC') || mood.includes('CALM')) {
            panel.cameraMovement = '陪伴平移';
        } else if (mood.includes('ACTION') || mood.includes('CHASE')) {
            panel.cameraMovement = '跟';
        } else if (panel.dialogue && panel.dialogue.length > 20) {
            panel.cameraMovement = '静止';
        } else {
            panel.cameraMovement = getCoherentMovement();
        }
    }

    // 4. 智能推断起始帧和结束帧
    if (!panel.startFrame || panel.startFrame === '静止画面') {
        const chars = panel.characters?.join('、') || '主体';
        const movement = panel.movementType || panel.cameraMovement || '静止';

        if (movement === 'DOLLY_IN' || movement === '推' || movement === '聚焦推进' || movement === '爆发急推') {
            panel.startFrame = `${chars}处于全景构图中心`;
            panel.endFrame = `${chars}面部特写，表情细节清晰`;
        } else if (movement === 'DOLLY_OUT' || movement === '拉' || movement === '抽离后拉' || movement === '爆发急拉') {
            panel.startFrame = `${chars}近景特写`;
            panel.endFrame = `${chars}在广阔远景中显得渺小`;
        } else if (movement === 'FOLLOW' || movement === '跟' || movement === '陪伴平移') {
            panel.startFrame = `${chars}开始侧向/正向移动`;
            panel.endFrame = `保持与${chars}同步高度的动态跟随`;
        } else if (movement === 'PAN_L' || movement === 'PAN_R' || movement === '探索横摇') {
            panel.startFrame = `场景边缘起始点，${chars}尚未入画`;
            panel.endFrame = `横移扫过场景，${chars}出现在黄金分割点`;
        } else if (panel.dialogue) {
            panel.startFrame = `${chars}开口瞬间的气息捕捉`;
            panel.endFrame = `${chars}说完对白后的微表情收尾`;
        } else {
            panel.startFrame = `${chars}处于画面稳定构图位置`;
            panel.endFrame = `画面保持稳定，光影微动`;
        }
    }

    // 5. 智能转场推断
    if (!panel.transition || panel.transition === '切至') {
        if (desc.includes('回忆') || desc.includes('过去')) {
            panel.transition = '溶至';
        } else if (desc.includes('惊醒') || desc.includes('突变')) {
            panel.transition = '闪白';
        } else if (desc.includes('落幕') || desc.includes('结束')) {
            panel.transition = '淡出';
        }
    }

    // 6. 智能推断运动速度
    if (!panel.motionSpeed || panel.motionSpeed === 'normal') {
        if (mood.includes('TENSE') || mood.includes('ACTION')) {
            panel.motionSpeed = 'fast';
        } else if (mood.includes('CALM') || mood.includes('SAD')) {
            panel.motionSpeed = 'slow';
        }
    }

    // 7. 智能推断镜头参数
    const shotSize = panel.shotSize || panel.shot || 'MS';
    if (!panel.lens) {
        if (shotSize === 'ECU' || shotSize === '大特写') {
            panel.lens = '100mm macro';
            panel.fStop = 'f/2.8';
            panel.depthOfField = 'SHALLOW';
        } else if (shotSize === 'CU' || shotSize === '特写') {
            panel.lens = '85mm';
            panel.fStop = 'f/2';
            panel.depthOfField = 'SHALLOW';
        } else if (shotSize === 'MCU' || shotSize === '近景') {
            panel.lens = '50mm';
            panel.fStop = 'f/2.8';
            panel.depthOfField = 'SHALLOW';
        } else if (shotSize === 'MS' || shotSize === '中景') {
            panel.lens = '50mm';
            panel.fStop = 'f/4';
            panel.depthOfField = 'NORMAL';
        } else if (shotSize === 'MWS' || shotSize === '中全景') {
            panel.lens = '35mm';
            panel.fStop = 'f/5.6';
            panel.depthOfField = 'NORMAL';
        } else if (shotSize === 'WS' || shotSize === '全景' || shotSize === '远景') {
            panel.lens = '24mm';
            panel.fStop = 'f/8';
            panel.depthOfField = 'DEEP';
        } else if (shotSize === 'EWS' || shotSize === '大远景') {
            panel.lens = '16mm';
            panel.fStop = 'f/11';
            panel.depthOfField = 'DEEP';
        } else {
            panel.lens = '50mm';
            panel.fStop = 'f/4';
            panel.depthOfField = 'NORMAL';
        }
    }

    // 8. 智能推断灯光氛围
    if (!panel.lighting || !panel.lighting.mood) {
        panel.lighting = panel.lighting || {};
        if (mood.includes('TENSE') || mood.includes('紧张') || mood.includes('SUSPENSE')) {
            panel.lighting.mood = '低调光影，高反差';
            panel.lighting.keyLight = '侧光为主，形成明暗对比';
        } else if (mood.includes('ROMANTIC') || mood.includes('浪漫') || mood.includes('温馨')) {
            panel.lighting.mood = '柔和暖光，高调氛围';
            panel.lighting.keyLight = '柔光正面，轮廓光勾边';
        } else if (mood.includes('SAD') || mood.includes('悲伤') || mood.includes('忧郁')) {
            panel.lighting.mood = '冷色调，低饱和';
            panel.lighting.keyLight = '顶光或逆光，形成剪影';
        } else if (mood.includes('ACTION') || mood.includes('动作') || mood.includes('热血')) {
            panel.lighting.mood = '高对比，动态光效';
            panel.lighting.keyLight = '硬光为主，强调立体';
        } else if (location.includes('夜') || location.includes('晚')) {
            panel.lighting.mood = '夜景氛围，点光源为主';
            panel.lighting.keyLight = '实景光源（路灯/月光）';
            panel.lighting.practicalLights = ['城市灯光', '月光'];
        } else if (location.includes('日') || location.includes('白天')) {
            panel.lighting.mood = '自然日光，通透明亮';
            panel.lighting.keyLight = '太阳光为主光';
        } else {
            panel.lighting.mood = '自然光影';
        }
    }

    // 9. 智能提取道具列表
    if (!panel.props || panel.props.length === 0) {
        const propsExtracted: string[] = [];
        const propKeywords = ['剑', '刀', '枪', '书', '杯', '碗', '椅', '桌', '门', '窗', '灯', '镜', '笔', '纸', '信', '手机', '电脑', '车', '包', '伞', '钥匙', '戒指', '项链', '眼镜', '帽子', '花', '酒', '药', '钱', '地图', '照片'];
        for (const keyword of propKeywords) {
            if (desc.includes(keyword)) {
                propsExtracted.push(keyword);
            }
        }
        if (propsExtracted.length > 0) {
            panel.props = propsExtracted.slice(0, 5);
        }
    }

    // 10. 智能推断视觉特效
    if (!panel.vfx || panel.vfx.length === 0) {
        const vfxList: string[] = [];
        if (desc.includes('爆炸') || desc.includes('火')) {
            vfxList.push('火焰特效', '烟尘粒子');
        }
        if (desc.includes('魔法') || desc.includes('法术') || desc.includes('能量')) {
            vfxList.push('魔法光效', '能量波动');
        }
        if (desc.includes('雨') || desc.includes('雪')) {
            vfxList.push('天气粒子系统');
        }
        if (desc.includes('闪电') || desc.includes('电')) {
            vfxList.push('闪电特效');
        }
        if (desc.includes('模糊') || desc.includes('慢动作')) {
            vfxList.push('运动模糊');
        }
        if (vfxList.length > 0) {
            panel.vfx = vfxList;
        }
    }

    // 11. 智能推断调色参考
    if (!panel.colorGrade) {
        if (mood.includes('TENSE') || mood.includes('紧张')) {
            panel.colorGrade = '冷调蓝绿，去饱和';
        } else if (mood.includes('ROMANTIC') || mood.includes('浪漫')) {
            panel.colorGrade = '暖调橙黄，柔化高光';
        } else if (mood.includes('SAD') || mood.includes('悲伤')) {
            panel.colorGrade = '低饱和蓝灰，压暗中间调';
        } else if (mood.includes('ACTION') || mood.includes('热血')) {
            panel.colorGrade = '高对比橙蓝色调';
        } else if (location.includes('古') || location.includes('武侠')) {
            panel.colorGrade = '复古暖黄，略微去饱和';
        } else {
            panel.colorGrade = '自然调色';
        }
    }

    // 12. 智能推断机位标记
    if (!panel.setupShot) {
        const idx = panel.panelNumber || 1;
        if (panel.composition?.includes('居右') || panel.composition?.includes('左侧')) {
            panel.setupShot = 'A机位';
        } else if (panel.composition?.includes('居左') || panel.composition?.includes('右侧')) {
            panel.setupShot = 'B机位';
        } else if (idx % 2 === 1) {
            panel.setupShot = 'A机位';
        } else {
            panel.setupShot = 'B机位';
        }
    }

    // 12.1 智能轴线判断
    if (!panel.axisNote) {
        const charCount = panel.characters?.length || 0;
        const prevChars = prevPanel?.characters || [];
        const sameChars = panel.characters?.filter((c: string) => prevChars.includes(c)) || [];
        const isSceneChange = panel.sceneId !== prevPanel?.sceneId;

        if (isSceneChange) {
            panel.axisNote = '新场景，重新建立轴线';
        } else if (charCount >= 3) {
            panel.axisNote = '群戏场景，建立主轴后保持一致';
        } else if (panel.dialogue && charCount >= 2) {
            panel.axisNote = '保持180°轴线，正反打切换';
        } else if (sameChars.length > 0 && charCount <= 2) {
            panel.axisNote = `延续上一镜轴线，${sameChars[0]}位置保持`;
        } else if (panel.cameraMovement === '跟' || panel.movementType === 'FOLLOW') {
            panel.axisNote = '动态轴线，随角色移动';
        } else if (charCount === 1) {
            panel.axisNote = '单人镜头，注意与前后镜头朝向一致';
        } else {
            panel.axisNote = '保持轴线';
        }
    }

    // 13. 智能推断构图
    if (!panel.composition) {
        const shotSizeVal = panel.shotSize || panel.shot || '';

        if (desc.includes('窗') || desc.includes('门框') || desc.includes('拱门') || desc.includes('走廊尽头')) {
            panel.composition = '框架构图，人物被门窗框住';
        } else if (desc.includes('道路') || desc.includes('走廊') || desc.includes('隧道') || desc.includes('铁轨')) {
            panel.composition = '引导线构图，纵深延伸';
        } else if (desc.includes('镜子') || desc.includes('水面倒影') || desc.includes('对称')) {
            panel.composition = '对称/反射构图';
        } else if (desc.includes('背影') || desc.includes('剪影') || desc.includes('逆光')) {
            panel.composition = '轮廓构图，强调形态';
        } else if (desc.includes('俯瞰') || desc.includes('鸟瞰') || desc.includes('从上往下')) {
            panel.composition = '俯视构图，展示空间关系';
        } else if (desc.includes('仰望') || desc.includes('从下往上') || desc.includes('高耸')) {
            panel.composition = '仰视构图，强调威严/渺小';
        } else if (desc.includes('角落') || desc.includes('边缘') || desc.includes('靠窗')) {
            panel.composition = '负空间构图，主体偏侧留白';
        } else if (desc.includes('人群') || desc.includes('围观') || desc.includes('中心')) {
            panel.composition = '中心放射构图';
        } else if (shotSizeVal === 'WS' || shotSizeVal === 'EWS' || shotSizeVal === '远景' || shotSizeVal === '大远景') {
            panel.composition = '三分法构图，环境占2/3';
        } else if (shotSizeVal === 'OTS' || panel.dialogue) {
            panel.composition = '过肩构图，主体偏一侧';
        } else if (panel.characters?.length >= 2) {
            panel.composition = '对称构图，双人居中';
        } else if (shotSizeVal === 'CU' || shotSizeVal === 'ECU' || shotSizeVal === '特写') {
            panel.composition = '中心构图，人物居中';
        } else {
            panel.composition = '三分法构图';
        }
    }

    // 14. 智能推断镜头意图
    if (!panel.shotIntent) {
        const shotSizeVal = panel.shotSize || panel.shot || '';
        if (shotSizeVal === 'WS' || shotSizeVal === 'EWS' || shotSizeVal === '远景') {
            panel.shotIntent = '建立空间，交代环境';
        } else if (panel.dialogue) {
            panel.shotIntent = '展示对话，传递信息';
        } else if (shotSizeVal === 'CU' || shotSizeVal === 'ECU' || shotSizeVal === '特写') {
            panel.shotIntent = '揭示细节，强调情绪';
        } else if (mood.includes('TENSE') || mood.includes('紧张')) {
            panel.shotIntent = '制造紧张，推进冲突';
        } else if (mood.includes('REVEAL')) {
            panel.shotIntent = '揭示人物，引发好奇';
        } else if (panel.panelNumber <= 2) {
            panel.shotIntent = '开场建立，吸引注意';
        } else {
            panel.shotIntent = '推进叙事';
        }
    }

    // 15. 智能推断环境动态
    if (!panel.environmentMotion) {
        const timeOfDay = (scene?.timeOfDay || '').toLowerCase();

        const TIME_ENVIRONMENT_MAP: Record<string, string> = {
            '清晨': '晨雾弥漫，露水滴落',
            '早晨': '阳光渐强，鸟鸣阵阵',
            '黄昏': '夕阳余晖，天色渐暗',
            '傍晚': '霞光万道，影子拉长',
            '深夜': '月光摇曳，虫鸣阵阵',
            '夜晚': '灯光点点，夜色朦胧',
            '正午': '阳光直射，影子短小',
            '午后': '阳光斜照，微风轻拂'
        };

        if (location.includes('雨') || desc.includes('下雨') || desc.includes('暴雨')) {
            panel.environmentMotion = '雨水滴落，水花飞溅';
        } else if (location.includes('雪') || desc.includes('下雪') || desc.includes('飘雪')) {
            panel.environmentMotion = '雪花飘落，白雪皑皑';
        } else if (location.includes('风') || desc.includes('狂风') || desc.includes('大风')) {
            panel.environmentMotion = '狂风呼啸，尘土飞扬';
        } else if (location.includes('风') || desc.includes('微风') || desc.includes('风')) {
            panel.environmentMotion = '微风轻拂，衣袂飘动';
        } else if (location.includes('海') || location.includes('港')) {
            panel.environmentMotion = '海浪拍岸，海鸥盘旋';
        } else if (location.includes('河') || location.includes('溪') || location.includes('水')) {
            panel.environmentMotion = '水波涟漪，倒影摇曳';
        } else if (location.includes('森') || location.includes('林') || location.includes('树')) {
            panel.environmentMotion = '树叶轻摇，光影斑驳';
        } else if (location.includes('火') || desc.includes('火焰') || desc.includes('篝火')) {
            panel.environmentMotion = '火焰跳动，烟雾升腾';
        } else if (location.includes('市') || location.includes('街') || location.includes('道')) {
            panel.environmentMotion = '行人走动，车辆穿梭';
        } else if (location.includes('酒') || location.includes('餐') || location.includes('咖啡')) {
            panel.environmentMotion = '人声鼎沸，杯盏交错';
        } else if (location.includes('工厂') || location.includes('车间')) {
            panel.environmentMotion = '机器运转，蒸汽喷涌';
        } else {
            let matched = false;
            for (const [key, value] of Object.entries(TIME_ENVIRONMENT_MAP)) {
                if (timeOfDay.includes(key) || location.includes(key)) {
                    panel.environmentMotion = value;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                panel.environmentMotion = '环境平静，光影自然';
            }
        }
    }

    // 16. 智能提取角色动作
    if (!panel.characterActions || panel.characterActions.length === 0) {
        const actions: string[] = [];

        const ACTION_PATTERNS = [
            '皱眉', '微笑', '大笑', '哭泣', '叹息', '惊讶', '愤怒', '沉思', '凝视', '闭眼',
            '转身', '点头', '摇头', '挥手', '握手', '拥抱', '推开', '拉住', '低头', '抬头',
            '起身', '坐下', '躺下', '跪下', '弯腰', '伸手', '缩手', '跺脚', '踱步',
            '走向', '走过', '跑向', '冲向', '逃离', '靠近', '后退', '绕过', '跳起', '踏入',
            '拿起', '放下', '打开', '关上', '翻开', '撕毁', '扔掉', '接住', '推门', '敲门',
            '说道', '喊道', '低语', '怒吼', '呢喃', '询问', '回答', '解释', '命令', '恳求'
        ];

        if (panel.characters && panel.characters.length > 0) {
            for (let i = 0; i < Math.min(panel.characters.length, 3); i++) {
                const char = panel.characters[i];
                const charFound: string[] = [];

                for (const action of ACTION_PATTERNS) {
                    if (desc.includes(`${char}${action}`) || desc.includes(`${char} ${action}`)) {
                        charFound.push(`${char}:${action}`);
                    } else if (desc.includes(action) && i === 0) {
                        charFound.push(`${char}:${action}`);
                        break;
                    }
                }

                if (charFound.length > 0) {
                    actions.push(charFound[0]);
                }
            }

            if (panel.dialogue && panel.characters[0] && !actions.some(a => a.includes('说'))) {
                actions.push(`${panel.characters[0]}:说话`);
            }
        }

        if (actions.length > 0) {
            panel.characterActions = actions;
        }
    }

    console.log(`[智能填充增强版] 音效: ${panel.soundEffects?.join(',')} | 音乐: ${panel.music} | 运镜: ${panel.cameraMovement} | 镜头: ${panel.lens} | 光影: ${panel.lighting?.mood}`);

    return panel;
}
