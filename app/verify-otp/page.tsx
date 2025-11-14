// app/verify-otp/page.tsx
"use client"

import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const VerifyOTP = () => {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
    const [timer, setTimer] = useState<number>(600) // 10 minutes in seconds
    const [isResendEnabled, setIsResendEnabled] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Try multiple ways to get the email
        let storedEmail = localStorage.getItem('resetEmail')
        
        // If not in localStorage, check URL parameters
        if (!storedEmail) {
            storedEmail = searchParams.get('email')
        }
        
        // If still not found, try sessionStorage as fallback
        if (!storedEmail) {
            storedEmail = sessionStorage.getItem('resetEmail')
        }

        if (storedEmail) {
            setEmail(storedEmail)
            // Ensure it's in localStorage for consistency
            localStorage.setItem('resetEmail', storedEmail)
        } else {
            setError('Email not found. Please go back and restart the password reset process.')
        }
    }, [searchParams])

    useEffect(() => {
        if (timer > 0) {
            const countdown = setTimeout(() => setTimer(timer - 1), 1000)
            return () => clearTimeout(countdown)
        } else {
            setIsResendEnabled(true)
        }
    }, [timer])

    const handleChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return // Only allow single digits

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)
        setError('')

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            // Move to previous input on backspace
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, 6)
        if (/^\d+$/.test(pastedData)) {
            const newOtp = [...otp]
            pastedData.split('').forEach((char, index) => {
                if (index < 6) {
                    newOtp[index] = char
                }
            })
            setOtp(newOtp)
            setError('')
            inputRefs.current[Math.min(5, pastedData.length - 1)]?.focus()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const otpValue = otp.join('')
        
        if (otpValue.length !== 6) {
            setError('Please enter the complete 6-digit OTP')
            return
        }

        if (!email) {
            setError('Email not found. Please go back and restart the process.')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp: otpValue }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'OTP verification failed')
            }

            // Store reset token and redirect to reset password page
            localStorage.setItem('resetToken', data.resetToken)
            // Clear the email from storage after successful verification
            localStorage.removeItem('resetEmail')
            router.push('/reset-password')
            
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'OTP verification failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        if (!email) {
            setError('Email not found. Please go back and restart the process.')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend OTP')
            }

            setTimer(600)
            setIsResendEnabled(false)
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
            
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to resend OTP')
        } finally {
            setIsLoading(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // If no email is found, show error message
    if (!email && error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <Link 
                    href="/forgot-password"
                    className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back</span>
                </Link>

                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                            CortexAI
                        </h1>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-red-600 dark:text-red-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                            Session Expired
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {error}
                        </p>
                        <Link
                            href="/forgot-password"
                            className="w-full bg-gray-700 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-800 dark:text-black cursor-pointer py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 inline-block text-center"
                        >
                            Restart Password Reset
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            {/* Back Button */}
            <Link 
                href="/forgot-password"
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
            </Link>

            {/* OTP Verification Card */}
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                        CortexAI
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Verify your email address
                    </p>
                </div>

                {/* OTP Verification Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                            Enter verification code
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            We{"'"}ve sent a 6-digit code to your email address
                        </p>
                        {email && (
                            <p className="text-sm font-medium text-gray-800 dark:text-white mt-1">
                                {email}
                            </p>
                        )}
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* OTP Input Fields */}
                        <div className="flex justify-center gap-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                                    required
                                    disabled={isLoading}
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>Code expires in {formatTime(timer)}</span>
                            </div>
                        </div>

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={otp.join('').length !== 6 || isLoading}
                            className="w-full bg-gray-700 hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed text-white dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-800 dark:text-black dark:disabled:bg-gray-600 dark:disabled:text-gray-400 cursor-pointer py-2.5 px-4 rounded-lg font-semibold transition-all duration-200"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>

                    {/* Resend Code */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Didn{"'"}t receive the code?{' '}
                            <button
                                onClick={handleResend}
                                disabled={!isResendEnabled || isLoading}
                                className={`font-medium transition-colors duration-200 ${
                                    isResendEnabled && !isLoading
                                        ? 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer' 
                                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Resend code
                            </button>
                        </p>
                    </div>

                    {/* Support Link */}
                    <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Having trouble?{' '}
                            <Link 
                                href="/support" 
                                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                            >
                                Contact support
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VerifyOTP