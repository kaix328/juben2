/**
 * 数据分析调试工具
 * 在浏览器控制台中使用
 */

// 🔍 诊断工具
window.debugAnalytics = {
    // 1. 检查localStorage数据
    checkStorage() {
        console.log('=== 检查localStorage数据 ===');
        const data = localStorage.getItem('quality-reports');
        
        if (!data) {
            console.error('❌ localStorage中没有质量报告数据');
            console.log('💡 请先执行质量检查');
            return null;
        }
        
        try {
            const parsed = JSON.parse(data);
            const keys = Object.keys(parsed);
            
            console.log('✅ 数据有效');
            console.log('📊 报告数量:', keys.length);
            console.log('🔑 所有键:', keys);
            
            keys.forEach(key => {
                const report = parsed[key];
                console.log(`  📄 ${key}:`, {
                    checkTime: report.checkTime,
                    qualityScore: report.summary?.qualityScore,
                    totalIssues: report.totalIssues,
                    totalPanels: report.totalPanels
                });
            });
            
            return parsed;
        } catch (error) {
            console.error('❌ 数据格式错误:', error);
            return null;
        }
    },
    
    // 2. 检查当前projectId
    checkProjectId() {
        console.log('=== 检查projectId ===');
        const url = window.location.href;
        console.log('🌐 当前URL:', url);
        
        const match = url.match(/storyboard\/([^\/]+)/);
        if (match) {
            const chapterId = match[1];
            console.log('✅ 当前chapterId:', chapterId);
            return chapterId;
        } else {
            console.error('❌ 无法从URL中提取chapterId');
            return null;
        }
    },
    
    // 3. 检查数据匹配
    checkMatch() {
        console.log('=== 检查数据匹配 ===');
        const chapterId = this.checkProjectId();
        const data = this.checkStorage();
        
        if (!chapterId || !data) {
            console.error('❌ 无法进行匹配检查');
            return;
        }
        
        const matchingKeys = Object.keys(data).filter(key => key.startsWith(chapterId));
        
        if (matchingKeys.length > 0) {
            console.log('✅ 找到匹配的报告:', matchingKeys.length, '个');
            console.log('📋 匹配的键:', matchingKeys);
        } else {
            console.error('❌ 没有找到匹配的报告');
            console.log('💡 可能的原因:');
            console.log('  1. projectId不匹配');
            console.log('  2. 还没有执行过质量检查');
            console.log('  3. 数据被清空了');
            
            console.log('\n🔧 可用的projectId:');
            const uniqueProjects = [...new Set(Object.keys(data).map(k => k.split('-')[0]))];
            uniqueProjects.forEach(id => {
                console.log(`  - ${id}`);
            });
        }
    },
    
    // 4. 生成测试数据
    generateTestData(count = 5) {
        console.log('=== 生成测试数据 ===');
        const chapterId = this.checkProjectId();
        
        if (!chapterId) {
            console.error('❌ 无法生成测试数据：找不到chapterId');
            return;
        }
        
        const reports = {};
        const now = Date.now();
        
        for (let i = 0; i < count; i++) {
            const timestamp = new Date(now - (count - 1 - i) * 24 * 60 * 60 * 1000).toISOString();
            const key = `${chapterId}-${timestamp}`;
            
            reports[key] = {
                checkTime: timestamp,
                totalPanels: 20 + i * 2,
                totalIssues: Math.max(0, 15 - i * 3),
                summary: {
                    qualityScore: Math.min(100, 65 + i * 7),
                    errorCount: Math.max(0, 5 - i),
                    warningCount: Math.max(0, 8 - i),
                    infoCount: Math.max(0, 4 - i)
                },
                errors: [],
                warnings: [],
                infos: []
            };
        }
        
        // 合并现有数据
        const existingData = localStorage.getItem('quality-reports');
        if (existingData) {
            const existing = JSON.parse(existingData);
            Object.assign(reports, existing);
        }
        
        localStorage.setItem('quality-reports', JSON.stringify(reports));
        
        console.log(`✅ 已生成 ${count} 个测试报告`);
        console.log('📊 质量分数趋势:', Object.values(reports)
            .filter(r => r.checkTime)
            .sort((a, b) => new Date(a.checkTime).getTime() - new Date(b.checkTime).getTime())
            .map(r => r.summary.qualityScore)
        );
        console.log('🔄 请刷新页面查看数据分析');
    },
    
    // 5. 清除所有数据
    clearAllData() {
        console.log('=== 清除所有数据 ===');
        localStorage.removeItem('quality-reports');
        console.log('✅ 已清除所有质量报告数据');
        console.log('🔄 请刷新页面');
    },
    
    // 6. 清除当前项目数据
    clearCurrentProject() {
        console.log('=== 清除当前项目数据 ===');
        const chapterId = this.checkProjectId();
        
        if (!chapterId) {
            console.error('❌ 无法清除：找不到chapterId');
            return;
        }
        
        const data = localStorage.getItem('quality-reports');
        if (!data) {
            console.log('ℹ️ 没有数据需要清除');
            return;
        }
        
        const parsed = JSON.parse(data);
        const filtered = {};
        
        Object.entries(parsed).forEach(([key, value]) => {
            if (!key.startsWith(chapterId)) {
                filtered[key] = value;
            }
        });
        
        localStorage.setItem('quality-reports', JSON.stringify(filtered));
        console.log(`✅ 已清除项目 ${chapterId} 的数据`);
        console.log('🔄 请刷新页面');
    },
    
    // 7. 完整诊断
    diagnose() {
        console.log('\n');
        console.log('╔════════════════════════════════════════╗');
        console.log('║   数据分析完整诊断                      ║');
        console.log('╚════════════════════════════════════════╝');
        console.log('\n');
        
        this.checkProjectId();
        console.log('\n');
        this.checkStorage();
        console.log('\n');
        this.checkMatch();
        
        console.log('\n');
        console.log('╔════════════════════════════════════════╗');
        console.log('║   可用命令                              ║');
        console.log('╚════════════════════════════════════════╝');
        console.log('debugAnalytics.generateTestData(5)  - 生成5个测试报告');
        console.log('debugAnalytics.clearCurrentProject() - 清除当前项目数据');
        console.log('debugAnalytics.clearAllData()       - 清除所有数据');
        console.log('\n');
    }
};

// 自动运行诊断
console.log('🔧 数据分析调试工具已加载');
console.log('💡 运行 debugAnalytics.diagnose() 进行完整诊断');
console.log('💡 运行 debugAnalytics.generateTestData() 生成测试数据');
