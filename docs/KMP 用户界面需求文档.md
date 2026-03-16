# KMP 用户界面需求文档

## 📋 文档概述

本文档基于现有 React 前端项目的接口使用情况和业务逻辑，为 Kotlin Multiplatform (KMP) 跨平台用户界面开发提供需求说明。**不包含管理员功能**，仅聚焦于普通用户的核心使用场景。

---

## 🎯 项目定位

### 核心目标
开发一个跨平台的智能学习助手应用，支持：
- **AI 智能对话**：基于文档的 RAG 问答
- **自适应测验**：根据用户掌握程度动态出题
- **文档管理**：上传、查看个人/团队文档
- **团队协作**：加入和管理学习小组

### 排除范围（管理员功能）
- ❌ 用户管理（增删改查用户）
- ❌ 跨团队消息查看
- ❌ 文档强制重索引
- ❌ 系统级监控

---

## 👤 用户角色

| 角色 | 权限说明 |
|:---|:---|
| **普通用户** | 登录、对话、测验、上传文档、加入团队 |
| **团队管理员** | 除普通用户权限外，还可管理团队（转让、退出）、删除团队文档 |

---

## 🏗️ 功能模块划分

### 1. 认证模块（Authentication）

#### 1.1 登录注册
**API 接口：**
```kotlin
// 登录
POST /user/login
Request: UserLoginRequest { userAccount, userPassword }
Response: BaseResponseUserVO { id, userAccount, userName, userAvatar, userRole }

// 注册
POST /user/register
Request: UserRegisterRequest { userAccount, userPassword, checkPassword }
Response: BaseResponseLong { userId }

// 登出
POST /user/logout
Response: BaseResponseBoolean

// 获取当前用户
GET /user/current
Response: BaseResponseUserVO
```

**UI 页面：**
- `LoginPage` - 登录表单（账号 + 密码），含注册入口
- `ProfilePage` - 个人资料页（修改昵称、头像）

**状态管理：**
- 当前用户信息缓存
- Token 持久化存储

---

### 2. 团队模块（Teams）

#### 2.1 团队管理
**API 接口：**
```kotlin
// 获取我加入的团队
GET /tenant/list
Response: List<TenantVO> { id, tenantName, tenantType, role }

// 创建团队
POST /tenant/create
Request: TenantCreateRequest { tenantName }
Response: TenantVO

// 加入团队
POST /tenant/join
Request: TenantJoinRequest { tenantId }
Response: Boolean

// 退出团队
POST /tenant/leave
Request: TenantLeaveRequest { tenantId }
Response: Boolean

// 切换当前团队
POST /tenant/active
Request: TenantSetActiveRequest { tenantId }
Response: Boolean

// 转让管理员（仅管理员）
POST /tenant/transfer-admin
Request: TenantTransferAdminRequest { tenantId, newAdminUserId }
Response: Boolean
```

**UI 页面：**
- `TeamsPage` - 团队列表，支持创建/加入/切换/退出

**核心逻辑：**
- 团队上下文全局状态管理（类似 React Context）
- 切换团队后影响文档和聊天范围

---

### 3. 文档管理模块（Upload & Datasets）

#### 3.1 文档上传与查看
**API 接口：**
```kotlin
// 上传文档（ multipart/form-data ）
POST /api/document/upload
Request: file (Blob)
Response: DocumentUploadResponse { documentId, fileName, status }

// 查询所有文档
GET /api/document/list
Response: List<StudyFriendDocument> { 
    id, fileName, fileType, status, 
    createdAt, updatedAt 
}

// 查询文档状态
GET /api/document/{documentId}
Response: StudyFriendDocument

// 删除文档（仅管理员）
DELETE /api/document/{documentId}
Response: Boolean

// 重新索引文档（仅管理员）
POST /api/document/{documentId}/reindex
Response: Boolean
```

**文档状态枚举：**
```kotlin
enum class DocumentStatus {
    WAITING,      // 待处理
    PROCESSING,   // 解析中
    INDEXING,     // 向量化中
    READY,        // 就绪
    ERROR         // 失败
}
```

**UI 页面：**
- `UploadPage` - 上传卡片 + 文档列表表格
- 左侧边栏显示处理流程说明

**状态管理：**
- 文档列表缓存
- 上传进度实时显示
- 文档状态轮询（可选）

---

### 4. AI 对话模块（Chat）

#### 4.1 会话管理
**API 接口：**
```kotlin
// 创建会话
POST /ai_friend/session?title=xxx
Response: ChatSessionVO { chatId, title, lastMessageAt }

// 获取会话列表（游标分页）
GET /ai_friend/session/list
Query: beforeLastMessageAt, beforeChatId, limit
Response: ChatSessionListResponse { 
    records, hasMore, nextChatId, nextLastMessageAt 
}

// 获取消息列表（游标分页）
GET /ai_friend/session/{chatId}/messages
Query: beforeId, limit
Response: ChatMessageListResponse { 
    records, hasMore, nextBeforeId 
}
```

#### 4.2 聊天交互
**API 接口：**
```kotlin
// SSE 流式聊天（推荐）
GET /ai_friend/do_chat/sse/agent/emitter
Query: chatMessage, chatId, messageId
Response: SSE Stream (text/event-stream)

// 异步一次性回答（备用）
GET /ai_friend/do_chat/async
Query: chatMessage, chatId, messageId
Response: String (完整回答)
```

**SSE 事件类型：**
```kotlin
sealed class DisplayEvent {
    data class TextDelta(val content: String) : DisplayEvent()
    data class Thinking(val text: String) : DisplayEvent()
    data class Sources(val list: List<Source>) : DisplayEvent()
    data class Error(val message: String) : DisplayEvent()
    object End : DisplayEvent()
}
```

**UI 页面：**
- `ChatPage` - 主聊天界面
  - 左侧：会话列表（支持加载更多）
  - 中间：消息气泡（支持 Markdown 渲染）
  - 底部：输入框 + 快捷意图按钮
  - 右上角：新建会话按钮

**高级功能：**
- 聊天模式切换（标准/研究）
- RAG 开关（是否引用文档）
- 联网搜索开关
- 快捷意图预设（文档总结、对比差异等）

**状态管理：**
- 当前会话 ID
- 消息列表（支持向上滚动加载历史）
- 流式接收状态
- 输入框草稿

---

### 5. 智能测验模块（Quiz）

#### 5.1 会话管理
**API 接口：**
```kotlin
// 创建测验会话
POST /api/v1/quiz/session
Request: CreateQuizSessionRequest { 
    documentIds, quizMode, questionCount 
}
Response: QuizSessionVO { 
    id, status, sessionId, currentQuestionIndex 
}

// 查询会话详情
GET /api/v1/quiz/session/{id}
Response: QuizSessionDetailVO { 
    session, questions, answers, analysis 
}

// 更新会话状态
PUT /api/v1/quiz/session/{id}
Request: UpdateQuizSessionRequest { action: PAUSE | RESUME | ABANDON }
Response: QuizSessionVO

// 删除会话
DELETE /api/v1/quiz/session/{id}
Response: Boolean

// 查询测验历史
GET /api/v1/quiz/session/list
Query: request (status, pageNum, pageSize)
Response: QuizSessionListVO { records, total }
```

#### 5.2 答题交互
**API 接口：**
```kotlin
// 提交答案
POST /api/v1/quiz/session/{id}/answer
Request: SubmitAnswerRequest { questionId, answer }
Response: SubmitAnswerResponse { 
    isCorrect, score, feedback, 
    hasNextQuestion, nextQuestion, quizCompleted 
}

// 获取下一题
GET /api/v1/quiz/session/{id}/next
Response: QuestionVO

// 获取会话状态
GET /api/v1/quiz/session/{id}/status
Response: QuizSessionStatusVO { status, completedAt }
```

#### 5.3 题目类型
**后端枚举：**
```kotlin
enum class QuestionType {
    SINGLE_CHOICE,      // 单选题
    MULTIPLE_SELECT,    // 多选题
    TRUE_FALSE,         // 判断题
    FILL_IN_BLANK,      // 填空题
    ORDERING,           // 排序题
    MATCHING,           // 连线题
    SHORT_ANSWER,       // 简答题
    EXPLANATION,        // 解释题
    CODE_COMPLETION     // 代码补全
}
```

**QuestionVO 结构：**
```kotlin
data class QuestionVO(
    val questionId: String,
    val type: QuestionType,
    val text: String,
    val options: List<String>?,  // 客观题选项
    val correctAnswer: String?,
    val relatedConcept: String?,
    val difficulty: DifficultyLevel?,
    val explanation: String?
)

enum class DifficultyLevel { EASY, MEDIUM, HARD }
```

#### 5.4 UI 页面
- `QuizPage` - 测验主页
  - `QuizSetup` - 测验设置（选文档、选难度）
  - `QuestionRenderer` - 题目渲染器（根据题型动态渲染）
  - `QuizNav` - 导航栏
  
- `QuizHistoryPage` - 测验历史列表
  - 筛选标签（全部/进行中/已完成）
  - 会话卡片（得分、正确率、操作按钮）
  
- `QuizSessionDetailPage` - 会话详情页
  - 题目回顾
  - 答案对比
  
- `QuizReportPage` - 报告页
  - 最终得分
  - 知识缺口分析

**状态管理（QuizStore）：**
```kotlin
data class QuizState(
    val sessionId: String?,
    val sessionStatus: SessionStatus,
    val currentQuestion: QuestionVO?,
    val answers: Map<String, String>,
    val isSubmitting: Boolean
)

enum class SessionStatus {
    IDLE, LOADING, IN_PROGRESS, COMPLETED, ERROR
}
```

---

### 6. 学习分析模块（Analysis）

#### 6.1 认知状态
**API 接口：**
```kotlin
// 获取用户认知状态
GET /api/v1/quiz/analysis/user/{userId}
Response: UserCognitiveStateVO {
    understandingDepth,      // 理解深度 0-100
    cognitiveLoad,          // 认知负荷 0-100
    stability,              // 稳定性 0-100
    radarChartData          // 雷达图数据
}
```

#### 6.2 知识缺口
**API 接口：**
```kotlin
// 获取知识缺口列表
GET /api/v1/quiz/analysis/user/{userId}/gaps
Query: request (status, severity)
Response: KnowledgeGapListVO {
    records: List<KnowledgeGapVO> {
        id, concept, gapType, description,
        severity, resolved, resolvedAt
    }
}

// 标记缺口已解决
POST /api/v1/quiz/analysis/gap/{id}/resolve
Response: Boolean
```

#### 6.3 会话报告
**API 接口：**
```kotlin
// 获取会话报告
GET /api/v1/quiz/analysis/session/{id}/report
Response: SessionReportVO {
    score, accuracy, totalTime,
    conceptMasteryMap, strengthAndWeakness
}
```

**UI 页面：**
- `QuizAnalysisPage` - 分析主页
  - 三维认知模型雷达图
  - 知识缺口列表（按严重程度排序）
  - 学习趋势折线图

---

## 🎨 UI 设计规范

### 设计风格
- **深色模式**为主
- **霓虹色彩**（紫/蓝/青渐变）
- **毛玻璃效果**（backdrop-blur）
- **平滑动画**过渡

### 色彩系统
```kotlin
object AppColors {
    val primary = Color(0xFFA78BFA)      // 霓虹紫
    val background = Color(0xFF0F172A)   // 深色背景
    val surface = Color(0xFF1E293B)      // 卡片表面
    val border = Color(0xFF334155)       // 边框
    val textMain = Color(0xFFF8FAFC)     // 主文本
    val textMuted = Color(0xFF94A3B8)    // 次要文本
}
```

### 响应式布局
| 设备 | 屏幕宽度 | 布局策略 |
|:---|:---|:---|
| 手机 | < 768px | 单列，底部固定按钮 |
| 平板 | 768-1024px | 双列，侧边栏可折叠 |
| 桌面 | > 1024px | 三列，最大宽度限制 |

---

## 📦 技术栈建议

### KMP 架构
```kotlin
// 共享模块（commonMain）
- 数据模型（data classes）
- API 客户端（Ktor + serialization）
- 状态管理（MVI/MVVM）
- 业务逻辑

// 平台特定模块
- Android: Jetpack Compose
- iOS: SwiftUI
- Desktop: Compose Desktop
- Web: Compose HTML (可选)
```

### 依赖库推荐
```kotlin
// 网络请求
io.ktor:ktor-client-core
io.ktor:ktor-client-content-negotiation
org.jetbrains.kotlinx:kotlinx-serialization-json

// 状态管理
org.jetbrains.androidx:lifecycle-viewmodel-compose
org.jetbrains.kotlinx:kotlinx-coroutines-core

// 本地存储
app.cash.sqldelight:runtime
com.russhwolf:multiplatform-settings

// UI 组件（Android/iOS/Desktop）
androidx.compose.material3:material3
org.jetbrains.compose.material3:material3-compose

// 图表（分析页面）
com.github.PhilJay:MPAndroidChart (Android)
co.yml:ycharts (Compose Multiplatform)
```

---

## 🔄 核心业务流程

### 1. 聊天流程
```
用户登录 → 选择团队 → 进入聊天页
    ↓
创建/选择会话 → 输入问题 → 发送
    ↓
接收 SSE 流式响应 → 实时渲染
    ↓
查看引用来源 → 继续追问
```

### 2. 测验流程
```
用户登录 → 选择团队 → 上传文档
    ↓
进入测验页 → 选择文档和难度 → 开始测验
    ↓
循环：出题 → 答题 → 提交 → 获取下一题
    ↓
测验完成 → 查看报告 → 分析知识缺口
```

### 3. 文档处理流程
```
选择文件 → 上传（显示进度）
    ↓
服务端异步处理：解析 → 向量化 → 索引
    ↓
轮询/推送状态更新
    ↓
状态变为 READY → 可在聊天中引用
```

---

## 📊 数据模型映射

### 统一响应包装
```kotlin
data class BaseResponse<T>(
    val code: Int = 0,
    val data: T?,
    val message: String? = null
)

fun <T> BaseResponse<T>.unwrap(): T {
    if (code != 0) throw ApiException(message ?: "操作失败")
    return data ?: throw ApiException("数据为空")
}
```

### 分页参数
```kotlin
// 游标分页（聊天）
data class CursorParams(
    val beforeId: String? = null,
    val limit: Int = 10
)

// 页码分页（测验历史）
data class PageParams(
    val pageNum: Int = 1,
    val pageSize: Int = 10
)
```

---

## 🔐 权限控制

### 登录检查
- 所有需要登录的页面在启动时检查 `current-user`
- Token 过期时自动跳转登录页

### 团队权限
```kotlin
enum class TenantRole { MEMBER, ADMIN }

// 仅管理员可执行的操作
- 删除文档
- 重索引文档
- 转让管理员
```

---

## ⚠️ 注意事项

### 1. SSE 流式聊天
- 需要处理连接中断重连
- 支持取消正在生成的回答
- 事件类型解析要健壮（兼容未知事件）

### 2. 测验答案序列化
```kotlin
when (questionType) {
    SINGLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK -> answer // 直接字符串
    MULTIPLE_SELECT, ORDERING -> Json.encodeToString(answerList)
    MATCHING -> Json.encodeToString(answerMap)
}
```

### 3. 团队上下文同步
- 切换团队后立即刷新文档列表和聊天会话
- 使用本地缓存避免频繁请求

### 4. 文件上传
- 支持拖拽上传
- 显示上传进度百分比
- 大文件分片上传（可选）

---

## 🚀 开发优先级

### Phase 1 - 核心功能（MVP）
1. ✅ 登录/注册
2. ✅ 团队切换
3. ✅ 文档上传与查看
4. ✅ AI 对话（基础版）
5. ✅ 测验流程（单选/多选/判断）

### Phase 2 - 完善体验
1. ⏳ 完整 9 种题型支持
2. ⏳ 测验历史和报告
3. ⏳ 学习分析页面
4. ⏳ 聊天快捷意图
5. ⏳ 暂停/恢复测验

### Phase 3 - 高级功能
1. ⏳ 知识缺口可视化
2. ⏳ 认知状态雷达图
3. ⏳ 答题反馈动画
4. ⏳ 错题本功能

---

## 📝 附录：API 调用示例

### Ktor 客户端配置
```kotlin
class ApiClient {
    private val client = HttpClient {
        defaultRequest {
            url(BASE_URL)
            contentType(ContentType.Application.Json)
        }
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
    }
    
    suspend fun login(request: UserLoginRequest): UserVO {
        return client.post("/user/login") {
            setBody(request)
        }.body<BaseResponse<UserVO>>().unwrap()
    }
}
```

### ViewModel 示例
```kotlin
class ChatViewModel(
    private val chatRepository: ChatRepository
) : ViewModel() {
    private val _state = MutableStateFlow(ChatState())
    val state: StateFlow<ChatState> = _state.asStateFlow()
    
    fun sendMessage(message: String) {
        viewModelScope.launch {
            _state.update { it.copy(isSending = true) }
            try {
                val response = chatRepository.sendStream(
                    message = message,
                    chatId = _state.value.activeChatId
                )
                // 处理 SSE 流...
            } finally {
                _state.update { it.copy(isSending = false) }
            }
        }
    }
}
```

---

## 📖 参考资料

- 后端 API 设计文档：`docs/后端设计文档.md`
- 前端实现参考：`src/features/` 下各模块
- 题型枚举定义：`src/api/models/QuestionVO.ts`
- SSE 事件解析：`src/features/chat/displayEvent.ts`

---

**文档版本**: v1.0  
**最后更新**: 2026-03-01  
**维护者**: 根据 React 前端项目整理
