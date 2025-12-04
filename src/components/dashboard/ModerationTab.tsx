import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHiveModeration } from '@/hooks/useHiveModeration';

export const ModerationTab = () => {
  const [testText, setTestText] = useState('');
  const [testImageUrl, setTestImageUrl] = useState('');
  const { moderateText, moderateImage, isChecking } = useHiveModeration();
  const [testResult, setTestResult] = useState<any>(null);

  const handleTestText = async () => {
    if (!testText.trim()) {
      toast.error('Please enter some text to test');
      return;
    }

    const result = await moderateText(testText);
    setTestResult(result);

    if (!result.isApproved) {
      toast.error(result.message || 'Content rejected');
    } else if (result.requiresReview) {
      toast.warning(result.message || 'Content flagged for review');
    } else {
      toast.success('Content approved');
    }
  };

  const handleTestImage = async () => {
    if (!testImageUrl.trim()) {
      toast.error('Please enter an image URL to test');
      return;
    }

    const result = await moderateImage(testImageUrl);
    setTestResult(result);

    if (!result.isApproved) {
      toast.error(result.message || 'Image rejected');
    } else if (result.requiresReview) {
      toast.warning(result.message || 'Image flagged for review');
    } else {
      toast.success('Image approved');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">HIVE Content Moderation</h2>
          <p className="text-muted-foreground">AI-powered content moderation for images and text across the platform</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Test Moderation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Test HIVE Moderation</DialogTitle>
              <DialogDescription>Test text or image moderation using the HIVE API</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Test Text</Label>
                <Input
                  placeholder="Enter text to moderate..."
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                />
                <Button onClick={handleTestText} disabled={isChecking} className="w-full">
                  {isChecking ? 'Checking...' : 'Test Text Moderation'}
                </Button>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Test Image URL</Label>
                <Input
                  placeholder="Enter image URL to moderate..."
                  value={testImageUrl}
                  onChange={(e) => setTestImageUrl(e.target.value)}
                />
                <Button onClick={handleTestImage} disabled={isChecking} className="w-full" variant="secondary">
                  {isChecking ? 'Checking...' : 'Test Image Moderation'}
                </Button>
              </div>

              {testResult && (
                <div className="border-t pt-4">
                  <h4 className="mb-2 font-semibold">Result:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {testResult.isApproved ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Rejected
                        </Badge>
                      )}
                      {testResult.requiresReview && (
                        <Badge variant="secondary">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Requires Review
                        </Badge>
                      )}
                    </div>
                    {testResult.message && <p className="text-sm text-muted-foreground">{testResult.message}</p>}
                    {testResult.categories && testResult.categories.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1 text-sm font-medium">Flagged Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {testResult.categories.map((cat: unknown, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cat.class}: {(cat.score * 100).toFixed(1)}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="mr-1 h-3 w-3" />
              Active
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">HIVE moderation is active and protecting your platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Protected Content</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Product images</li>
              <li>✓ Product names</li>
              <li>✓ Product descriptions</li>
              <li>✓ Message streams</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detection Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• NSFW content</li>
              <li>• Violence & gore</li>
              <li>• Hate symbols</li>
              <li>• Weapons</li>
              <li>• Self-harm</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>HIVE AI automatically scans all content uploaded to your platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Product Submissions</h4>
            <p className="text-sm text-muted-foreground">
              When sellers upload products, all images are automatically scanned. Product names and descriptions are
              checked before publishing. Content that violates guidelines is automatically rejected.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Message Streams</h4>
            <p className="text-sm text-muted-foreground">
              Live chat messages can be moderated in real-time to keep your community safe. Messages containing
              inappropriate content can be flagged or blocked automatically.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Thresholds</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Reject Threshold: 90%</p>
                <p className="text-muted-foreground">
                  Content with confidence scores above this is automatically rejected
                </p>
              </div>
              <div>
                <p className="font-medium">Review Threshold: 70%</p>
                <p className="text-muted-foreground">Content between 70-90% is flagged for manual review</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
