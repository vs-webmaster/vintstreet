import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useQuery } from '@tanstack/react-query';
import { Trash2, MoveUp, MoveDown, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { searchProductsByName, fetchProductsByIds } from '@/services/products';
import { isFailure } from '@/types/api';
import { BlogImageUpload } from './BlogImageUpload';

const ProductRowEditor = ({ content, updateSection }: { content: any; updateSection: (content: any) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['products-search-section', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];

      const result = await searchProductsByName(debouncedSearch, {
        limit: 20,
        includeDetails: true,
      });

      if (isFailure(result)) throw result.error;

      return result.data.map((product) => ({
        id: product.id,
        product_name: product.product_name,
        thumbnail: product.thumbnail || null,
        starting_price: product.starting_price || 0,
      }));
    },
    enabled: debouncedSearch.length >= 2,
  });

  const { data: selectedProductsData = [] } = useQuery({
    queryKey: ['blog-section-products', content.products],
    enabled: content.products && content.products.length > 0,
    queryFn: async () => {
      if (!content.products || content.products.length === 0) return [];

      const result = await fetchProductsByIds(content.products);
      if (isFailure(result)) throw result.error;

      return result.data.map((product) => ({
        id: product.id,
        product_name: product.product_name,
        thumbnail: product.thumbnail,
        starting_price: product.starting_price,
      }));
    },
  });

  const addProduct = (productId: string) => {
    if (!content.products) {
      updateSection({ ...content, products: [productId] });
    } else if (content.products.length < 5 && !content.products.includes(productId)) {
      updateSection({ ...content, products: [...content.products, productId] });
    }
  };

  const removeProduct = (productId: string) => {
    updateSection({
      ...content,
      products: content.products ? content.products.filter((id: string) => id !== productId) : [],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Search Products (Max 5)</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-9"
            disabled={content.products && content.products.length >= 5}
          />
        </div>
        {content.products && content.products.length >= 5 && (
          <p className="mt-1 text-xs text-muted-foreground">Maximum of 5 products reached</p>
        )}
      </div>

      {searchQuery && searchQuery.length >= 2 && (!content.products || content.products.length < 5) && (
        <div className="max-h-48 overflow-y-auto rounded-lg border p-4">
          {isSearching ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>
          ) : searchResults.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No products found</p>
          ) : (
            <div className="space-y-2">
              {searchResults
                .filter((product) => !content.products || !content.products.includes(product.id))
                .map((product: any) => (
                  <div
                    key={product.id}
                    className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-accent"
                    onClick={() => addProduct(product.id)}
                  >
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.product_name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">£{product.starting_price}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {selectedProductsData.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Products ({selectedProductsData.length}/5)</Label>
          <div className="grid gap-2">
            {selectedProductsData.map((product: any) => (
              <div key={product.id} className="flex items-center gap-3 rounded-lg border p-2">
                {product.thumbnail && (
                  <img src={product.thumbnail} alt={product.product_name} className="h-10 w-10 rounded object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.product_name}</p>
                  <p className="text-xs text-muted-foreground">£{product.starting_price}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeProduct(product.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface BlogSectionEditorProps {
  sections: any[];
  onSectionsChange: (sections: any[]) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  sectionRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const QUILL_FORMATS = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

export const BlogSectionEditor = ({
  sections,
  onSectionsChange,
  onUploadStateChange,
  sectionRefs,
}: BlogSectionEditorProps) => {
  const addSection = (type: string) => {
    const newSection = {
      section_type: type,
      content: getDefaultContent(type),
      display_order: sections.length,
    };
    onSectionsChange([...sections, newSection]);
  };

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
      case 'gallery':
        return { images: [] };
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

  const updateSection = (index: number, content: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], content };
    onSectionsChange(updated);
  };

  const removeSection = (index: number) => {
    onSectionsChange(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onSectionsChange(updated);
  };

  const renderSectionEditor = (section: any, index: number) => {
    const { section_type, content } = section;

    switch (section_type) {
      case 'heading':
        return (
          <div className="space-y-3">
            <div>
              <Label>Heading Level</Label>
              <Select
                value={content.level}
                onValueChange={(value) => updateSection(index, { ...content, level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                  <SelectItem value="h4">H4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Text</Label>
              <Input
                value={content.text}
                onChange={(e) => updateSection(index, { ...content, text: e.target.value })}
                placeholder="Heading text"
              />
            </div>
          </div>
        );

      case 'paragraph':
        return (
          <div>
            <Label>Content</Label>
            <div className="mt-2">
              <ReactQuill
                theme="snow"
                value={content.text || ''}
                onChange={(value) => updateSection(index, { ...content, text: value })}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Write your paragraph content..."
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div>
              <Label>Image Dimensions</Label>
              <Select
                value={content.dimensions || '1x1'}
                onValueChange={(value) => updateSection(index, { ...content, dimensions: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="1x1">1:1 (Square)</SelectItem>
                  <SelectItem value="2x1">2:1 (Wide)</SelectItem>
                  <SelectItem value="3x1">3:1 (Ultra Wide)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <BlogImageUpload
              id={`section-image-${index}`}
              label="Image"
              value={content.url || ''}
              onChange={(url) => updateSection(index, { ...content, url })}
              onUploadStateChange={onUploadStateChange}
            />
            <div>
              <Label>Alt Text</Label>
              <Input
                value={content.alt}
                onChange={(e) => updateSection(index, { ...content, alt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            <div>
              <Label>Caption</Label>
              <Input
                value={content.caption}
                onChange={(e) => updateSection(index, { ...content, caption: e.target.value })}
                placeholder="Optional caption"
              />
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="space-y-3">
            <div>
              <Label>Quote Text</Label>
              <div className="mt-2">
                <ReactQuill
                  theme="snow"
                  value={content.text || ''}
                  onChange={(value) => updateSection(index, { ...content, text: value })}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  placeholder="Enter quote..."
                />
              </div>
            </div>
            <div>
              <Label>Author</Label>
              <Input
                value={content.author}
                onChange={(e) => updateSection(index, { ...content, author: e.target.value })}
                placeholder="Quote author"
              />
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-3">
            <div>
              <Label>List Type</Label>
              <Select value={content.type} onValueChange={(value) => updateSection(index, { ...content, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulleted">Bulleted</SelectItem>
                  <SelectItem value="numbered">Numbered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Items (one per line)</Label>
              <Textarea
                value={content.items?.join('\n') || ''}
                onChange={(e) =>
                  updateSection(index, {
                    ...content,
                    items: e.target.value.split('\n').filter((item) => item.trim()),
                  })
                }
                placeholder="List item 1&#10;List item 2&#10;List item 3"
                rows={4}
              />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-3">
            <div>
              <Label>Video URL or Embed Code</Label>
              <Input
                value={content.url}
                onChange={(e) => updateSection(index, { ...content, url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <Label>Caption</Label>
              <Input
                value={content.caption}
                onChange={(e) => updateSection(index, { ...content, caption: e.target.value })}
                placeholder="Optional caption"
              />
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-3">
            <div>
              <Label>CTA Text</Label>
              <div className="mt-2">
                <ReactQuill
                  theme="snow"
                  value={content.text || ''}
                  onChange={(value) => updateSection(index, { ...content, text: value })}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  placeholder="Call to action message..."
                />
              </div>
            </div>
            <div>
              <Label>Button Label</Label>
              <Input
                value={content.buttonLabel}
                onChange={(e) => updateSection(index, { ...content, buttonLabel: e.target.value })}
                placeholder="Shop Now"
              />
            </div>
            <div>
              <Label>Button Link</Label>
              <Input
                value={content.buttonLink}
                onChange={(e) => updateSection(index, { ...content, buttonLink: e.target.value })}
                placeholder="/shop"
              />
            </div>
          </div>
        );

      case 'author_note':
        return (
          <div>
            <Label>Author Note</Label>
            <div className="mt-2">
              <ReactQuill
                theme="snow"
                value={content.text || ''}
                onChange={(value) => updateSection(index, { ...content, text: value })}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Author's note or credits..."
              />
            </div>
          </div>
        );

      case 'newsletter':
        return (
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={content.title}
                onChange={(e) => updateSection(index, { ...content, title: e.target.value })}
                placeholder="Subscribe to our newsletter"
              />
            </div>
            <div>
              <Label>Description</Label>
              <div className="mt-2">
                <ReactQuill
                  theme="snow"
                  value={content.description || ''}
                  onChange={(value) => updateSection(index, { ...content, description: value })}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  placeholder="Get the latest updates..."
                />
              </div>
            </div>
          </div>
        );

      case 'divider':
        return <div className="text-sm text-muted-foreground">This will display as a visual divider</div>;

      case 'product_row':
        return <ProductRowEditor content={content} updateSection={(newContent) => updateSection(index, newContent)} />;

      case 'text_image':
        return (
          <div className="space-y-3">
            <div>
              <Label>Text Content</Label>
              <div className="mt-2">
                <ReactQuill
                  theme="snow"
                  value={content.text || ''}
                  onChange={(value) => updateSection(index, { ...content, text: value })}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  placeholder="Your text content here..."
                />
              </div>
            </div>
            <BlogImageUpload
              id={`text-image-${index}`}
              label="Image"
              value={content.imageUrl || ''}
              onChange={(url) => updateSection(index, { ...content, imageUrl: url })}
              onUploadStateChange={onUploadStateChange}
            />
            <div>
              <Label>Image Alt Text</Label>
              <Input
                value={content.imageAlt}
                onChange={(e) => updateSection(index, { ...content, imageAlt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            <div>
              <Label>Image Position</Label>
              <Select
                value={content.imagePosition}
                onValueChange={(value) => updateSection(index, { ...content, imagePosition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'hero_banner':
        return (
          <div className="space-y-3">
            <BlogImageUpload
              id={`hero-banner-${index}`}
              label="Hero Banner Image"
              value={content.imageUrl || ''}
              onChange={(url) => updateSection(index, { ...content, imageUrl: url })}
              onUploadStateChange={onUploadStateChange}
            />
            <div>
              <Label>Heading</Label>
              <Input
                value={content.heading}
                onChange={(e) => updateSection(index, { ...content, heading: e.target.value })}
                placeholder="Main heading"
              />
            </div>
            <div>
              <Label>Subheading</Label>
              <Input
                value={content.subheading}
                onChange={(e) => updateSection(index, { ...content, subheading: e.target.value })}
                placeholder="Optional subheading"
              />
            </div>
          </div>
        );

      case 'cta_banner':
        return (
          <div className="space-y-3">
            <div>
              <Label>CTA Text</Label>
              <div className="mt-2">
                <ReactQuill
                  theme="snow"
                  value={content.text || ''}
                  onChange={(value) => updateSection(index, { ...content, text: value })}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  placeholder="Call to action message..."
                />
              </div>
            </div>
            <div>
              <Label>Button Label</Label>
              <Input
                value={content.buttonLabel}
                onChange={(e) => updateSection(index, { ...content, buttonLabel: e.target.value })}
                placeholder="Shop Now"
              />
            </div>
            <div>
              <Label>Button Link</Label>
              <Input
                value={content.buttonLink}
                onChange={(e) => updateSection(index, { ...content, buttonLink: e.target.value })}
                placeholder="/shop"
              />
            </div>
            <div>
              <Label>Background Color (optional)</Label>
              <Input
                value={content.backgroundColor}
                onChange={(e) => updateSection(index, { ...content, backgroundColor: e.target.value })}
                placeholder="e.g., #f0f0f0 or leave empty for default"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No content blocks yet. Use the sidebar to add your first block.
          </CardContent>
        </Card>
      ) : (
        sections.map((section, index) => (
          <Card
            key={index}
            ref={(el) => {
              if (sectionRefs && sectionRefs.current) {
                sectionRefs.current[index] = el;
              }
            }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-medium capitalize">
                  Block {index + 1}: {section.section_type.replace('_', ' ')}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => moveSection(index, 'up')} disabled={index === 0}>
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === sections.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => removeSection(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>{renderSectionEditor(section, index)}</CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
