"use client"

import { ArrowLeft, CheckCircle, Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const Verifyemail = () => {
    const [isVerified, setIsVerified] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [countdown, setCountdown] = useState<number>(5)
    const [error, setError] = useState<string>('')
    const [userEmail, setUserEmail] = useState<string>('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    const verifyEmail = useCallback(async (verificationToken: string) => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: verificationToken }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed')
            }

            setIsVerified(true)
            setUserEmail(data.email || userEmail)
            
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Verification failed')
        } finally {
            setIsLoading(false)
        }
    }, [userEmail])

    const handleContinue = useCallback(() => {
        router.push('/login')
    }, [router])

    const handleRefresh = () => {
        // This would typically resend verification email
        setError('')
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
        }, 2000)
    }

    useEffect(() => {
        if (email) {
            setUserEmail(email)
        }

        // If token is present, verify the email immediately
        if (token) {
            verifyEmail(token)
        } else {
            // If no token, just show the loading state
            setTimeout(() => {
                setIsLoading(false)
            }, 2000)
        }
    }, [token, email, verifyEmail])

    useEffect(() => {
        if (isVerified && countdown > 0) {
            const countdownTimer = setTimeout(() => {
                setCountdown(countdown - 1)
            }, 1000)
            return () => clearTimeout(countdownTimer)
        }

        if (isVerified && countdown === 0) {
            handleContinue()
        }
    }, [isVerified, countdown, handleContinue])

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            {/* Back Button */}
            <Link 
                href="/signup"
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Signup</span>
            </Link>

            {/* Verification Card */}
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

                {/* Verification Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <div className="text-center">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Animated Icon */}
                        <div className="flex justify-center mb-6">
                            <div className={`relative ${isLoading ? 'animate-pulse' : ''}`}>
                                <div className={`w-20 h-20 rounded-full ${
                                    isLoading 
                                        ? 'bg-blue-100 dark:bg-blue-900' 
                                        : isVerified 
                                            ? 'bg-green-100 dark:bg-green-900' 
                                            : 'bg-gray-100 dark:bg-gray-700'
                                } flex items-center justify-center transition-all duration-500`}>
                                    {isLoading ? (
                                        <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                                    ) : isVerified ? (
                                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <Mail className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                                    )}
                                </div>
                                
                                {isVerified && (
                                    <div className="absolute inset-0 border-4 border-green-200 dark:border-green-800 rounded-full animate-ping opacity-75"></div>
                                )}
                            </div>
                        </div>

                        {/* Title & Description */}
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                            {isLoading ? 'Checking your email...' : isVerified ? 'Email verified successfully!' : 'Check your email'}
                        </h2>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {isLoading 
                                ? 'We are verifying your email address. Please wait...'
                                : isVerified 
                                    ? 'Your email address has been successfully verified.'
                                    : 'We sent a verification link to your email address.'
                            }
                        </p>

                        {/* Email Display */}
                        {userEmail && (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-6 mb-6">
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Mail className="w-4 h-4" />
                                    <span>{userEmail}</span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Verifying...</span>
                                </div>
                            ) : isVerified ? (
                                <>
                                    <button
                                        onClick={handleContinue}
                                        className="w-full bg-gray-700 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-800 dark:text-black cursor-pointer py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                                    >
                                        {countdown > 0 ? `Continue (${countdown})` : 'Continue to Login'}
                                    </button>
                                    
                                    <button
                                        onClick={handleRefresh}
                                        className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Verify Another Email
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleRefresh}
                                    className="w-full bg-gray-700 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-800 dark:text-black cursor-pointer py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Resend Verification Email
                                </button>
                            )}
                        </div>

                        {/* Help Text */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isLoading 
                                    ? 'This usually takes just a few seconds...'
                                    : isVerified 
                                        ? 'You will be automatically redirected shortly'
                                        : 'Check your spam folder if you don\'t see the email'
                                }
                            </p>
                        </div>

                        {/* Support Link */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Need help?{' '}
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

                {/* Progress Bar */}
                {isVerified && countdown > 0 && (
                    <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div 
                            className="bg-green-500 h-1 rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${(5 - countdown) * 20}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Verifyemail