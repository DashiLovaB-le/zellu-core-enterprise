import ReactMarkdown from "react-markdown";

/**
 * Renderização leve de markdown nas respostas da IA do chat.
 * Suporta negrito, itálico, listas e quebras de linha — sem visual exagerado.
 */
export function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--clay-title)]">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-[var(--clay-title)]/90">{children}</em>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-[var(--clay-cta)]"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-black/5 px-1 py-0.5 text-[0.9em]">{children}</code>
        ),
        h1: ({ children }) => (
          <p className="mb-1.5 font-semibold text-[var(--clay-title)]">{children}</p>
        ),
        h2: ({ children }) => (
          <p className="mb-1.5 font-semibold text-[var(--clay-title)]">{children}</p>
        ),
        h3: ({ children }) => (
          <p className="mb-1 font-semibold text-[var(--clay-title)]">{children}</p>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-[var(--clay-cta)]/40 pl-2.5 text-[var(--clay-title)]/80 last:mb-0">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-2 border-[var(--clay-title)]/10" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
