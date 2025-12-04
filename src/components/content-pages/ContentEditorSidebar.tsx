import { Image, Type, Layout, MousePointerClick, HelpCircle, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Section {
  id?: string;
  section_type: string;
  content: unknown;
  display_order: number;
}

interface ContentEditorSidebarProps {
  sections: Section[];
  onAddSection: (type: string) => void;
  onNavigateToSection: (index: number) => void;
}

const SECTION_TEMPLATES = [
  { value: 'hero', label: 'Hero Section', description: 'Large banner with image and text' },
  { value: 'text_block', label: 'Text Block', description: 'Rich text content' },
  { value: 'image_text', label: 'Image + Text', description: 'Side-by-side layout' },
  { value: 'cta', label: 'Call to Action', description: 'Button with headline' },
  { value: 'faq', label: 'FAQ Section', description: 'Question and answer pairs' },
  { value: 'cards', label: 'Cards Section', description: 'Row of cards with title and text' },
];

const SECTION_ICONS: Record<string, LucideIcon> = {
  hero: Image,
  text_block: Type,
  image_text: Layout,
  cta: MousePointerClick,
  faq: HelpCircle,
  cards: LayoutGrid,
};

const getSectionLabel = (section: Section): string => {
  const content = section.content || {};

  switch (section.section_type) {
    case 'hero':
      return content.headline || 'Hero Section';
    case 'text_block':
      return content.heading || 'Text Block';
    case 'image_text':
      return content.heading || 'Image + Text';
    case 'cta':
      return content.headline || 'Call to Action';
    case 'faq':
      return content.title || 'FAQ Section';
    case 'cards':
      return content.title || 'Cards Section';
    default:
      return section.section_type;
  }
};

export const ContentEditorSidebar = ({ sections, onAddSection, onNavigateToSection }: ContentEditorSidebarProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Block</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={onAddSection}>
            <SelectTrigger>
              <SelectValue placeholder="+ Add Section" />
            </SelectTrigger>
            <SelectContent>
              {SECTION_TEMPLATES.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  <div>
                    <div className="font-medium">{template.label}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Content Index</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {sections.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No sections yet</p>
            ) : (
              <div className="space-y-1 p-2">
                {sections.map((section, index) => {
                  const Icon = SECTION_ICONS[section.section_type] || Type;
                  const label = getSectionLabel(section);

                  return (
                    <button
                      key={index}
                      onClick={() => onNavigateToSection(index)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
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
