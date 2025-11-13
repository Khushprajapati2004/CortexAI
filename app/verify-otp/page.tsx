"use client"

import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react'

const VerifyOTP = () => {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
    const [timer, setTimer] = useState<number>(60)
    const [isResendEnabled, setIsResendEnabled] = useState<boolean>(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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
            inputRefs.current[Math.min(5, pastedData.length - 1)]?.focus()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const otpValue = otp.join('')
        if (otpValue.length === 6) {
            // Handle OTP verification here
            console.log('OTP submitted:', otpValue)
        }
    }

    const handleResend = () => {
        setTimer(60)
        setIsResendEnabled(false)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        // Handle resend OTP logic here
        console.log('Resend OTP requested')
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
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
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* OTP Input Fields */}
                        <div className="flex justify-center gap-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                                    required
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
                            disabled={otp.join('').length !== 6}
                            className="w-full bg-gray-700 hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed text-white dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-800 dark:text-black dark:disabled:bg-gray-600 dark:disabled:text-gray-400 cursor-pointer py-2.5 px-4 rounded-lg font-semibold transition-all duration-200"
                        >
                            Verify Code
                        </button>
                    </form>

                    {/* Resend Code */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Didn{"'"}t receive the code?{' '}
                            <button
                                onClick={handleResend}
                                disabled={!isResendEnabled}
                                className={`font-medium transition-colors duration-200 ${
                                    isResendEnabled 
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