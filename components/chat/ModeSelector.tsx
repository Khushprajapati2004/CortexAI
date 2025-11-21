// components/chat/ModeSelector.tsx
import { ChevronDown, ShoppingCart, Box, ScrollText, CircleCheckBig, BadgeDollarSignIcon, ShoppingBag, ToolCase } from 'lucide-react'
import React from 'react'

interface Mode {
  name: string;
  icon?: React.JSX.Element;
}

interface ModeSelectorProps {
  selectedMode: string;
  isDropdownOpen: boolean;
  hasMessages: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onSelect: (mode: Mode) => void;
}

const modes: Mode[] = [
  { name: 'Marketplace', icon: <ShoppingCart className='h-4 w-4' /> },
  { name: 'Inventory', icon: <Box className='h-4 w-4' /> },
  { name: 'Work Orders', icon: <ScrollText className='h-4 w-4' /> },
  { name: 'Compliance', icon: <CircleCheckBig className='h-4 w-4' /> },
  { name: 'Financials', icon: <BadgeDollarSignIcon className='h-4 w-4' /> },
  { name: 'Purchasing', icon: <ShoppingBag className='h-4 w-4' /> },
  { name: 'Parts Analyzer', icon: <ToolCase className='h-4 w-4' /> },
  { name: 'Clear all' }
]

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  isDropdownOpen,
  hasMessages,
  dropdownRef,
  onToggle,
  onSelect,
}) => {
  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className='flex items-center cursor-pointer gap-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 border rounded-full border-gray-400 dark:border-gray-600 transition-all duration-200 hover:border-gray-500 dark:hover:border-gray-400'
        onClick={onToggle}
      >
        <span className='text-sm font-normal'>{selectedMode}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isDropdownOpen && (
        <div className={`absolute ${
          hasMessages ? 'bottom-full mb-2' : 'top-full mt-2'
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
              onClick={() => onSelect(mode)}
            >
              <span className="text-gray-500">{mode.icon}</span>
              <span className="text-sm font-normal">{mode.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
