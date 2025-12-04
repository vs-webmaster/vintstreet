export interface Stream {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  status: 'live' | 'scheduled' | 'ended';
  viewer_count: number;
  start_time: string;
  end_time?: string;
  category: string;
  thumbnail?: string;
  duration?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  stream_id: string;
  order_amount: number;
  quantity: number;
  status: string;
  order_date: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  // Computed fields for display
  customer_name?: string;
  product_name?: string;
}

export interface Message {
  id: string;
  customer_name: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  itemCount: number;
}

export interface ScheduledShow {
  id: string;
  title: string;
  date: Date | undefined;
  time: string;
  timezone?: string;
  duration?: string;
  products: Product[];
}

export interface StreamFormData {
  title: string;
  description: string;
  category: string;
  thumbnail: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedStreams: number;
  upcomingStreamsCount: number;
  totalViewers: number;
}
