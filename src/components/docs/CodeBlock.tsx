interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock = ({ code, language = 'typescript' }: CodeBlockProps) => {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
        <code className="text-foreground">{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
