-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_received', 'order_shipped', 'new_follow')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_id UUID,
  follower_id UUID
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to create notification for order shipped
CREATE OR REPLACE FUNCTION public.notify_order_shipped()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create notification when delivery_status changes to 'shipped'
  IF NEW.delivery_status = 'shipped' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'shipped') THEN
    INSERT INTO public.notifications (user_id, type, title, message, order_id)
    VALUES (
      NEW.buyer_id,
      'order_shipped',
      'Order Shipped',
      'Your order has been shipped and is on its way!',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Function to create notification for new order (seller receives)
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify seller about new order
  INSERT INTO public.notifications (user_id, type, title, message, order_id)
  VALUES (
    NEW.seller_id,
    'order_received',
    'New Order Received',
    'You have received a new order!',
    NEW.id
  );
  RETURN NEW;
END;
$$;

-- Function to create notification for new follow
CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower's shop name or username
  SELECT COALESCE(sp.shop_name, p.username, 'Someone')
  INTO follower_name
  FROM profiles p
  LEFT JOIN seller_profiles sp ON sp.user_id = p.user_id
  WHERE p.user_id = NEW.follower_id
  LIMIT 1;
  
  -- Notify the user being followed
  INSERT INTO public.notifications (user_id, type, title, message, follower_id)
  VALUES (
    NEW.followed_user_id,
    'new_follow',
    'New Follower',
    follower_name || ' started following you!',
    NEW.follower_id
  );
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_order_shipped
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_shipped();

CREATE TRIGGER trigger_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order();

CREATE TRIGGER trigger_new_follow
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follow();