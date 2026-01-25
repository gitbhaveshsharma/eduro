import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { FileText, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AssignmentInstructionsProps {
    instructions: string;
    isMarkdown?: boolean;
    defaultExpanded?: boolean;
}

export function AssignmentInstructions({
    instructions,
    isMarkdown = true,
    defaultExpanded = true,
}: AssignmentInstructionsProps) {
    const [isCopied, setIsCopied] = useState(false);
    const [isAccordionExpanded, setIsAccordionExpanded] = useState(defaultExpanded);

    // Function to handle copy to clipboard
    const handleCopyToClipboard = async () => {
        try {

            await navigator.clipboard.writeText(instructions);

            setIsCopied(true);
            showSuccessToast('Instructions copied to clipboard!');

            // Reset the copy icon after 2 seconds
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            showErrorToast('Failed to copy instructions. Please try again.');
        }
    };

    // Custom components for better Markdown styling
    const markdownComponents = {
        h1: ({ children }: { children: React.ReactNode }) => (
            <h1 className="text-2xl font-bold mt-4 mb-2 text-foreground">{children}</h1>
        ),
        h2: ({ children }: { children: React.ReactNode }) => (
            <h2 className="text-xl font-bold mt-3 mb-2 text-foreground">{children}</h2>
        ),
        h3: ({ children }: { children: React.ReactNode }) => (
            <h3 className="text-lg font-semibold mt-3 mb-2 text-foreground">{children}</h3>
        ),
        h4: ({ children }: { children: React.ReactNode }) => (
            <h4 className="text-base font-semibold mt-2 mb-1 text-foreground">{children}</h4>
        ),
        p: ({ children }: { children: React.ReactNode }) => (
            <p className="my-2 text-foreground leading-relaxed">{children}</p>
        ),
        ul: ({ children }: { children: React.ReactNode }) => (
            <ul className="my-2 ml-6 list-disc text-foreground space-y-1">{children}</ul>
        ),
        ol: ({ children }: { children: React.ReactNode }) => (
            <ol className="my-2 ml-6 list-decimal text-foreground space-y-1">{children}</ol>
        ),
        li: ({ children }: { children: React.ReactNode }) => (
            <li className="my-1 text-foreground">{children}</li>
        ),
        strong: ({ children }: { children: React.ReactNode }) => (
            <strong className="font-bold text-foreground">{children}</strong>
        ),
        em: ({ children }: { children: React.ReactNode }) => (
            <em className="italic text-foreground">{children}</em>
        ),
        code: ({ children }: { children: React.ReactNode }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                {children}
            </code>
        ),
        pre: ({ children }: { children: React.ReactNode }) => (
            <pre className="bg-muted p-4 rounded-lg my-3 overflow-x-auto">
                <code className="text-sm font-mono text-foreground">{children}</code>
            </pre>
        ),
        blockquote: ({ children }: { children: React.ReactNode }) => (
            <blockquote className="border-l-4 border-primary pl-4 my-3 italic text-muted-foreground">
                {children}
            </blockquote>
        ),
        a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
            >
                {children}
            </a>
        ),
        table: ({ children }: { children: React.ReactNode }) => (
            <div className="my-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-border">{children}</table>
            </div>
        ),
        thead: ({ children }: { children: React.ReactNode }) => (
            <thead className="bg-muted">{children}</thead>
        ),
        tbody: ({ children }: { children: React.ReactNode }) => (
            <tbody className="divide-y divide-border">{children}</tbody>
        ),
        tr: ({ children }: { children: React.ReactNode }) => (
            <tr>{children}</tr>
        ),
        th: ({ children }: { children: React.ReactNode }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                {children}
            </th>
        ),
        td: ({ children }: { children: React.ReactNode }) => (
            <td className="px-4 py-2 text-sm text-foreground">{children}</td>
        ),
        hr: () => <hr className="my-4 border-border" />,
    };

    // Detect if content looks like Markdown (has common Markdown patterns)
    const looksLikeMarkdown = (text: string) => {
        const markdownPatterns = [
            /^#{1,6}\s/m,           // Headers
            /\*\*.*\*\*/,           // Bold
            /\*.*\*/,               // Italic
            /^\s*[-*+]\s/m,         // Unordered list
            /^\s*\d+\.\s/m,         // Ordered list
            /\[.*\]\(.*\)/,         // Links
            /`.*`/,                 // Inline code
            /```[\s\S]*```/,        // Code blocks
        ];
        return markdownPatterns.some(pattern => pattern.test(text));
    };

    const shouldRenderAsMarkdown = isMarkdown || looksLikeMarkdown(instructions);

    // Determine tooltip messages based on state
    const getAccordionTooltip = () => {
        if (isAccordionExpanded) {
            return 'Click to hide the assignment instructions';
        }
        return 'Click to view the assignment instructions';
    };

    const getAccordionText = () => {
        if (isAccordionExpanded) {
            return 'Click to collapse';
        }
        return 'Click to expand instructions';
    };

    // Handle accordion state change
    const handleAccordionChange = (value: string) => {
        setIsAccordionExpanded(value === 'instructions');
    };

    return (
        <TooltipProvider>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Instructions
                    </CardTitle>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={handleCopyToClipboard}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors duration-200"
                                aria-label="Copy instructions to clipboard"
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="h-4 w-4 text-success" />
                                        <span className='text-success'>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isCopied ? 'Instructions copied!' : 'Copy instructions to clipboard'}</p>
                        </TooltipContent>
                    </Tooltip>
                </CardHeader>
                <CardContent>
                    <Accordion
                        type="single"
                        collapsible
                        defaultValue={defaultExpanded ? 'instructions' : undefined}
                        onValueChange={handleAccordionChange}
                        className="w-full bg-secondary/20 p-2 rounded-lg"
                    >
                        <AccordionItem value="instructions" className="border-none">
                            <AccordionTrigger className="py-2 hover:no-underline hover:text-primary transition-colors group">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">
                                                {getAccordionText()}
                                            </span>

                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{getAccordionTooltip()}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 pb-2">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    {shouldRenderAsMarkdown ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={markdownComponents}
                                        >
                                            {instructions}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                            {instructions}
                                        </p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}