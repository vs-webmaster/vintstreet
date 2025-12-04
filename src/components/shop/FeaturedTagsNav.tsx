import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface FeaturedTagsNavProps {
  tags: Tag[];
  selectedTags?: Set<string>;
  onTagToggle?: (tagId: string) => void;
}

export const FeaturedTagsNav = memo(({ tags }: FeaturedTagsNavProps) => {
  const navigate = useNavigate();

  if (tags.length === 0) return null;

  const handleTagClick = (tag: Tag) => {
    navigate(`/shop/tag/${tag.slug}`);
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-3">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              className="cursor-pointer whitespace-nowrap text-white transition-all hover:opacity-90"
              style={{
                backgroundColor: tag.color,
              }}
              onClick={() => handleTagClick(tag)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
});

FeaturedTagsNav.displayName = 'FeaturedTagsNav';
