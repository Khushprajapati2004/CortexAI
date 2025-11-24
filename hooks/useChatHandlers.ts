// hooks/useChatHandlers.ts
import { useState, useCallback } from 'react'
// import { ChatStorage } from '@/lib/chatStorage'

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  feedback?: 'like' | 'dislike' | null;
}

export const useChatHandlers = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  currentChatId: string | null,
  selectedMode: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  notifyChatListRefresh: () => void,
  streamIntervalRef: React.RefObject<NodeJS.Timeout | null>
) => {
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)

  const handleLike = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback: msg.feedback === 'like' ? null : 'like' as const }
        : msg
    ))
  }, [setMessages])

  const handleDislike = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback: msg.feedback === 'dislike' ? null : 'dislike' as const }
        : msg
    ))
  }, [setMessages])

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [])

  const streamResponse = useCallback((fullResponse: string, aiMessageId: string) => {
    let currentIndex = 0
    const streamInterval = setInterval(() => {
      if (currentIndex < fullResponse.length) {
        const chunkSize = Math.floor(Math.random() * 3) + 1
        currentIndex += chunkSize
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: fullResponse.slice(0, currentIndex) }
            : msg
        ))
      } else {
        clearInterval(streamInterval)
        setStreamingMessageId(null)
        if (streamIntervalRef.current) {
          streamIntervalRef.current = null
        }
      }
    }, 20)
    
    // Store interval ID for stopping
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
    }
    streamIntervalRef.current = streamInterval
    return streamInterval
  }, [setMessages, setStreamingMessageId, streamIntervalRef])

  const handleStopGeneration = useCallback(() => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
      streamIntervalRef.current = null
    }
    setStreamingMessageId(null)
    setIsLoading(false)
  }, [streamIntervalRef, setStreamingMessageId, setIsLoading])

  const handleRetry = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1 || messageIndex === 0) return

    const assistantMessage = messages[messageIndex]
    const userMessage = messages[messageIndex - 1]
    
    if (userMessage.role !== 'user' || assistantMessage.role !== 'assistant') return

    setRetryingMessageId(messageId)
    setIsLoading(true)
    setMessages(prev => prev.filter(msg => msg.id !== messageId))

    try {
      const normalizedMode = selectedMode !== 'Select Modes' ? selectedMode : null
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          mode: normalizedMode,
          chatId: currentChatId,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || `Failed to get response (${response.status})`)
      }

      if (!payload) throw new Error('Received empty response from assistant')

      const fullResponse = payload.response || 'No response returned.'
      const aiMessageId = payload.messageId || (Date.now() + 1).toString()
      
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
  }, [messages, selectedMode, currentChatId, setIsLoading, setMessages, setStreamingMessageId, streamResponse, notifyChatListRefresh])

  return {
    handleLike,
    handleDislike,
    handleCopy,
    handleRetry,
    retryingMessageId,
    streamResponse,
    setStreamingMessageId,
    handleStopGeneration,
    streamingMessageId,
  }
}
