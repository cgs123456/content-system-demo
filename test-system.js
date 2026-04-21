
const http = require('http');

// 测试基础 URL
const BASE_URL = 'http://localhost:3001';

console.log('========================================');
console.log('🧪 Content System 完整测试');
console.log('========================================\n');

// 辅助函数：发送 HTTP 请求
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ data: jsonData, statusCode: res.statusCode });
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

// 测试结果记录
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// 单个测试函数
function test(name, fn) {
  console.log(`测试: ${name}...`);
  try {
    fn();
    console.log(`✅ ${name}  PASSED\n`);
    results.passed++;
    results.tests.push({ name, passed: true });
  } catch (e) {
    console.log(`❌ ${name}  FAILED: ${e.message}\n`);
    results.failed++;
    results.tests.push({ name, passed: false, error: e.message });
  }
}

// 主测试流程
async function runAllTests() {
  try {
    console.log('📡 检查服务器连接...\n');
    const rootRes = await request('GET', '/');
    console.log('✅ 服务器响应正常! Status:', rootRes.statusCode);
    
    // 测试数据记录
    let member1, member2, community, article, post, chapter1, chapter2, comment;
    
    console.log('\n========================================');
    console.log('1️⃣ 测试成员管理');
    console.log('========================================\n');
    
    // 测试创建成员
    console.log('创建成员 Alice...');
    const createMemberRes = await request('POST', '/api/members', { 
      name: 'Alice', 
      email: 'alice@test.com' 
    });
    if (createMemberRes.statusCode === 201) {
      member1 = createMemberRes.data;
      console.log('✅ 创建成员成功! ID:', member1.id);
      results.passed++;
    } else {
      console.log('❌ 创建成员失败');
      results.failed++;
    }
    
    // 创建 Bob
    console.log('\n创建成员 Bob...');
    const createMember2Res = await request('POST', '/api/members', { 
      name: 'Bob', 
      email: 'bob@test.com' 
    });
    if (createMember2Res.statusCode === 201) {
      member2 = createMember2Res.data;
      console.log('✅ 创建 Bob 成功!');
      results.passed++;
    }
    
    // 测试获取所有成员
    console.log('\n获取所有成员...');
    const getMembersRes = await request('GET', '/api/members');
    if (getMembersRes.statusCode === 200 && getMembersRes.data.length >= 2) {
      console.log('✅ 获取成员成功，共', getMembersRes.data.length, '个成员');
      results.passed++;
    }
    
    console.log('\n========================================');
    console.log('2️⃣ 测试社区管理');
    console.log('========================================\n');
    
    // 测试创建社区
    console.log('创建社区 Tech Club...');
    const createCommunityRes = await request('POST', '/api/communities', {
      name: 'Tech Club',
      description: '一个技术社区',
      founderId: member1.id
    });
    if (createCommunityRes.statusCode === 201) {
      community = createCommunityRes.data;
      console.log('✅ 创建社区成功! ID:', community.id);
      results.passed++;
    }
    
    // 测试加入社区
    console.log('\nBob 加入社区...');
    const joinRes = await request('POST', `/api/communities/${community.id}/join`, {
      memberId: member2.id
    });
    if (joinRes.data.success === true) {
      console.log('✅ 加入社区成功!');
      results.passed++;
    }
    
    console.log('\n========================================');
    console.log('3️⃣ 测试内容发布');
    console.log('========================================\n');
    
    // 成员发布文章
    console.log('Alice 发布文章...');
    const articleRes = await request('POST', '/api/contents', {
      publisherType: 'member',
      memberId: member1.id,
      contentType: 'article',
      title: 'JavaScript 入门教程',
      body: '这是一篇关于 JavaScript 的入门教程...'
    });
    if (articleRes.statusCode === 201) {
      article = articleRes.data;
      console.log('✅ 文章发布成功! ID:', article.id);
      results.passed++;
    }
    
    // 发布章节 1
    console.log('\n发布章节 1...');
    const chapter1Res = await request('POST', '/api/contents', {
      publisherType: 'member',
      memberId: member1.id,
      contentType: 'note',
      title: '1. 基础语法',
      body: '变量、函数等基础内容...'
    });
    if (chapter1Res.statusCode === 201) {
      chapter1 = chapter1Res.data;
      console.log('✅ 章节 1 发布成功!');
      results.passed++;
    }
    
    // 发布章节 2
    console.log('\n发布章节 2...');
    const chapter2Res = await request('POST', '/api/contents', {
      publisherType: 'member',
      memberId: member1.id,
      contentType: 'note',
      title: '2. 数据类型',
      body: '字符串、数字、数组等...'
    });
    if (chapter2Res.statusCode === 201) {
      chapter2 = chapter2Res.data;
      console.log('✅ 章节 2 发布成功!');
      results.passed++;
    }
    
    // 社区发布公告
    console.log('\n社区发布公告...');
    const communityPostRes = await request('POST', '/api/contents', {
      publisherType: 'community',
      communityId: community.id,
      operatorId: member1.id,
      contentType: 'post',
      title: '社区欢迎公告',
      body: '欢迎来到 Tech Club 社区！'
    });
    if (communityPostRes.statusCode === 201) {
      post = communityPostRes.data;
      console.log('✅ 社区公告发布成功!');
      results.passed++;
    }
    
    console.log('\n========================================');
    console.log('4️⃣ 测试内容关系');
    console.log('========================================\n');
    
    // 建立父子关系
    console.log('建立文章-章节的结构关系...');
    const structuralRes = await request('POST', '/api/relations/structural', {
      parentId: article.id,
      childId: chapter1.id,
      order: 1
    });
    // 添加第二个章节
    await request('POST', '/api/relations/structural', {
      parentId: article.id,
      childId: chapter2.id,
      order: 2
    });
    if (structuralRes.data.success === true) {
      console.log('✅ 结构关系建立成功!');
      results.passed++;
    }
    
    // 测试获取子内容
    console.log('\n获取文章的子内容...');
    const childrenRes = await request('GET', `/api/contents/${article.id}/children`);
    if (childrenRes.statusCode === 200 && childrenRes.data.length === 2) {
      console.log('✅ 获取子内容成功，共', childrenRes.data.length, '个章节!');
      results.passed++;
    }
    
    // Bob 发布帖子并引用 Alice 的文章
    console.log('\nBob 发布帖子并引用...');
    const bobPostRes = await request('POST', '/api/contents', {
      publisherType: 'member',
      memberId: member2.id,
      contentType: 'post',
      title: '推荐好文',
      body: '推荐大家看 Alice 的这篇文章!'
    });
    const bobPost = bobPostRes.data;
    
    // 添加引用关系
    const referenceRes = await request('POST', '/api/relations/reference', {
      fromId: bobPost.id,
      toId: article.id,
      relationType: 'quote'
    });
    if (referenceRes.data.success === true) {
      console.log('✅ 引用关系建立成功!');
      results.passed++;
    }
    
    console.log('\n========================================');
    console.log('5️⃣ 测试互动功能');
    console.log('========================================\n');
    
    // Bob 点赞
    console.log('Bob 给文章点赞...');
    const likeRes = await request('POST', `/api/contents/${article.id}/like`, {
      author: { id: member2.id, type: 'member', name: 'Bob' }
    });
    if (likeRes.data.success === true) {
      console.log('✅ 点赞成功!');
      results.passed++;
    }
    
    // Bob 评论
    console.log('\nBob 发表评论...');
    const commentRes = await request('POST', `/api/contents/${article.id}/comment`, {
      author: { id: member2.id, type: 'member', name: 'Bob' },
      body: '这篇文章写得太好了！'
    });
    if (commentRes.statusCode === 201) {
      comment = commentRes.data;
      console.log('✅ 评论发布成功! ID:', comment.id);
      results.passed++;
    }
    
    console.log('\n========================================');
    console.log('6️⃣ 测试内容查询');
    console.log('========================================\n');
    
    // 获取文章详情（带关系）
    console.log('获取文章详情（带关系）...');
    const detailRes = await request('GET', `/api/contents/${article.id}?relations=true`);
    if (detailRes.statusCode === 200 && detailRes.data.content) {
      console.log('✅ 获取详情成功!');
      console.log('   - 标题:', detailRes.data.content.title);
      console.log('   - 子内容:', detailRes.data.children.length);
      console.log('   - 互动数:', detailRes.data.interactions.length);
      results.passed++;
    }
    
    // 获取所有内容列表
    console.log('\n获取所有内容列表...');
    const listRes = await request('GET', '/api/contents');
    if (listRes.statusCode === 200) {
      console.log('✅ 内容列表获取成功，共', listRes.data.length, '个内容!');
      listRes.data.forEach((c, i) => {
        console.log(`   ${i + 1}. [${c.type.toUpperCase()}] ${c.title || c.body.substring(0, 20)}...`);
      });
      results.passed++;
    }
    
    // 测试结束，打印总结
    console.log('\n========================================');
    console.log('📊 测试结果总结');
    console.log('========================================\n');
    console.log('✅ PASSED:', results.passed);
    console.log('❌ FAILED:', results.failed);
    console.log('📈 成功率:', Math.round(results.passed / (results.passed + results.failed) * 100) + '%\n');
    
    if (results.failed === 0) {
      console.log('🎉 所有测试都通过了! 系统运行完美!');
    } else {
      console.log('⚠️ 有一些测试失败，建议检查');
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
runAllTests();
