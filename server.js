
const http = require('http');
const fs = require('fs');
const path = require('path');
const { InMemoryStore } = require('./store.js');
const { ContentService } = require('./content-service.js');

// 初始化系统
const store = new InMemoryStore();
const service = new ContentService(store);

// 辅助函数
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

function sendJson(res, data, statusCode = 200) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data, null, 2));
}

// 创建服务器
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method || 'GET';
    
    // 前端页面
    if (pathname === '/' || pathname === '') {
        const htmlPath = path.join(__dirname, 'index.html');
        if (fs.existsSync(htmlPath)) {
            const html = fs.readFileSync(htmlPath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        }
    }
    
    // ===== API 端点 =====
    if (pathname.startsWith('/api')) {
        const apiPath = pathname.replace('/api', '');
        
        try {
            // 成员管理
            if (apiPath === '/members' && method === 'POST') {
                const body = await parseBody(req);
                const member = service.createMember(body.name, body.email);
                sendJson(res, member, 201);
                return;
            }
            if (apiPath === '/members' && method === 'GET') {
                sendJson(res, service.store.listMembers());
                return;
            }
            
            // 社区管理
            if (apiPath === '/communities' && method === 'POST') {
                const body = await parseBody(req);
                const community = service.createCommunity(body.name, body.description, body.founderId);
                sendJson(res, community, 201);
                return;
            }
            if (apiPath === '/communities' && method === 'GET') {
                sendJson(res, service.store.listCommunities());
                return;
            }
            
            // 内容管理
            if (apiPath === '/contents' && method === 'POST') {
                const body = await parseBody(req);
                let content;
                if (body.publisherType === 'community') {
                    content = service.communityPublish(body.communityId, body.operatorId, body.contentType, body.body, { title: body.title });
                } else {
                    content = service.memberPublish(body.memberId, body.contentType, body.body, { title: body.title, status: body.status });
                }
                sendJson(res, content, 201);
                return;
            }
            if (apiPath === '/contents' && method === 'GET') {
                const contents = service.store.listContents({ includeDeleted: true });
                sendJson(res, contents);
                return;
            }
            
            // replyTo
            if (apiPath.startsWith('/contents/') && apiPath.endsWith('/reply') && method === 'POST') {
                const contentId = apiPath.split('/')[2];
                const body = await parseBody(req);
                try {
                    const reply = service.replyTo(contentId, body.author, body.body);
                    sendJson(res, reply, 201);
                } catch (e) {
                    sendJson(res, { error: e.message }, 400);
                }
                return;
            }
            
            // 点赞
            if (apiPath.startsWith('/contents/') && apiPath.endsWith('/like') && method === 'POST') {
                const contentId = apiPath.split('/')[2];
                const body = await parseBody(req);
                const success = service.addLike(contentId, body.author);
                sendJson(res, { success });
                return;
            }
            
            // 发布草稿
            if (apiPath.startsWith('/contents/') && apiPath.endsWith('/publish') && method === 'POST') {
                const contentId = apiPath.split('/')[2];
                const published = service.publishDraft(contentId);
                if (published) sendJson(res, published);
                else sendJson(res, { error: 'Not found' }, 404);
                return;
            }
            
            // 归档
            if (apiPath.startsWith('/contents/') && apiPath.endsWith('/archive') && method === 'POST') {
                const contentId = apiPath.split('/')[2];
                const archived = service.archiveContent(contentId);
                if (archived) sendJson(res, archived);
                else sendJson(res, { error: 'Not found' }, 404);
                return;
            }
            
            // 删除
            if (apiPath.startsWith('/contents/') && method === 'DELETE') {
                const contentId = apiPath.split('/')[2];
                const deleted = service.softDelete(contentId);
                if (deleted) sendJson(res, { success: true, content: deleted });
                else sendJson(res, { error: 'Not found' }, 404);
                return;
            }
            
            // 恢复
            if (apiPath.startsWith('/contents/') && apiPath.endsWith('/restore') && method === 'POST') {
                const contentId = apiPath.split('/')[2];
                const restored = service.restoreContent(contentId);
                if (restored) sendJson(res, restored);
                else sendJson(res, { error: 'Not found' }, 404);
                return;
            }
            
            // 回收站
            if (apiPath === '/trash' && method === 'GET') {
                sendJson(res, service.getTrash());
                return;
            }
            
            sendJson(res, { error: 'Not found' }, 404);
            
        } catch (error) {
            console.error('API Error:', error);
            sendJson(res, { error: 'Server error' }, 500);
        }
        return;
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
});

const PORT = 3001;

server.listen(PORT, () => {
    console.log('========================================');
    console.log('  🎉 Content System - 完整版');
    console.log('========================================');
    console.log(`服务器运行在: http://localhost:${PORT}`);
    console.log('');
    console.log('📖 前端页面: http://localhost:3001/');
    console.log('🔧 API 端点: http://localhost:3001/api');
    console.log('');
    console.log('📋 功能列表:');
    console.log('  ✅ 成员和社区管理');
    console.log('  ✅ 内容发布与状态管理');
    console.log('  ✅ replyTo 快捷回复');
    console.log('  ✅ 内容状态流转');
    console.log('  ✅ 软删除与回收站');
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
    console.log('========================================');
});
