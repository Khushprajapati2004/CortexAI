// components/chat/ChatInput.tsx
'use client';

import { Plus, Dribbble, Mic, ArrowUp, CircleStop } from 'lucide-react'
import React from 'react'
import { ModeSelector } from './ModeSelector'

interface ChatInputProps {
  inputValue: string;
  isLoading: boolean;
  isHydrating: boolean;
  isStreaming: boolean;
  selectedMode: string;
  isDropdownOpen: boolean;
  hasMessages: boolean;
  isAeroSearchActive: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onStopGeneration: () => void;
  onToggleDropdown: () => void;
  onModeSelect: (mode: { name: string; icon?: React.JSX.Element }) => void;
  onToggleAeroSearch: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  isLoading,
  isHydrating,
  isStreaming,
  selectedMode,
  isDropdownOpen,
  hasMessages,
  isAeroSearchActive,
  inputRef,
  dropdownRef,
  onInputChange,
  onKeyDown,
  onSubmit,
  onStopGeneration,
  onToggleDropdown,
  onModeSelect,
  onToggleAeroSearch,
}) => {
  return (
    <div className={`w-full ${hasMessages ? 'mt-auto pb-6' : 'mt-5'}`}>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='py-3 px-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm'>
          <textarea
            ref={inputRef}
            placeholder='Ask a question...'
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            disabled={isLoading || isHydrating}
            rows={1}
            spellCheck={false}
            className='outline-none text-sm w-full bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 resize-none leading-6 max-h-72'
          />
          <div className='flex items-center justify-between'>
            <div className='mt-4 flex items-center gap-2'>
              <Plus className='w-8 h-8 border rounded-full p-2 border-gray-400 dark:border-gray-600 cursor-pointer text-gray-700 dark:text-gray-300' />

              <button
                onClick={onToggleAeroSearch}
                className={`flex items-center gap-1 cursor-pointer px-3 py-1.5 border rounded-full transition-all duration-200 ${
                  isAeroSearchActive
                    ? 'bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400'
                }`}
              >
                <Dribbble className='w-4 h-4' />
                <span className='text-sm font-normal'>AeroSearch</span>
              </button>
              
              <ModeSelector
                selectedMode={selectedMode}
                isDropdownOpen={isDropdownOpen}
                hasMessages={hasMessages}
                dropdownRef={dropdownRef}
                onToggle={onToggleDropdown}
                onSelect={onModeSelect}
              />
            </div>
            <div className='flex items-center mt-1 gap-3'>
              <Mic className='h-9 w-9 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-2 text-gray-700 dark:text-gray-300' />
              {isStreaming ? (
                <button 
                  onClick={onStopGeneration}
                  className='p-1 cursor-pointer rounded-full text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200 text-sm font-medium'
                  title="Stop generating"
                >
                  <CircleStop />
                </button>
              ) : (
                <button 
                  onClick={onSubmit}
                  disabled={isLoading || isHydrating || !inputValue.trim()}
                  className='p-1.5 cursor-pointer rounded-full text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200'
                >
                  <ArrowUp className='w-5 h-5' />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
