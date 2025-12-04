import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2, Eye, Upload, Copy } from 'lucide-react';
import { ContentEditorLayout } from '@/components/content-pages/ContentEditorLayout';
import { ContentEditorSidebar } from '@/components/content-pages/ContentEditorSidebar';
import { ProductSelector } from '@/components/content-pages/ProductSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { fetchContentPage, updateContentPage, savePageSections, uploadContentImage } from '@/services/contentPages';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

interface Section {
  id?: string;
  section_type: string;
  content: unknown;
  display_order: number;
}

const SECTION_TEMPLATES = [
  { value: 'hero', label: 'Hero Section', description: 'Large banner with image and text' },
  { value: 'text_block', label: 'Text Block', description: 'Rich text content' },
  { value: 'image_text', label: 'Image + Text', description: 'Side-by-side layout' },
  { value: 'cta', label: 'Call to Action', description: 'Button with headline' },
  { value: 'faq', label: 'FAQ Section', description: 'Question and answer pairs' },
  { value: 'cards', label: 'Cards Section', description: 'Row of cards with title and text' },
];

export default function AdminContentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<Section[]>([]);
  const [pageData, setPageData] = useState({
    title: '',
    slug: '',
    meta_description: '',
    is_published: false,
    page_type: 'content' as 'content' | 'product',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { isLoading } = useQuery({
    queryKey: ['content-page', id],
    queryFn: async () => {
      if (!id) throw new Error('Page ID is required');
      const result = await fetchContentPage(id);
      if (isFailure(result)) throw result.error;

      const { page, sections } = result.data;

      setPageData({
        title: page.title,
        slug: page.slug,
        meta_description: page.meta_description || '',
        is_published: page.is_published,
        page_type: (page.page_type || 'content') as 'content' | 'product',
      });
      setSections(sections);

      return { page, sections };
    },
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Page ID is required');

      // Update page
      const updateResult = await updateContentPage(id, {
        title: pageData.title,
        slug: pageData.slug,
        meta_description: pageData.meta_description || null,
        is_published: pageData.is_published,
      });

      if (isFailure(updateResult)) throw updateResult.error;

      // Save sections
      const sectionsResult = await savePageSections(
        id,
        sections.map((section) => ({
          section_type: section.section_type,
          content: section.content,
          display_order: section.display_order,
        })),
      );

      if (isFailure(sectionsResult)) throw sectionsResult.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-page', id] });
      queryClient.invalidateQueries({ queryKey: ['content-pages'] });
      toast({
        title: 'Saved',
        description: 'Page saved successfully',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addSection = (type: string) => {
    const newSection: Section = {
      section_type: type,
      content: getDefaultContent(type),
      display_order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (index: number, content: unknown) => {
    const updated = [...sections];
    updated[index].content = content;
    setSections(updated);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSections(updated);
  };

  const navigateToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const uploadImage = async (file: File, sectionIndex: number, field: string) => {
    setUploadingImage(`${sectionIndex}-${field}`);
    try {
      const result = await uploadContentImage(file, 'content');
      if (isFailure(result)) throw result.error;

      const updated = [...sections];
      updated[sectionIndex].content[field] = result.data;
      setSections(updated);

      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingImage(null);
    }
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'hero':
        return { title: '', subtitle: '', image: '', cta_text: '', cta_link: '', fade_image: true };
      case 'text_block':
        return { title: '', content: '' };
      case 'image_text':
        return { title: '', content: '', image: '', image_position: 'left' };
      case 'cta':
        return { title: '', subtitle: '', button_text: '', button_link: '' };
      case 'faq':
        return { title: '', items: [{ question: '', answer: '' }] };
      case 'cards':
        return {
          title: '',
          cards: [
            { title: '', text: '', image: '' },
            { title: '', text: '', image: '' },
            { title: '', text: '', image: '' },
          ],
        };
      default:
        return {};
    }
  };

  const renderPreview = () => {
    return (
      <div className="space-y-8">
        {sections.map((section, index) => {
          const content = section.content;

          switch (section.section_type) {
            case 'hero':
              return (
                <div key={index} className="relative flex h-[500px] items-center justify-center bg-muted text-center">
                  {content.image && (
                    <img
                      src={content.image}
                      alt=""
                      className={`absolute inset-0 h-full w-full object-cover ${
                        content.fade_image ? 'opacity-20' : ''
                      }`}
                    />
                  )}
                  <div className="relative z-10 max-w-4xl px-4 text-primary-foreground">
                    <h1 className="mb-4 text-5xl font-bold">{content.title || 'Hero Title'}</h1>
                    <p className="mb-8 text-xl">{content.subtitle || 'Hero subtitle'}</p>
                    {content.cta_text && <Button size="lg">{content.cta_text}</Button>}
                  </div>
                </div>
              );

            case 'text_block':
              return (
                <div key={index} className="mx-auto max-w-4xl px-4 py-8">
                  <h2 className="mb-4 text-3xl font-bold">{content.title || 'Section Title'}</h2>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {content.content || 'Content goes here...'}
                  </p>
                </div>
              );

            case 'image_text':
              return (
                <div
                  key={index}
                  className={`mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 md:grid-cols-2 ${
                    content.image_position === 'right' ? 'md:grid-flow-dense' : ''
                  }`}
                >
                  <div className={content.image_position === 'right' ? 'md:col-start-2' : ''}>
                    <h2 className="mb-4 text-3xl font-bold">{content.title || 'Section Title'}</h2>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {content.content || 'Content goes here...'}
                    </p>
                  </div>
                  {content.image && <img src={content.image} alt="" className="h-64 w-full rounded-lg object-cover" />}
                </div>
              );

            case 'cta':
              return (
                <div key={index} className="bg-primary py-16 text-center text-primary-foreground">
                  <div className="mx-auto max-w-4xl px-4">
                    <h2 className="mb-4 text-4xl font-bold">{content.title || 'Call to Action'}</h2>
                    <p className="mb-8 text-xl">{content.subtitle || 'Subtitle here'}</p>
                    {content.button_text && (
                      <Button variant="secondary" size="lg">
                        {content.button_text}
                      </Button>
                    )}
                  </div>
                </div>
              );

            case 'faq':
              return (
                <div key={index} className="mx-auto max-w-4xl px-4 py-8">
                  <h2 className="mb-8 text-3xl font-bold">{content.title || 'FAQ'}</h2>
                  <div className="space-y-4">
                    {content.items?.map((item: unknown, i: number) => (
                      <div key={i} className="rounded-lg border p-4">
                        <h3 className="mb-2 font-semibold">{item.question || 'Question?'}</h3>
                        <p className="text-muted-foreground">{item.answer || 'Answer...'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 'cards':
              return (
                <div key={index} className="mx-auto max-w-7xl px-4 py-8">
                  {content.title && <h2 className="mb-8 text-center text-3xl font-bold">{content.title}</h2>}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {content.cards?.map((card: unknown, i: number) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <h3 className="mb-3 text-xl font-semibold">{card.title || 'Card Title'}</h3>
                          <p className="text-muted-foreground">{card.text || 'Card text goes here...'}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    );
  };

  const renderImageUpload = (index: number, field: string, currentValue: string) => {
    const isUploading = uploadingImage === `${index}-${field}`;

    return (
      <div className="space-y-2">
        <Label>Image</Label>
        {currentValue && (
          <div className="relative h-48 w-full overflow-hidden rounded-lg border">
            <img src={currentValue} alt="Preview" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Or paste image URL"
              value={currentValue || ''}
              onChange={(e) => updateSection(index, { ...sections[index].content, [field]: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              id={`upload-${index}-${field}`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file, index, field);
              }}
              disabled={isUploading}
            />
            <Button variant="outline" size="icon" asChild disabled={isUploading}>
              <label htmlFor={`upload-${index}-${field}`} className="cursor-pointer">
                <Upload className="h-4 w-4" />
              </label>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionEditor = (section: Section, index: number) => {
    const content = section.content;

    return (
      <Card key={index} ref={(el) => (sectionRefs.current[index] = el)} className="mb-4 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/30 pb-4">
          <CardTitle className="text-lg font-semibold">
            {SECTION_TEMPLATES.find((t) => t.value === section.section_type)?.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => moveSection(index, 'up')} disabled={index === 0}>
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => moveSection(index, 'down')}
              disabled={index === sections.length - 1}
            >
              ↓
            </Button>
            <Button variant="ghost" size="sm" onClick={() => removeSection(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {section.section_type === 'hero' && (
            <div className="space-y-4 rounded-lg bg-muted/20 p-4">
              <div>
                <Label className="text-base">Title</Label>
                <Input
                  className="text-lg font-semibold"
                  placeholder="Enter hero title"
                  value={content.title || ''}
                  onChange={(e) => updateSection(index, { ...content, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  placeholder="Enter subtitle"
                  value={content.subtitle || ''}
                  onChange={(e) => updateSection(index, { ...content, subtitle: e.target.value })}
                />
              </div>
              {renderImageUpload(index, 'image', content.image)}
              <div className="flex items-center gap-2 py-2">
                <Switch
                  id={`fade-image-${index}`}
                  checked={content.fade_image !== false}
                  onCheckedChange={(checked) => updateSection(index, { ...content, fade_image: checked })}
                />
                <Label htmlFor={`fade-image-${index}`} className="cursor-pointer">
                  Fade image (add transparency overlay)
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CTA Button Text</Label>
                  <Input
                    placeholder="e.g., Get Started"
                    value={content.cta_text || ''}
                    onChange={(e) => updateSection(index, { ...content, cta_text: e.target.value })}
                  />
                </div>
                <div>
                  <Label>CTA Button Link</Label>
                  <Input
                    placeholder="e.g., /shop"
                    value={content.cta_link || ''}
                    onChange={(e) => updateSection(index, { ...content, cta_link: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {section.section_type === 'text_block' && (
            <div className="space-y-4 rounded-lg bg-muted/20 p-4">
              <div>
                <Label className="text-base">Title</Label>
                <Input
                  className="text-xl font-bold"
                  placeholder="Section title"
                  value={content.title || ''}
                  onChange={(e) => updateSection(index, { ...content, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Content</Label>
                <ReactQuill
                  theme="snow"
                  value={content.content || ''}
                  onChange={(value) => updateSection(index, { ...content, content: value })}
                  className="rounded-md bg-background"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link'],
                      ['clean'],
                    ],
                  }}
                />
              </div>
            </div>
          )}

          {section.section_type === 'image_text' && (
            <div className="space-y-4 rounded-lg bg-muted/20 p-4">
              <div>
                <Label className="text-base">Title</Label>
                <Input
                  className="text-xl font-bold"
                  placeholder="Section title"
                  value={content.title || ''}
                  onChange={(e) => updateSection(index, { ...content, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Content</Label>
                <ReactQuill
                  theme="snow"
                  value={content.content || ''}
                  onChange={(value) => updateSection(index, { ...content, content: value })}
                  className="rounded-md bg-background"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link'],
                      ['clean'],
                    ],
                  }}
                />
              </div>
              {renderImageUpload(index, 'image', content.image)}
              <div>
                <Label>Image Position</Label>
                <Select
                  value={content.image_position || 'left'}
                  onValueChange={(value) => updateSection(index, { ...content, image_position: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left of Text</SelectItem>
                    <SelectItem value="right">Right of Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {section.section_type === 'cta' && (
            <div className="space-y-4 rounded-lg border-2 border-primary/20 bg-primary/10 p-4">
              <div>
                <Label className="text-base">Main Headline</Label>
                <Input
                  className="text-xl font-bold"
                  placeholder="Call to action headline"
                  value={content.title || ''}
                  onChange={(e) => updateSection(index, { ...content, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Supporting Text</Label>
                <Input
                  placeholder="Additional details"
                  value={content.subtitle || ''}
                  onChange={(e) => updateSection(index, { ...content, subtitle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Button Text</Label>
                  <Input
                    placeholder="e.g., Sign Up Now"
                    value={content.button_text || ''}
                    onChange={(e) => updateSection(index, { ...content, button_text: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Button Link</Label>
                  <Input
                    placeholder="e.g., /signup"
                    value={content.button_link || ''}
                    onChange={(e) => updateSection(index, { ...content, button_link: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {section.section_type === 'faq' && (
            <div className="space-y-4 rounded-lg bg-muted/20 p-4">
              <div>
                <Label className="text-base">Section Title</Label>
                <Input
                  className="text-xl font-bold"
                  placeholder="Frequently Asked Questions"
                  value={content.title || ''}
                  onChange={(e) => updateSection(index, { ...content, title: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                {content.items?.map((item: unknown, itemIndex: number) => (
                  <Card key={itemIndex} className="bg-background p-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold">Question {itemIndex + 1}</Label>
                        <Input
                          placeholder="Enter question"
                          className="mt-1"
                          value={item.question || ''}
                          onChange={(e) => {
                            const newItems = [...content.items];
                            newItems[itemIndex].question = e.target.value;
                            updateSection(index, { ...content, items: newItems });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Answer</Label>
                        <Textarea
                          placeholder="Enter answer"
                          className="mt-1"
                          rows={3}
                          value={item.answer || ''}
                          onChange={(e) => {
                            const newItems = [...content.items];
                            newItems[itemIndex].answer = e.target.value;
                            updateSection(index, { ...content, items: newItems });
                          }}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newItems = content.items.filter((_: unknown, i: number) => i !== itemIndex);
                          updateSection(index, { ...content, items: newItems });
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Question
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const newItems = [...(content.items || []), { question: '', answer: '' }];
                  updateSection(index, { ...content, items: newItems });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Question
              </Button>
            </div>
          )}

          {section.section_type === 'cards' && (
            <div className="space-y-4 rounded-lg bg-muted/20 p-4">
              <div>
                <Label className="text-base">Section Title (Optional)</Label>
                <Input
                  className="text-xl font-bold"
                  placeholder="e.g., Our Features"
                  value={content.title || ''}
                  onChange={(e) => updateSection(index, { ...content, title: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base">Cards</Label>
                {content.cards?.map((card: unknown, cardIndex: number) => (
                  <Card key={cardIndex} className="border-2 border-primary/20 bg-primary/10 p-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold">Card {cardIndex + 1} - Title</Label>
                        <Input
                          placeholder="Enter card title"
                          className="mt-1 font-semibold"
                          value={card.title || ''}
                          onChange={(e) => {
                            const newCards = [...content.cards];
                            newCards[cardIndex].title = e.target.value;
                            updateSection(index, { ...content, cards: newCards });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Text</Label>
                        <Textarea
                          placeholder="Enter card text"
                          className="mt-1"
                          rows={3}
                          value={card.text || ''}
                          onChange={(e) => {
                            const newCards = [...content.cards];
                            newCards[cardIndex].text = e.target.value;
                            updateSection(index, { ...content, cards: newCards });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Image</Label>
                        {card.image && (
                          <div className="mb-2 mt-2">
                            <img
                              src={card.image}
                              alt={`Card ${cardIndex + 1}`}
                              className="h-32 w-full rounded object-cover"
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            id={`card-upload-${index}-${cardIndex}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              setUploadingImage(`${index}-card-${cardIndex}`);
                              try {
                                const result = await uploadContentImage(file, 'content');
                                if (isFailure(result)) throw result.error;

                                const newCards = [...content.cards];
                                newCards[cardIndex].image = result.data;
                                updateSection(index, { ...content, cards: newCards });

                                toast({ title: 'Success', description: 'Image uploaded successfully' });
                              } catch (error: unknown) {
                                toast({ title: 'Error', description: error.message, variant: 'destructive' });
                              } finally {
                                setUploadingImage(null);
                              }
                            }}
                            disabled={uploadingImage === `${index}-card-${cardIndex}`}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                            disabled={uploadingImage === `${index}-card-${cardIndex}`}
                          >
                            <label htmlFor={`card-upload-${index}-${cardIndex}`} className="cursor-pointer">
                              <Upload className="h-4 w-4" />
                            </label>
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newCards = content.cards.filter((_: unknown, i: number) => i !== cardIndex);
                          updateSection(index, { ...content, cards: newCards });
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Card
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const newCards = [...(content.cards || []), { title: '', text: '', image: '' }];
                  updateSection(index, { ...content, cards: newCards });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading)
    return (
      <AdminLayout>
        <p>Loading...</p>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/admin/content')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <div className="flex items-center gap-2">
              <Label htmlFor="published">Published</Label>
              <Switch
                id="published"
                checked={pageData.is_published}
                onCheckedChange={(checked) => setPageData((prev) => ({ ...prev, is_published: checked }))}
              />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Save Page
            </Button>
          </div>
        </div>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {pageData.title}</DialogTitle>
            </DialogHeader>
            {renderPreview()}
          </DialogContent>
        </Dialog>

        <ContentEditorLayout
          sidebar={
            <ContentEditorSidebar
              sections={sections}
              onAddSection={addSection}
              onNavigateToSection={navigateToSection}
            />
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Page Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={pageData.title}
                    onChange={(e) => setPageData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      value={pageData.slug}
                      onChange={(e) => setPageData((prev) => ({ ...prev, slug: e.target.value }))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const url = `https://vintstreetdev.co.uk/page/${pageData.slug}`;
                        navigator.clipboard.writeText(url);
                        toast({
                          title: 'Copied!',
                          description: 'Page URL copied to clipboard',
                        });
                      }}
                      title="Copy page URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={pageData.meta_description}
                  onChange={(e) => setPageData((prev) => ({ ...prev, meta_description: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Page Sections</CardTitle>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mb-2 text-muted-foreground">No sections yet. Add your first section to get started.</p>
                  <p className="text-sm text-muted-foreground">
                    Choose from hero banners, text blocks, image+text layouts, CTAs, and FAQs.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">{sections.map((section, index) => renderSectionEditor(section, index))}</div>
              )}
            </CardContent>
          </Card>

          {/* Product Selector - only show for product pages */}
          {pageData.page_type === 'product' && <ProductSelector pageId={id!} />}
        </ContentEditorLayout>
      </div>
    </AdminLayout>
  );
}
