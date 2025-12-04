import { Message } from '@/types';

// Mock messages remain for the messages functionality
export const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    customer_name: 'Alex Wilson',
    subject: 'Question about shipping',
    message: 'Hi! When will my order be shipped? I need it by Friday.',
    status: 'new',
    created_at: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    customer_name: 'Jennifer Lee',
    subject: 'Product customization',
    message: 'Can you customize the color of the jacket I saw in your stream?',
    status: 'read',
    created_at: '2024-01-14T11:15:00Z',
  },
  {
    id: '3',
    customer_name: 'David Brown',
    subject: 'Bulk order inquiry',
    message: "I'm interested in placing a bulk order for my store. Can we discuss pricing?",
    status: 'replied',
    created_at: '2024-01-13T16:45:00Z',
  },
];

export const MOCK_SAVED_IMAGES = [
  '/src/assets/pokemon-cards-stream.webp',
  '/src/assets/sneakers-display-stream.webp',
  '/src/assets/clothing-store-stream.webp',
  '/src/assets/sneaker-wall-stream.webp',
  '/src/assets/vintage-clothing-stream.webp',
  '/src/assets/pokemon-cards-stream.webp',
  '/src/assets/clothing-store-stream.webp',
  '/src/assets/sneaker-wall-stream.webp',
];

export const TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
})();
