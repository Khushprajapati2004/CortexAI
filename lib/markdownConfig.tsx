// lib/markdownConfig.tsx
import React from 'react'
import type { Components } from 'react-markdown'

export const markdownComponents: Components = {
  code(codeProps) {
    const { inline, className, children, ...rest } = codeProps as {
      inline?: boolean
      className?: string
      children: React.ReactNode
    }
    if (inline) {
      return <code className={`px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-[13px] ${className ?? ''}`} {...rest}>{children}</code>
    }
    return <code className={className} {...rest}>{children}</code>
  },
  pre(preProps) {
    const { children, ...rest } = preProps
    return (
      <pre className='w-full overflow-x-auto rounded-xl bg-gray-900 text-gray-100 text-sm p-4 my-3 border border-gray-800' {...rest}>
        {children}
      </pre>
    )
  },
  ul(props) {
    return <ul {...props} className={`list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-200 ${props.className ?? ''}`} />
  },
  ol(props) {
    return <ol {...props} className={`list-decimal ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-200 ${props.className ?? ''}`} />
  },
  p(props) {
    const hasPre = React.Children.toArray(props.children).some(
      (child) => React.isValidElement(child) && child.type === 'pre'
    )
    
    if (hasPre) {
      return <>{props.children}</>
    }
    
    return <p {...props} className={`text-sm leading-6 text-gray-700 dark:text-gray-200 ${props.className ?? ''}`} />
  },
  a(props) {
    return <a {...props} target='_blank' rel='noreferrer' className={`text-blue-500 hover:underline ${props.className ?? ''}`} />
  },
}
