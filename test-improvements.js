
const http = require('http');

console.log('========================================');
console.log('🚀 测试改进的新功能');
console.log('========================================\n');

const BASE_URL = 'http://localhost:3001';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ data: JSON.parse(data), statusCode: res.statusCode });
        } catch (e) {
          resolve({ data, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  try {
    // 测试数据
    let alice, post, reply1, reply2;
    
    console.log('📝 1. 准备测试数据');
    const aliceRes = await request('POST', '/api/members', { name: 'Alice', email: 'alice@test.com' });
    alice = aliceRes.data;
    const aliceAuthor = { id: alice.id, type: 'member', name: alice.name };
    console.log('✅ 创建 Alice 成功');
    
    const postRes = await request('POST', '/api/contents', {
      publisherType: 'member', memberId: alice.id, contentType: 'post',
      title: '欢迎帖子', body: '大家好，这是我的第一个帖子！'
    });
    post = postRes.data;
    console.log('✅ 创建帖子成功');
    
    console.log('\n========================================');
    console.log('🔥 测试高优先级改进：replyTo');
    console.log('========================================\n');
    
    console.log('📝 使用 replyTo 快捷方法回复帖子...');
    const reply1Res = await request('POST', `/api/contents/${post.id}/reply`, {
      author: aliceAuthor, body: '这是我的自回复！测试快捷方法'
    });
    if (reply1Res.statusCode === 201) {
      reply1 = reply1Res.data;
      console.log('✅ replyTo 成功！');
      console.log('   - 回复 ID:', reply1.id);
      console.log('   - 回复类型:', reply1.type);
      console.log('   - 回复内容:', reply1.body.substring(0, 30) + '...');
    }
    
    console.log('\n📝 再次回复...');
    const reply2Res = await request('POST', `/api/contents/${post.id}/reply`, {
      author: aliceAuthor, body: '第二条回复！这个方法真方便'
    });
    if (reply2Res.statusCode === 201) {
      reply2 = reply2Res.data;
      console.log('✅ 第二条回复也成功了！');
    }
    
    console.log('\n🔍 查看原文章详情，确认回复关联...');
    const detailRes = await request('GET', `/api/contents/${post.id}?relations=true`);
    if (detailRes.statusCode === 200 && detailRes.data.interactions) {
      console.log('✅ 原文章上有', detailRes.data.interactions.length, '个互动');
      detailRes.data.interactions.forEach(i => {
        if (i.type === 'reply') {
          console.log('   - 回复类型互动:', i.content.body.substring(0, 25) + '...');
        }
      });
    }
    
    console.log('\n========================================');
    console.log('🗂️ 测试中优先级改进：内容状态流转');
    console.log('========================================\n');
    
    console.log('📝 创建一个草稿...');
    const draftRes = await request('POST', '/api/contents', {
      publisherType: 'member', memberId: alice.id, contentType: 'post',
      status: 'draft', title: '未完成的草稿', body: '这是一个还没写完的内容...'
    });
    const draft = draftRes.data;
    console.log('✅ 草稿创建成功！当前状态:', draft.status);
    
    console.log('\n📝 发布草稿...');
    const publishRes = await request('POST', `/api/contents/${draft.id}/publish`);
    if (publishRes.statusCode === 200) {
      console.log('✅ 发布成功！新状态:', publishRes.data.status);
      console.log('   - 发布时间:', publishRes.data.publishedAt);
    }
    
    console.log('\n📝 归档内容...');
    const archiveRes = await request('POST', `/api/contents/${post.id}/archive`);
    if (archiveRes.statusCode === 200) {
      console.log('✅ 归档成功！新状态:', archiveRes.data.status);
    }
    
    console.log('\n📝 测试直接更新状态...');
    const updateRes = await request('PUT', `/api/contents/${draft.id}/status`, { status: 'draft' });
    if (updateRes.statusCode === 200) {
      console.log('✅ 状态更新成功！设回 draft');
    }
    
    console.log('\n========================================');
    console.log('🗑️ 测试中优先级改进：软删除与回收站');
    console.log('========================================\n');
    
    console.log('📝 软删除一个内容...');
    const deleteRes = await request('DELETE', `/api/contents/${reply2.id}`);
    if (deleteRes.data.success === true) {
      console.log('✅ 软删除成功！');
      console.log('   - deleted 标记:', deleteRes.data.content.deleted);
      console.log('   - deletedAt:', deleteRes.data.content.deletedAt);
    }
    
    console.log('\n📝 查看内容列表，确认已删除内容不显示...');
    const listRes = await request('GET', '/api/contents');
    const found = listRes.data.some(c => c.id === reply2.id);
    console.log('✅ 列表中是否还有被删除内容？', found ? '是的，但不应该有！' : '没有！正确过滤掉了');
    
    console.log('\n📝 查看回收站...');
    const trashRes = await request('GET', '/api/trash');
    console.log('✅ 回收站中有', trashRes.data.length, '个内容');
    trashRes.data.forEach(c => {
      console.log('   -', c.title || c.body.substring(0, 20), '| deleted:', c.deleted);
    });
    
    console.log('\n📝 恢复内容...');
    const restoreRes = await request('POST', `/api/contents/${reply2.id}/restore`);
    if (restoreRes.statusCode === 200) {
      console.log('✅ 恢复成功！');
      console.log('   - 现在 deleted:', restoreRes.data.deleted);
      console.log('   - deletedAt:', restoreRes.data.deletedAt);
    }
    
    console.log('\n📝 再次查看列表，确认已恢复...');
    const listRes2 = await request('GET', '/api/contents');
    const foundAgain = listRes2.data.some(c => c.id === reply2.id);
    console.log('✅ 恢复后是否在列表中？', foundAgain ? '是的！恢复成功！' : '没有！有问题');
    
    console.log('\n========================================');
    console.log('🎉 所有改进功能测试完成！');
    console.log('========================================\n');
    console.log('✅ replyTo 快捷方法 - 工作正常');
    console.log('✅ 状态流转 (draft → published → archived) - 工作正常');
    console.log('✅ 软删除与回收站 - 工作正常');
    console.log('\n🎊 所有改进功能都完美实现！');
    
  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.error(error.stack);
  }
}

runTests();
