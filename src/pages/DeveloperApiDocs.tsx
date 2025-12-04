import { useState } from 'react';
import { Search } from 'lucide-react';
import ApiEndpointCard from '@/components/docs/ApiEndpointCard';
import CredentialsSection from '@/components/docs/CredentialsSection';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DeveloperApiDocs = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const authEndpoints = [
    {
      method: 'POST',
      name: 'Sign Up',
      table: 'auth.users',
      description: 'Create a new user account',
      authRequired: false,
      code: `const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    data: {
      username: 'username',
      full_name: 'John Doe'
    }
  }
});`,
      response: `{
  user: { id: uuid, email: string, ... },
  session: { access_token: string, ... }
}`,
    },
    {
      method: 'POST',
      name: 'Sign In',
      table: 'auth.users',
      description: 'Authenticate existing user',
      authRequired: false,
      code: `const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123'
});`,
      response: `{
  user: { id: uuid, email: string, ... },
  session: { access_token: string, ... }
}`,
    },
    {
      method: 'POST',
      name: 'Sign Out',
      table: 'auth.users',
      description: 'End user session',
      authRequired: true,
      code: `const { error } = await supabase.auth.signOut();`,
      response: `{ error: null }`,
    },
    {
      method: 'POST',
      name: 'Reset Password',
      table: 'auth.users',
      description: 'Send password reset email',
      authRequired: false,
      code: `const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com'
);`,
      response: `{ error: null }`,
    },
  ];

  const profileEndpoints = [
    {
      method: 'GET',
      name: 'Get User Profile',
      table: 'profiles',
      description: 'Fetch user profile information',
      authRequired: true,
      rlsPolicy: 'Users can view their own profile',
      code: `const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();`,
      response: `{
  id: uuid,
  user_id: uuid,
  username: string,
  full_name: string,
  avatar_url: string,
  bio: string,
  user_type: 'buyer' | 'seller'
}`,
    },
    {
      method: 'PUT',
      name: 'Update Profile',
      table: 'profiles',
      description: 'Update user profile details',
      authRequired: true,
      rlsPolicy: 'Users can update their own profile',
      code: `const { data, error } = await supabase
  .from('profiles')
  .update({
    username: 'newUsername',
    full_name: 'New Name',
    bio: 'Updated bio'
  })
  .eq('user_id', userId);`,
      response: `{ data: [...], error: null }`,
    },
  ];

  const sellerEndpoints = [
    {
      method: 'POST',
      name: 'Create Seller Profile',
      table: 'seller_profiles',
      description: 'Create a new seller profile',
      authRequired: true,
      rlsPolicy: 'Users can insert their own seller profile',
      code: `const { data, error } = await supabase
  .from('seller_profiles')
  .insert({
    user_id: userId,
    shop_name: 'My Shop',
    shop_description: 'Shop description',
    business_name: 'Business LLC',
    contact_email: 'contact@shop.com'
  });`,
      response: `{ data: [...], error: null }`,
    },
    {
      method: 'GET',
      name: 'Get Public Seller Info',
      table: 'get_public_seller_info()',
      description: 'Get public seller information (safe for public access)',
      authRequired: false,
      code: `const { data, error } = await supabase
  .rpc('get_public_seller_info', { seller_user_id: sellerId });`,
      response: `{
  shop_name: string,
  shop_description: string,
  shop_logo_url: string,
  business_name: string,
  return_policy: string,
  shipping_policy: string
}`,
    },
    {
      method: 'PUT',
      name: 'Update Seller Profile',
      table: 'seller_profiles',
      description: 'Update seller profile information',
      authRequired: true,
      rlsPolicy: 'Users can update their own seller profile',
      code: `const { data, error } = await supabase
  .from('seller_profiles')
  .update({
    shop_name: 'Updated Shop Name',
    shop_description: 'New description',
    return_policy: 'Updated policy'
  })
  .eq('user_id', userId);`,
      response: `{ data: [...], error: null }`,
    },
  ];

  const streamEndpoints = [
    {
      method: 'POST',
      name: 'Create Stream',
      table: 'streams',
      description: 'Schedule a new livestream',
      authRequired: true,
      rlsPolicy: 'Users can create their own streams',
      code: `const { data, error } = await supabase
  .from('streams')
  .insert({
    seller_id: userId,
    title: 'My Livestream',
    description: 'Stream description',
    category: 'Fashion',
    start_time: '2024-12-01T18:00:00Z',
    duration: '2',
    timezone: 'America/New_York',
    status: 'scheduled'
  });`,
      response: `{ data: [...], error: null }`,
    },
    {
      method: 'GET',
      name: 'Get Streams',
      table: 'streams',
      description: 'Fetch all streams or filter by seller',
      authRequired: false,
      rlsPolicy: 'Streams are viewable by everyone',
      code: `const { data, error } = await supabase
  .from('streams')
  .select('*')
  .eq('seller_id', sellerId)
  .order('start_time', { ascending: false });`,
      response: `[{
  id: uuid,
  title: string,
  description: string,
  category: string,
  start_time: timestamp,
  status: 'scheduled' | 'live' | 'ended',
  viewer_count: number
}]`,
    },
    {
      method: 'PUT',
      name: 'Update Stream Status',
      table: 'streams',
      description: 'Update stream status (go live, end stream)',
      authRequired: true,
      rlsPolicy: 'Users can update their own streams',
      code: `const { data, error } = await supabase
  .from('streams')
  .update({ 
    status: 'live',
    start_time: new Date().toISOString()
  })
  .eq('id', streamId)
  .eq('seller_id', userId);`,
      response: `{ data: [...], error: null }`,
    },
    {
      method: 'DELETE',
      name: 'Delete Stream',
      table: 'streams',
      description: 'Delete a scheduled stream',
      authRequired: true,
      rlsPolicy: 'Users can delete their own streams',
      code: `const { data, error } = await supabase
  .from('streams')
  .delete()
  .eq('id', streamId)
  .eq('seller_id', userId);`,
      response: `{ data: [...], error: null }`,
    },
  ];

  const productEndpoints = [
    {
      method: 'POST',
      name: 'Create Listing',
      table: 'listings',
      description: 'Add a product/listing to a stream',
      authRequired: true,
      rlsPolicy: 'Sellers can create their own listings',
      code: `const { data, error } = await supabase
  .from('listings')
  .insert({
    seller_id: userId,
    stream_id: streamId,
    product_name: 'Product Name',
    product_description: 'Description',
    starting_price: 99.99,
    product_type: 'livestream',
    is_active: true
  });`,
      response: `{ data: [...], error: null }`,
    },
    {
      method: 'GET',
      name: 'Get Listings',
      table: 'listings',
      description: 'Fetch all listings for a stream',
      authRequired: false,
      rlsPolicy: 'Listings are viewable by everyone',
      code: `const { data, error } = await supabase
  .from('listings')
  .select('*')
  .eq('stream_id', streamId)
  .eq('is_active', true);`,
      response: `[{
  id: uuid,
  product_name: string,
  starting_price: number,
  current_bid: number,
  is_active: boolean
}]`,
    },
    {
      method: 'PUT',
      name: 'Update Listing',
      table: 'listings',
      description: 'Update product listing details',
      authRequired: true,
      rlsPolicy: 'Sellers can update their own listings',
      code: `const { data, error } = await supabase
  .from('listings')
  .update({
    product_name: 'Updated Name',
    starting_price: 149.99,
    is_active: false
  })
  .eq('id', listingId)
  .eq('seller_id', userId);`,
      response: `{ data: [...], error: null }`,
    },
  ];

  const biddingEndpoints = [
    {
      method: 'POST',
      name: 'Place Bid',
      table: 'bids',
      description: 'Place a bid on a listing',
      authRequired: true,
      rlsPolicy: 'Users can create bids',
      code: `const { data, error } = await supabase
  .from('bids')
  .insert({
    listing_id: listingId,
    bidder_id: userId,
    bid_amount: 125.00
  });`,
      response: `{ data: [...], error: null }`,
    },
    {
      method: 'GET',
      name: 'Get Bids',
      table: 'bids',
      description: 'Fetch bids for a listing',
      authRequired: true,
      rlsPolicy: 'Bidders and sellers can view bids',
      code: `const { data, error } = await supabase
  .from('bids')
  .select('*')
  .eq('listing_id', listingId)
  .order('bid_amount', { ascending: false });`,
      response: `[{
  id: uuid,
  listing_id: uuid,
  bidder_id: uuid,
  bid_amount: number,
  created_at: timestamp
}]`,
    },
  ];

  const offerEndpoints = [
    {
      method: 'POST',
      name: 'Create Offer',
      table: 'offers',
      description: 'Make an offer on a listing',
      authRequired: true,
      rlsPolicy: 'Buyers can create offers',
      code: `const { data, error } = await supabase
  .from('offers')
  .insert({
    listing_id: listingId,
    buyer_id: userId,
    seller_id: sellerId,
    offer_amount: 100.00,
    message: 'Is this price acceptable?',
    expires_at: '2024-12-15T23:59:59Z'
  });`,
      response: `{ data: [...], error: null }`,
    },
    {
      method: 'PUT',
      name: 'Accept/Decline Offer',
      table: 'offers',
      description: 'Update offer status',
      authRequired: true,
      rlsPolicy: 'Sellers can update offer status',
      code: `const { data, error } = await supabase
  .from('offers')
  .update({ status: 'accepted' })
  .eq('id', offerId)
  .eq('seller_id', userId);`,
      response: `{ data: [...], error: null }`,
    },
    {
      method: 'GET',
      name: 'Get Offers',
      table: 'offers',
      description: 'Fetch offers for buyer or seller',
      authRequired: true,
      rlsPolicy: 'Buyers can view their own offers, sellers can view offers on their listings',
      code: `const { data, error } = await supabase
  .from('offers')
  .select('*')
  .eq('seller_id', userId)
  .eq('status', 'pending');`,
      response: `[{
  id: uuid,
  offer_amount: number,
  status: 'pending' | 'accepted' | 'declined',
  message: string
}]`,
    },
  ];

  const orderEndpoints = [
    {
      method: 'POST',
      name: 'Create Order',
      table: 'orders',
      description: 'Create a new order/purchase',
      authRequired: true,
      rlsPolicy: 'Users can create orders',
      code: `const { data, error } = await supabase
  .from('orders')
  .insert({
    buyer_id: userId,
    seller_id: sellerId,
    listing_id: listingId,
    stream_id: streamId,
    order_amount: 99.99,
    quantity: 1,
    status: 'completed'
  });`,
      response: `{ data: [...], error: null }`,
    },
    {
      method: 'GET',
      name: 'Get Orders',
      table: 'orders',
      description: 'Fetch orders for buyer or seller',
      authRequired: true,
      rlsPolicy: 'Buyers can view their orders, sellers can view their sales',
      code: `const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('buyer_id', userId)
  .order('order_date', { ascending: false });`,
      response: `[{
  id: uuid,
  order_amount: number,
  status: string,
  order_date: timestamp,
  quantity: number
}]`,
    },
    {
      method: 'PUT',
      name: 'Update Order Status',
      table: 'orders',
      description: 'Update order fulfillment status',
      authRequired: true,
      rlsPolicy: 'Sellers can update their order status',
      code: `const { data, error } = await supabase
  .from('orders')
  .update({ status: 'shipped' })
  .eq('id', orderId)
  .eq('seller_id', userId);`,
      response: `{ data: [...], error: null }`,
    },
  ];

  const categoryEndpoints = [
    {
      method: 'GET',
      name: 'Get Stream Categories',
      table: 'stream_categories',
      description: 'Fetch all active stream categories',
      authRequired: false,
      rlsPolicy: 'Categories are viewable by everyone',
      code: `const { data, error } = await supabase
  .from('stream_categories')
  .select('*')
  .eq('is_active', true)
  .order('name');`,
      response: `[{
  id: uuid,
  name: string,
  description: string,
  icon: string,
  is_active: boolean
}]`,
    },
    {
      method: 'GET',
      name: 'Get Master Categories (Level 1)',
      table: 'master_categories',
      description: 'Fetch all master product categories (top level)',
      authRequired: false,
      rlsPolicy: 'Master categories are viewable by everyone',
      code: `const { data, error } = await supabase
  .from('master_categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order');`,
      response: `[{
  id: uuid,
  name: string,
  slug: string,
  description: string,
  icon: string,
  is_active: boolean,
  display_order: number
}]`,
    },
    {
      method: 'GET',
      name: 'Get Product Categories (Level 2)',
      table: 'product_categories',
      description: 'Fetch product categories by master category',
      authRequired: false,
      rlsPolicy: 'Categories are viewable by everyone',
      code: `const { data, error } = await supabase
  .from('product_categories')
  .select('*')
  .eq('master_category_id', masterCategoryId)
  .eq('is_active', true)
  .order('display_order');`,
      response: `[{
  id: uuid,
  name: string,
  slug: string,
  description: string,
  icon: string,
  master_category_id: uuid,
  is_active: boolean,
  display_order: number
}]`,
    },
    {
      method: 'GET',
      name: 'Get Product Subcategories (Level 3)',
      table: 'product_subcategories',
      description: 'Fetch subcategories by product category',
      authRequired: false,
      rlsPolicy: 'Subcategories are viewable by everyone',
      code: `const { data, error } = await supabase
  .from('product_subcategories')
  .select('*')
  .eq('category_id', categoryId)
  .eq('is_active', true)
  .order('name');`,
      response: `[{
  id: uuid,
  name: string,
  slug: string,
  description: string,
  category_id: uuid,
  is_active: boolean
}]`,
    },
    {
      method: 'GET',
      name: 'Get Sub-Subcategories (Level 4)',
      table: 'product_sub_subcategories',
      description: 'Fetch sub-subcategories by subcategory',
      authRequired: false,
      rlsPolicy: 'Sub-subcategories are viewable by everyone',
      code: `const { data, error } = await supabase
  .from('product_sub_subcategories')
  .select('*')
  .eq('subcategory_id', subcategoryId)
  .eq('is_active', true)
  .order('name');`,
      response: `[{
  id: uuid,
  name: string,
  description: string,
  subcategory_id: uuid,
  is_active: boolean
}]`,
    },
    {
      method: 'GET',
      name: 'Get Sub-Sub-Subcategories (Level 5)',
      table: 'product_sub_sub_subcategories',
      description: 'Fetch sub-sub-subcategories by sub-subcategory',
      authRequired: false,
      rlsPolicy: 'Sub-sub-subcategories are viewable by everyone',
      code: `const { data, error } = await supabase
  .from('product_sub_sub_subcategories')
  .select('*')
  .eq('sub_subcategory_id', subSubcategoryId)
  .eq('is_active', true)
  .order('name');`,
      response: `[{
  id: uuid,
  name: string,
  description: string,
  sub_subcategory_id: uuid,
  is_active: boolean
}]`,
    },
    {
      method: 'GET',
      name: 'Get All Category Levels',
      table: 'Multiple Tables',
      description: 'Fetch complete category hierarchy with nested relationships',
      authRequired: false,
      code: `// Get master categories with nested subcategories
const { data, error } = await supabase
  .from('master_categories')
  .select(\`
    *,
    product_categories:product_categories(
      *,
      product_subcategories:product_subcategories(
        *,
        product_sub_subcategories:product_sub_subcategories(
          *,
          product_sub_sub_subcategories:product_sub_sub_subcategories(*)
        )
      )
    )
  \`)
  .eq('is_active', true)
  .order('display_order');`,
      response: `[{
  id: uuid,
  name: string,
  product_categories: [{
    id: uuid,
    name: string,
    product_subcategories: [{
      id: uuid,
      name: string,
      product_sub_subcategories: [{
        id: uuid,
        name: string,
        product_sub_sub_subcategories: [...]
      }]
    }]
  }]
}]`,
    },
  ];

  const reviewEndpoints = [
    {
      method: 'POST',
      name: 'Create Review',
      table: 'reviews',
      description: 'Leave a review for a seller',
      authRequired: true,
      rlsPolicy: 'Buyers can create reviews',
      code: `const { data, error } = await supabase
  .from('reviews')
  .insert({
    seller_id: sellerId,
    buyer_id: userId,
    rating: 5,
    comment: 'Great seller!'
  });`,
      response: `{ data: [...], error: null }`,
    },
    {
      method: 'GET',
      name: 'Get Reviews',
      table: 'reviews',
      description: 'Fetch reviews for a seller',
      authRequired: false,
      rlsPolicy: 'Reviews are viewable by everyone',
      code: `const { data, error } = await supabase
  .from('reviews')
  .select('*')
  .eq('seller_id', sellerId)
  .order('created_at', { ascending: false });`,
      response: `[{
  id: uuid,
  rating: number,
  comment: string,
  created_at: timestamp
}]`,
    },
  ];

  const storageEndpoints = [
    {
      method: 'POST',
      name: 'Upload Avatar',
      table: 'storage.avatars',
      description: 'Upload user avatar image',
      authRequired: true,
      code: `const { data, error } = await supabase.storage
  .from('avatars')
  .upload(\`\${userId}/avatar.jpg\`, file, {
    cacheControl: '3600',
    upsert: true
  });`,
      response: `{
  path: string,
  id: uuid,
  fullPath: string
}`,
    },
    {
      method: 'GET',
      name: 'Get Public URL',
      table: 'storage.avatars',
      description: 'Get public URL for uploaded file',
      authRequired: false,
      code: `const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('path/to/file.jpg');`,
      response: `{
  publicUrl: string
}`,
    },
  ];

  const edgeFunctionEndpoints = [
    {
      method: 'POST',
      name: 'Get Agora RTC Config',
      table: 'Edge Function',
      description: 'Get Agora configuration for livestreaming',
      authRequired: false,
      code: `const { data, error } = await supabase.functions.invoke(
  'get-agora-config',
  {
    body: {
      channelName: 'stream-123',
      uid: userId
    }
  }
);`,
      response: `{
  appId: string,
  token: string,
  codec: string,
  mode: string
}`,
    },
    {
      method: 'POST',
      name: 'Get Agora RTM Config',
      table: 'Edge Function',
      description: 'Get Agora RTM configuration for chat',
      authRequired: false,
      code: `const { data, error } = await supabase.functions.invoke(
  'get-agora-rtm-config',
  {
    body: {
      channelName: 'stream-123',
      uid: userId
    }
  }
);`,
      response: `{
  appId: string,
  token: string,
  type: 'rtm'
}`,
    },
  ];

  const realtimeEndpoints = [
    {
      method: 'REALTIME',
      name: 'Subscribe to Stream Updates',
      table: 'streams',
      description: 'Real-time subscription to stream status changes',
      authRequired: true,
      code: `const channel = supabase
  .channel('stream-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'streams',
      filter: \`id=eq.\${streamId}\`
    },
    (payload) => {
      console.log('Stream updated:', payload.new);
    }
  )
  .subscribe();`,
      response: `// Callback receives:
{
  new: { status: 'live', viewer_count: 42, ... },
  old: { status: 'scheduled', viewer_count: 0, ... }
}`,
    },
    {
      method: 'REALTIME',
      name: 'Subscribe to New Bids',
      table: 'bids',
      description: 'Real-time subscription to new bids on listings',
      authRequired: true,
      code: `const channel = supabase
  .channel('bid-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'bids',
      filter: \`listing_id=eq.\${listingId}\`
    },
    (payload) => {
      console.log('New bid:', payload.new);
    }
  )
  .subscribe();`,
      response: `// Callback receives:
{
  new: {
    id: uuid,
    bid_amount: number,
    bidder_id: uuid,
    created_at: timestamp
  }
}`,
    },
  ];

  const allEndpoints = [
    ...authEndpoints.map((e) => ({ ...e, category: 'Authentication' })),
    ...profileEndpoints.map((e) => ({ ...e, category: 'Profiles' })),
    ...sellerEndpoints.map((e) => ({ ...e, category: 'Seller' })),
    ...streamEndpoints.map((e) => ({ ...e, category: 'Streams' })),
    ...productEndpoints.map((e) => ({ ...e, category: 'Products' })),
    ...biddingEndpoints.map((e) => ({ ...e, category: 'Bidding' })),
    ...offerEndpoints.map((e) => ({ ...e, category: 'Offers' })),
    ...orderEndpoints.map((e) => ({ ...e, category: 'Orders' })),
    ...categoryEndpoints.map((e) => ({ ...e, category: 'Categories' })),
    ...reviewEndpoints.map((e) => ({ ...e, category: 'Reviews' })),
    ...storageEndpoints.map((e) => ({ ...e, category: 'Storage' })),
    ...edgeFunctionEndpoints.map((e) => ({ ...e, category: 'Edge Functions' })),
    ...realtimeEndpoints.map((e) => ({ ...e, category: 'Real-time' })),
  ];

  const filteredEndpoints = searchQuery
    ? allEndpoints.filter(
        (endpoint) =>
          endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          endpoint.table.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allEndpoints;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground">
            Complete API reference for building your React Native app with Supabase
          </p>
        </div>

        <CredentialsSection />

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex h-auto flex-wrap gap-2 bg-muted/50 p-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="authentication">Auth</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="seller">Seller</TabsTrigger>
            <TabsTrigger value="streams">Streams</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="bidding">Bidding</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-4">
            {filteredEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="authentication" className="mt-6 space-y-4">
            {authEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="profiles" className="mt-6 space-y-4">
            {profileEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="seller" className="mt-6 space-y-4">
            {sellerEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="streams" className="mt-6 space-y-4">
            {streamEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="products" className="mt-6 space-y-4">
            {productEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="bidding" className="mt-6 space-y-4">
            {biddingEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="offers" className="mt-6 space-y-4">
            {offerEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="orders" className="mt-6 space-y-4">
            {orderEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="categories" className="mt-6 space-y-4">
            {categoryEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-4">
            {reviewEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="storage" className="mt-6 space-y-4">
            {storageEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="edge-functions" className="mt-6 space-y-4">
            {edgeFunctionEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>

          <TabsContent value="realtime" className="mt-6 space-y-4">
            {realtimeEndpoints.map((endpoint, idx) => (
              <ApiEndpointCard key={idx} endpoint={endpoint} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeveloperApiDocs;
