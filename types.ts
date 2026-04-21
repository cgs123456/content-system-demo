
// 数据类型定义

export type ID = string;

// 发布主体类型
export type PublisherType = 'member' | 'community';

// 作者主体类型
export type AuthorType = 'member' | 'community_operator';

// 内容类型
export type ContentType = 
  | 'post'           // 帖子
  | 'comment'        // 评论（互动内容）
  | 'reply'          // 回复（互动内容）
  | 'article'        // 文章
  | 'thread'         // 讨论串
  | 'note';          // 笔记

// 内容状态
export type ContentStatus = 'draft' | 'published' | 'archived' | 'deleted';

// 发布主体
export interface Publisher {
  id: ID;
  type: PublisherType;
  name: string;
}

// 作者主体
export interface Author {
  id: ID;
  type: AuthorType;
  name: string;
  communityId?: ID;  // 如果是社区运营者，关联的社区 ID
}

// 内容结构关系类型
export type StructuralRelationType = 
  | 'parent'         // 父内容（如文章的章节）
  | 'child'          // 子内容
  | 'root'           // 根内容
  | 'version'        // 版本
  | 'translation';   // 翻译

// 内容引用关系类型
export type ReferenceRelationType = 
  | 'mention'        // 提及
  | 'quote'          // 引用
  | 'link'           // 链接
  | 'tag'            // 标签
  | 'reply_to';      // 回复对象

// 内容结构关系
export interface StructuralRelation {
  id: ID;
  contentId: ID;
  relatedContentId: ID;
  relationType: StructuralRelationType;
  order?: number;    // 排序用，如章节顺序
  createdAt: Date;
}

// 内容引用关系
export interface ReferenceRelation {
  id: ID;
  fromContentId: ID;
  toContentId: ID;
  relationType: ReferenceRelationType;
  createdAt: Date;
}

// 互动类型
export type InteractionType = 
  | 'like'           // 点赞
  | 'dislike'        // 踩
  | 'comment'        // 评论（作为内容）
  | 'reply'          // 回复（作为内容）
  | 'share'          // 分享
  | 'bookmark';      // 收藏

// 互动（也可作为内容）
export interface Interaction {
  id: ID;
  contentId: ID;        // 互动对象的内容 ID
  author: Author;       // 互动作者
  type: InteractionType;
  content?: Content;    // 如果是评论/回复，这里是互动内容本身
  metadata?: Record<string, any>;
  createdAt: Date;
}

// 内容主体
export interface Content {
  id: ID;
  type: ContentType;
  status: ContentStatus;
  
  // 发布信息
  publisher: Publisher;
  author: Author;
  
  // 内容
  title?: string;
  body: string;
  metadata?: Record<string, any>;  // 扩展字段，如富文本、附件等
  
  // 关系（直接引用，方便查询）
  structuralRelations: StructuralRelation[];
  referenceRelations: ReferenceRelation[];
  interactions: Interaction[];
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // 软删除
  deleted: boolean;
  deletedAt?: Date;
  
  // 版本
  version: number;
}

// 社区
export interface Community {
  id: ID;
  name: string;
  description?: string;
  members: ID[];            // 成员 ID 列表
  operators: ID[];          // 运营者 ID 列表
  createdAt: Date;
}

// 成员
export interface Member {
  id: ID;
  name: string;
  email?: string;
  communities: ID[];        // 所属社区 ID 列表
  createdAt: Date;
}
