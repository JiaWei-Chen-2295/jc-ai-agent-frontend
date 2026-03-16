# Quiz 模块 API 使用说明

## 概述

本模块已完整实现后端提供的所有测验相关接口，所有接口调用统一封装在 `quizApi.ts` 文件中。

## 已实现的接口

### 1. 会话管理接口

#### 创建测验会话
```typescript
import { createQuizSession, startAdaptiveQuiz } from './quizApi';

// 方式1: 完整参数
const response = await createQuizSession({
  documentIds: [1, 2, 3],
  quizMode: 'ADAPTIVE',
  questionCount: 0
});

// 方式2: 快捷方法（自适应模式）
const response = await startAdaptiveQuiz([1, 2, 3]);
```

#### 查询会话详情
```typescript
import { getQuizSessionDetail } from './quizApi';

const response = await getQuizSessionDetail(sessionId);
```

#### 更新会话状态
```typescript
import { updateQuizSession, pauseQuiz, resumeQuiz, abandonQuiz } from './quizApi';

// 方式1: 通用方法
await updateQuizSession(sessionId, 'PAUSE');

// 方式2: 快捷方法
await pauseQuiz(sessionId);
await resumeQuiz(sessionId);
await abandonQuiz(sessionId);
```

#### 删除会话
```typescript
import { deleteQuizSession } from './quizApi';

await deleteQuizSession(sessionId);
```

#### 查询测验历史列表
```typescript
import { getQuizSessionList } from './quizApi';

const response = await getQuizSessionList({
  status: 'COMPLETED',
  pageNum: 1,
  pageSize: 20
});
```

### 2. 答题交互接口

#### 提交答案
```typescript
import { submitQuizAnswer } from './quizApi';

await submitQuizAnswer(sessionId, {
  questionId: 'q123',
  answer: 'A',
  responseTimeMs: 5000
});
```

#### 获取下一题
```typescript
import { getNextQuestion } from './quizApi';

const response = await getNextQuestion(sessionId);
```

#### 获取会话实时状态
```typescript
import { getQuizSessionStatus, isSessionCompleted } from './quizApi';

const response = await getQuizSessionStatus(sessionId);

// 或使用辅助函数
const completed = await isSessionCompleted(sessionId);
```

### 3. 分析接口

#### 获取用户认知状态
```typescript
import { getUserCognitiveState } from './quizApi';

const response = await getUserCognitiveState(userId);
// response.data 包含三维认知模型数据
```

#### 获取会话报告
```typescript
import { getSessionReport } from './quizApi';

const response = await getSessionReport(sessionId);
```

#### 获取用户知识缺口列表
```typescript
import { getUserKnowledgeGaps } from './quizApi';

const response = await getUserKnowledgeGaps(userId, {
  severity: 'HIGH',
  pageNum: 1,
  pageSize: 20
});
```

#### 标记知识缺口已解决
```typescript
import { markGapAsResolved } from './quizApi';

await markGapAsResolved(gapId);
```

## 使用位置

### QuizStore (store/quizStore.ts)
- ✅ `startNewSession` - 使用 `startAdaptiveQuiz`
- ✅ `submitAnswer` - 使用 `submitQuizAnswer`
- ✅ `fetchNextQuestion` - 使用 `getNextQuestion` + `getQuizSessionStatus`
- ✅ `pauseQuiz` - 使用 `pauseQuiz`
- ✅ `resumeQuiz` - 使用 `resumeQuiz`
- ✅ `abandonQuiz` - 使用 `abandonQuiz`

### QuizPage (features/quiz/QuizPage.tsx)
- ✅ 实现暂停/恢复/放弃功能
- ✅ 提交答案并获取下一题

### QuizHistoryPage (features/quiz/QuizHistoryPage.tsx)
- ✅ `loadSessions` - 使用 `getQuizSessionList`
- ✅ `handleDelete` - 使用 `deleteQuizSession`
- ✅ `handleViewDetail` - 使用 `getQuizSessionDetail`
- ✅ `handleViewReport` - 使用 `getSessionReport`

### QuizAnalysisPage (features/quiz/QuizAnalysisPage.tsx)
- ✅ `loadAnalysisData` - 使用 `getUserCognitiveState` + `getUserKnowledgeGaps`
- ✅ `handleResolveGap` - 使用 `markGapAsResolved`

## 对应后端接口

根据后端设计文档 (docs/后端设计文档.md)，所有接口已完整实现：

### 会话管理
- ✅ POST   `/api/v1/quiz/session` - 创建会话
- ✅ GET    `/api/v1/quiz/session/{id}` - 查询会话详情
- ✅ PUT    `/api/v1/quiz/session/{id}` - 更新会话
- ✅ DELETE `/api/v1/quiz/session/{id}` - 删除会话
- ✅ GET    `/api/v1/quiz/session/list` - 查询历史列表

### 答题交互
- ✅ POST `/api/v1/quiz/session/{id}/answer` - 提交答案
- ✅ GET  `/api/v1/quiz/session/{id}/status` - 会话实时状态
- ✅ GET  `/api/v1/quiz/session/{id}/next` - 获取下一题

### 分析接口
- ✅ GET  `/api/v1/quiz/analysis/user/{userId}` - 用户认知状态
- ✅ GET  `/api/v1/quiz/analysis/session/{id}/report` - 会话报告
- ✅ GET  `/api/v1/quiz/analysis/user/{userId}/gaps` - 知识缺口列表
- ✅ POST `/api/v1/quiz/analysis/gap/{id}/resolve` - 标记缺口已解决

## 统一响应格式

所有接口返回格式统一为：

```typescript
{
  code: number;      // 0 表示成功
  data: T;           // 具体数据
  message: string;   // 提示信息
}
```

## 注意事项

1. 所有 API 调用已统一封装在 `quizApi.ts`，不要直接使用 `Service` 类
2. 使用 TypeScript 类型定义，确保类型安全
3. 所有接口都有错误处理，失败时会抛出异常
4. 分页查询默认参数：`pageNum: 1`, `pageSize: 20`
