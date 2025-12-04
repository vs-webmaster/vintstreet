// Stream images from external URLs
const streamImages = [
  'https://www.mannequins-shopping.com/mannequins-de-vitrine/Image/produit/g/low-clothing-rails-for-retail-store-125-cm-9.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQmHfKKwagVYFsab8VTRcG3aOCznQOBDbmKw&s',
  'https://foxcustomfurniture.co.uk/wp-content/uploads/2020/02/MNH-4-1024x768.jpeg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzzP452zuJtiwf5pousipeXDijgmhFCSxI2w&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfupmsjHDz5rluGlJP7Ifq7CqXGxL7tQ8X-Q&s',
];

// Map of thumbnail keys to image URLs - expanded to cover all possible cases
const thumbnailMap: { [key: string]: string } = {
  'clothing-rails': streamImages[0],
  'nike-display': streamImages[1],
  'shoe-store': streamImages[2],
  'sneaker-wall': streamImages[3],
  'pokemon-cards': streamImages[4],
  // Legacy mappings for existing data
  'pokemon-astral-radiance': streamImages[4],
  'nike-grey-stacks': streamImages[1],
  'vintage-shop': streamImages[0],
  'equipped-kicks': streamImages[3],
  'north-face-racks': streamImages[2],
  // Asset path mappings (old system)
  '/src/assets/sneaker-wall-stream.webp': streamImages[3],
  '/src/assets/clothing-store-stream.webp': streamImages[0],
  '/src/assets/pokemon-cards-stream.webp': streamImages[4],
  '/src/assets/sneakers-display-stream.webp': streamImages[1],
  '/src/assets/vintage-clothing-stream.webp': streamImages[0],
  'src/assets/sneaker-wall-stream.webp': streamImages[3],
  'src/assets/clothing-store-stream.webp': streamImages[0],
  'src/assets/pokemon-cards-stream.webp': streamImages[4],
  'src/assets/sneakers-display-stream.webp': streamImages[1],
  'src/assets/vintage-clothing-stream.webp': streamImages[0],
};

// Export stream images for use in components
export { streamImages };

export const resolveThumbnail = (thumbnail: string): string | null => {
  // If it's already one of our target URLs, return it
  if (thumbnail && streamImages.includes(thumbnail)) {
    return thumbnail;
  }

  // If it's already a resolved HTTP URL, check if it's one of ours
  if (thumbnail && thumbnail.startsWith('http')) {
    // If it's not one of our target images, replace with a random one
    return streamImages[Math.floor(Math.random() * streamImages.length)];
  }

  // Handle all possible thumbnail keys and map them to our images
  const allPossibleKeys = [
    // Current keys
    'clothing-rails',
    'nike-display',
    'shoe-store',
    'sneaker-wall',
    'pokemon-cards',
    // Legacy keys
    'pokemon-astral-radiance',
    'nike-grey-stacks',
    'vintage-shop',
    'equipped-kicks',
    'north-face-racks',
    // Asset paths (from old system)
    '/src/assets/sneaker-wall-stream.webp',
    '/src/assets/clothing-store-stream.webp',
    '/src/assets/pokemon-cards-stream.webp',
    '/src/assets/sneakers-display-stream.webp',
    '/src/assets/vintage-clothing-stream.webp',
  ];

  // Try to resolve from thumbnail map first
  if (thumbnailMap[thumbnail]) {
    return thumbnailMap[thumbnail];
  }

  // If thumbnail exists but not in our map, assign it to a random image
  if (thumbnail && thumbnail.trim() !== '') {
    // Use a hash of the thumbnail string to consistently assign the same image
    let hash = 0;
    for (let i = 0; i < thumbnail.length; i++) {
      const char = thumbnail.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % streamImages.length;
    return streamImages[index];
  }

  return null;
};
