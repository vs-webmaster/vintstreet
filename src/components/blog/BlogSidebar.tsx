import {
  FileText,
  Image,
  Heading,
  List,
  Quote,
  Video,
  Megaphone,
  Minus,
  StickyNote,
  Mail,
  ShoppingBag,
  LayoutGrid,
  ImageIcon,
  Frame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BlogSidebarProps {
  sections: unknown[];
  onAddSection: (type: string) => void;
  onNavigateToSection: (index: number) => void;
}

import type { LucideIcon } from 'lucide-react';

const SECTION_ICONS: Record<string, LucideIcon> = {
  heading: Heading,
  paragraph: FileText,
  image: Image,
  quote: Quote,
  list: List,
  video: Video,
  cta: Megaphone,
  divider: Minus,
  author_note: StickyNote,
  newsletter: Mail,
  product_row: ShoppingBag,
  text_image: LayoutGrid,
  hero_banner: ImageIcon,
  cta_banner: Frame,
};

const getSectionLabel = (section: unknown) => {
  const type = section.section_type;
  const content = section.content;

  switch (type) {
    case 'heading':
      return content.text || 'Untitled Heading';
    case 'paragraph':
      return content.text?.substring(0, 50) || 'Empty paragraph';
    case 'image':
      return content.caption || content.alt || 'Image';
    case 'quote':
      return content.text?.substring(0, 40) || 'Quote';
    case 'list':
      return `${content.type === 'numbered' ? 'Numbered' : 'Bulleted'} List`;
    case 'video':
      return content.caption || 'Video';
    case 'cta':
      return content.buttonLabel || 'CTA';
    case 'author_note':
      return 'Author Note';
    case 'newsletter':
      return content.title || 'Newsletter';
    case 'product_row':
      return `Products (${content.products?.length || 0})`;
    case 'text_image':
      return 'Text & Image';
    case 'hero_banner':
      return content.heading || 'Hero Banner';
    case 'cta_banner':
      return content.buttonLabel || 'CTA Banner';
    default:
      return type.replace('_', ' ');
  }
};

export const BlogSidebar = ({ sections, onAddSection, onNavigateToSection }: BlogSidebarProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Block</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={onAddSection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose block type..." />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="heading">Heading</SelectItem>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="quote">Quote</SelectItem>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="cta">CTA Block</SelectItem>
              <SelectItem value="divider">Divider</SelectItem>
              <SelectItem value="author_note">Author Note</SelectItem>
              <SelectItem value="newsletter">Newsletter Signup</SelectItem>
              <SelectItem value="product_row">Product Row</SelectItem>
              <SelectItem value="text_image">Text & Image</SelectItem>
              <SelectItem value="hero_banner">Hero Banner</SelectItem>
              <SelectItem value="cta_banner">CTA Banner</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Index</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {sections.length} {sections.length === 1 ? 'block' : 'blocks'}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {sections.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No blocks yet. Add your first block above.
              </div>
            ) : (
              <div className="space-y-1 p-3">
                {sections.map((section, index) => {
                  const Icon = SECTION_ICONS[section.section_type] || FileText;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="h-auto w-full justify-start px-3 py-2 text-left"
                      onClick={() => onNavigateToSection(index)}
                    >
                      <div className="flex w-full min-w-0 items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-muted-foreground">Block {index + 1}</div>
                          <div className="truncate text-sm font-medium">{getSectionLabel(section)}</div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
