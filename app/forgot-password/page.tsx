// app/forgot-password/page.tsx
"use client"

import { ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import React, { useState, ChangeEvent, FormEvent } from 'react'

const ForgotPassword = () => {
    const [email, setEmail] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value)
        setError('')
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
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
                throw new Error(data.error || 'Failed to send reset instructions')
            }

            // Store email in localStorage before redirecting
            localStorage.setItem('resetEmail', email)
            setIsSubmitted(true)
            
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send reset instructions')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            {/* Back Button */}
            <Link
                href="/login"
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Login</span>
            </Link>

            {/* Forgot Password Card */}
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                        CortexAI
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {isSubmitted ? 'Check your email' : 'Reset your password'}
                    </p>
                </div>

                {/* Forgot Password Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {!isSubmitted ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="flex justify-center mb-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                                    Forgot your password?
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Enter your email address and we{"'"}ll send you instructions to reset your password.
                                </p>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={email}
                                        onChange={handleChange}
                                        className="w-full text-sm px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-white focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                                        placeholder="Enter your email address"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gray-700 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-800 dark:text-black cursor-pointer py-2.5 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Success Message */
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                    <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                                Check your email
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                We{"'"}ve sent password reset instructions to <span className="font-medium text-gray-800 dark:text-white">{email}</span>
                            </p>
                            <div className="space-y-4">
                                <Link
                                    href="/verify-otp"
                                    className="block w-full bg-gray-700 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-800 dark:text-black cursor-pointer py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 text-center"
                                >
                                    Enter OTP
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsSubmitted(false)
                                        setEmail('')
                                        localStorage.removeItem('resetEmail')
                                    }}
                                    className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer py-2.5 px-4 rounded-lg font-semibold transition-all duration-200"
                                >
                                    Use Different Email
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Signup Link */}
                    <div className="text-center mt-8">
                        <p className="text-gray-600 text-sm dark:text-gray-400">
                            Don{"'"}t have an account?{' '}
                            <Link
                                href="/signup"
                                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword