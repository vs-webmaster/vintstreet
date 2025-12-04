-- Create stripe_connected_accounts table
CREATE TABLE IF NOT EXISTS public.stripe_connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id)
);

-- Create stripe_transactions table
CREATE TABLE IF NOT EXISTS public.stripe_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  stripe_charge_id TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL,
  seller_net NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stripe_payouts table
CREATE TABLE IF NOT EXISTS public.stripe_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payout_id TEXT UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_connected_accounts
CREATE POLICY "Sellers can view their own Stripe account"
  ON public.stripe_connected_accounts FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own Stripe account"
  ON public.stripe_connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own Stripe account"
  ON public.stripe_connected_accounts FOR UPDATE
  USING (auth.uid() = seller_id);

-- RLS Policies for stripe_transactions
CREATE POLICY "Sellers can view their transactions"
  ON public.stripe_transactions FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can view their transactions"
  ON public.stripe_transactions FOR SELECT
  USING (auth.uid() = buyer_id);

-- RLS Policies for stripe_payouts
CREATE POLICY "Sellers can view their payouts"
  ON public.stripe_payouts FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can request payouts"
  ON public.stripe_payouts FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Create indexes for better performance
CREATE INDEX idx_stripe_connected_accounts_seller_id ON public.stripe_connected_accounts(seller_id);
CREATE INDEX idx_stripe_transactions_seller_id ON public.stripe_transactions(seller_id);
CREATE INDEX idx_stripe_transactions_buyer_id ON public.stripe_transactions(buyer_id);
CREATE INDEX idx_stripe_transactions_order_id ON public.stripe_transactions(order_id);
CREATE INDEX idx_stripe_payouts_seller_id ON public.stripe_payouts(seller_id);

-- Trigger to update updated_at
CREATE TRIGGER update_stripe_connected_accounts_updated_at
  BEFORE UPDATE ON public.stripe_connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stripe_transactions_updated_at
  BEFORE UPDATE ON public.stripe_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stripe_payouts_updated_at
  BEFORE UPDATE ON public.stripe_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();