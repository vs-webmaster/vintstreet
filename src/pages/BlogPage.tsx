import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MegaMenuNav } from '@/components/MegaMenuNav';
import { Badge } from '@/components/ui/badge';
import { fetchActiveBlogCategories, fetchPublishedBlogPosts } from '@/services/blog';
import type { BlogCategory } from '@/services/blog/blogCategoryService';
import type { BlogPostWithCategory } from '@/services/blog/blogPostService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isFailure } from '@/types/api';
import wordOnStreetTitle from '@/assets/word-on-street-title.webp';

export default function BlogPage() {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');

  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const result = await fetchActiveBlogCategories();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: posts = [], isLoading } = useQuery<BlogPostWithCategory[]>({
    queryKey: ['blog-posts', categorySlug],
    queryFn: async () => {
      const result = await fetchPublishedBlogPosts(categorySlug || undefined);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: true,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Main Category Navigation */}
      <MegaMenuNav />

      <main className="container mx-auto flex-1 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          {/* Hero Section - 2 Column Layout */}
          <div className="mb-12">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
              {/* Left Column - Image (33%) */}
              <div className="md:col-span-1">
                <img src={wordOnStreetTitle} alt="Word on the Street" className="h-auto w-full rounded-lg" />
              </div>

              {/* Right Column - Category Filters (66%) */}
              <div className="md:col-span-2">
                <p className="mb-6 text-xl text-muted-foreground">Stories worth wearing.</p>

                {/* Blog Category Filters */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Link to="/blog">
                      <Badge
                        variant={!categorySlug ? 'default' : 'outline'}
                        className="cursor-pointer px-4 py-2 transition-colors hover:bg-primary/80"
                      >
                        All Posts
                      </Badge>
                    </Link>
                    {categories.map((category) => (
                      <Link key={category.id} to={`/blog?category=${category.slug}`}>
                        <Badge
                          variant={categorySlug === category.slug ? 'default' : 'outline'}
                          className="cursor-pointer px-4 py-2 transition-colors hover:bg-primary/80"
                        >
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">Loading...</div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No blog posts yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
                    {post.featured_image && (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="h-48 w-full rounded-t-lg object-cover"
                      />
                    )}
                    <CardHeader className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {post.blog_categories && <Badge>{post.blog_categories.name}</Badge>}
                        {post.reading_time != null && post.reading_time > 0 && (
                          <span className="text-sm text-muted-foreground">{post.reading_time} min read</span>
                        )}
                      </div>
                      <CardTitle className="line-clamp-2 text-2xl">{post.title}</CardTitle>
                      {post.excerpt && <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>}
                      <div className="mt-2 text-sm text-muted-foreground">
                        By {post.author_name || 'Unknown'} • {format(new Date(post.publish_date), 'MMM d, yyyy')}
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
