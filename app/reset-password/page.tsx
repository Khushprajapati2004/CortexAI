"use client"

import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import React, { useState, ChangeEvent, FormEvent } from 'react'

const ResetPassword = () => {
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    })

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // Handle reset password logic here
        console.log('Reset password:', formData)
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            {/* Back Button */}
            <Link 
                href="/verify-otp"
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
            </Link>

            {/* Reset Password Card */}
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8">
                   
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                        CortexAI
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create your new password
                    </p>
                </div>

                {/* Reset Password Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                            Reset Password
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enter your new password below
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* New Password Field */}
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    id="newPassword"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full text-sm px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-white focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none pr-12"
                                    placeholder="Enter new password"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Password must be at least 6 characters long
                            </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full text-sm px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-white focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none pr-12"
                                    placeholder="Confirm new password"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Match Indicator */}
                        {formData.newPassword && formData.confirmPassword && (
                            <div className={`p-3 rounded-lg text-sm ${
                                formData.newPassword === formData.confirmPassword 
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}>
                                {formData.newPassword === formData.confirmPassword 
                                    ? '✓ Passwords match' 
                                    : '✗ Passwords do not match'
                                }
                            </div>
                        )}

                        {/* Password Strength Indicator */}
                        {formData.newPassword && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <span>Password strength:</span>
                                    <span className={`
                                        ${formData.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 
                                          formData.newPassword.length >= 6 ? 'text-yellow-600 dark:text-yellow-400' : 
                                          'text-red-600 dark:text-red-400'}
                                    `}>
                                        {formData.newPassword.length >= 8 ? 'Strong' : 
                                         formData.newPassword.length >= 6 ? 'Medium' : 
                                         'Weak'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            formData.newPassword.length >= 8 ? 'bg-green-500 w-full' : 
                                            formData.newPassword.length >= 6 ? 'bg-yellow-500 w-2/3' : 
                                            'bg-red-500 w-1/3'
                                        }`}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Reset Password Button */}
                        <button
                            type="submit"
                            disabled={!formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword}
                            className="w-full bg-gray-700 hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed text-white dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-800 dark:text-black dark:disabled:bg-gray-600 dark:disabled:text-gray-400 cursor-pointer py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                        >
                            Reset Password
                        </button>
                    </form>

                    {/* Security Tips */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                            🔒 Password Tips
                        </h3>
                        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                            <li>• Use at least 8 characters</li>
                            <li>• Include numbers and symbols</li>
                            <li>• Mix uppercase and lowercase letters</li>
                            <li>• Avoid common words or patterns</li>
                        </ul>
                    </div>

                    {/* Login Link */}
                    <div className="text-center mt-8">
                        <p className="text-gray-600 text-sm dark:text-gray-400">
                            Remember your password?{' '}
                            <Link 
                                href="/login" 
                                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                            >
                                Back to login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword