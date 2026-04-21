
const { InMemoryStore } = require('./store');

class ContentService {
  constructor(store) {
    this.store = store;
  }
  
  // ========== 内容发布 ==========
  
  /**
   * 发布内容
   */
  publishContent(publisher, author, type, body, options = {}) {
    const status = options.status || 'published';
    return this.store.createContent({
      type,
      status,
      publisher,
      author,
      title: options.title,
      body,
      metadata: options.metadata,
      structuralRelations: [],
      referenceRelations: [],
      interactions: [],
      deleted: false,
      publishedAt: status === 'published' ? new Date() : null
    });
  }
  
  /**
   * 快捷方法：回复某内容（replyTo）
   */
  replyTo(targetContentId, author, body, options = {}) {
    const targetContent = this.store.getContent(targetContentId);
    if (!targetContent) {
      throw new Error('Target content not found');
    }
    
    // 创建回复内容
    const reply = this.store.createContent({
      type: 'reply',
      status: 'published',
      publisher: { 
        id: author.id, 
        type: author.type === 'member' ? 'member' : 'community', 
        name: author.name 
      },
      author,
      title: options.title,
      body,
      metadata: { replyTo: targetContentId },
      structuralRelations: [],
      referenceRelations: [],
      interactions: [],
      deleted: false,
      publishedAt: new Date()
    });
    
    // 添加引用关系
    this.store.addReferenceRelation(reply.id, targetContentId, 'reply_to');
    
    // 在目标内容上添加互动记录
    this.store.addInteraction(targetContentId, {
      contentId: targetContentId,
      author,
      type: 'reply',
      content: reply
    });
    
    return reply;
  }
  
  // ========== 内容状态管理 ==========
  
  /**
   * 更新内容状态
   */
  updateContentStatus(contentId, newStatus) {
    const content = this.store.getContent(contentId);
    if (!content) return null;
    
    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status');
    }
    
    const updates = { status: newStatus };
    if (newStatus === 'published' && !content.publishedAt) {
      updates.publishedAt = new Date();
    }
    
    return this.store.updateContent(contentId, updates);
  }
  
  /**
   * 发布草稿
   */
  publishDraft(contentId) {
    return this.updateContentStatus(contentId, 'published');
  }
  
  /**
   * 归档内容
   */
  archiveContent(contentId) {
    return this.updateContentStatus(contentId, 'archived');
  }
  
  // ========== 软删除与回收站 ==========
  
  /**
   * 软删除内容
   */
  softDelete(contentId) {
    const content = this.store.getContent(contentId);
    if (!content) return null;
    
    return this.store.updateContent(contentId, {
      deleted: true,
      deletedAt: new Date()
    });
  }
  
  /**
   * 恢复已删除内容
   */
  restoreContent(contentId) {
    const content = this.store.getContent(contentId);
    if (!content) return null;
    
    return this.store.updateContent(contentId, {
      deleted: false,
      deletedAt: null
    });
  }
  
  /**
   * 获取回收站内容列表
   */
  getTrash() {
    return this.store.listContents({ status: undefined })
      .filter(c => c.deleted === true);
  }
  
  /**
   * 成员发布内容
   */
  memberPublish(memberId, type, body, options = {}) {
    const member = this.store.getMember(memberId);
    if (!member) return undefined;
    
    const publisher = {
      id: member.id,
      type: 'member',
      name: member.name
    };
    
    const author = {
      id: member.id,
      type: 'member',
      name: member.name
    };
    
    return this.publishContent(publisher, author, type, body, options);
  }
  
  /**
   * 社区发布内容（由社区运营者发布）
   */
  communityPublish(communityId, operatorId, type, body, options = {}) {
    const community = this.store.getCommunity(communityId);
    const member = this.store.getMember(operatorId);
    
    if (!community || !member) return undefined;
    
    // 验证运营者身份
    if (!community.operators.includes(operatorId)) {
      throw new Error('Not a community operator');
    }
    
    const publisher = {
      id: community.id,
      type: 'community',
      name: community.name
    };
    
    const author = {
      id: member.id,
      type: 'community_operator',
      name: member.name,
      communityId: community.id
    };
    
    return this.publishContent(publisher, author, type, body, options);
  }
  
  // ========== 结构关系 ==========
  
  /**
   * 设置父子关系（如文章与章节）
   */
  setParentChild(parentId, childId, order) {
    const parent = this.store.getContent(parentId);
    const child = this.store.getContent(childId);
    
    if (!parent || !child) return false;
    
    // 添加父关系到子内容
    this.store.addStructuralRelation(childId, parentId, 'parent');
    // 添加子关系到父内容
    this.store.addStructuralRelation(parentId, childId, 'child', order);
    
    return true;
  }
  
  /**
   * 获取内容的子内容
   */
  getChildren(contentId) {
    const content = this.store.getContent(contentId);
    if (!content) return [];
    
    const childRelations = content.structuralRelations
      .filter(r => r.relationType === 'child')
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return childRelations
      .map(r => this.store.getContent(r.relatedContentId))
      .filter(c => c !== undefined);
  }
  
  /**
   * 获取内容的父内容
   */
  getParent(contentId) {
    const content = this.store.getContent(contentId);
    if (!content) return undefined;
    
    const parentRelation = content.structuralRelations
      .find(r => r.relationType === 'parent');
    
    return parentRelation ? this.store.getContent(parentRelation.relatedContentId) : undefined;
  }
  
  // ========== 引用关系 ==========
  
  /**
   * 添加引用关系
   */
  addReference(fromId, toId, relationType = 'link') {
    const fromContent = this.store.getContent(fromId);
    const toContent = this.store.getContent(toId);
    
    if (!fromContent || !toContent) return false;
    
    this.store.addReferenceRelation(fromId, toId, relationType);
    return true;
  }
  
  /**
   * 获取引用了某内容的所有内容
   */
  getReferringTo(contentId) {
    return this.store.listContents().filter(c => 
      c.referenceRelations.some(r => r.toContentId === contentId)
    );
  }
  
  /**
   * 获取某内容引用的所有内容
   */
  getReferencesFrom(contentId) {
    const content = this.store.getContent(contentId);
    if (!content) return [];
    
    return content.referenceRelations
      .map(r => this.store.getContent(r.toContentId))
      .filter(c => c !== undefined);
  }
  
  // ========== 互动功能 ==========
  
  /**
   * 添加点赞
   */
  addLike(contentId, author) {
    const content = this.store.getContent(contentId);
    if (!content) return false;
    
    this.store.addInteraction(contentId, {
      contentId,
      author,
      type: 'like'
    });
    
    return true;
  }
  
  /**
   * 添加评论（评论本身也是内容）
   */
  addComment(contentId, author, body, options = {}) {
    const targetContent = this.store.getContent(contentId);
    if (!targetContent) return undefined;
    
    // 创建评论内容
    const comment = this.store.createContent({
      type: 'comment',
      status: 'published',
      publisher: { id: author.id, type: author.type === 'member' ? 'member' : 'community', name: author.name },
      author,
      title: options.title,
      body,
      structuralRelations: [],
      referenceRelations: [],
      interactions: [],
      publishedAt: new Date()
    });
    
    // 添加引用关系（回复到原内容）
    this.addReference(comment.id, contentId, 'reply_to');
    
    // 在原内容上添加互动记录
    this.store.addInteraction(contentId, {
      contentId,
      author,
      type: 'comment',
      content: comment
    });
    
    return comment;
  }
  
  /**
   * 获取内容的所有互动
   */
  getInteractions(contentId, type) {
    const content = this.store.getContent(contentId);
    if (!content) return [];
    
    let interactions = content.interactions;
    if (type) {
      interactions = interactions.filter(i => i.type === type);
    }
    
    return interactions;
  }
  
  // ========== 查询功能 ==========
  
  /**
   * 获取内容的完整信息（包含关系）
   */
  getContentWithRelations(contentId) {
    const content = this.store.getContent(contentId);
    if (!content) return undefined;
    
    return {
      content,
      parent: this.getParent(contentId),
      children: this.getChildren(contentId),
      references: this.getReferencesFrom(contentId),
      referredBy: this.getReferringTo(contentId),
      interactions: content.interactions
    };
  }
  
  // ========== 用户和社区管理 ==========
  
  createMember(name, email) {
    return this.store.createMember({ name, email, communities: [] });
  }
  
  createCommunity(name, description, founderId) {
    const community = this.store.createCommunity({ 
      name, 
      description,
      members: founderId ? [founderId] : [],
      operators: founderId ? [founderId] : []
    });
    
    // 将创始人加入社区
    if (founderId) {
      const founder = this.store.getMember(founderId);
      if (founder) {
        this.store.updateMember(founderId, {
          communities: [...founder.communities, community.id]
        });
      }
    }
    
    return community;
  }
  
  joinCommunity(memberId, communityId) {
    const member = this.store.getMember(memberId);
    const community = this.store.getCommunity(communityId);
    
    if (!member || !community) return false;
    
    // 更新成员的社区列表
    if (!member.communities.includes(communityId)) {
      this.store.updateMember(memberId, {
        communities: [...member.communities, communityId]
      });
    }
    
    // 更新社区的成员列表
    if (!community.members.includes(memberId)) {
      this.store.updateCommunity(communityId, {
        members: [...community.members, memberId]
      });
    }
    
    return true;
  }
}

module.exports = { ContentService };
