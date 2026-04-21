
const http = require('http');

const API_BASE = 'http://localhost:3001/api';

async function apiRequest(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, API_BASE);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ data: JSON.parse(data), statusCode: res.statusCode });
                } catch (e) {
                    resolve({ data, statusCode: res.statusCode });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function initializeData() {
    console.log('========================================');
    console.log('  初始化系统数据');
    console.log('========================================\n');

    try {
        // 创建成员
        console.log('📝 创建成员...');
        const alice = (await apiRequest('/members', 'POST', { name: 'Alice', email: 'alice@example.com' })).data;
        const bob = (await apiRequest('/members', 'POST', { name: 'Bob', email: 'bob@example.com' })).data;
        const charlie = (await apiRequest('/members', 'POST', { name: 'Charlie', email: 'charlie@example.com' })).data;
        console.log('✅ 成员创建成功:', alice.name, bob.name, charlie.name);

        // 创建社区
        console.log('\n🏘️ 创建社区...');
        const community = (await apiRequest('/communities', 'POST', {
            name: 'Tech Enthusiasts',
            description: '技术爱好者社区',
            founderId: alice.id
        })).data;
        console.log('✅ 社区创建成功:', community.name);

        // Alice 发布一些内容
        console.log('\n📄 Alice 发布内容...');
        
        const article = (await apiRequest('/contents', 'POST', {
            publisherType: 'member',
            memberId: alice.id,
            contentType: 'article',
            title: 'JavaScript 入门指南',
            body: '本指南将带你从零基础开始学习 JavaScript，包括变量声明、函数定义、DOM 操作等核心概念。适合编程新手阅读！'
        })).data;
        
        const post = (await apiRequest('/contents', 'POST', {
            publisherType: 'member',
            memberId: alice.id,
            contentType: 'post',
            title: '欢迎加入社区！',
            body: '大家好！欢迎来到 Tech Enthusiasts 社区，这里是技术爱好者的聚集地。'
        })).data;
        
        const draft = (await apiRequest('/contents', 'POST', {
            publisherType: 'member',
            memberId: alice.id,
            contentType: 'note',
            title: '学习笔记（草稿）',
            body: '今天学到了很多新知识，先记录下来，整理好再发布...',
            status: 'draft'
        })).data;
        
        console.log('✅ Alice 发布内容完成');

        // Bob 发布并回复
        console.log('\n📄 Bob 发布并回复...');
        const bobPost = (await apiRequest('/contents', 'POST', {
            publisherType: 'member',
            memberId: bob.id,
            contentType: 'post',
            title: '推荐一篇好文章',
            body: '强烈推荐 Alice 写的 JavaScript 入门指南！'
        })).data;
        
        // Bob 给 Alice 的文章点赞
        await apiRequest(`/contents/${article.id}/like`, 'POST', {
            author: { id: bob.id, type: 'member', name: bob.name }
        });
        
        // Bob 回复 Alice
        const reply = (await apiRequest(`/contents/${post.id}/reply`, 'POST', {
            author: { id: bob.id, type: 'member', name: bob.name },
            body: '谢谢 Alice 创办这个社区！'
        })).data;
        
        console.log('✅ Bob 完成操作');

        console.log('\n========================================');
        console.log('  🎉 数据初始化完成！');
        console.log('========================================');
        console.log('\n📖 访问 http://localhost:3001 查看前端界面');
        console.log('👤 使用 Alice 作为初始用户开始体验');
        console.log('\n可用用户: Alice, Bob, Charlie');
        console.log('可用内容: 3篇文章, 1篇草稿, 1个回复');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ 初始化失败:', error);
    }
}

initializeData();
