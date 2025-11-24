// components/Hero.tsx
import { Info } from 'lucide-react'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChatStorage, StoredChat } from '@/lib/chatStorage'
import { ChatMessage } from './chat/ChatMessage'
import { ChatInput } from './chat/ChatInput'
import { FeedbackModal } from './chat/FeedbackModal'
import { useChatHandlers } from '@/hooks/useChatHandlers'
import { useChatEdit } from '@/hooks/useChatEdit'
import { useFeedback } from '@/hooks/useFeedback'
import { markdownComponents } from '@/lib/markdownConfig'

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  feedback?: 'like' | 'dislike' | null;
}

interface ApiMessage {
  id: string;
  content: string;
  role: Message['role'];
  createdAt: string;
}

type ChatMeta = Pick<StoredChat, 'id' | 'title' | 'mode' | 'createdAt' | 'updatedAt'>

const Hero = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedMode, setSelectedMode] = useState('Select Modes')
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isHydrating, setIsHydrating] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [currentChatMeta, setCurrentChatMeta] = useState<ChatMeta | null>(null)
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
    const [isAeroSearchActive, setIsAeroSearchActive] = useState(false)
    
    const dropdownRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const autoResizeInput = useCallback(() => {
        if (!inputRef.current) return
        const textarea = inputRef.current
        textarea.style.height = 'auto'
        const nextHeight = Math.min(textarea.scrollHeight, 280)
        textarea.style.height = `${nextHeight}px`
    }, [])

    const broadcastActiveChat = useCallback((chatId: string | null) => {
        window.dispatchEvent(new CustomEvent('chat:active', { detail: { chatId } }))
    }, [])

    const notifyChatListRefresh = useCallback(() => {
        window.dispatchEvent(new CustomEvent('chat:list-refresh'))
    }, [])

    const setActiveChat = useCallback((chatId: string | null, mode?: string | null) => {
        if (chatId) {
            setCurrentChatId(chatId)
            localStorage.setItem('currentChatId', chatId)
            setSelectedMode(mode ?? 'Select Modes')
        } else {
            setCurrentChatId(null)
            localStorage.removeItem('currentChatId')
            setSelectedMode('Select Modes')
            setCurrentChatMeta(null)
        }
        broadcastActiveChat(chatId)
    }, [broadcastActiveChat])

    const resetConversation = useCallback(() => {
        setMessages([])
        setInputValue('')
        setActiveChat(null)
        setCurrentChatMeta(null)
    }, [setActiveChat])

    const hydrateFromLocal = useCallback((chatId: string) => {
        const storedChat = ChatStorage.getChat(chatId)
        if (!storedChat) {
            resetConversation()
            return false
        }
        const hydratedMessages: Message[] = (storedChat.messages || []).map((msg) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            createdAt: new Date(msg.createdAt),
        }))
        setMessages(hydratedMessages)
        setActiveChat(storedChat.id, storedChat.mode)
        setCurrentChatMeta({
            id: storedChat.id,
            title: storedChat.title,
            mode: storedChat.mode,
            createdAt: storedChat.createdAt,
            updatedAt: storedChat.updatedAt,
        })
        setSelectedMode(storedChat.mode ?? 'Select Modes')
        return true
    }, [resetConversation, setActiveChat])

    const hydrateChat = useCallback(async (chatId: string) => {
        setMessages([])
        setIsHydrating(true)
        let hydrated = false
        try {
            const response = await fetch(`/api/chats/${chatId}`)

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    hydrateFromLocal(chatId)
                    return
                }
                if (response.status === 404) {
                    resetConversation()
                    return
                }
                throw new Error('Failed to fetch chat history')
            }
            const data = await response.json()
            const chat = data.chat
            if (chat) {
                const hydratedMessages: Message[] = (chat.messages || []).map((msg: ApiMessage) => ({
                    id: msg.id,
                    content: msg.content,
                    role: msg.role,
                    createdAt: new Date(msg.createdAt),
                }))
                setMessages(hydratedMessages)
                setActiveChat(chat.id, chat.mode)
                setCurrentChatMeta({
                    id: chat.id,
                    title: chat.title,
                    mode: chat.mode,
                    createdAt: chat.createdAt,
                    updatedAt: chat.updatedAt,
                })
                
                const serializedMessages = hydratedMessages.map((msg) => ({
                    id: msg.id,
                    content: msg.content,
                    role: msg.role,
                    createdAt: msg.createdAt.toISOString(),
                }))
                ChatStorage.saveChat({
                    id: chat.id,
                    title: chat.title,
                    mode: chat.mode,
                    createdAt: chat.createdAt,
                    updatedAt: chat.updatedAt,
                    isFavorite: chat.isFavorite || false,
                    messages: serializedMessages,
                })
                
                hydrated = true
            }
        } catch (error) {
            console.error(error)
        } finally {
            if (!hydrated) {
                hydrateFromLocal(chatId)
            }
            setIsHydrating(false)
        }
    }, [hydrateFromLocal, resetConversation, setActiveChat])

    const { 
        handleLike, 
        handleDislike, 
        handleCopy, 
        handleRetry, 
        retryingMessageId,
        streamResponse,
        setStreamingMessageId
    } = useChatHandlers(
        messages, 
        setMessages, 
        currentChatId, 
        selectedMode, 
        setIsLoading,
        notifyChatListRefresh
    )

    const {
        editingMessageId,
        editValue,
        editInputRef,
        handleEdit,
        handleCancelEdit,
        handleSaveEdit,
        setEditValue,
        handleEditKeyDown,
    } = useChatEdit(
        messages,
        setMessages,
        currentChatId,
        selectedMode,
        setIsLoading,
        streamResponse,
        notifyChatListRefresh
    )

    const {
        feedbackMessageId,
        feedbackText,
        selectedFeedbackReasons,
        feedbackSuccessId,
        isSubmittingFeedback,
        handleOpenFeedback,
        handleCloseFeedbackModal,
        toggleFeedbackReason,
        handleSubmitFeedback,
        setFeedbackText,
    } = useFeedback()

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        autoResizeInput()
    }, [autoResizeInput, inputValue])

    useEffect(() => {
        const storedChatId = localStorage.getItem('currentChatId')
        if (storedChatId) {
            hydrateChat(storedChatId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const handleChatSelect = (event: Event) => {
            const detail = (event as CustomEvent<{ chatId: string | null }>).detail
            if (!detail) return

            if (detail.chatId) {
                if (detail.chatId !== currentChatId) {
                    hydrateChat(detail.chatId)
                }
            } else {
                resetConversation()
            }
        }

        const handleChatDeleted = (event: Event) => {
            const detail = (event as CustomEvent<{ chatId: string }>).detail
            if (detail?.chatId) {
                ChatStorage.deleteChat(detail.chatId)
                if (detail.chatId === currentChatId) {
                    resetConversation()
                }
            }
        }

        const handleChatRenamed = (event: Event) => {
            const detail = (event as CustomEvent<{ chatId: string; title: string }>).detail
            if (detail?.chatId === currentChatId && currentChatMeta) {
                setCurrentChatMeta(prev => prev ? { ...prev, title: detail.title } : prev)
            }
        }

        window.addEventListener('chat:select', handleChatSelect as EventListener)
        window.addEventListener('chat:deleted', handleChatDeleted as EventListener)
        window.addEventListener('chat:renamed', handleChatRenamed as EventListener)

        return () => {
            window.removeEventListener('chat:select', handleChatSelect as EventListener)
            window.removeEventListener('chat:deleted', handleChatDeleted as EventListener)
            window.removeEventListener('chat:renamed', handleChatRenamed as EventListener)
        }
    }, [currentChatId, currentChatMeta, hydrateChat, resetConversation])

    useEffect(() => {
        if (!currentChatMeta) return
        const normalizedMode = selectedMode !== 'Select Modes' ? selectedMode : null
        if (currentChatMeta.mode === normalizedMode) return
        setCurrentChatMeta(prev => prev ? { ...prev, mode: normalizedMode } : prev)
    }, [currentChatMeta, selectedMode])

    useEffect(() => {
        if (!currentChatId || !currentChatMeta) return
        const normalizedMode = selectedMode !== 'Select Modes' ? selectedMode : null
        
        const existingChat = ChatStorage.getChat(currentChatId);
        
        const serializedMessages = messages.map((message) => ({
            id: message.id,
            content: message.content,
            role: message.role,
            createdAt: message.createdAt.toISOString(),
        }))
        ChatStorage.saveChat({
            id: currentChatMeta.id,
            title: currentChatMeta.title,
            mode: normalizedMode,
            createdAt: currentChatMeta.createdAt,
            updatedAt: new Date().toISOString(),
            isFavorite: existingChat?.isFavorite || false,
            messages: serializedMessages,
        })
        // Only notify on actual message changes, not on every render
        if (messages.length > 0) {
            notifyChatListRefresh()
        }
    }, [currentChatId, currentChatMeta, messages, selectedMode])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleSubmit = async () => {
        if (!inputValue.trim() || isLoading || isHydrating) return

        const userMessage = inputValue.trim()
        setInputValue('')
        setIsLoading(true)

        const userMessageObj: Message = {
            id: Date.now().toString(),
            content: userMessage,
            role: 'user',
            createdAt: new Date(),
        }

        setMessages(prev => [...prev, userMessageObj])

        try {
            let chatId = currentChatId
            const normalizedMode = selectedMode !== 'Select Modes' ? selectedMode : null
            if (!chatId) {
                const chatResponse = await fetch('/api/chats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
                        mode: normalizedMode,
                    }),
                })

                if (!chatResponse.ok) {
                    const errorData = await chatResponse.json().catch(() => ({}))
                    console.error('Chat creation failed:', errorData)
                    throw new Error(`Failed to create chat: ${errorData.error || chatResponse.statusText}`)
                }

                const chatData = await chatResponse.json()
                chatId = chatData.chat.id
                
                window.history.pushState({}, '', `/chat/${chatId}`);
                
                setActiveChat(chatId, normalizedMode)
                setCurrentChatMeta({
                    id: chatData.chat.id,
                    title: chatData.chat.title,
                    mode: chatData.chat.mode,
                    createdAt: chatData.chat.createdAt,
                    updatedAt: chatData.chat.updatedAt,
                })
                notifyChatListRefresh()
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    mode: normalizedMode,
                    chatId: chatId,
                    deepSearch: isAeroSearchActive,
                }),
            })

            const payload = await response.json().catch(() => null)

            if (!response.ok) {
                const errorMessage = payload?.error || `Failed to get response (${response.status} ${response.statusText})`
                throw new Error(errorMessage)
            }

            if (!payload) {
                throw new Error('Received empty response from assistant')
            }

            const fullResponse = payload.response || 'No response returned.';
            const aiMessageId = payload.messageId || (Date.now() + 1).toString();
            
            const aiMessageObj: Message = {
                id: aiMessageId,
                content: '',
                role: 'assistant',
                createdAt: new Date(),
            }
            setMessages(prev => [...prev, aiMessageObj])
            setStreamingMessageId(aiMessageId)
            streamResponse(fullResponse, aiMessageId)
            notifyChatListRefresh()

        } catch (error) {
            console.error('Error sending message:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            const errorMessageObj: Message = {
                id: (Date.now() + 1).toString(),
                content: `Sorry, I encountered an error: ${errorMessage}`,
                role: 'assistant',
                createdAt: new Date(),
            }
            setMessages(prev => [...prev, errorMessageObj])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value)
    }

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen)
    }

    const handleModeSelect = (mode: { name: string; icon?: React.JSX.Element }) => {
        if (mode.name === 'Clear all') {
            setSelectedMode('Select Modes')
        } else {
            setSelectedMode(mode.name)
        }
        setIsDropdownOpen(false)
    }

    return (
        <>
            <section className={`flex flex-col h-[676px] ${messages.length > 0 ? 'pt-4' : 'pt-56 items-center'}`}>
                {messages.length === 0 && (
                    <div>
                        <h1 className='text-4xl tracking-wider font-bold flex items-center gap-1 text-gray-700 dark:text-gray-300'>CortexAI <Info className='h-5 w-5' /></h1>
                    </div>
                )}

                {messages.length > 0 && (
                    <div className='w-full flex-1 overflow-y-auto custom-chat-scrollbar'>
                        <div className='max-w-4xl mx-auto px-4 py-6 space-y-6'>
                        {messages.map((message) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                isHovered={hoveredMessageId === message.id}
                                isRetrying={retryingMessageId === message.id}
                                isEditing={editingMessageId === message.id}
                                isLoading={isLoading}
                                editValue={editValue}
                                feedbackSuccessId={feedbackSuccessId}
                                editInputRef={editInputRef}
                                markdownComponents={markdownComponents}
                                onMouseEnter={() => setHoveredMessageId(message.id)}
                                onMouseLeave={() => setHoveredMessageId(null)}
                                onLike={handleLike}
                                onDislike={handleDislike}
                                onCopy={handleCopy}
                                onRetry={handleRetry}
                                onOpenFeedback={handleOpenFeedback}
                                onEdit={handleEdit}
                                onCancelEdit={handleCancelEdit}
                                onSaveEdit={handleSaveEdit}
                                onEditChange={setEditValue}
                                onEditKeyDown={handleEditKeyDown}
                            />
                        ))}
                        {isLoading && (
                            <div className='flex justify-start'>
                                <div className='max-w-[80%] rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800/50'>
                                    <div className='flex space-x-2'>
                                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
                                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {isHydrating && (
                    <div className='w-full max-w-3xl mx-auto px-4 mt-4 text-sm text-gray-500 dark:text-gray-400 text-center'>
                        Loading conversation...
                    </div>
                )}

                <ChatInput
                    inputValue={inputValue}
                    isLoading={isLoading}
                    isHydrating={isHydrating}
                    selectedMode={selectedMode}
                    isDropdownOpen={isDropdownOpen}
                    hasMessages={messages.length > 0}
                    inputRef={inputRef}
                    dropdownRef={dropdownRef}
                    onInputChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onSubmit={handleSubmit}
                    onToggleDropdown={toggleDropdown}
                    onModeSelect={handleModeSelect}
                />
            </section>

            <FeedbackModal
                isOpen={!!feedbackMessageId}
                feedbackText={feedbackText}
                selectedReasons={selectedFeedbackReasons}
                isSubmitting={isSubmittingFeedback}
                onClose={handleCloseFeedbackModal}
                onTextChange={setFeedbackText}
                onToggleReason={toggleFeedbackReason}
                onSubmit={() => feedbackMessageId && handleSubmitFeedback(feedbackMessageId)}
            />
        </>
    )
}

export default Hero
