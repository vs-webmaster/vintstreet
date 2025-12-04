import { useEffect, useState } from 'react';
import { Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchAllWaitlistSignups, type WaitlistSignup } from '@/services/waitlist';
import { isFailure } from '@/types/api';

export const WaitlistTab = () => {
  const [signups, setSignups] = useState<WaitlistSignup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlistSignups();
  }, []);

  const fetchWaitlistSignups = async () => {
    try {
      const result = await fetchAllWaitlistSignups();

      if (isFailure(result)) {
        throw result.error;
      }

      setSignups(result.data);
    } catch (error) {
      console.error('Error fetching waitlist signups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Waitlist Signups
          </CardTitle>
          <CardDescription>
            {signups.length} {signups.length === 1 ? 'person has' : 'people have'} joined the waitlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signups.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No waitlist signups yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signups.map((signup) => (
                  <TableRow key={signup.id}>
                    <TableCell className="font-medium">{signup.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(signup.created_at), 'PPp')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
