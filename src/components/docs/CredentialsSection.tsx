import { useState } from 'react';
import { Copy, CheckCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CredentialsSection = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card className="mb-8 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Project Credentials
          <a
            href="https://supabase.com/dashboard/project/quibvppxriibzfvhrhwv"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto"
          >
            <Button variant="ghost" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Supabase
            </Button>
          </a>
        </CardTitle>
        <CardDescription>
          Use these credentials to initialize the Supabase client in your React Native app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Supabase URL</label>
          <div className="flex gap-2">
            <code className="flex-1 break-all rounded bg-muted px-3 py-2 font-mono text-sm">{SUPABASE_URL}</code>
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(SUPABASE_URL, 'URL')}>
              {copiedField === 'URL' ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Anon Key (Public)</label>
          <div className="flex gap-2">
            <code className="flex-1 break-all rounded bg-muted px-3 py-2 font-mono text-sm">{SUPABASE_ANON_KEY}</code>
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(SUPABASE_ANON_KEY, 'Anon Key')}>
              {copiedField === 'Anon Key' ? (
                <CheckCheck className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <p className="mb-2 text-sm font-semibold">Initialize Supabase Client:</p>
          <pre className="overflow-x-auto rounded bg-background p-3 font-mono text-xs">
            {`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  '${SUPABASE_URL}',
  '${SUPABASE_ANON_KEY}'
);`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default CredentialsSection;
