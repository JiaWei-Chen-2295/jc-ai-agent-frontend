# Quiz 模块实现规范

目标：描述 Quiz 模块的接口与业务逻辑，供在其他平台复刻该功能时参考。

---

## 一、核心数据模型

### 题目 (Question)

```ts
{
  id: string;
  questionNo: number;                  // 题目序号
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' |
                'FILL_IN_BLANK' | 'SHORT_ANSWER' | 'EXPLANATION' |
                'MATCHING' | 'ORDERING' | 'CODE_COMPLETION';
  questionText: string;
  options: string[];                   // 选项列表（选择题/排序题/配对题使用）
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  relatedConcept: string;              // 关联知识点
  answered: boolean;
}
```

### 会话 (QuizSession)

```ts
{
  sessionId: string;
  quizMode: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'TIMEOUT' | 'ABANDONED';
  currentQuestionNo: number;
  totalQuestions: number;
  score: number;
  startedAt: string;
  completedAt: string;
  firstQuestion: Question;             // 创建会话时同步返回第一题
}
```

### 提交答案响应 (SubmitAnswerResponse)

```ts
{
  isCorrect: boolean;
  score: number;
  correctAnswer: string;
  explanation: string;
  feedback: string;
  conceptMastery: string;
  hasNextQuestion: boolean;
  nextQuestion: Question;             // 后端可直接携带下一题，减少请求次数
  quizCompleted: boolean;
  totalScore: number;
  currentQuestionNo: number;
  totalQuestions: number;
}
```

### 会话报告 (SessionReport)

```ts
{
  sessionId: string;
  totalQuestions: number;
  correctCount: number;
  totalScore: number;
  accuracy: number;                   // 正确率（0-100）
  durationSeconds: number;
  understandingDepth: number;         // 三维认知：理解深度（0-100）
  cognitiveLoad: number;              // 三维认知：认知负荷（0-100，越低越好）
  stability: number;                  // 三维认知：稳定性（0-100）
  conceptAnalyses: {
    concept: string;
    mastery: 'MASTERED' | 'FAMILIAR' | 'LEARNING' | 'UNFAMILIAR';
    questionCount: number;
    correctCount: number;
    accuracy: number;
  }[];
  suggestions: string[];
}
```

### 知识缺口 (KnowledgeGap)

```ts
{
  id: string;
  conceptName: string;
  gapDescription: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  rootCause: string;
}
```

---

## 二、API 接口

基础路径：`/api/v1/quiz`

### 会话管理

#### 创建会话（开始测验）
```
POST /session
Body: {
  documentIds: number[];              // 选择用于出题的文档 ID 列表
  quizMode: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
  questionCount: number;              // 0 = 自适应（无限题）
}
Response: { code, data: QuizSession }  // data.firstQuestion 包含第一道题
```

#### 获取会话详情
```
GET /session/{sessionId}
Response: { code, data: {
  session: QuizSession;
  questions: Question[];              // 该会话所有已出的题
  responses: { questionId, answer, isCorrect, ... }[];  // 答题记录
}}
```

#### 更新会话状态
```
PUT /session/{sessionId}
Body: { action: 'PAUSE' | 'RESUME' | 'ABANDON' }
Response: { code, data: QuizSession }
```

#### 删除会话
```
DELETE /session/{sessionId}
Response: { code, data: boolean }
```

#### 查询历史列表
```
GET /session/list?status=IN_PROGRESS|COMPLETED&pageNum=1&pageSize=20
Response: { code, data: { list: QuizSession[], total: number } }
```

---

### 答题交互

#### 提交答案
```
POST /session/{sessionId}/answer
Body: {
  questionId: string;
  answer: string;                     // 所有题型统一为字符串，复杂类型 JSON.stringify
  responseTimeMs: number;             // 答题耗时（毫秒），可传 0
}
Response: { code, data: SubmitAnswerResponse }
```

答案格式约定（不同题型）：

| 题型 | answer 格式示例 |
|---|---|
| 单选 | `"A"` |
| 多选 | `'["A","C"]'`（JSON 数组字符串） |
| 判断 | `"true"` 或 `"false"` |
| 填空/简答/代码 | 纯文本字符串 |
| 排序 | `'["步骤1","步骤3","步骤2"]'` |
| 配对 | `'{"概念A":"定义2","概念B":"定义1"}'` |

#### 获取下一题
```
GET /session/{sessionId}/next
Response: { code, data: Question }
```

> 说明：提交答案时若响应中 `nextQuestion` 已存在则直接使用，无需再调此接口；仅当 `hasNextQuestion=true` 但 `nextQuestion` 为空时才调用。

#### 获取会话实时状态
```
GET /session/{sessionId}/status
Response: { code, data: { status: string, ... } }
```

---

### 分析接口

#### 获取用户认知状态（跨会话累计）
```
GET /analysis/user/{userId}
Response: { code, data: {
  avgUnderstandingDepth: number;
  avgCognitiveLoad: number;
  avgStability: number;
}}
```

#### 获取单次会话报告
```
GET /analysis/session/{sessionId}/report
Response: { code, data: SessionReport }
```

#### 获取用户知识缺口
```
GET /analysis/user/{userId}/gaps
Response: { code, data: { list: KnowledgeGap[] } }
```

#### 标记知识缺口已解决
```
POST /analysis/gap/{gapId}/resolve
Response: { code, data: boolean }
```

---

## 三、业务逻辑

### 3.1 开始测验

1. 用户选择一个或多个文档（documentIds）
2. 调用**创建会话**接口，模式固定为 `ADAPTIVE`，questionCount 传 `0`
3. 响应中 `data.firstQuestion` 即为第一题，直接展示，无需再调 `/next`

### 3.2 答题主流程

```
展示当前题目
    ↓
用户作答（本地暂存答案，未提交前可修改）
    ↓
用户确认提交 → 调用「提交答案」接口
    ↓
    ├── data.quizCompleted = true  → 进入「完成」状态，展示结果页
    ├── data.nextQuestion 存在     → 直接展示 nextQuestion，继续循环
    ├── data.hasNextQuestion = true（但无 nextQuestion）
    │       → 调「获取下一题」接口 → 展示，继续循环
    └── hasNextQuestion = false    → 进入「完成」状态
```

### 3.3 会话控制

| 操作 | 前提 | 行为 |
|---|---|---|
| 暂停 | 状态为 IN_PROGRESS | 调 `PUT /session/{id}` action=PAUSE，状态变 PAUSED，暂停时禁止提交 |
| 恢复 | 状态为 PAUSED | 调 `PUT /session/{id}` action=RESUME，状态变 IN_PROGRESS |
| 放弃 | 任意进行中状态 | 调 `PUT /session/{id}` action=ABANDON，清除本地会话数据 |

### 3.4 继续未完成的测验（从历史记录恢复）

1. 调**获取会话详情**接口，获取 `session`、`questions`、`responses`
2. 若 `session.status = PAUSED`，先调 RESUME 恢复
3. 若 `session.status = COMPLETED`，直接跳转到报告页
4. 从 `responses` 中提取已答题的 questionId 集合
5. 在 `questions` 列表中找第一道未被作答的题（按 questionNo 排序）
6. 若找不到未答题，调**获取下一题**接口（动态出题场景）
7. 从找到的题目开始继续答题流程

### 3.5 页面刷新恢复

- 将 `sessionId` 和 `sessionStatus` 持久化到本地存储
- 页面加载时，若本地存有 `sessionId` 且状态为非完成/非放弃，执行「继续未完成的测验」流程

### 3.6 测验完成后

- 跳转到结果页，展示完成状态
- 提供两个入口：
  - **开始新测验**：清除当前会话状态，回到初始配置页
  - **查看分析**：跳转到学习分析页，调用认知状态和知识缺口接口

### 3.7 历史记录页

- 拉取会话列表，支持按状态筛选（全部 / 进行中 / 已完成）
- 每条记录根据状态展示不同操作：
  - `COMPLETED` → 查看报告（跳转报告页）
  - `IN_PROGRESS` / `PAUSED` → 继续测验（执行 3.4 恢复流程）
  - 其他 → 查看详情

### 3.8 学习分析页

- 调**用户认知状态**接口展示三维指标（0-100 分）
  - 理解深度：≥70 为良好
  - 认知负荷：≤40 为良好（反向指标，越低说明掌握越好）
  - 稳定性：≥70 为良好
- 调**知识缺口**接口展示待补强知识点（按 HIGH / MEDIUM / LOW 分级）
- 支持单条标记为"已解决"

---

## 四、会话状态机

```
IDLE ──────────────── 创建会话 ──────────────→ IN_PROGRESS
                                                   │
                          ┌── PAUSE ───────────────┤
                          ↓                         │
                        PAUSED ── RESUME ──────────→┤
                                                    │
                          ┌── ABANDON ─────────────→ ABANDONED（本地清除）
                          │
                          └── 题目耗尽 / quizCompleted ─→ COMPLETED
```

---

## 五、响应格式约定

所有接口统一返回结构：

```json
{
  "code": 0,       // 0 = 成功，非 0 = 错误
  "data": { ... },
  "message": ""
}
```

业务层判断：`code === 0 && data !== null` 为成功，否则视为失败并提示错误信息。
