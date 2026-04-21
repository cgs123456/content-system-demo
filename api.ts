
import http from 'http';
import { InMemoryStore } from './store';
import { ContentService } from './content-service';

export function createApiServer(service: ContentService) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // 简单的路由处理
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method || 'GET';
    
    try {
      // ===== 成员管理 =====
      if (path === '/api/members' && method === 'POST') {
        const body = await parseBody(req);
        const member = service.createMember(body.name, body.email);
        sendJson(res, member, 201);
        return;
      }
      
      if (path === '/api/members' && method === 'GET') {
        const members = service['store'].listMembers();
        sendJson(res, members);
        return;
      }
      
      // ===== 社区管理 =====
      if (path === '/api/communities' && method === 'POST') {
        const body = await parseBody(req);
        const community = service.createCommunity(body.name, body.description, body.founderId);
        sendJson(res, community, 201);
        return;
      }
      
      if (path === '/api/communities' && method === 'GET') {
        const communities = service['store'].listCommunities();
        sendJson(res, communities);
        return;
      }
      
      if (path.startsWith('/api/communities/') && path.endsWith('/join') && method === 'POST') {
        const communityId = path.split('/')[3];
        const body = await parseBody(req);
        const success = service.joinCommunity(body.memberId, communityId);
        sendJson(res, { success });
        return;
      }
      
      // ===== 内容管理 =====
      if (path === '/api/contents' && method === 'POST') {
        const body = await parseBody(req);
        
        let content;
        if (body.publisherType === 'community') {
          content = service.communityPublish(
            body.communityId,
            body.operatorId,
            body.contentType,
            body.body,
            { title: body.title, metadata: body.metadata, status: body.status }
          );
        } else {
          content = service.memberPublish(
            body.memberId,
            body.contentType,
            body.body,
            { title: body.title, metadata: body.metadata, status: body.status }
          );
        }
        
        if (content) {
          sendJson(res, content, 201);
        } else {
          sendJson(res, { error: 'Failed to publish content' }, 400);
        }
        return;
      }
      
      if (path === '/api/contents' && method === 'GET') {
        const publisherId = url.searchParams.get('publisherId');
        const authorId = url.searchParams.get('authorId');
        const type = url.searchParams.get('type') as any;
        const status = url.searchParams.get('status') as any;
        
        const contents = service['store'].listContents({ 
          publisherId: publisherId || undefined,
          authorId: authorId || undefined,
          type: type || undefined,
          status: status || undefined,
          includeDeleted: true  // 前端需要看到所有内容
        });
        sendJson(res, contents);
        return;
      }
      
      if (path.startsWith('/api/contents/') && method === 'GET') {
        const contentId = path.split('/')[3];
        const withRelations = url.searchParams.get('relations') === 'true';
        
        if (withRelations) {
          const result = service.getContentWithRelations(contentId);
          if (result) {
            sendJson(res, result);
          } else {
            sendJson(res, { error: 'Content not found' }, 404);
          }
        } else {
          const content = service['store'].getContent(contentId);
          if (content) {
            sendJson(res, content);
          } else {
            sendJson(res, { error: 'Content not found' }, 404);
          }
        }
        return;
      }
      
      // ===== 结构关系 =====
      if (path.startsWith('/api/contents/') && path.endsWith('/children') && method === 'GET') {
        const contentId = path.split('/')[3];
        const children = service.getChildren(contentId);
        sendJson(res, children);
        return;
      }
      
      if (path === '/api/relations/structural' && method === 'POST') {
        const body = await parseBody(req);
        const success = service.setParentChild(body.parentId, body.childId, body.order);
        sendJson(res, { success });
        return;
      }
      
      // ===== 引用关系 =====
      if (path === '/api/relations/reference' && method === 'POST') {
        const body = await parseBody(req);
        const success = service.addReference(body.fromId, body.toId, body.relationType);
        sendJson(res, { success });
        return;
      }
      
      // ===== 互动 =====
      if (path.startsWith('/api/contents/') && path.endsWith('/like') && method === 'POST') {
        const contentId = path.split('/')[3];
        const body = await parseBody(req);
        const success = service.addLike(contentId, body.author);
        sendJson(res, { success });
        return;
      }
      
      if (path.startsWith('/api/contents/') && path.endsWith('/comment') && method === 'POST') {
        const contentId = path.split('/')[3];
        const body = await parseBody(req);
        const comment = service.addComment(contentId, body.author, body.body, { title: body.title });
        if (comment) {
          sendJson(res, comment, 201);
        } else {
          sendJson(res, { error: 'Failed to add comment' }, 400);
        }
        return;
      }
      
      // 回复内容
      if (path.startsWith('/api/contents/') && path.endsWith('/reply') && method === 'POST') {
        const contentId = path.split('/')[3];
        const body = await parseBody(req);
        try {
          const reply = service.replyTo(contentId, body.author, body.body, { title: body.title });
          sendJson(res, reply, 201);
        } catch (e) {
          sendJson(res, { error: (e as Error).message }, 400);
        }
        return;
      }
      
      // ===== 内容状态管理 =====
      if (path.startsWith('/api/contents/') && path.endsWith('/status') && method === 'PUT') {
        const contentId = path.split('/')[3];
        const body = await parseBody(req);
        try {
          const updated = service.updateContentStatus(contentId, body.status);
          if (updated) {
            sendJson(res, updated);
          } else {
            sendJson(res, { error: 'Content not found' }, 404);
          }
        } catch (e) {
          sendJson(res, { error: (e as Error).message }, 400);
        }
        return;
      }
      
      if (path.startsWith('/api/contents/') && path.endsWith('/publish') && method === 'POST') {
        const contentId = path.split('/')[3];
        const published = service.publishDraft(contentId);
        if (published) {
          sendJson(res, published);
        } else {
          sendJson(res, { error: 'Content not found' }, 404);
        }
        return;
      }
      
      if (path.startsWith('/api/contents/') && path.endsWith('/archive') && method === 'POST') {
        const contentId = path.split('/')[3];
        const archived = service.archiveContent(contentId);
        if (archived) {
          sendJson(res, archived);
        } else {
          sendJson(res, { error: 'Content not found' }, 404);
        }
        return;
      }
      
      // ===== 回收站功能 =====
      if (path.startsWith('/api/contents/') && method === 'DELETE') {
        const parts = path.split('/');
        if (parts.length === 4) {
          const contentId = parts[3];
          const deleted = service.softDelete(contentId);
          if (deleted) {
            sendJson(res, { success: true, content: deleted });
          } else {
            sendJson(res, { error: 'Content not found' }, 404);
          }
          return;
        }
      }
      
      if (path.startsWith('/api/contents/') && path.endsWith('/restore') && method === 'POST') {
        const contentId = path.split('/')[3];
        const restored = service.restoreContent(contentId);
        if (restored) {
          sendJson(res, restored);
        } else {
          sendJson(res, { error: 'Content not found' }, 404);
        }
        return;
      }
      
      if (path === '/api/trash' && method === 'GET') {
        const trash = service.getTrash();
        sendJson(res, trash);
        return;
      }
      
      // 404
      sendJson(res, { error: 'Not found' }, 404);
      
    } catch (error) {
      console.error('API Error:', error);
      sendJson(res, { error: 'Internal server error' }, 500);
    }
  });
  
  return server;
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, data: any, statusCode = 200) {
  res.statusCode = statusCode;
  res.end(JSON.stringify(data, null, 2));
}
