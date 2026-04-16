/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StudyFriendSource } from '../../features/chat/chatApi';

/**
 * Chat message view
 */
export type ChatMessageVO = {
  /**
   * Message id
   */
  id?: number;
  /**
   * Role (user/assistant)
   */
  role?: string;
  /**
   * Message content
   */
  content?: string;
  /**
   * Created time
   */
  createdAt?: string;
  /**
   * Whether web search was used
   */
  webSearchUsed?: boolean | null;
  /**
   * Associated sources
   */
  sources?: StudyFriendSource[] | null;
};

