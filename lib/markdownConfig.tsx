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
  table(props) {
    return (
      <div className="overflow-x-auto my-4">
        <table {...props} className={`min-w-full border-collapse border border-gray-300 dark:border-gray-600 ${props.className ?? ''}`} />
      </div>
    )
  },
  thead(props) {
    return <thead {...props} className={`bg-gray-100 dark:bg-gray-800 ${props.className ?? ''}`} />
  },
  tbody(props) {
    return <tbody {...props} className={props.className} />
  },
  tr(props) {
    return <tr {...props} className={`border-b border-gray-300 dark:border-gray-600 ${props.className ?? ''}`} />
  },
  th(props) {
    return <th {...props} className={`px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 ${props.className ?? ''}`} />
  },
  td(props) {
    return <td {...props} className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 ${props.className ?? ''}`} />
  },
  h1(props) {
    return <h1 {...props} className={`text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100 ${props.className ?? ''}`} />
  },
  h2(props) {
    return <h2 {...props} className={`text-xl font-bold mt-5 mb-2 text-gray-900 dark:text-gray-100 ${props.className ?? ''}`} />
  },
  h3(props) {
    return <h3 {...props} className={`text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100 ${props.className ?? ''}`} />
  },
  h4(props) {
    return <h4 {...props} className={`text-base font-semibold mt-3 mb-1 text-gray-900 dark:text-gray-100 ${props.className ?? ''}`} />
  },
  blockquote(props) {
    return <blockquote {...props} className={`border-l-4 border-blue-500 pl-4 py-2 my-3 italic bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 ${props.className ?? ''}`} />
  },
  hr(props) {
    return <hr {...props} className={`my-6 border-t-2 border-gray-300 dark:border-gray-600 ${props.className ?? ''}`} />
  },
  strong(props) {
    return <strong {...props} className={`font-bold text-gray-900 dark:text-gray-100 ${props.className ?? ''}`} />
  },
  em(props) {
    return <em {...props} className={`italic text-gray-700 dark:text-gray-300 ${props.className ?? ''}`} />
  },
}
