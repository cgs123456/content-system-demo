
// 简单的内存存储实现
class InMemoryStore {
  constructor() {
    this.contents = new Map();
    this.members = new Map();
    this.communities = new Map();
  }
  
  // 生成唯一 ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // ========== 内容操作 ==========
  createContent(contentData) {
    const id = this.generateId();
    const now = new Date();
    const content = {
      ...contentData,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      // 确保新字段存在
      deleted: contentData.deleted !== undefined ? contentData.deleted : false,
      deletedAt: contentData.deletedAt || null
    };
    this.contents.set(id, content);
    return content;
  }
  
  getContent(id) {
    return this.contents.get(id);
  }
  
  updateContent(id, updates) {
    const content = this.contents.get(id);
    if (!content) return undefined;
    
    const updatedContent = {
      ...content,
      ...updates,
      updatedAt: new Date(),
      version: content.version + 1
    };
    this.contents.set(id, updatedContent);
    return updatedContent;
  }
  
  deleteContent(id) {
    return this.contents.delete(id);
  }
  
  listContents(filters = {}) {
    let results = Array.from(this.contents.values());
    
    // 默认过滤已删除内容，除非显式要求
    const includeDeleted = filters.includeDeleted === true;
    if (!includeDeleted) {
      results = results.filter(c => c.deleted !== true);
    }
    
    if (filters.publisherId) {
      results = results.filter(c => c.publisher.id === filters.publisherId);
    }
    if (filters.authorId) {
      results = results.filter(c => c.author.id === filters.authorId);
    }
    if (filters.type) {
      results = results.filter(c => c.type === filters.type);
    }
    if (filters.status) {
      results = results.filter(c => c.status === filters.status);
    }
    
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // ========== 成员操作 ==========
  createMember(memberData) {
    const id = this.generateId();
    const member = {
      ...memberData,
      id,
      createdAt: new Date()
    };
    this.members.set(id, member);
    return member;
  }
  
  getMember(id) {
    return this.members.get(id);
  }
  
  updateMember(id, updates) {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...updates };
    this.members.set(id, updatedMember);
    return updatedMember;
  }
  
  listMembers() {
    return Array.from(this.members.values());
  }
  
  // ========== 社区操作 ==========
  createCommunity(communityData) {
    const id = this.generateId();
    const community = {
      ...communityData,
      id,
      createdAt: new Date()
    };
    this.communities.set(id, community);
    return community;
  }
  
  getCommunity(id) {
    return this.communities.get(id);
  }
  
  updateCommunity(id, updates) {
    const community = this.communities.get(id);
    if (!community) return undefined;
    
    const updatedCommunity = { ...community, ...updates };
    this.communities.set(id, updatedCommunity);
    return updatedCommunity;
  }
  
  listCommunities() {
    return Array.from(this.communities.values());
  }
  
  // ========== 关系和互动的快捷方法 ==========
  addStructuralRelation(contentId, relatedContentId, relationType, order) {
    const content = this.getContent(contentId);
    if (!content) return undefined;
    
    const relation = {
      id: this.generateId(),
      contentId,
      relatedContentId,
      relationType,
      order,
      createdAt: new Date()
    };
    
    return this.updateContent(contentId, {
      structuralRelations: [...content.structuralRelations, relation]
    });
  }
  
  addReferenceRelation(fromId, toId, relationType) {
    const content = this.getContent(fromId);
    if (!content) return undefined;
    
    const relation = {
      id: this.generateId(),
      fromContentId: fromId,
      toContentId: toId,
      relationType,
      createdAt: new Date()
    };
    
    return this.updateContent(fromId, {
      referenceRelations: [...content.referenceRelations, relation]
    });
  }
  
  addInteraction(contentId, interaction) {
    const content = this.getContent(contentId);
    if (!content) return undefined;
    
    const newInteraction = {
      ...interaction,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    return this.updateContent(contentId, {
      interactions: [...content.interactions, newInteraction]
    });
  }
}

module.exports = { InMemoryStore };
