/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatSessionVO } from './ChatSessionVO';
/**
 * Cursor page for chat sessions
 */
export type ChatSessionListResponse = {
  /**
   * Session list
   */
  records?: Array<ChatSessionVO>;
  /**
   * Whether more data exists
   */
  hasMore?: boolean;
  /**
   * Cursor chat id for next page
   */
  nextChatId?: string;
  /**
   * Cursor last message time for next page
   */
  nextLastMessageAt?: string;
};

