"use client"

import { CheckCircle, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SignupSuccessProps {
    email: string
    onClose: () => void
}

const SignupSuccess = ({ email, onClose }: SignupSuccessProps) => {
    const router = useRouter()

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-center">
                    {/* Success Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    {/* Title & Message */}
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                        Check Your Email!
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        We{"'"}ve sent a verification link to:
                    </p>

                    {/* Email Display */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-6">
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">{email}</span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="text-left bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            • Click the verification link in the email<br/>
                            • The link expires in 1 hour<br/>
                            • Check spam folder if you don{"'"}t see it
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/verify-email?email=' + encodeURIComponent(email))}
                            className="w-full bg-gray-700 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-800 dark:text-black py-2.5 px-4 rounded-lg font-semibold transition-all duration-200"
                        >
                            Go to Verification Page
                        </button>
                        
                        <button
                            onClick={onClose}
                            className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-2.5 px-4 rounded-lg font-medium transition-all duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignupSuccess