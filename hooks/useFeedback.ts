// hooks/useFeedback.ts
import { useState, useCallback } from 'react'

export const useFeedback = () => {
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [selectedFeedbackReasons, setSelectedFeedbackReasons] = useState<string[]>([])
  const [feedbackSuccessId, setFeedbackSuccessId] = useState<string | null>(null)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const handleOpenFeedback = useCallback((messageId: string) => {
    if (feedbackMessageId === messageId) {
      setFeedbackMessageId(null)
      setFeedbackText('')
      setSelectedFeedbackReasons([])
      return
    }
    setFeedbackMessageId(messageId)
    setFeedbackText('')
    setSelectedFeedbackReasons([])
    setFeedbackSuccessId(null)
  }, [feedbackMessageId])

  const handleCloseFeedbackModal = useCallback(() => {
    setFeedbackMessageId(null)
    setFeedbackText('')
    setSelectedFeedbackReasons([])
  }, [])

  const toggleFeedbackReason = useCallback((reasonId: string) => {
    setSelectedFeedbackReasons(prev =>
      prev.includes(reasonId)
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId]
    )
  }, [])

  const handleSubmitFeedback = useCallback(async (messageId: string) => {
    if (!selectedFeedbackReasons.length && !feedbackText.trim()) return
    setIsSubmittingFeedback(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setFeedbackSuccessId(messageId)
      handleCloseFeedbackModal()
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }, [selectedFeedbackReasons, feedbackText, handleCloseFeedbackModal])

  return {
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
  }
}
