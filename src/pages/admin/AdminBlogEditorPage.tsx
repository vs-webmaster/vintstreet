import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { BlogEditorLayout } from '@/components/blog/BlogEditorLayout';
import { BlogImageUpload } from '@/components/blog/BlogImageUpload';
import { BlogProductSelector } from '@/components/blog/BlogProductSelector';
import { BlogRelatedPostsSelector } from '@/components/blog/BlogRelatedPostsSelector';
import { BlogSectionEditor } from '@/components/blog/BlogSectionEditor';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { BlogTagSelector } from '@/components/blog/BlogTagSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchActiveBlogCategories,
  fetchBlogPostForEditor,
  createBlogPost,
  updateBlogPost,
  saveBlogPostSections,
  saveBlogPostTags,
  saveBlogPostProducts,
  saveBlogPostRelatedPosts,
  type CreateOrUpdateBlogPostInput,
} from '@/services/blog';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

export default function AdminBlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditMode = id !== 'new';

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    author_name: '',
    publish_date: new Date().toISOString().split('T')[0],
    featured_image: '',
    excerpt: '',
    category_id: '',
    seo_title: '',
    seo_description: '',
    reading_time: 0,
    hero_banner: '',
    cta_link: '',
    cta_label: '',
    visibility: 'draft',
    author_bio: '',
  });

  const [sections, setSections] = useState<unknown[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedRelatedPosts, setSelectedRelatedPosts] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track initial state for unsaved changes detection
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<unknown>(null);
  const [initialSections, setInitialSections] = useState<unknown[]>([]);
  const [initialTags, setInitialTags] = useState<string[]>([]);
  const [initialProducts, setInitialProducts] = useState<string[]>([]);
  const [initialRelatedPosts, setInitialRelatedPosts] = useState<string[]>([]);

  const { data: categories = [] } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const result = await fetchActiveBlogCategories();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: existingPost } = useQuery({
    queryKey: ['blog-post', id],
    enabled: isEditMode && !!id,
    queryFn: async () => {
      if (!id) return null;
      const result = await fetchBlogPostForEditor(id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  useEffect(() => {
    if (existingPost) {
      const formDataState = {
        title: existingPost.title,
        slug: existingPost.slug,
        author_name: existingPost.author_name || '',
        publish_date: existingPost.publish_date.split('T')[0],
        featured_image: existingPost.featured_image || '',
        excerpt: existingPost.excerpt || '',
        category_id: existingPost.category_id || '',
        seo_title: existingPost.seo_title || '',
        seo_description: existingPost.seo_description || '',
        reading_time: existingPost.reading_time || 0,
        hero_banner: existingPost.hero_banner || '',
        cta_link: existingPost.cta_link || '',
        cta_label: existingPost.cta_label || '',
        visibility: existingPost.visibility,
        author_bio: existingPost.author_bio || '',
      };
      const sectionsData =
        existingPost.blog_post_sections?.sort((a: unknown, b: unknown) => a.display_order - b.display_order) || [];
      const tagsData = existingPost.blog_post_tags?.map((t: unknown) => t.tag_id) || [];
      const productsData = existingPost.blog_post_products?.map((p: unknown) => p.product_id) || [];
      const relatedPostsData = existingPost.blog_post_related_posts?.map((r: unknown) => r.related_post_id) || [];

      setFormData(formDataState);
      setSections(sectionsData);
      setSelectedTags(tagsData);
      setSelectedProducts(productsData);
      setSelectedRelatedPosts(relatedPostsData);

      // Store initial state for change detection
      setInitialFormData(formDataState);
      setInitialSections(sectionsData);
      setInitialTags(tagsData);
      setInitialProducts(productsData);
      setInitialRelatedPosts(relatedPostsData);
    } else {
      // Set initial state for new posts
      setInitialFormData(formData);
      setInitialSections([]);
      setInitialTags([]);
      setInitialProducts([]);
      setInitialRelatedPosts([]);
    }
  }, [existingPost]);

  const addSection = (type: string) => {
    const getDefaultContent = (type: string) => {
      switch (type) {
        case 'heading':
          return { level: 'h2', text: '' };
        case 'paragraph':
          return { text: '' };
        case 'image':
          return { url: '', alt: '', caption: '', dimensions: '1x1' };
        case 'quote':
          return { text: '', author: '' };
        case 'list':
          return { type: 'bulleted', items: [''] };
        case 'video':
          return { url: '', caption: '' };
        case 'cta':
          return { text: '', buttonLabel: '', buttonLink: '' };
        case 'divider':
          return {};
        case 'author_note':
          return { text: '' };
        case 'newsletter':
          return { title: '', description: '' };
        case 'product_row':
          return { products: [] };
        case 'text_image':
          return { text: '', imageUrl: '', imageAlt: '', imagePosition: 'left' };
        case 'hero_banner':
          return { imageUrl: '', heading: '', subheading: '' };
        case 'cta_banner':
          return { text: '', buttonLabel: '', buttonLink: '', backgroundColor: '' };
        default:
          return {};
      }
    };

    const newSection = {
      section_type: type,
      content: getDefaultContent(type),
      display_order: sections.length,
    };
    setSections([...sections, newSection]);

    // Scroll to new section after a brief delay
    setTimeout(() => {
      const lastIndex = sections.length;
      sectionRefs.current[lastIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  };

  const navigateToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const hasUnsavedChanges = () => {
    if (!initialFormData) return false;

    const formDataChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    const sectionsChanged = JSON.stringify(sections) !== JSON.stringify(initialSections);
    const tagsChanged = JSON.stringify(selectedTags.sort()) !== JSON.stringify(initialTags.sort());
    const productsChanged = JSON.stringify(selectedProducts.sort()) !== JSON.stringify(initialProducts.sort());
    const relatedPostsChanged =
      JSON.stringify(selectedRelatedPosts.sort()) !== JSON.stringify(initialRelatedPosts.sort());

    return formDataChanged || sectionsChanged || tagsChanged || productsChanged || relatedPostsChanged;
  };

  const handleNavigateBack = () => {
    if (hasUnsavedChanges() && !saveMutation.isPending) {
      setPendingNavigation('/admin/blog');
      setShowUnsavedDialog(true);
    } else {
      navigate('/admin/blog');
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleSaveAndClose = async () => {
    setShowUnsavedDialog(false);
    saveMutation.mutate();
  };

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    formData,
    sections,
    selectedTags,
    selectedProducts,
    selectedRelatedPosts,
    initialFormData,
    initialSections,
    initialTags,
    initialProducts,
    initialRelatedPosts,
  ]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Post title is required');
      }
      if (!formData.slug.trim()) {
        throw new Error('Post slug is required');
      }

      // Convert empty strings to null for UUID fields
      const postData = {
        ...formData,
        author_id: user?.id,
        created_by: user?.id,
        category_id: formData.category_id || null,
        featured_image: formData.featured_image || null,
        hero_banner: formData.hero_banner || null,
        visibility: formData.visibility as 'draft' | 'scheduled' | 'published',
      };

      let postId = id;

      // Create or update blog post
      if (isEditMode && id) {
        const result = await updateBlogPost(id, postData as Partial<CreateOrUpdateBlogPostInput>);
        if (isFailure(result)) throw result.error;
      } else {
        const result = await createBlogPost(postData as CreateOrUpdateBlogPostInput);
        if (isFailure(result)) throw result.error;
        postId = result.data.id;
      }

      // Save sections, tags, products, and related posts
      const [sectionsResult, tagsResult, productsResult, relatedPostsResult] = await Promise.all([
        saveBlogPostSections(
          postId,
          sections.map((s) => ({ section_type: s.section_type, content: s.content, display_order: s.display_order })),
        ),
        saveBlogPostTags(postId, selectedTags),
        saveBlogPostProducts(postId, selectedProducts),
        saveBlogPostRelatedPosts(postId, selectedRelatedPosts),
      ]);

      if (isFailure(sectionsResult)) throw sectionsResult.error;
      if (isFailure(tagsResult)) throw tagsResult.error;
      if (isFailure(productsResult)) throw productsResult.error;
      if (isFailure(relatedPostsResult)) throw relatedPostsResult.error;

      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post', postId] });
      toast.success(isEditMode ? 'Post updated successfully' : 'Post created successfully');
      navigate('/admin/blog');
    },
    onError: (error) => {
      toast.error('Failed to save post: ' + error.message);
    },
  });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleNavigateBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{isEditMode ? 'Edit Post' : 'New Post'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={formData.visibility}
              onValueChange={(value) => setFormData({ ...formData, visibility: value })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isUploadingImages}>
              <Save className="mr-2 h-4 w-4" />
              {isUploadingImages ? 'Uploading images...' : saveMutation.isPending ? 'Saving...' : 'Save Post'}
            </Button>
          </div>
        </div>

        <BlogEditorLayout
          sidebar={
            <BlogSidebar sections={sections} onAddSection={addSection} onNavigateToSection={navigateToSection} />
          }
        >
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Post Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({
                        ...formData,
                        title,
                        slug: generateSlug(title),
                      });
                    }}
                    placeholder="Enter post title"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="post-url-slug"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="author_name">Author Name</Label>
                    <Input
                      id="author_name"
                      value={formData.author_name}
                      onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="publish_date">Publish Date</Label>
                    <Input
                      id="publish_date"
                      type="date"
                      value={formData.publish_date}
                      onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                    />
                  </div>
                </div>

                <BlogImageUpload
                  id="featured_image"
                  label="Featured Image"
                  value={formData.featured_image}
                  onChange={(url) => setFormData({ ...formData, featured_image: url })}
                  onUploadStateChange={setIsUploadingImages}
                />

                <div>
                  <Label htmlFor="excerpt">Excerpt / Summary</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Short 1-2 sentence teaser"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat: unknown) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reading_time">Reading Time (minutes)</Label>
                    <Input
                      id="reading_time"
                      type="number"
                      value={formData.reading_time}
                      onChange={(e) => setFormData({ ...formData, reading_time: parseInt(e.target.value) || 0 })}
                      placeholder="5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    placeholder="Custom SEO title"
                  />
                </div>

                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description}
                    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                    placeholder="Meta description for search engines"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <BlogTagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />

            <BlogSectionEditor
              sections={sections}
              onSectionsChange={setSections}
              onUploadStateChange={setIsUploadingImages}
              sectionRefs={sectionRefs}
            />

            <BlogProductSelector selectedProducts={selectedProducts} onProductsChange={setSelectedProducts} />

            <BlogRelatedPostsSelector
              currentPostId={id}
              selectedPosts={selectedRelatedPosts}
              onPostsChange={setSelectedRelatedPosts}
            />

            <Card>
              <CardHeader>
                <CardTitle>Author Bio</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.author_bio}
                  onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })}
                  placeholder="Optional author biography to display at the end of the post"
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        </BlogEditorLayout>
      </div>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Close Without Saving
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndClose}>Save and Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
