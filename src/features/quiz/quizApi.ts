/**
 * 测验模块 API 统一封装
 * 基于后端设计文档的完整接口调用
 */

import { Service } from '@/api/services/Service';
import type { CreateQuizSessionRequest } from '@/api/models/CreateQuizSessionRequest';
import type { UpdateQuizSessionRequest } from '@/api/models/UpdateQuizSessionRequest';
import type { SubmitAnswerRequest } from '@/api/models/SubmitAnswerRequest';
import type { QuizSessionQueryRequest } from '@/api/models/QuizSessionQueryRequest';
import type { KnowledgeGapQueryRequest } from '@/api/models/KnowledgeGapQueryRequest';
import type { BaseResponseQuizSessionVO } from '@/api/models/BaseResponseQuizSessionVO';
import type { BaseResponseQuizSessionDetailVO } from '@/api/models/BaseResponseQuizSessionDetailVO';
import type { BaseResponseQuizSessionListVO } from '@/api/models/BaseResponseQuizSessionListVO';
import type { BaseResponseQuizSessionStatusVO } from '@/api/models/BaseResponseQuizSessionStatusVO';
import type { BaseResponseQuestionVO } from '@/api/models/BaseResponseQuestionVO';
import type { BaseResponseSubmitAnswerResponse } from '@/api/models/BaseResponseSubmitAnswerResponse';
import type { BaseResponseBoolean } from '@/api/models/BaseResponseBoolean';
import type { BaseResponseUserCognitiveStateVO } from '@/api/models/BaseResponseUserCognitiveStateVO';
import type { BaseResponseSessionReportVO } from '@/api/models/BaseResponseSessionReportVO';
import type { BaseResponseKnowledgeGapListVO } from '@/api/models/BaseResponseKnowledgeGapListVO';
import type { BaseResponseKnowledgeCoverageVO } from '@/api/models/BaseResponseKnowledgeCoverageVO';

// ============================================
// 会话管理接口
// ============================================

/**
 * 创建测验会话 (开始测验)
 * POST /api/v1/quiz/session
 */
export const createQuizSession = async (
  request: CreateQuizSessionRequest
): Promise<BaseResponseQuizSessionVO> => {
  return Service.createSession({ requestBody: request });
};

/**
 * 查询会话详情
 * GET /api/v1/quiz/session/{id}
 */
export const getQuizSessionDetail = async (
  sessionId: string
): Promise<BaseResponseQuizSessionDetailVO> => {
  return Service.getSessionDetail({ id: sessionId });
};

/**
 * 更新会话状态 (暂停/恢复/放弃)
 * PUT /api/v1/quiz/session/{id}
 */
export const updateQuizSession = async (
  sessionId: string,
  action: 'PAUSE' | 'RESUME' | 'ABANDON'
): Promise<BaseResponseQuizSessionVO> => {
  const request: UpdateQuizSessionRequest = { action };
  return Service.updateSession({ id: sessionId, requestBody: request });
};

/**
 * 删除会话 (软删除)
 * DELETE /api/v1/quiz/session/{id}
 */
export const deleteQuizSession = async (
  sessionId: string
): Promise<BaseResponseBoolean> => {
  return Service.deleteSession({ id: sessionId });
};

/**
 * 查询测验历史列表
 * GET /api/v1/quiz/session/list
 */
export const getQuizSessionList = async (
  request: QuizSessionQueryRequest = {}
): Promise<BaseResponseQuizSessionListVO> => {
  return Service.listSessions({ request });
};

// ============================================
// 答题交互接口
// ============================================

/**
 * 提交答案
 * POST /api/v1/quiz/session/{id}/answer
 */
export const submitQuizAnswer = async (
  sessionId: string,
  request: SubmitAnswerRequest
): Promise<BaseResponseSubmitAnswerResponse> => {
  return Service.submitAnswer({ id: sessionId, requestBody: request });
};

/**
 * 获取下一题
 * GET /api/v1/quiz/session/{id}/next
 */
export const getNextQuestion = async (
  sessionId: string
): Promise<BaseResponseQuestionVO> => {
  return Service.getNextQuestion({ id: sessionId });
};

/**
 * 获取会话实时状态
 * GET /api/v1/quiz/session/{id}/status
 */
export const getQuizSessionStatus = async (
  sessionId: string
): Promise<BaseResponseQuizSessionStatusVO> => {
  return Service.getSessionStatus({ id: sessionId });
};

// ============================================
// 分析接口
// ============================================

/**
 * 获取用户认知状态 (三维认知模型)
 * GET /api/v1/quiz/analysis/user/{userId}
 */
export const getUserCognitiveState = async (
  userId: number
): Promise<BaseResponseUserCognitiveStateVO> => {
  return Service.getUserCognitiveState({ userId });
};

/**
 * 获取会话报告
 * GET /api/v1/quiz/analysis/session/{id}/report
 */
export const getSessionReport = async (
  sessionId: string
): Promise<BaseResponseSessionReportVO> => {
  return Service.getSessionReport({ id: sessionId });
};

/**
 * 获取用户知识缺口列表
 * GET /api/v1/quiz/analysis/user/{userId}/gaps
 */
export const getUserKnowledgeGaps = async (
  userId: number,
  request: KnowledgeGapQueryRequest = {}
): Promise<BaseResponseKnowledgeGapListVO> => {
  return Service.getUserKnowledgeGaps({ userId, request });
};

/**
 * 标记知识缺口已解决
 * POST /api/v1/quiz/analysis/gap/{id}/resolve
 */
export const markGapAsResolved = async (
  gapId: string
): Promise<BaseResponseBoolean> => {
  return Service.markGapAsResolved({ id: gapId });
};

/**
 * 获取会话的知识覆盖率
 * GET /api/v1/quiz/session/{id}/coverage
 */
export const getKnowledgeCoverage = async (
  sessionId: string
): Promise<BaseResponseKnowledgeCoverageVO> => {
  return Service.getKnowledgeCoverage({ id: sessionId });
};

// ============================================
// 辅助函数
// ============================================

/**
 * 开始自适应测验 (快捷方法)
 */
export const startAdaptiveQuiz = async (
  documentIds: number[]
): Promise<BaseResponseQuizSessionVO> => {
  return createQuizSession({
    documentIds,
    quizMode: 'ADAPTIVE',
    questionCount: 0 // 自适应模式
  });
};

/**
 * 开始指定难度的测验
 */
export const startQuizWithMode = async (
  documentIds: number[],
  quizMode: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE',
  questionCount?: number
): Promise<BaseResponseQuizSessionVO> => {
  return createQuizSession({
    documentIds,
    quizMode,
    questionCount: questionCount || 0
  });
};

/**
 * 暂停测验
 */
export const pauseQuiz = async (
  sessionId: string
): Promise<BaseResponseQuizSessionVO> => {
  return updateQuizSession(sessionId, 'PAUSE');
};

/**
 * 恢复测验
 */
export const resumeQuiz = async (
  sessionId: string
): Promise<BaseResponseQuizSessionVO> => {
  return updateQuizSession(sessionId, 'RESUME');
};

/**
 * 放弃测验
 */
export const abandonQuiz = async (
  sessionId: string
): Promise<BaseResponseQuizSessionVO> => {
  return updateQuizSession(sessionId, 'ABANDON');
};

/**
 * 检查会话是否已完成
 */
export const isSessionCompleted = async (
  sessionId: string
): Promise<boolean> => {
  const response = await getQuizSessionStatus(sessionId);
  return response.data?.status === 'COMPLETED';
};
