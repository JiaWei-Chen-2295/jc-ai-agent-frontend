/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConceptDetail } from './ConceptDetail';
/**
 * 知识覆盖率
 */
export type KnowledgeCoverageVO = {
  /**
   * 会话ID
   */
  sessionId?: string;
  /**
   * 概念总数（概念清单中的总量）
   */
  totalConcepts?: number;
  /**
   * 已测概念数（至少答过一题的概念）
   */
  testedConcepts?: number;
  /**
   * 已掌握概念数（D≥70, L≤40, S≥70）
   */
  masteredConcepts?: number;
  /**
   * 覆盖率百分比 (已测/总数 * 100)
   */
  coveragePercent?: number;
  /**
   * 掌握率百分比 (已掌握/总数 * 100)
   */
  masteryPercent?: number;
  /**
   * 已答题总数
   */
  answeredQuestions?: number;
  /**
   * 概念来源
   */
  conceptSource?: string;
  /**
   * 各概念详情
   */
  concepts?: Array<ConceptDetail>;
};

