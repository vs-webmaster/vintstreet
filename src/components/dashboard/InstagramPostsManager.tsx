import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchInstagramPosts, replaceInstagramPosts } from '@/services/instagram';
import { isFailure } from '@/types/api';

interface InstagramPost {
  id: string;
  embed_code: string | null;
  display_order: number;
  is_active: boolean;
}

export const InstagramPostsManager = () => {
  const queryClient = useQueryClient();
  const [posts, setPosts] = useState<Partial<InstagramPost>[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['instagram-posts-admin'],
    queryFn: async () => {
      const result = await fetchInstagramPosts();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  useEffect(() => {
    if (data) {
      setPosts(data.length > 0 ? data : [createEmptyPost(0)]);
    }
  }, [data]);

  const createEmptyPost = (order: number): Partial<InstagramPost> => ({
    embed_code: '',
    display_order: order,
    is_active: true,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Prepare posts to insert
      const postsToInsert = posts
        .filter((post) => post.embed_code?.trim())
        .map((post, index) => ({
          embed_code: post.embed_code!,
          display_order: index,
          is_active: true,
        }));

      const result = await replaceInstagramPosts(postsToInsert);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-posts-admin'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-posts'] });
      toast.success('Instagram posts updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const addPost = () => {
    setPosts([...posts, createEmptyPost(posts.length)]);
  };

  const removePost = (index: number) => {
    if (posts.length <= 1) return;
    setPosts(posts.filter((_, i) => i !== index));
  };

  const updatePost = (index: number, embedCode: string) => {
    const newPosts = [...posts];
    newPosts[index] = { ...newPosts[index], embed_code: embedCode };
    setPosts(newPosts);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Instagram Posts</h3>
          <p className="text-sm text-muted-foreground">
            Manage Instagram posts displayed on the homepage. Paste the full embed code from Instagram. You can add
            unlimited posts.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Posts</Label>
          <Button onClick={addPost} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Post
          </Button>
        </div>

        <div className="space-y-4">
          {posts.map((post, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <Label htmlFor={`post-${index}`}>Instagram Post {index + 1}</Label>
                  <Textarea
                    id={`post-${index}`}
                    placeholder="Paste Instagram embed code here..."
                    value={post.embed_code || ''}
                    onChange={(e) => updatePost(index, e.target.value)}
                    className="mt-1 min-h-[150px] font-mono text-sm"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePost(index)}
                  disabled={posts.length <= 1}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
