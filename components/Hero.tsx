// components/Hero.tsx
import { AlertCircle, ArrowUp, BadgeDollarSignIcon, Box, ChevronDown, CircleCheckBig, Copy, Dribbble, Flag, Info, Mic, PencilLine, Plus, RotateCcw, ScrollText, ShoppingBag, ShoppingCart, ThumbsDown, ThumbsUp, ToolCase, X } from 'lucide-react'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatStorage, StoredChat } from '@/lib/chatStorage'

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
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
    const [streamingContent, setStreamingContent] = useState('')
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [currentChatMeta, setCurrentChatMeta] = useState<ChatMeta | null>(null)
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
    const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null)
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null)
    const [feedbackText, setFeedbackText] = useState('')
    const [selectedFeedbackReasons, setSelectedFeedbackReasons] = useState<string[]>([])
    const [feedbackSuccessId, setFeedbackSuccessId] = useState<string | null>(null)
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
    const editInputRef = useRef<HTMLTextAreaElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const modes = [
        { name: 'Marketplace', icon: <ShoppingCart className='h-4 w-4' /> },
        { name: 'Inventory', icon: <Box className='h-4 w-4' /> },
        { name: 'Work Orders', icon: <ScrollText className='h-4 w-4' /> },
        { name: 'Compliance', icon: <CircleCheckBig className='h-4 w-4' /> },
        { name: 'Financials', icon: <BadgeDollarSignIcon className='h-4 w-4' /> },
        { name: 'Purchasing', icon: <ShoppingBag className='h-4 w-4' /> },
        { name: 'Parts Analyzer', icon: <ToolCase className='h-4 w-4' /> },
        { name: 'Clear all' }
    ]

    const feedbackReasons = [
        { id: 'inaccurate', label: 'Inaccurate' },
        { id: 'out_of_date', label: 'Out of date' },
        { id: 'too_short', label: 'Too short' },
        { id: 'too_long', label: 'Too long' },
        { id: 'harmful', label: 'Harmful or offensive' },
        { id: 'not_helpful', label: 'Not helpful' },
    ]

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

    const markdownComponents: Components = {
        code(codeProps) {
            const { inline, className, children, ...rest } = codeProps as {
                inline?: boolean
                className?: string
                children: React.ReactNode
            }
            if (inline) {
                return <code className={`px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-[13px] ${className ?? ''}`} {...rest}>{children}</code>
            }
            // For code blocks, return just the code element - the pre wrapper will be handled separately
            return <code className={className} {...rest}>{children}</code>
        },
        pre(preProps) {
            const { children, ...rest } = preProps
            // react-markdown wraps code blocks in <pre><code>...</code></pre>
            // We need to handle the pre wrapper separately to avoid nesting issues
            return (
                <pre className='w-full overflow-x-auto rounded-xl bg-gray-900 text-gray-100 text-sm p-4 my-3 border border-gray-800' {...rest}>
                    {children}
                </pre>
            )
        },
        ul(props) {
            return <ul {...props} className={`list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-200 ${props.className ?? ''}`} />
        },
        ol(props) {
            return <ol {...props} className={`list-decimal ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-200 ${props.className ?? ''}`} />
        },
        p(props) {
            // Check if children contain a pre element (code block)
            // If so, don't wrap in p tag to avoid invalid HTML
            const hasPre = React.Children.toArray(props.children).some(
                (child) => React.isValidElement(child) && child.type === 'pre'
            )
            
            if (hasPre) {
                // Return children without p wrapper for code blocks
                return <>{props.children}</>
            }
            
            return <p {...props} className={`text-sm leading-6 text-gray-700 dark:text-gray-200 ${props.className ?? ''}`} />
        },
        a(props) {
            return <a {...props} target='_blank' rel='noreferrer' className={`text-blue-500 hover:underline ${props.className ?? ''}`} />
        },
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        autoResizeInput()
    }, [autoResizeInput, inputValue])

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

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
            setIsDropdownOpen(false)
        }
    }

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
                
                // Save to localStorage to sync with database
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

    useEffect(() => {
        const storedChatId = localStorage.getItem('currentChatId')
        if (storedChatId) {
            hydrateChat(storedChatId)
        }
    }, [hydrateChat])

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
        
        // Get existing chat to preserve isFavorite
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
        notifyChatListRefresh()
    }, [currentChatId, currentChatMeta, messages, notifyChatListRefresh, selectedMode])

    const handleSubmit = async () => {
        if (!inputValue.trim() || isLoading || isHydrating) return

        const userMessage = inputValue.trim()
        setInputValue('')
        setIsLoading(true)

        // Add user message to UI immediately
        const userMessageObj: Message = {
            id: Date.now().toString(),
            content: userMessage,
            role: 'user',
            createdAt: new Date(),
        }

        setMessages(prev => [...prev, userMessageObj])

        try {
            // Create chat if it doesn't exist
            let chatId = currentChatId
            const normalizedMode = selectedMode !== 'Select Modes' ? selectedMode : null
            if (!chatId) {
                const chatResponse = await fetch('/api/chats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
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
                
                // Navigate to chat URL
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

            // Send message with chatId
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    mode: normalizedMode,
                    chatId: chatId,
                }),
            })

            let payload: { response?: string; messageId?: string; error?: string } | null = null
            try {
                payload = await response.json()
            } catch (jsonError) {
                console.warn('Failed to parse AI response JSON:', jsonError)
            }

            if (!response.ok) {
                const errorMessage =
                    payload?.error ||
                    `Failed to get response (${response.status} ${response.statusText})`
                throw new Error(errorMessage)
            }

            if (!payload) {
                throw new Error('Received empty response from assistant')
            }

            // Stream AI response with typewriter effect
            const fullResponse = payload.response || 'No response returned.';
            const aiMessageId = payload.messageId || (Date.now() + 1).toString();
            
            // Add empty message first
            const aiMessageObj: Message = {
                id: aiMessageId,
                content: '',
                role: 'assistant',
                createdAt: new Date(),
            }
            setMessages(prev => [...prev, aiMessageObj])
            setStreamingMessageId(aiMessageId)
            
            // Stream the response character by character
            let currentIndex = 0;
            const streamInterval = setInterval(() => {
                if (currentIndex < fullResponse.length) {
                    const chunkSize = Math.floor(Math.random() * 3) + 1; // Random 1-3 characters
                    const nextChunk = fullResponse.slice(currentIndex, currentIndex + chunkSize);
                    currentIndex += chunkSize;
                    
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId 
                            ? { ...msg, content: fullResponse.slice(0, currentIndex) }
                            : msg
                    ))
                } else {
                    clearInterval(streamInterval);
                    setStreamingMessageId(null);
                }
            }, 20); // 20ms delay between chunks for smooth streaming
            notifyChatListRefresh()

        } catch (error) {
            console.error('Error sending message:', error)
            // Add error message with details
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

    const handleLike = (messageId: string) => {
        setMessages(prev => prev.map(msg => 
            msg.id === messageId 
                ? { ...msg, feedback: msg.feedback === 'like' ? null : 'like' }
                : msg
        ))
    }

    const handleDislike = (messageId: string) => {
        setMessages(prev => prev.map(msg => 
            msg.id === messageId 
                ? { ...msg, feedback: msg.feedback === 'dislike' ? null : 'dislike' }
                : msg
        ))
    }

    const handleCopy = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content)
            // You could add a toast notification here
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    const handleRetry = async (messageId: string) => {
        // Find the message to retry and the user message before it
        const messageIndex = messages.findIndex(msg => msg.id === messageId)
        if (messageIndex === -1 || messageIndex === 0) return

        const assistantMessage = messages[messageIndex]
        const userMessage = messages[messageIndex - 1]
        
        if (userMessage.role !== 'user' || assistantMessage.role !== 'assistant') return

        setRetryingMessageId(messageId)
        setIsLoading(true)

        // Remove the old assistant message
        setMessages(prev => prev.filter(msg => msg.id !== messageId))

        try {
            const normalizedMode = selectedMode !== 'Select Modes' ? selectedMode : null
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    mode: normalizedMode,
                    chatId: currentChatId,
                }),
            })

            let payload: { response?: string; messageId?: string; error?: string } | null = null
            try {
                payload = await response.json()
            } catch (jsonError) {
                console.warn('Failed to parse AI response JSON:', jsonError)
            }

            if (!response.ok) {
                const errorMessage =
                    payload?.error ||
                    `Failed to get response (${response.status} ${response.statusText})`
                throw new Error(errorMessage)
            }

            if (!payload) {
                throw new Error('Received empty response from assistant')
            }

            // Stream AI response with typewriter effect
            const fullResponse = payload.response || 'No response returned.';
            const aiMessageId = payload.messageId || (Date.now() + 1).toString();
            
            // Add empty message first
            const aiMessageObj: Message = {
                id: aiMessageId,
                content: '',
                role: 'assistant',
                createdAt: new Date(),
            }
            setMessages(prev => [...prev, aiMessageObj])
            setStreamingMessageId(aiMessageId)
            
            // Stream the response character by character
            let currentIndex = 0;
            const streamInterval = setInterval(() => {
                if (currentIndex < fullResponse.length) {
                    const chunkSize = Math.floor(Math.random() * 3) + 1;
                    currentIndex += chunkSize;
                    
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId 
                            ? { ...msg, content: fullResponse.slice(0, currentIndex) }
                            : msg
                    ))
                } else {
                    clearInterval(streamInterval);
                    setStreamingMessageId(null);
                }
            }, 20);
            
            notifyChatListRefresh()
        } catch (error) {
            console.error('Error retrying message:', error)
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
            setRetryingMessageId(null)
        }
    }

    const handleOpenFeedback = (messageId: string) => {
        if (feedbackMessageId === messageId) {
            handleCloseFeedbackModal()
            return
        }
        setFeedbackMessageId(messageId)
        setFeedbackText('')
        setSelectedFeedbackReasons([])
        setFeedbackSuccessId(null)
    }

    const handleCloseFeedbackModal = () => {
        setFeedbackMessageId(null)
        setFeedbackText('')
        setSelectedFeedbackReasons([])
    }

    const toggleFeedbackReason = (reasonId: string) => {
        setSelectedFeedbackReasons(prev =>
            prev.includes(reasonId)
                ? prev.filter(id => id !== reasonId)
                : [...prev, reasonId]
        )
    }

    const handleSubmitFeedback = async (messageId: string) => {
        if (!selectedFeedbackReasons.length && !feedbackText.trim()) return
        setIsSubmittingFeedback(true)
        try {
            // Simulate async submission; replace with API call when available
            await new Promise(resolve => setTimeout(resolve, 500))
            setFeedbackSuccessId(messageId)
            handleCloseFeedbackModal()
        } catch (error) {
            console.error('Failed to submit feedback:', error)
        } finally {
            setIsSubmittingFeedback(false)
        }
    }

    const handleEdit = (messageId: string) => {
        const message = messages.find(msg => msg.id === messageId)
        if (message && message.role === 'user') {
            setEditingMessageId(messageId)
            setEditValue(message.content)
            // Focus the edit input after state update
            setTimeout(() => {
                editInputRef.current?.focus()
                editInputRef.current?.setSelectionRange(
                    editInputRef.current.value.length,
                    editInputRef.current.value.length
                )
            }, 0)
        }
    }

    const handleCancelEdit = () => {
        setEditingMessageId(null)
        setEditValue('')
    }

    const handleSaveEdit = async (messageId: string) => {
        if (!editValue.trim()) {
            handleCancelEdit()
            return
        }

        const messageIndex = messages.findIndex(msg => msg.id === messageId)
        if (messageIndex === -1) return

        const message = messages[messageIndex]
        if (message.role !== 'user') return

        setIsLoading(true)
        setEditingMessageId(null)

        // Update the user message
        setMessages(prev => prev.map(msg => 
            msg.id === messageId 
                ? { ...msg, content: editValue.trim() }
                : msg
        ))

        // Remove all messages after this one (including the assistant response)
        setMessages(prev => {
            const index = prev.findIndex(msg => msg.id === messageId)
            return prev.slice(0, index + 1)
        })

        try {
            const normalizedMode = selectedMode !== 'Select Modes' ? selectedMode : null
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: editValue.trim(),
                    mode: normalizedMode,
                    chatId: currentChatId,
                }),
            })

            let payload: { response?: string; messageId?: string; error?: string } | null = null
            try {
                payload = await response.json()
            } catch (jsonError) {
                console.warn('Failed to parse AI response JSON:', jsonError)
            }

            if (!response.ok) {
                const errorMessage =
                    payload?.error ||
                    `Failed to get response (${response.status} ${response.statusText})`
                throw new Error(errorMessage)
            }

            if (!payload) {
                throw new Error('Received empty response from assistant')
            }

            // Add new AI response
            const aiMessageObj: Message = {
                id: payload.messageId || (Date.now() + 1).toString(),
                content: payload.response || 'No response returned.',
                role: 'assistant',
                createdAt: new Date(),
            }

            setMessages(prev => [...prev, aiMessageObj])
            notifyChatListRefresh()
        } catch (error) {
            console.error('Error sending edited message:', error)
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
            setEditValue('')
        }
    }

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, messageId: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSaveEdit(messageId)
        } else if (e.key === 'Escape') {
            e.preventDefault()
            handleCancelEdit()
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const canSubmitFeedback = selectedFeedbackReasons.length > 0 || feedbackText.trim().length > 0

    return (
        <>
            <section className={`flex flex-col h-[676px] ${messages.length > 0 ? 'pt-4' : 'pt-56 items-center'}`}>
                {/* Show title only when no messages */}
                {messages.length === 0 && (
                    <div>
                        <h1 className='text-4xl tracking-wider font-bold flex items-center gap-1 text-gray-700 dark:text-gray-300'>CortexAI <Info className='h-5 w-5' /></h1>
                    </div>
                )}

                {/* Messages Container - DeepSeek style */}
                {messages.length > 0 && (
                    <div className='w-full flex-1 overflow-y-auto custom-chat-scrollbar'>
                        <div className='max-w-4xl mx-auto px-4 py-6 space-y-6'>
                        {messages.map((message) => {
                            const isUser = message.role === 'user'
                            const isHovered = hoveredMessageId === message.id
                            const isRetrying = retryingMessageId === message.id
                            const isEditing = editingMessageId === message.id
                            return (
                                <div
                                    key={message.id}
                                    className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                                    onMouseEnter={() => setHoveredMessageId(message.id)}
                                    onMouseLeave={() => setHoveredMessageId(null)}
                                >
                                    <div className={`max-w-[85%] ${!isUser ? 'flex flex-col' : 'flex flex-col'}`}>
                                        {isEditing && isUser ? (
                                            // Edit mode for user messages
                                            <div className="rounded-lg px-4 py-3 bg-gray-600 text-white ml-auto w-full dark:bg-blue-500">
                                                <textarea
                                                    ref={editInputRef}
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => handleEditKeyDown(e, message.id)}
                                                    className="w-full bg-transparent text-white placeholder-white/70 outline-none resize-none min-h-[60px] max-h-72"
                                                    placeholder="Edit your message..."
                                                    rows={3}
                                                />
                                                <div className="flex items-center justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-3 py-1.5 text-sm rounded-md bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveEdit(message.id)}
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
                                                {/* Edit button for user messages */}
                                                {isUser && (
                                                    <div className={`flex items-center justify-end gap-1 mt-1 px-1 transition-opacity duration-200 ${
                                                        isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                                    }`}>
                                                        <button
                                                            onClick={() => handleCopy(message.content)}
                                                            className="p-1.5 rounded-md text-black dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
                                                            title="Copy"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(message.id)}
                                                            className="p-1.5 rounded-md text-black dark:text-white/80 dark:hover:bg-white/20 hover:bg-gray-100 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <PencilLine className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                {/* Action buttons for assistant messages */}
                                                {!isUser && (
                                                    <div className={`flex flex-wrap items-center gap-1 mt-1 px-1 transition-opacity duration-200 ${
                                                        isHovered ? 'opacity-100' : 'opacity-60'
                                                    }`}>
                                                        <button
                                                            onClick={() => handleLike(message.id)}
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
                                                            onClick={() => handleDislike(message.id)}
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
                                                            onClick={() => handleCopy(message.content)}
                                                            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                            title="Copy"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRetry(message.id)}
                                                            disabled={isRetrying || isLoading}
                                                            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Retry"
                                                        >
                                                            <RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenFeedback(message.id)}
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
                        })}
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

                {/* Input Container - DeepSeek style */}
                <div className={`w-full ${messages.length > 0 ? 'mt-auto pb-6' : 'mt-5'}`}>
                    <div className='max-w-4xl mx-auto px-4'>
                        <div className='py-3 px-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm'>
                        <textarea
                            ref={inputRef}
                            placeholder='Ask a question...'
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading || isHydrating}
                            rows={1}
                            spellCheck={false}
                            className='outline-none text-sm w-full bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 resize-none leading-6 max-h-72'
                        />
                        <div className='flex items-center justify-between'>
                            <div className='mt-4 flex items-center gap-2'>
                                <Plus className='w-8 h-8 border rounded-full p-2 border-gray-400 dark:border-gray-600 cursor-pointer text-gray-700 dark:text-gray-300' />

                                <div className='flex items-center gap-1 cursor-pointer px-3 py-1.5 text-gray-700 dark:text-gray-300 border rounded-full border-gray-400 dark:border-gray-600'>
                                    <Dribbble className='w-4 h-4' />
                                    <span className='text-sm font-normal'>AeroSearch</span>
                                </div>
                                
                                {/* Select Modes Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <div 
                                        className='flex items-center cursor-pointer gap-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 border rounded-full border-gray-400 dark:border-gray-600 transition-all duration-200 hover:border-gray-500 dark:hover:border-gray-400'
                                        onClick={toggleDropdown}
                                    >
                                        <span className='text-sm font-normal'>{selectedMode}</span>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    
                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className={`absolute ${
                                            messages.length > 0 ? 'bottom-full mb-2' : 'top-full mt-2'
                                        } left-0 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg dark:shadow-gray-900 z-10 overflow-hidden transition-all duration-200 transform origin-top`}>
                                            {modes.map((mode, index) => (
                                                <div
                                                    key={mode.name}
                                                    className={`flex items-center gap-3 px-4 py-1.5 cursor-pointer transition-colors duration-150 ${
                                                        index !== modes.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                                                    } ${
                                                        mode.name === 'Clear all' 
                                                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                    onClick={() => handleModeSelect(mode)}
                                                >
                                                    <span className="text-gray-500">{mode.icon}</span>
                                                    <span className="text-sm font-normal">{mode.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className='flex items-center mt-1 gap-3'>
                                <Mic className='h-9 w-9 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-2 text-gray-700 dark:text-gray-300' />
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isLoading || isHydrating || !inputValue.trim()}
                                    className='p-1.5 cursor-pointer rounded-full text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200'
                                >
                                    <ArrowUp className='w-5 h-5' />
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </section>

            {feedbackMessageId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={handleCloseFeedbackModal}
                    />
                    <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Help us improve</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Provide feedback on this answer. Select all that apply.</p>
                            </div>
                            <button
                                onClick={handleCloseFeedbackModal}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-300"
                                aria-label="Close feedback form"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {feedbackReasons.map((reason) => {
                                const isSelected = selectedFeedbackReasons.includes(reason.id)
                                return (
                                    <button
                                        key={reason.id}
                                        onClick={() => toggleFeedbackReason(reason.id)}
                                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-200'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                                        }`}
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {reason.label}
                                    </button>
                                )
                            })}
                        </div>

                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                            How can the response be improved? (optional)
                        </label>
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Your feedback..."
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[120px]"
                        />

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={handleCloseFeedbackModal}
                                className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmitFeedback(feedbackMessageId)}
                                disabled={!canSubmitFeedback || isSubmittingFeedback}
                                className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                {isSubmittingFeedback ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Hero
