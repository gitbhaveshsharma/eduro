import * as React from 'react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, EyeOff, Code } from 'lucide-react'

interface MarkdownTextareaProps extends React.ComponentProps<'textarea'> {
    onMarkdownChange?: (value: string) => void
    previewClassName?: string
    showToggle?: boolean
    markdownComponents?: any // ReactMarkdown components prop
}

const MarkdownTextarea = React.forwardRef<HTMLTextAreaElement, MarkdownTextareaProps>(
    ({
        className,
        value,
        onMarkdownChange,
        previewClassName,
        showToggle = true,
        markdownComponents,
        ...props
    }, ref) => {
        const [isPreview, setIsPreview] = React.useState(false)
        const textareaRef = React.useRef<HTMLTextAreaElement>(null)

        React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onMarkdownChange?.(e.target.value)
            props.onChange?.(e)
        }

        return (
            <div className="space-y-3">
                {showToggle && (
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {isPreview ? 'Preview' : 'Markdown'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPreview(!isPreview)}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            {isPreview ? (
                                <>
                                    <EyeOff className="h-4 w-4" />
                                    Edit Markdown
                                </>
                            ) : (
                                <>
                                    <Eye className="h-4 w-4" />
                                    Preview HTML
                                </>
                            )}
                        </button>
                    </div>
                )}

                {isPreview ? (
                    <div
                        className={cn(
                            'min-h-16 w-full rounded-md border bg-card px-3 py-2 text-base',
                            'prose prose-sm dark:prose-invert max-w-none overflow-auto',
                            previewClassName
                        )}
                    >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {String(value || '')}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        data-slot="textarea"
                        value={value}
                        onChange={handleChange}
                        className={cn(
                            'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono',
                            className,
                        )}
                        placeholder="Type markdown here... ## Headers, **bold**, *italic*, `code`"
                        {...props}
                    />
                )}
            </div>
        )
    }
)

MarkdownTextarea.displayName = 'MarkdownTextarea'

export { MarkdownTextarea }