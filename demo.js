
const { InMemoryStore } = require('./store.js');
const { ContentService } = require('./content-service.js');

console.log('========================================');
console.log('  Content System Demo');
console.log('========================================\n');

// 初始化系统
const store = new InMemoryStore();
const service = new ContentService(store);

async function runDemo() {
  try {
    // ===== 1. 创建用户和社区 =====
    console.log('【1】创建用户和社区...\n');
    
    // 创建成员
    const alice = service.createMember('Alice', 'alice@example.com');
    const bob = service.createMember('Bob', 'bob@example.com');
    const charlie = service.createMember('Charlie', 'charlie@example.com');
    
    console.log('✅ 创建成员:');
    console.log('   -', alice.name, '(ID:', alice.id, ')');
    console.log('   -', bob.name, '(ID:', bob.id, ')');
    console.log('   -', charlie.name, '(ID:', charlie.id, ')\n');
    
    // Alice 创建一个社区
    const techCommunity = service.createCommunity(
      'Tech Enthusiasts',
      'A community for tech lovers',
      alice.id
    );
    
    console.log('✅ 创建社区:', techCommunity.name);
    console.log('   创始人:', alice.name, '同时也是运营者\n');
    
    // Bob 和 Charlie 加入社区
    service.joinCommunity(bob.id, techCommunity.id);
    service.joinCommunity(charlie.id, techCommunity.id);
    
    console.log('✅ Bob 和 Charlie 加入了社区\n');
    
    // ===== 2. 发布内容 =====
    console.log('【2】发布内容...\n');
    
    // Alice 作为成员发布一篇文章
    const article = service.memberPublish(
      alice.id,
      'article',
      '这是一篇关于 JavaScript 的精彩文章。在现代 Web 开发中，JavaScript 扮演着至关重要的角色...',
      { title: 'JavaScript 入门指南' }
    );
    
    console.log('✅ Alice 发布文章:', article ? article.title : '未知');
    
    // 创建文章的章节（结构关系示例）
    const section1 = service.memberPublish(
      alice.id,
      'note',
      'JavaScript 的基本语法包括变量声明、函数定义等。让我们从 var、let、const 开始...',
      { title: '1. 基本语法' }
    );
    
    const section2 = service.memberPublish(
      alice.id,
      'note',
      '函数是 JavaScript 的一等公民。理解函数的工作原理对于掌握这门语言至关重要...',
      { title: '2. 函数' }
    );
    
    // 建立父子结构关系
    if (article && section1 && section2) {
      service.setParentChild(article.id, section1.id, 1);
      service.setParentChild(article.id, section2.id, 2);
      console.log('✅ 添加了两个章节，形成文章结构\n');
    }
    
    // 社区发布公告（由 Alice 作为运营者发布）
    const announcement = service.communityPublish(
      techCommunity.id,
      alice.id,
      'post',
      '大家好！欢迎来到 Tech Enthusiasts 社区！我们会定期分享技术文章和举办线上活动。',
      { title: '社区公告：欢迎新成员！' }
    );
    
    console.log('✅ 社区发布公告:', announcement ? announcement.title : '未知', '\n');
    
    // ===== 3. 引用关系 =====
    console.log('【3】内容引用...\n');
    
    // Bob 发布一个帖子，引用 Alice 的文章
    const bobPost = service.memberPublish(
      bob.id,
      'post',
      '我刚刚读了 Alice 写的 JavaScript 入门指南，非常棒！推荐给大家！',
      { title: '推荐一篇好文' }
    );
    
    // 建立引用关系
    if (bobPost && article) {
      service.addReference(bobPost.id, article.id, 'quote');
      console.log('✅ Bob 发布帖子并引用了 Alice 的文章\n');
    }
    
    // ===== 4. 互动功能 =====
    console.log('【4】内容互动...\n');
    
    // Bob 给 Alice 的文章点赞
    const bobAuthor = { id: bob.id, type: 'member', name: bob.name };
    if (article) {
      service.addLike(article.id, bobAuthor);
      console.log('✅ Bob 给文章点赞');
      
      // Charlie 也点赞
      const charlieAuthor = { id: charlie.id, type: 'member', name: charlie.name };
      service.addLike(article.id, charlieAuthor);
      console.log('✅ Charlie 给文章点赞');
      
      // Bob 发表评论（评论也是内容）
      const bobComment = service.addComment(
        article.id,
        bobAuthor,
        '写得太好了！特别是关于函数的部分，让我收获很多。期待更多内容！'
      );
      console.log('✅ Bob 发表评论\n');
      
      // Charlie 评论 Bob 的评论
      if (bobComment) {
        service.addComment(
          bobComment.id,
          charlieAuthor,
          '同意！我也觉得函数部分讲得很清楚。'
        );
        console.log('✅ Charlie 回复了 Bob 的评论\n');
      }
    }
    
    // ===== 5. 展示完整信息 =====
    console.log('【5】查看完整的内容信息...\n');
    
    if (article) {
      const articleWithRelations = service.getContentWithRelations(article.id);
      if (articleWithRelations) {
        console.log('📄 文章:', articleWithRelations.content.title);
        console.log('👤 作者:', articleWithRelations.content.author.name);
        console.log('📊 子内容 (章节):', articleWithRelations.children.length, '个');
        
        articleWithRelations.children.forEach((child, idx) => {
          console.log('   ', idx + 1, '.', child.title);
        });
        
        console.log('🔗 被引用:', articleWithRelations.referredBy.length, '次');
        
        console.log('💬 互动:');
        console.log('   - 点赞:', articleWithRelations.interactions.filter(i => i.type === 'like').length);
        
        const comments = articleWithRelations.interactions.filter(i => i.type === 'comment');
        console.log('   - 评论:', comments.length);
        comments.forEach(c => {
          const bodyPreview = c.content && c.content.body ? c.content.body.substring(0, 50) + '...' : '';
          console.log('     *', c.author.name, ':', bodyPreview);
        });
      }
    }
    
    // ===== 6. 展示所有内容 =====
    console.log('\n【6】所有内容列表...\n');
    
    const allContents = store.listContents();
    allContents.forEach((content, idx) => {
      const bodyPreview = content.body.length > 30 ? content.body.substring(0, 30) + '...' : content.body;
      const publisherName = content.publisher.type === 'community' ? content.publisher.name : '个人';
      console.log(idx + 1, '.', '[' + content.type.toUpperCase() + ']', 
        content.title || bodyPreview, 
        '- by', content.author.name,
        '(发布者:', publisherName, ')');
    });
    
    console.log('\n========================================');
    console.log('  Demo 完成！');
    console.log('========================================');
    console.log('\n提示: 运行 node server.js 可以启动 API 服务器');
    
  } catch (error) {
    console.error('Demo 出错:', error);
  }
}

// 运行演示
runDemo();
