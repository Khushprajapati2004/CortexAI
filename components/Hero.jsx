import { ArrowUp, BadgeDollarSignIcon, Box, ChevronDown, CircleCheckBig, Dribbble, Info, Mic, Plus, ScrollText, ShoppingBag, ShoppingCart, ToolCase } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

const Hero = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedMode, setSelectedMode] = useState('Select Modes')
    const dropdownRef = useRef(null)

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

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen)
    }

    const handleModeSelect = (mode) => {
        if (mode.name === 'Clear all') {
            setSelectedMode('Select Modes')
        } else {
            setSelectedMode(mode.name)
        }
        setIsDropdownOpen(false)
    }

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false)
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
            <section className='flex flex-col pt-48 items-center max-h-screen h-[712px] '>
                <div>
                    <h1 className='text-4xl tracking-wider font-bold flex items-center gap-1 text-gray-700 dark:text-gray-300'>CortexAI <Info className='h-5 w-5' /></h1>
                </div>

                <div className='mt-5 w-full max-w-[824px] py-2.5 px-3 rounded-3xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow dark:shadow-gray-900'>
                    <input 
                        type="text" 
                        placeholder='Ask a question...' 
                        className='outline-none py-1.5 text-sm w-full bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400' 
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
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg dark:shadow-gray-900 z-10 overflow-hidden transition-all duration-200 transform origin-top">
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
                            <ArrowUp className='w-8.5 h-8.5 p-1.5 cursor-pointer rounded-full text-white bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500' />
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Hero