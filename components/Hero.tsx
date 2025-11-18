// components/Hero.tsx
import { ArrowUp, BadgeDollarSignIcon, Box, ChevronDown, CircleCheckBig, Dribbble, Info, Mic, Plus, ScrollText, ShoppingBag, ShoppingCart, ToolCase } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

const Hero = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedMode, setSelectedMode] = useState('Select Modes')
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const modes = [
        { name: 'Marketplace', icon: <ShoppingCart className='h-4 w-4' /> },
        { name: 'Inventory', icon: <Box className='h-4 w-4' /> },
        { name: 'Work Orders', icon: <ScrollText className='h-4 w-4' /> },
        { name: 'Compliance', icon: <CircleCheckBig className='h-4 w-4' /> },
        { name: 'Financials', icon: <BadgeDollarSignIcon className='h-4 w-4' /> },
        { name: 'Purchasing', icon: <ShoppingBag className='h-4 w-4' /> },
        { name: 'Parts Analyzer', icon: <ToolCase className='h-4 w-4' /> },
        { name: 'Clear all' }
    ]

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen)
    }

    const handleModeSelect = (mode: { name: string; icon?: React.JSX.Element }) => {
        if (mode.name === 'Clear all') {
            setSelectedMode('Select Modes')
        } else {
            setSelectedMode(mode.name)
        }
        setIsDropdownOpen(false)
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
            setIsDropdownOpen(false)
        }
    }

    const handleSubmit = async () => {
        if (!inputValue.trim() || isLoading) return

        const userMessage = inputValue.trim()
        setInputValue('')
        setIsLoading(true)

        // Add user message to UI immediately
        const userMessageObj: Message = {
            id: Date.now().toString(),
            content: userMessage,
            role: 'user',
            createdAt: new Date(),
        }

        setMessages(prev => [...prev, userMessageObj])

        try {
            // Create chat if it doesn't exist
            let chatId = currentChatId
            if (!chatId) {
                const chatResponse = await fetch('/api/chats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
                        mode: selectedMode !== 'Select Modes' ? selectedMode : null,
                    }),
                })

                if (!chatResponse.ok) {
                    const errorData = await chatResponse.json().catch(() => ({}))
                    console.error('Chat creation failed:', errorData)
                    throw new Error(`Failed to create chat: ${errorData.error || chatResponse.statusText}`)
                }

                const chatData = await chatResponse.json()
                chatId = chatData.chat.id
                setCurrentChatId(chatId)
            }

            // Send message with chatId
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    mode: selectedMode !== 'Select Modes' ? selectedMode : null,
                    chatId: chatId,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to get response')
            }

            const data = await response.json()

            // Add AI response to UI
            const aiMessageObj: Message = {
                id: data.messageId || (Date.now() + 1).toString(),
                content: data.response,
                role: 'assistant',
                createdAt: new Date(),
            }

            setMessages(prev => [...prev, aiMessageObj])

        } catch (error) {
            console.error('Error sending message:', error)
            // Add error message with details
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
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <>
            <section className={`flex flex-col items-center h-[676px] ${messages.length > 0 ? 'pt-8' : 'pt-56'}`}>
                {/* Show title only when no messages */}
                {messages.length === 0 && (
                    <div>
                        <h1 className='text-4xl tracking-wider font-bold flex items-center gap-1 text-gray-700 dark:text-gray-300'>CortexAI <Info className='h-5 w-5' /></h1>
                    </div>
                )}

                {/* Messages Container */}
                {messages.length > 0 && (
                    <div className='w-full max-w-4xl -mb-3 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto px-4 -mt-6'>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                        message.role === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <p className='text-sm whitespace-pre-wrap'>{message.content}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className='flex justify-start'>
                                <div className='max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800'>
                                    <div className='flex space-x-2'>
                                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
                                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input Container - Position changes based on whether there are messages */}
                <div className={`w-full max-w-4xl px-4 ${messages.length > 0 ? 'mt-auto pb-8' : 'mt-5'}`}>
                    <div className='py-2.5 px-3 rounded-3xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow dark:shadow-gray-900'>
                        <input 
                            type="text" 
                            placeholder='Ask a question...' 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            className='outline-none py-1.5 text-sm w-full bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50' 
                        />
                        <div className='flex items-center justify-between'>
                            <div className='mt-4 flex items-center gap-2'>
                                <Plus className='w-8 h-8 border rounded-full p-2 border-gray-400 dark:border-gray-600 cursor-pointer text-gray-700 dark:text-gray-300' />

                                <div className='flex items-center gap-1 cursor-pointer px-3 py-1.5 text-gray-700 dark:text-gray-300 border rounded-full border-gray-400 dark:border-gray-600'>
                                    <Dribbble className='w-4 h-4' />
                                    <span className='text-sm font-normal'>AeroSearch</span>
                                </div>
                                
                                {/* Select Modes Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <div 
                                        className='flex items-center cursor-pointer gap-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 border rounded-full border-gray-400 dark:border-gray-600 transition-all duration-200 hover:border-gray-500 dark:hover:border-gray-400'
                                        onClick={toggleDropdown}
                                    >
                                        <span className='text-sm font-normal'>{selectedMode}</span>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    
                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className={`absolute ${
                                            messages.length > 0 ? 'bottom-full mb-2' : 'top-full mt-2'
                                        } left-0 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg dark:shadow-gray-900 z-10 overflow-hidden transition-all duration-200 transform origin-top`}>
                                            {modes.map((mode, index) => (
                                                <div
                                                    key={mode.name}
                                                    className={`flex items-center gap-3 px-4 py-1.5 cursor-pointer transition-colors duration-150 ${
                                                        index !== modes.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                                                    } ${
                                                        mode.name === 'Clear all' 
                                                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                    onClick={() => handleModeSelect(mode)}
                                                >
                                                    <span className="text-gray-500">{mode.icon}</span>
                                                    <span className="text-sm font-normal">{mode.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className='flex items-center mt-1 gap-3'>
                                <Mic className='h-9 w-9 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-2 text-gray-700 dark:text-gray-300' />
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isLoading || !inputValue.trim()}
                                    className='p-1.5 cursor-pointer rounded-full text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200'
                                >
                                    <ArrowUp className='w-5 h-5' />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Hero
