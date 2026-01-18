/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvatarUploadTokenRequest } from '../models/AvatarUploadTokenRequest';
import type { BaseResponseAvatarUploadTokenResponse } from '../models/BaseResponseAvatarUploadTokenResponse';
import type { BaseResponseBoolean } from '../models/BaseResponseBoolean';
import type { BaseResponseChatMessageListResponse } from '../models/BaseResponseChatMessageListResponse';
import type { BaseResponseChatSessionListResponse } from '../models/BaseResponseChatSessionListResponse';
import type { BaseResponseChatSessionVO } from '../models/BaseResponseChatSessionVO';
import type { BaseResponseListTenantVO } from '../models/BaseResponseListTenantVO';
import type { BaseResponseListUserVO } from '../models/BaseResponseListUserVO';
import type { BaseResponseLong } from '../models/BaseResponseLong';
import type { BaseResponsePageUserVO } from '../models/BaseResponsePageUserVO';
import type { BaseResponseTenantVO } from '../models/BaseResponseTenantVO';
import type { BaseResponseUserVO } from '../models/BaseResponseUserVO';
import type { DeleteRequest } from '../models/DeleteRequest';
import type { DocumentUploadResponse } from '../models/DocumentUploadResponse';
import type { StudyFriendDocument } from '../models/StudyFriendDocument';
import type { TenantCreateRequest } from '../models/TenantCreateRequest';
import type { TenantJoinRequest } from '../models/TenantJoinRequest';
import type { TenantLeaveRequest } from '../models/TenantLeaveRequest';
import type { TenantSetActiveRequest } from '../models/TenantSetActiveRequest';
import type { TenantTransferAdminRequest } from '../models/TenantTransferAdminRequest';
import type { UserAvatarUpdateRequest } from '../models/UserAvatarUpdateRequest';
import type { UserCreateRequest } from '../models/UserCreateRequest';
import type { UserLoginRequest } from '../models/UserLoginRequest';
import type { UserQueryRequest } from '../models/UserQueryRequest';
import type { UserRegisterRequest } from '../models/UserRegisterRequest';
import type { UserUpdateMyRequest } from '../models/UserUpdateMyRequest';
import type { UserUpdateRequest } from '../models/UserUpdateRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class Service {
  /**
   * 更新用户（管理员）
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static updateUser({
    requestBody,
  }: {
    requestBody: UserUpdateRequest,
  }): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/update',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 更新我的资料
   * @returns BaseResponseUserVO OK
   * @throws ApiError
   */
  public static updateMyUser({
    requestBody,
  }: {
    requestBody: UserUpdateMyRequest,
  }): CancelablePromise<BaseResponseUserVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/update/my',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 用户注册
   * @returns BaseResponseLong OK
   * @throws ApiError
   */
  public static userRegister({
    requestBody,
  }: {
    requestBody: UserRegisterRequest,
  }): CancelablePromise<BaseResponseLong> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/register',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 用户退出登录
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static userLogout(): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/logout',
    });
  }
  /**
   * 用户登录
   * @returns BaseResponseUserVO OK
   * @throws ApiError
   */
  public static userLogin({
    requestBody,
  }: {
    requestBody: UserLoginRequest,
  }): CancelablePromise<BaseResponseUserVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/login',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 分页查询用户（管理员）
   * @returns BaseResponsePageUserVO OK
   * @throws ApiError
   */
  public static listUserByPage({
    requestBody,
  }: {
    requestBody: UserQueryRequest,
  }): CancelablePromise<BaseResponsePageUserVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/list/page',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 删除用户（管理员）
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static deleteUser({
    requestBody,
  }: {
    requestBody: DeleteRequest,
  }): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/delete',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 更新当前用户头像
   * @returns BaseResponseUserVO OK
   * @throws ApiError
   */
  public static updateMyAvatar({
    requestBody,
  }: {
    requestBody: UserAvatarUpdateRequest,
  }): CancelablePromise<BaseResponseUserVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/avatar',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 获取头像上传凭证（前端直传）
   * @returns BaseResponseAvatarUploadTokenResponse OK
   * @throws ApiError
   */
  public static getUploadToken({
    requestBody,
  }: {
    requestBody: AvatarUploadTokenRequest,
  }): CancelablePromise<BaseResponseAvatarUploadTokenResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/avatar/upload-token',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 新增用户（管理员）
   * @returns BaseResponseLong OK
   * @throws ApiError
   */
  public static addUser({
    requestBody,
  }: {
    requestBody: UserCreateRequest,
  }): CancelablePromise<BaseResponseLong> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/add',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 管理员转让
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static transferAdmin({
    requestBody,
  }: {
    requestBody: TenantTransferAdminRequest,
  }): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/tenant/transfer-admin',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 退出团队
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static leaveTenant({
    requestBody,
  }: {
    requestBody: TenantLeaveRequest,
  }): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/tenant/leave',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 加入团队
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static joinTenant({
    requestBody,
  }: {
    requestBody: TenantJoinRequest,
  }): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/tenant/join',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 创建团队
   * @returns BaseResponseTenantVO OK
   * @throws ApiError
   */
  public static createTeam({
    requestBody,
  }: {
    requestBody: TenantCreateRequest,
  }): CancelablePromise<BaseResponseTenantVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/tenant/create',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 切换当前团队
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static setActiveTenant({
    requestBody,
  }: {
    requestBody: TenantSetActiveRequest,
  }): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/tenant/active',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 重新索引文档
   * 重新执行文档的向量化处理（用于失败重试）
   * @returns any 提交成功
   * @throws ApiError
   */
  public static reindexDocument({
    documentId,
  }: {
    /**
     * 文档唯一标识 ID
     */
    documentId: number,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/document/{documentId}/reindex',
      path: {
        'documentId': documentId,
      },
    });
  }
  /**
   * 上传文档
   * 上传文档后立即返回，后台异步进行向量化处理。返回的 documentId 可用于查询状态。
   * @returns DocumentUploadResponse 上传成功
   * @throws ApiError
   */
  public static uploadDocument({
    formData,
  }: {
    formData?: {
      /**
       * 上传的文档文件，支持 pdf/pptx/docx/md 等
       */
      file: Blob;
    },
  }): CancelablePromise<DocumentUploadResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/document/upload',
      formData: formData,
      mediaType: 'multipart/form-data',
      errors: {
        400: `文件为空或读取失败`,
      },
    });
  }
  /**
   * Create chat session
   * Create a StudyFriend chat session and return chatId.
   * @returns BaseResponseChatSessionVO OK
   * @throws ApiError
   */
  public static createSession({
    title,
  }: {
    title?: string,
  }): CancelablePromise<BaseResponseChatSessionVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/ai_friend/session',
      query: {
        'title': title,
      },
    });
  }
  /**
   * 查询用户列表（管理员）
   * @returns BaseResponseListUserVO OK
   * @throws ApiError
   */
  public static listUser({
    request,
  }: {
    request: UserQueryRequest,
  }): CancelablePromise<BaseResponseListUserVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/user/list',
      query: {
        'request': request,
      },
    });
  }
  /**
   * 根据 id 获取用户（管理员）
   * @returns BaseResponseUserVO OK
   * @throws ApiError
   */
  public static getUserById({
    id,
  }: {
    id: number,
  }): CancelablePromise<BaseResponseUserVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/user/get',
      query: {
        'id': id,
      },
    });
  }
  /**
   * 获取当前登录用户
   * @returns BaseResponseUserVO OK
   * @throws ApiError
   */
  public static getCurrentUser(): CancelablePromise<BaseResponseUserVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/user/current',
    });
  }
  /**
   * 查询我加入的团队
   * @returns BaseResponseListTenantVO OK
   * @throws ApiError
   */
  public static listMyTenants(): CancelablePromise<BaseResponseListTenantVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/tenant/list',
    });
  }
  /**
   * 健康检查
   * 用于探活或部署验证
   * @returns string 服务正常，返回 OK
   * @throws ApiError
   */
  public static health(): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/health',
    });
  }
  /**
   * 查询文档状态
   * 根据文档ID查询文档处理状态
   * @returns StudyFriendDocument 文档详情
   * @throws ApiError
   */
  public static getDocument({
    documentId,
  }: {
    /**
     * 文档唯一标识 ID
     */
    documentId: number,
  }): CancelablePromise<StudyFriendDocument> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/document/{documentId}',
      path: {
        'documentId': documentId,
      },
    });
  }
  /**
   * 删除文档
   * 删除文档及其关联的向量数据
   * @returns any 删除成功
   * @throws ApiError
   */
  public static deleteDocument({
    documentId,
  }: {
    /**
     * 文档唯一标识 ID
     */
    documentId: number,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/document/{documentId}',
      path: {
        'documentId': documentId,
      },
    });
  }
  /**
   * 查询所有文档
   * 获取所有文档列表及其状态
   * @returns StudyFriendDocument 文档列表
   * @throws ApiError
   */
  public static listDocuments(): CancelablePromise<Array<StudyFriendDocument>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/document/list',
    });
  }
  /**
   * List chat messages (cursor)
   * Cursor pagination for chat messages.
   * @returns BaseResponseChatMessageListResponse OK
   * @throws ApiError
   */
  public static listMessages({
    chatId,
    beforeId,
    limit = 10,
  }: {
    chatId: string,
    beforeId?: number,
    limit?: number,
  }): CancelablePromise<BaseResponseChatMessageListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai_friend/session/{chatId}/messages',
      path: {
        'chatId': chatId,
      },
      query: {
        'beforeId': beforeId,
        'limit': limit,
      },
    });
  }
  /**
   * List chat sessions (cursor)
   * Cursor pagination for current user's sessions.
   * @returns BaseResponseChatSessionListResponse OK
   * @throws ApiError
   */
  public static listSessions({
    beforeLastMessageAt,
    beforeChatId,
    limit = 10,
  }: {
    beforeLastMessageAt?: string,
    beforeChatId?: string,
    limit?: number,
  }): CancelablePromise<BaseResponseChatSessionListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai_friend/session/list',
      query: {
        'beforeLastMessageAt': beforeLastMessageAt,
        'beforeChatId': beforeChatId,
        'limit': limit,
      },
    });
  }
  /**
   * SSE 流式聊天（可触发工具调用）
   * 与上一个接口一致，但内部可调用工具以获取外部数据，返回的流中同样包含文本增量。
   * @returns any SSE 数据流（data 字段为字符串增量）
   * @throws ApiError
   */
  public static doChatWithRagStreamTool({
    chatMessage,
    chatId,
    messageId,
  }: {
    /**
     * 用户提问或对话内容
     */
    chatMessage: string,
    /**
     * 会话唯一标识，复用以保持上下文
     */
    chatId: string,
    messageId?: string,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai_friend/do_chat/sse_with_tool/emitter',
      query: {
        'chatMessage': chatMessage,
        'chatId': chatId,
        'messageId': messageId,
      },
    });
  }
  /**
   * SSE 流式聊天（AgentEvent，可触发工具调用）
   * 与上一个接口一致，但内部可调用工具。
   * @returns any SSE 数据流（data 字段为 DisplayEvent JSON）
   * @throws ApiError
   */
  public static doChatWithAgentEventStreamTool({
    chatMessage,
    chatId,
    messageId,
  }: {
    /**
     * 用户提问或对话内容
     */
    chatMessage: string,
    /**
     * 会话唯一标识，复用以保持上下文
     */
    chatId: string,
    messageId?: string,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai_friend/do_chat/sse_with_tool/agent/emitter',
      query: {
        'chatMessage': chatMessage,
        'chatId': chatId,
        'messageId': messageId,
      },
    });
  }
  /**
   * SSE 流式聊天
   * 以 text/event-stream 返回增量输出，前端可直接用 EventSource 订阅。每条 data 为模型的部分回答。
   * @returns any SSE 数据流（data 字段为字符串增量）
   * @throws ApiError
   */
  public static doChatWithRagStream({
    chatMessage,
    chatId,
    messageId,
  }: {
    /**
     * 用户提问或对话内容
     */
    chatMessage: string,
    /**
     * 会话唯一标识，复用以保持上下文
     */
    chatId: string,
    messageId?: string,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai_friend/do_chat/sse/emitter',
      query: {
        'chatMessage': chatMessage,
        'chatId': chatId,
        'messageId': messageId,
      },
    });
  }
  /**
   * SSE 流式聊天（AgentEvent）
   * 以 text/event-stream 返回 DisplayEvent JSON，前端按 display 事件渲染。
   * @returns any SSE 数据流（data 字段为 DisplayEvent JSON）
   * @throws ApiError
   */
  public static doChatWithAgentEventStream({
    chatMessage,
    chatId,
    messageId,
  }: {
    /**
     * 用户提问或对话内容
     */
    chatMessage: string,
    /**
     * 会话唯一标识，复用以保持上下文
     */
    chatId: string,
    messageId?: string,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai_friend/do_chat/sse/agent/emitter',
      query: {
        'chatMessage': chatMessage,
        'chatId': chatId,
        'messageId': messageId,
      },
    });
  }
  /**
   * 异步聊天（轮询获取完整回答）
   * 使用 chatId 维持上下文，会在服务端完成检索后返回一次性完整回答。
   * @returns any AI 的完整回答
   * @throws ApiError
   */
  public static doChatWithRag({
    chatMessage,
    chatId,
    messageId,
  }: {
    /**
     * 用户提问或对话内容
     */
    chatMessage: string,
    /**
     * 会话唯一标识，复用以保持上下文
     */
    chatId: string,
    messageId?: string,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai_friend/do_chat/async',
      query: {
        'chatMessage': chatMessage,
        'chatId': chatId,
        'messageId': messageId,
      },
    });
  }
  /**
   * Admin list chat messages (cursor)
   * Admin can read messages across tenants.
   * @returns BaseResponseChatMessageListResponse OK
   * @throws ApiError
   */
  public static listMessagesByAdmin({
    chatId,
    beforeId,
    limit = 10,
  }: {
    chatId: string,
    beforeId?: number,
    limit?: number,
  }): CancelablePromise<BaseResponseChatMessageListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai_friend/admin/session/{chatId}/messages',
      path: {
        'chatId': chatId,
      },
      query: {
        'beforeId': beforeId,
        'limit': limit,
      },
    });
  }
  /**
   * Admin list chat sessions (cursor)
   * Admin can list sessions across tenants.
   * @returns BaseResponseChatSessionListResponse OK
   * @throws ApiError
   */
  public static listSessionsByAdmin({
    tenantId,
    userId,
    beforeLastMessageAt,
    beforeChatId,
    limit = 10,
  }: {
    tenantId?: number,
    userId?: number,
    beforeLastMessageAt?: string,
    beforeChatId?: string,
    limit?: number,
  }): CancelablePromise<BaseResponseChatSessionListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai_friend/admin/session/list',
      query: {
        'tenantId': tenantId,
        'userId': userId,
        'beforeLastMessageAt': beforeLastMessageAt,
        'beforeChatId': beforeChatId,
        'limit': limit,
      },
    });
  }
}
