// components/chat/ChatMessage.tsx
'use client';

import { Copy, PencilLine, ThumbsUp, ThumbsDown, RotateCcw, Flag, X } from 'lucide-react'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  feedback?: 'like' | 'dislike' | null;
}

interface ChatMessageProps {
  message: Message;
  isHovered: boolean;
  isRetrying: boolean;
  isEditing: boolean;
  isLoading: boolean;
  editValue: string;
  feedbackSuccessId: string | null;
  editInputRef: React.RefObject<HTMLTextAreaElement | null>;
  markdownComponents: Components;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onCopy: (content: string) => void;
  onRetry: (id: string) => void;
  onOpenFeedback: (id: string) => void;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onEditChange: (value: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isHovered,
  isRetrying,
  isEditing,
  isLoading,
  editValue,
  feedbackSuccessId,
  editInputRef,
  markdownComponents,
  onMouseEnter,
  onMouseLeave,
  onLike,
  onDislike,
  onCopy,
  onRetry,
  onOpenFeedback,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
  onEditKeyDown,
}) => {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`max-w-[85%] flex flex-col`}>
        {isEditing && isUser ? (
          <div className="rounded-lg px-4 py-3 bg-gray-600 text-white ml-auto w-full dark:bg-blue-500">
            <textarea
              ref={editInputRef}
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => onEditKeyDown(e, message.id)}
              className="w-full bg-transparent text-white placeholder-white/70 outline-none resize-none min-h-[60px] max-h-72"
              placeholder="Edit your message..."
              rows={3}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1.5 text-sm rounded-md bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={() => onSaveEdit(message.id)}
                disabled={!editValue.trim() || isLoading}
                className="px-3 py-1.5 text-sm rounded-md bg-white text-blue-500 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`rounded-lg px-4 py-3 transition-colors ${
                isUser
                  ? 'bg-gray-300 text-black ml-auto dark:bg-blue-500 dark:text-white'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              <div className={`prose prose-sm max-w-none ${
                isUser
                  ? 'prose-invert text-white **:text-black prose-headings:text-white prose-strong:text-white prose-code:text-white prose-a:text-blue-200'
                  : 'dark:prose-invert prose-p:text-gray-800 dark:prose-p:text-gray-200'
              }`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
            {isUser && (
              <div className={`flex items-center justify-end gap-1 mt-1 px-1 transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <button
                  onClick={() => onCopy(message.content)}
                  className="p-1.5 rounded-md text-black dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(message.id)}
                  className="p-1.5 rounded-md text-black dark:text-white/80 dark:hover:bg-white/20 hover:bg-gray-100 transition-colors"
                  title="Edit"
                >
                  <PencilLine className="w-4 h-4" />
                </button>
              </div>
            )}
            {!isUser && (
              <div className={`flex flex-wrap items-center gap-1 mt-1 px-1 transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-60'
              }`}>
                <button
                  onClick={() => onLike(message.id)}
                  className={`p-1.5 rounded-md transition-colors ${
                    message.feedback === 'like'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Like"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDislike(message.id)}
                  className={`p-1.5 rounded-md transition-colors ${
                    message.feedback === 'dislike'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Dislike"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onCopy(message.content)}
                  className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRetry(message.id)}
                  disabled={isRetrying || isLoading}
                  className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Retry"
                >
                  <RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => onOpenFeedback(message.id)}
                  className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Give feedback"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            )}
            {feedbackSuccessId === message.id && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 px-1">Thanks for your feedback!</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
