import { useState } from 'react';
import { Copy, CheckCheck, ExternalLink, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CodeBlock from './CodeBlock';

interface ApiEndpointCardProps {
  endpoint: {
    method: string;
    name: string;
    table: string;
    description: string;
    authRequired: boolean;
    rlsPolicy?: string;
    code: string;
    response: string;
  };
}

const ApiEndpointCard = ({ endpoint }: ApiEndpointCardProps) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(endpoint.code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'POST':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'PUT':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'REALTIME':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
              <code className="font-mono text-sm text-muted-foreground">{endpoint.table}</code>
            </div>
            <CardTitle className="text-xl">{endpoint.name}</CardTitle>
            <CardDescription className="mt-1">{endpoint.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {endpoint.authRequired ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Auth Required
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Unlock className="h-3 w-3" />
                Public
              </Badge>
            )}
          </div>
        </div>
        {endpoint.rlsPolicy && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-semibold">RLS Policy:</span>
            <span>{endpoint.rlsPolicy}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Request Code</span>
            <Button variant="ghost" size="sm" onClick={copyCode}>
              {copied ? (
                <>
                  <CheckCheck className="mr-2 h-4 w-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <CodeBlock code={endpoint.code} language="typescript" />
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold">Response</span>
          <CodeBlock code={endpoint.response} language="json" />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="text-xs">
            <a
              href="https://supabase.com/dashboard/project/quibvppxriibzfvhrhwv/editor"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              View in Supabase
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiEndpointCard;
