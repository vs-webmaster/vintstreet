import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { fetchBlogPostBySlug } from '@/services/blog';
import { fetchProductsByIds } from '@/services/products';
import { isFailure } from '@/types/api';

const ProductRowSection = ({ products }: { products: string[] }) => {
  const { data: productsData = [] } = useQuery({
    queryKey: ['blog-products-display', products],
    enabled: products && products.length > 0,
    queryFn: async () => {
      const result = await fetchProductsByIds(products);
      if (isFailure(result)) throw result.error;
      return result.data.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        thumbnail: p.thumbnail,
        starting_price: p.starting_price,
        slug: p.slug,
      }));
    },
  });

  if (!productsData || productsData.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-xl font-bold">Featured Products</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {productsData.map((product: unknown) => (
          <Link key={product.id} to={`/product/${product.id}`} className="group">
            <div className="mb-2 aspect-square overflow-hidden rounded-lg">
              <img
                src={product.thumbnail}
                alt={product.product_name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <h4 className="mb-1 line-clamp-2 text-sm font-medium">{product.product_name}</h4>
            <p className="text-sm text-muted-foreground">£{product.starting_price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const { isSuperAdmin } = useAuth();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const result = await fetchBlogPostBySlug(slug!);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!slug,
  });

  const renderSection = (section: unknown) => {
    const { section_type, content } = section;

    switch (section_type) {
      case 'heading':
        const HeadingTag = content.level as keyof JSX.IntrinsicElements;
        return <HeadingTag className="mb-4 font-bold">{content.text}</HeadingTag>;

      case 'paragraph':
        return <p className="mb-4 leading-relaxed">{content.text}</p>;

      case 'image':
        return (
          <figure className="mb-6">
            <img src={content.url} alt={content.alt} className="w-full rounded-lg" />
            {content.caption && (
              <figcaption className="mt-2 text-sm text-muted-foreground">{content.caption}</figcaption>
            )}
          </figure>
        );

      case 'quote':
        return (
          <blockquote className="mb-6 border-l-4 border-primary pl-4 italic">
            <p className="mb-2">{content.text}</p>
            {content.author && <cite className="text-sm">— {content.author}</cite>}
          </blockquote>
        );

      case 'list':
        const ListTag = content.type === 'numbered' ? 'ol' : 'ul';
        return (
          <ListTag className="mb-6 ml-6 space-y-2">
            {content.items?.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ListTag>
        );

      case 'divider':
        return <hr className="my-8 border-t" />;

      case 'cta':
        return (
          <div className="mb-6 rounded-lg bg-accent p-6 text-center">
            <p className="mb-4">{content.text}</p>
            <Button asChild>
              <a href={content.buttonLink}>{content.buttonLabel}</a>
            </Button>
          </div>
        );

      case 'video':
        // Extract video ID from YouTube URL
        const getYouTubeId = (url: string) => {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url?.match(regExp);
          return match && match[2].length === 11 ? match[2] : null;
        };
        const videoId = getYouTubeId(content.url);
        return (
          <figure className="mb-6">
            <div className="aspect-video w-full">
              {videoId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
                  <p className="text-muted-foreground">Invalid video URL</p>
                </div>
              )}
            </div>
            {content.caption && (
              <figcaption className="mt-2 text-sm text-muted-foreground">{content.caption}</figcaption>
            )}
          </figure>
        );

      case 'author_note':
        return (
          <div className="mb-6 rounded-lg border-l-4 border-primary bg-accent/50 p-6">
            <p className="mb-2 font-semibold">Author's Note</p>
            <p className="text-sm">{content.text}</p>
          </div>
        );

      case 'newsletter':
        return (
          <div className="mb-6 rounded-lg border-2 border-primary/20 bg-primary/10 p-6 text-center">
            <h3 className="mb-2 text-xl font-bold">{content.title || 'Subscribe to our newsletter'}</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {content.description || 'Get the latest updates delivered to your inbox.'}
            </p>
            <div className="mx-auto flex max-w-md gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-md border bg-background px-4 py-2"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        );

      case 'product_row':
        return <ProductRowSection products={content.products} />;

      case 'text_image':
        return (
          <div
            className={`mb-6 flex flex-col items-center gap-6 md:flex-row ${
              content.imagePosition === 'right' ? 'md:flex-row-reverse' : ''
            }`}
          >
            <div className="flex-1">
              <p className="leading-relaxed">{content.text}</p>
            </div>
            {content.imageUrl && (
              <div className="flex-1">
                <img src={content.imageUrl} alt={content.imageAlt || ''} className="w-full rounded-lg" />
              </div>
            )}
          </div>
        );

      case 'hero_banner':
        return (
          <div className="relative mb-6 h-96 w-full overflow-hidden rounded-lg">
            {content.imageUrl && (
              <img
                src={content.imageUrl}
                alt={content.heading || 'Hero banner'}
                className="h-full w-full object-cover"
              />
            )}
            {(content.heading || content.subheading) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-6 text-white">
                {content.heading && (
                  <h2 className="mb-2 text-center text-4xl font-bold md:text-5xl">{content.heading}</h2>
                )}
                {content.subheading && <p className="text-center text-xl md:text-2xl">{content.subheading}</p>}
              </div>
            )}
          </div>
        );

      case 'cta_banner':
        return (
          <div
            className="mb-6 rounded-lg p-8 text-center"
            style={{ backgroundColor: content.backgroundColor || 'hsl(var(--accent))' }}
          >
            {content.text && <p className="mb-4 text-lg">{content.text}</p>}
            {content.buttonLabel && content.buttonLink && (
              <Button asChild>
                <a href={content.buttonLink}>{content.buttonLabel}</a>
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex-1 px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex-1 px-4 py-12">
          <div className="text-center">Post not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <article className="flex-1">
        {post.hero_banner && (
          <div className="relative h-96 w-full overflow-hidden">
            <img src={post.hero_banner} alt={post.title} className="h-full w-full object-cover" />
            <div className="absolute left-6 top-6">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              >
                <Link to="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blogs
                </Link>
              </Button>
            </div>
            {isSuperAdmin && (
              <div className="absolute right-6 top-6">
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <Link to={`/admin/blog/${post.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              {post.blog_categories && <Badge>{post.blog_categories.name}</Badge>}
              {post.reading_time && <span className="text-sm text-muted-foreground">{post.reading_time} min read</span>}
            </div>

            <h1 className="mb-4 text-4xl font-bold">{post.title}</h1>

            <div className="text-muted-foreground">
              By {post.author_name || 'Unknown'} • {format(new Date(post.publish_date), 'MMMM d, yyyy')}
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            {post.blog_post_sections
              ?.sort((a: unknown, b: unknown) => a.display_order - b.display_order)
              .map((section: unknown) => (
                <div key={section.id}>{renderSection(section)}</div>
              ))}
          </div>

          {post.author_bio && (
            <div className="mt-12 rounded-lg bg-accent p-6">
              <h3 className="mb-2 font-semibold">About the Author</h3>
              <p className="text-sm">{post.author_bio}</p>
            </div>
          )}
        </div>
      </article>
      <Footer />
    </div>
  );
}
