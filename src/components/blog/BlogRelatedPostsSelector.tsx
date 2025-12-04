import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { searchBlogPosts, fetchBlogPostsByIds } from '@/services/blog';
import { isFailure } from '@/types/api';

interface BlogRelatedPostsSelectorProps {
  currentPostId?: string;
  selectedPosts: string[];
  onPostsChange: (posts: string[]) => void;
}

export const BlogRelatedPostsSelector = ({
  currentPostId,
  selectedPosts,
  onPostsChange,
}: BlogRelatedPostsSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: availablePosts = [] } = useQuery({
    queryKey: ['blog-posts-search', searchQuery, currentPostId],
    queryFn: async () => {
      const result = await searchBlogPosts({
        excludePostId: currentPostId,
        searchQuery: searchQuery || undefined,
        limit: 10,
      });

      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
  });

  const { data: selected = [] } = useQuery({
    queryKey: ['blog-selected-posts', selectedPosts],
    enabled: selectedPosts.length > 0,
    queryFn: async () => {
      const result = await fetchBlogPostsByIds(selectedPosts);

      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
  });

  const addPost = (postId: string) => {
    if (!selectedPosts.includes(postId)) {
      onPostsChange([...selectedPosts, postId]);
    }
  };

  const removePost = (postId: string) => {
    onPostsChange(selectedPosts.filter((id) => id !== postId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Posts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="pl-9"
            />
          </div>
        </div>

        {availablePosts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Available Posts:</p>
            <div className="grid max-h-48 gap-2 overflow-y-auto">
              {availablePosts
                .filter((post) => !selectedPosts.includes(post.id))
                .map((post: any) => (
                  <div
                    key={post.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent"
                    onClick={() => addPost(post.id)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{post.title}</p>
                    </div>
                    <Badge variant={post.visibility === 'published' ? 'default' : 'secondary'}>{post.visibility}</Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {selected.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected Posts:</p>
            <div className="grid gap-2">
              {selected.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{post.title}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removePost(post.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
