// components/chat/FeedbackModal.tsx
import { AlertCircle, X } from 'lucide-react'
import React from 'react'

interface FeedbackReason {
  id: string;
  label: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  feedbackText: string;
  selectedReasons: string[];
  isSubmitting: boolean;
  onClose: () => void;
  onTextChange: (text: string) => void;
  onToggleReason: (reasonId: string) => void;
  onSubmit: () => void;
}

const feedbackReasons: FeedbackReason[] = [
  { id: 'inaccurate', label: 'Inaccurate' },
  { id: 'out_of_date', label: 'Out of date' },
  { id: 'too_short', label: 'Too short' },
  { id: 'too_long', label: 'Too long' },
  { id: 'harmful', label: 'Harmful or offensive' },
  { id: 'not_helpful', label: 'Not helpful' },
]

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  feedbackText,
  selectedReasons,
  isSubmitting,
  onClose,
  onTextChange,
  onToggleReason,
  onSubmit,
}) => {
  if (!isOpen) return null

  const canSubmit = selectedReasons.length > 0 || feedbackText.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
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
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-300"
            aria-label="Close feedback form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {feedbackReasons.map((reason) => {
            const isSelected = selectedReasons.includes(reason.id)
            return (
              <button
                key={reason.id}
                onClick={() => onToggleReason(reason.id)}
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
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Your feedback..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[120px]"
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
