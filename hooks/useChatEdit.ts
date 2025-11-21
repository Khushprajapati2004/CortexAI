// hooks/useChatEdit.ts
import { useState, useRef, useCallback } from 'react'

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  feedback?: 'like' | 'dislike' | null;
}

export const useChatEdit = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  currentChatId: string | null,
  selectedMode: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  streamResponse: (fullResponse: string, aiMessageId: string) => void,
  notifyChatListRefresh: () => void
) => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const handleEdit = useCallback((messageId: string) => {
    const message = messages.find(msg => msg.id === messageId)
    if (message && message.role === 'user') {
      setEditingMessageId(messageId)
      setEditValue(message.content)
      setTimeout(() => {
        editInputRef.current?.focus()
        editInputRef.current?.setSelectionRange(
          editInputRef.current.value.length,
          editInputRef.current.value.length
        )
      }, 0)
    }
  }, [messages])

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null)
    setEditValue('')
  }, [])

  const handleSaveEdit = useCallback(async (messageId: string) => {
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

    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: editValue.trim() }
        : msg
    ))

    setMessages(prev => {
      const index = prev.findIndex(msg => msg.id === messageId)
      return prev.slice(0, index + 1)
    })

    try {
      const normalizedMode = selectedMode !== 'Select Modes' ? selectedMode : null
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: editValue.trim(),
          mode: normalizedMode,
          chatId: currentChatId,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || `Failed to get response (${response.status})`)
      }

      if (!payload) throw new Error('Received empty response from assistant')

      const aiMessageObj: Message = {
        id: payload.messageId || (Date.now() + 1).toString(),
        content: payload.response || 'No response returned.',
        role: 'assistant',
        createdAt: new Date(),
      }

      setMessages(prev => [...prev, aiMessageObj])
      notifyChatListRefresh()
    } catch (error) {
      console.error('Error saving edit:', error)
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
  }, [editValue, messages, selectedMode, currentChatId, setIsLoading, setMessages, handleCancelEdit, notifyChatListRefresh])

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>, messageId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit(messageId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }, [handleSaveEdit, handleCancelEdit])

  return {
    editingMessageId,
    editValue,
    editInputRef,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    setEditValue,
    handleEditKeyDown,
  }
}
