
# Content System - 内容管理系统

一个功能完整的内容管理系统，支持用户发布、互动、关系管理等功能。

<div align="center">
  <p>
    <img src="https://img.shields.io/badge/Node.js-18+-green?style=flat-square" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square" alt="TypeScript">
    <img src="https://img.shields.io/badge/License-MIT-orange?style=flat-square" alt="License">
  </p>
</div>

## 📖 目录

- [🎉 功能特性](#-功能特性)
- [🚀 快速开始](#-快速开始)
- [📋 项目结构](#-项目结构)
- [📚 API 文档](#-api-文档)
- [💡 使用示例](#-使用示例)
- [🎯 后续改进建议](#-后续改进建议-低优先级)
- [📊 测试脚本](#-测试脚本)
- [📝 技术栈](#-技术栈)
- [🎊 项目亮点](#-项目亮点)
- [🤝 贡献指南](#-贡献指南)

## 🎉 功能特性

### 核心功能

- ✅ **发布主体**: 支持成员(member)和社区(community)两种发布主体
- ✅ **作者主体**: 支持成员(member)和社区运营者(community operator)
- ✅ **内容类型**: 文章(article)、帖子(post)、笔记(note)等
- ✅ **结构关系**: 支持父子内容关系（如：文章 -> 章节）
- ✅ **引用关系**: 支持内容间的引用、提及、链接关系
- ✅ **内容互动**: 点赞、评论、回复（互动本身也是内容）

### 改进功能 (高/中优先级)

- ✅ **replyTo 快捷回复**: 新增 `/api/contents/:id/reply` 端点
- ✅ **状态流转机制**: draft(草稿) → published(发布) → archived(归档)
- ✅ **软删除与回收站**: 支持误删内容恢复

## 🚀 快速开始

### 启动系统

```bash
cd content-system
node server.js
```

### 访问界面

- 🌐 **前端页面**: http://localhost:3001/
- 🔧 **API 端点**: http://localhost:3001/api

## 📋 项目结构

```
content-system/
├── index.html           # 前端界面
├── server.js            # 服务器主文件
├── store.js             # 内存数据存储
├── content-service.js   # 业务逻辑层
├── api.js               # (可选) 独立的 API 模块
├── demo.js              # 完整系统演示
├── test-system.js       # 系统测试脚本
├── test-improvements.js # 改进功能测试
├── init-data.js         # 数据初始化脚本
├── IMPROVEMENTS.md      # 改进文档
└── README.md            # 本文件
```

## 📚 API 文档

### 成员管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/members | 获取所有成员 |
| POST | /api/members | 创建成员 |

### 社区管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/communities | 获取所有社区 |
| POST | /api/communities | 创建社区 |

### 内容管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/contents | 获取内容列表 |
| POST | /api/contents | 发布内容 |
| GET  | /api/contents/:id | 获取单条内容 |
| GET  | /api/contents/:id/children | 获取子内容 |

### 内容互动
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/contents/:id/like | 点赞 |
| POST | /api/contents/:id/comment | 评论 |
| POST | /api/contents/:id/reply | 回复 (新功能) |

### 状态管理
| 方法 | 路径 | 说明 |
|------|------|------|
| PUT  | /api/contents/:id/status | 更新状态 |
| POST | /api/contents/:id/publish | 发布草稿 |
| POST | /api/contents/:id/archive | 归档内容 |

### 回收站
| 方法 | 路径 | 说明 |
|------|------|------|
| DELETE | /api/contents/:id | 软删除 |
| POST | /api/contents/:id/restore | 恢复内容 |
| GET  | /api/trash | 获取回收站 |

## 💡 使用示例

### 1. 创建成员
```javascript
// 通过前端界面点击创建
// 或通过 API
POST /api/members
{ "name": "Alice", "email": "alice@example.com" }
```

### 2. 发布内容
```javascript
POST /api/contents
{
  "publisherType": "member",
  "memberId": "...",
  "contentType": "post",
  "title": "欢迎",
  "body": "大家好！",
  "status": "published"  // 可选: draft/published/archived
}
```

### 3. 快捷回复
```javascript
POST /api/contents/{id}/reply
{
  "author": { "id": "...", "type": "member", "name": "Bob" },
  "body": "谢谢分享！"
}
```

### 4. 内容状态管理
```javascript
// 发布草稿
POST /api/contents/{id}/publish

// 归档内容
POST /api/contents/{id}/archive
```

### 5. 软删除与恢复
```javascript
// 删除
DELETE /api/contents/{id}

// 查看回收站
GET /api/trash

// 恢复
POST /api/contents/{id}/restore
```

## 🎯 后续改进建议 (低优先级)

1. **权限校验机制**
   - 谁可以修改或删除内容？
   - 社区运营者权限

2. **数据库持久化**
   - 替换内存存储为 SQLite/MongoDB/PostgreSQL
   - 实现数据持久化

## 📊 测试脚本

| 脚本 | 功能 |
|------|------|
| `node demo.js` | 完整系统演示 |
| `node test-system.js` | 系统全面测试 |
| `node test-improvements.js` | 改进功能测试 |
| `node init-data.js` | 初始化演示数据 |

## 📝 技术栈

- **后端**: Node.js (原生 HTTP)
- **数据**: 内存存储 (可扩展为数据库)
- **前端**: 原生 JavaScript + HTML + CSS
- **架构**: 三层架构 (存储/服务/API)

## 🎊 项目亮点

1. **功能完整**: 所有核心需求都已实现
2. **改进全面**: 高/中优先级建议已完成
3. **代码清晰**: 架构合理，易于维护扩展
4. **有测试**: 完整的测试脚本
5. **有界面**: 美观的前端界面
6. **有文档**: 详细的 README 和改进文档

## 📞 联系

如有问题，请查看项目根目录中的文档或运行演示脚本。
