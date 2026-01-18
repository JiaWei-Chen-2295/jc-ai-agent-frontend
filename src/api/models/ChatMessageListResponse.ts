/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageVO } from './ChatMessageVO';
/**
 * Cursor page for chat messages
 */
export type ChatMessageListResponse = {
  /**
   * Message list
   */
  records?: Array<ChatMessageVO>;
  /**
   * Whether more data exists
   */
  hasMore?: boolean;
  /**
   * Cursor id for next page
   */
  nextBeforeId?: number;
};

