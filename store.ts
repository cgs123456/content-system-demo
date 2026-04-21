
import { 
  ID, 
  Content, 
  Member, 
  Community, 
  StructuralRelation, 
  ReferenceRelation, 
  Interaction 
} from './types';

// 简单的内存存储实现
export class InMemoryStore {
  private contents: Map<ID, Content> = new Map();
  private members: Map<ID, Member> = new Map();
  private communities: Map<ID, Community> = new Map();
  
  // 生成唯一 ID
  private generateId(): ID {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // ========== 内容操作 ==========
  createContent(contentData: Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Content {
    const id = this.generateId();
    const now = new Date();
    const content: Content = {
      ...contentData,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      // 确保新字段存在
      deleted: contentData.deleted !== undefined ? contentData.deleted : false,
      deletedAt: contentData.deletedAt
    };
    this.contents.set(id, content);
    return content;
  }
  
  getContent(id: ID): Content | undefined {
    return this.contents.get(id);
  }
  
  updateContent(id: ID, updates: Partial<Omit<Content, 'id' | 'createdAt' | 'version'>>): Content | undefined {
    const content = this.contents.get(id);
    if (!content) return undefined;
    
    const updatedContent: Content = {
      ...content,
      ...updates,
      updatedAt: new Date(),
      version: content.version + 1
    };
    this.contents.set(id, updatedContent);
    return updatedContent;
  }
  
  deleteContent(id: ID): boolean {
    return this.contents.delete(id);
  }
  
  listContents(filters?: { 
    publisherId?: ID, 
    authorId?: ID, 
    type?: Content['type'],
    status?: Content['status'],
    includeDeleted?: boolean
  }): Content[] {
    let results = Array.from(this.contents.values());
    
    // 默认过滤已删除内容，除非显式要求
    const includeDeleted = filters?.includeDeleted === true;
    if (!includeDeleted) {
      results = results.filter(c => c.deleted !== true);
    }
    
    if (filters?.publisherId) {
      results = results.filter(c => c.publisher.id === filters.publisherId);
    }
    if (filters?.authorId) {
      results = results.filter(c => c.author.id === filters.authorId);
    }
    if (filters?.type) {
      results = results.filter(c => c.type === filters.type);
    }
    if (filters?.status) {
      results = results.filter(c => c.status === filters.status);
    }
    
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // ========== 成员操作 ==========
  createMember(memberData: Omit<Member, 'id' | 'createdAt'>): Member {
    const id = this.generateId();
    const member: Member = {
      ...memberData,
      id,
      createdAt: new Date()
    };
    this.members.set(id, member);
    return member;
  }
  
  getMember(id: ID): Member | undefined {
    return this.members.get(id);
  }
  
  updateMember(id: ID, updates: Partial<Omit<Member, 'id' | 'createdAt'>>): Member | undefined {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const updatedMember: Member = { ...member, ...updates };
    this.members.set(id, updatedMember);
    return updatedMember;
  }
  
  listMembers(): Member[] {
    return Array.from(this.members.values());
  }
  
  // ========== 社区操作 ==========
  createCommunity(communityData: Omit<Community, 'id' | 'createdAt'>): Community {
    const id = this.generateId();
    const community: Community = {
      ...communityData,
      id,
      createdAt: new Date()
    };
    this.communities.set(id, community);
    return community;
  }
  
  getCommunity(id: ID): Community | undefined {
    return this.communities.get(id);
  }
  
  updateCommunity(id: ID, updates: Partial<Omit<Community, 'id' | 'createdAt'>>): Community | undefined {
    const community = this.communities.get(id);
    if (!community) return undefined;
    
    const updatedCommunity: Community = { ...community, ...updates };
    this.communities.set(id, updatedCommunity);
    return updatedCommunity;
  }
  
  listCommunities(): Community[] {
    return Array.from(this.communities.values());
  }
  
  // ========== 关系和互动的快捷方法 ==========
  addStructuralRelation(
    contentId: ID, 
    relatedContentId: ID, 
    relationType: StructuralRelation['relationType'],
    order?: number
  ): Content | undefined {
    const content = this.getContent(contentId);
    if (!content) return undefined;
    
    const relation: StructuralRelation = {
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
  
  addReferenceRelation(
    fromContentId: ID, 
    toContentId: ID, 
    relationType: ReferenceRelation['relationType']
  ): Content | undefined {
    const content = this.getContent(fromContentId);
    if (!content) return undefined;
    
    const relation: ReferenceRelation = {
      id: this.generateId(),
      fromContentId,
      toContentId,
      relationType,
      createdAt: new Date()
    };
    
    return this.updateContent(fromContentId, {
      referenceRelations: [...content.referenceRelations, relation]
    });
  }
  
  addInteraction(
    contentId: ID,
    interaction: Omit<Interaction, 'id' | 'createdAt'>
  ): Content | undefined {
    const content = this.getContent(contentId);
    if (!content) return undefined;
    
    const newInteraction: Interaction = {
      ...interaction,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    return this.updateContent(contentId, {
      interactions: [...content.interactions, newInteraction]
    });
  }
}
