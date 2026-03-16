/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 缺口列表
 */
export type KnowledgeGapVO = {
  /**
   * 缺口ID
   */
  id?: string;
  /**
   * 概念名称
   */
  conceptName?: string;
  /**
   * 缺口类型
   */
  gapType?: 'CONCEPTUAL' | 'PROCEDURAL' | 'BOUNDARY';
  /**
   * 缺口描述
   */
  gapDescription?: string;
  /**
   * 根本原因
   */
  rootCause?: string;
  /**
   * 严重程度
   */
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
  /**
   * 状态
   */
  status?: 'ACTIVE' | 'RESOLVED';
  /**
   * 失败次数
   */
  failureCount?: number;
  /**
   * 创建时间
   */
  createTime?: string;
  /**
   * 解决时间
   */
  resolvedAt?: string;
};

