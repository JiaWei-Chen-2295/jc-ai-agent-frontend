/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConceptAnalysis } from './ConceptAnalysis';
/**
 * 会话分析报告
 */
export type SessionReportVO = {
  /**
   * 会话ID
   */
  sessionId?: string;
  /**
   * 总题数
   */
  totalQuestions?: number;
  /**
   * 正确题数
   */
  correctCount?: number;
  /**
   * 总分
   */
  totalScore?: number;
  /**
   * 正确率
   */
  accuracy?: number;
  /**
   * 平均响应时间 (毫秒)
   */
  avgResponseTimeMs?: number;
  /**
   * 开始时间
   */
  startedAt?: string;
  /**
   * 完成时间
   */
  completedAt?: string;
  /**
   * 用时 (秒)
   */
  durationSeconds?: number;
  /**
   * 理解深度
   */
  understandingDepth?: number;
  /**
   * 认知负荷
   */
  cognitiveLoad?: number;
  /**
   * 稳定性
   */
  stability?: number;
  /**
   * 知识点分析
   */
  conceptAnalyses?: Array<ConceptAnalysis>;
  /**
   * 改进建议
   */
  suggestions?: Array<string>;
};

