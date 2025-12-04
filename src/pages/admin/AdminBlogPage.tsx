import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, Tags, FolderTree } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteBlogPost, fetchAllBlogPostsForAdmin } from '@/services/blog';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

export default function AdminBlogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const result = await fetchAllBlogPostsForAdmin();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const result = await deleteBlogPost(postId);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Blog post deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete blog post: ' + error.message);
    },
  });

  const getVisibilityBadge = (visibility: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      scheduled: 'outline',
    };

    return <Badge variant={variants[visibility] || 'secondary'}>{visibility}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Blog Posts</h1>
            <p className="mt-1 text-muted-foreground">Manage your blog content</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/blog/categories')}>
              <FolderTree className="mr-2 h-4 w-4" />
              Categories
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/blog/tags')}>
              <Tags className="mr-2 h-4 w-4" />
              Tags
            </Button>
            <Button onClick={() => navigate('/admin/blog/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No blog posts yet. Create your first post!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post: any) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <CardTitle className="text-xl">{post.title}</CardTitle>
                        {getVisibilityBadge(post.visibility)}
                      </div>
                      <CardDescription>{post.excerpt}</CardDescription>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>By {post.author_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{format(new Date(post.publish_date), 'MMM d, yyyy')}</span>
                        {post.blog_categories && (
                          <>
                            <span>•</span>
                            <span>{post.blog_categories.name}</span>
                          </>
                        )}
                        {post.reading_time && (
                          <>
                            <span>•</span>
                            <span>{post.reading_time} min read</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {post.visibility === 'published' && (
                        <Button variant="outline" size="icon" onClick={() => navigate(`/blog/${post.slug}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="icon" onClick={() => navigate(`/admin/blog/${post.id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this post?')) {
                            deleteMutation.mutate(post.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
