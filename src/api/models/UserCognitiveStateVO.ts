/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 用户认知状态
 */
export type UserCognitiveStateVO = {
  /**
   * 用户ID
   */
  userId?: number;
  /**
   * 平均理解深度
   */
  avgUnderstandingDepth?: number;
  /**
   * 平均认知负荷
   */
  avgCognitiveLoad?: number;
  /**
   * 平均稳定性
   */
  avgStability?: number;
  /**
   * 已掌握知识点数
   */
  masteredCount?: number;
  /**
   * 未掌握知识点数
   */
  unmasteredCount?: number;
  /**
   * 总知识点数
   */
  totalTopics?: number;
  /**
   * 总答题数
   */
  totalAnswers?: number;
  /**
   * 正确答题数
   */
  correctAnswers?: number;
  /**
   * 正确率
   */
  accuracy?: number;
  /**
   * 薄弱知识点
   */
  strugglingTopics?: Array<string>;
  /**
   * 可提高难度的知识点
   */
  readyForChallenge?: Array<string>;
  /**
   * 学习建议
   */
  recommendation?: string;
  /**
   * 是否已达成全部掌握
   */
  masteryAchieved?: boolean;
};

