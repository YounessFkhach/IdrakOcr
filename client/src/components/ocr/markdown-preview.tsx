import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nord } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const renderers = useMemo(() => ({
    // Code blocks
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={nord}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    // Tables
    table({ node, ...props }: any) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-muted" {...props} />
        </div>
      );
    },
    thead({ node, ...props }: any) {
      return <thead className="bg-muted/30" {...props} />;
    },
    tr({ node, ...props }: any) {
      return <tr className="border-b border-muted" {...props} />;
    },
    th({ node, ...props }: any) {
      return <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" {...props} />;
    },
    td({ node, ...props }: any) {
      return <td className="px-4 py-2 whitespace-nowrap text-sm" {...props} />;
    },
    // Lists
    ul({ node, ...props }: any) {
      return <ul className="list-disc pl-6 space-y-1" {...props} />;
    },
    ol({ node, ...props }: any) {
      return <ol className="list-decimal pl-6 space-y-1" {...props} />;
    },
    // Headings
    h1({ node, ...props }: any) {
      return <h1 className="text-2xl font-bold mt-6 mb-2" {...props} />;
    },
    h2({ node, ...props }: any) {
      return <h2 className="text-xl font-bold mt-5 mb-2" {...props} />;
    },
    h3({ node, ...props }: any) {
      return <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />;
    },
    // Paragraph
    p({ node, ...props }: any) {
      return <p className="mb-4" {...props} />;
    },
    // Blockquote
    blockquote({ node, ...props }: any) {
      return <blockquote className="border-l-4 border-muted pl-4 italic" {...props} />;
    },
    // Horizontal rule
    hr({ node, ...props }: any) {
      return <hr className="my-4 border-muted" {...props} />;
    },
  }), []);

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} 
      components={renderers as any}
      className="prose prose-invert max-w-none"
    >
      {content}
    </ReactMarkdown>
  );
}
