/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RagTraceDocView } from './RagTraceDocView';
/**
 * 真实业务数据载荷，可以是对象、列表或字符串
 */
export type RagRetrievalTrace = {
  traceId?: string;
  query?: string;
  tenantId?: number;
  topK?: number;
  hybridEnabled?: boolean;
  rrfK?: number;
  degradedToVectorOnly?: boolean;
  degradeReason?: string;
  vectorLatencyMs?: number;
  esLatencyMs?: number;
  mergeLatencyMs?: number;
  totalLatencyMs?: number;
  vectorDocs?: Array<RagTraceDocView>;
  esDocs?: Array<RagTraceDocView>;
  mergedDocs?: Array<RagTraceDocView>;
  createdAt?: string;
};

