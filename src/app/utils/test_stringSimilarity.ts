import { calculateSimilarity, levenshteinDistance, findPotentialDuplicates } from './stringSimilarity';

function runTests() {
    console.log('--- 开始测试 stringSimilarity ---');

    // 1. Levenshtein 距离测试
    const dist1 = levenshteinDistance('张三', '张三');
    console.log(`'张三' vs '张三' 距离: ${dist1} (预期: 0)`);

    const dist2 = levenshteinDistance('张三', '李四');
    console.log(`'张三' vs '李四' 距离: ${dist2} (预期: 2)`);

    const dist3 = levenshteinDistance('张三', '张三(青年)');
    console.log(`'张三' vs '张三(青年)' 距离: ${dist3} (预期: 4)`);

    // 2. 相似度分数测试
    const score1 = calculateSimilarity('张三', '张三');
    console.log(`'张三' vs '张三' 分数: ${score1} (预期: 1.0)`);

    const score2 = calculateSimilarity('张三', '张三(主角)');
    console.log(`'张三' vs '张三(主角)' 分数: ${score2} (预期: > 0.8)`);

    const score3 = calculateSimilarity('实验室', '办公室');
    console.log(`'实验室' vs '办公室' 分数: ${score3} (预期: < 0.5)`);

    // 3. 重复项查找测试
    const existing = [
        { name: '张三', id: '1', aliases: ['老张'] },
        { name: '李四', id: '2' },
        { name: '实验室', id: '3' }
    ];

    const newItem = { name: '张三(青年)' } as any;
    const duplicates = findPotentialDuplicates(newItem, existing);
    console.log(`'张三(青年)' 的重复项:`, duplicates.map(d => `${d.item.name} (${Math.round(d.score * 100)}%)`));
    // 预期: 包含 张三

    const newItem2 = { name: '老张' } as any;
    const duplicates2 = findPotentialDuplicates(newItem2, existing);
    console.log(`'老张' 的重复项:`, duplicates2.map(d => `${d.item.name} (${Math.round(d.score * 100)}%)`));
    // 预期: 包含 张三 (命中了别名)

    console.log('--- 测试结束 ---');
}

runTests();
