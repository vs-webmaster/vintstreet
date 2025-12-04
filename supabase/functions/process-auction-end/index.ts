import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get all auctions that have ended but haven't been processed
    const { data: endedAuctions, error: auctionsError } = await supabase
      .from('auctions')
      .select(
        `
        id,
        listing_id,
        current_bid,
        reserve_price,
        reserve_met,
        end_time,
        winner_id,
        listings (
          id,
          product_name,
          starting_price,
          seller_id
        )
      `,
      )
      .eq('status', 'active')
      .lt('end_time', new Date().toISOString());

    if (auctionsError) throw auctionsError;

    const results = [];

    for (const auction of endedAuctions || []) {
      try {
        // Get the highest bid
        const { data: highestBid, error: bidError } = await supabase
          .from('bids')
          .select('*')
          .eq('auction_id', auction.id)
          .order('bid_amount', { ascending: false })
          .limit(1)
          .single();

        if (bidError && bidError.code !== 'PGRST116') {
          throw bidError;
        }

        let auctionStatus = 'ended';
        let winnerId = null;
        let paymentProcessed = false;

        // Check if there's a winner (bid meets reserve or no reserve)
        if (highestBid && (auction.reserve_met || auction.current_bid >= auction.reserve_price)) {
          winnerId = highestBid.bidder_id;

          // Check if winner has Stripe customer ID on file
          const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('user_id', winnerId)
            .single();

          // If they have payment details, auto-charge
          if (profile?.stripe_customer_id) {
            try {
              // Get seller's Stripe account
              const { data: sellerAccount } = await supabase
                .from('stripe_connected_accounts')
                .select('stripe_account_id')
                .eq('seller_id', auction.listings.seller_id)
                .single();

              if (sellerAccount?.stripe_account_id) {
                // Calculate platform fee (5%)
                const platformFee = Math.round(highestBid.bid_amount * 0.05);
                const sellerAmount = highestBid.bid_amount - platformFee;

                // Create payment intent with split payment
                const paymentIntent = await stripe.paymentIntents.create({
                  amount: Math.round(highestBid.bid_amount * 100), // Convert to cents
                  currency: 'gbp',
                  customer: profile.stripe_customer_id,
                  payment_method_types: ['card'],
                  off_session: true,
                  confirm: true,
                  application_fee_amount: platformFee * 100,
                  transfer_data: {
                    destination: sellerAccount.stripe_account_id,
                  },
                  metadata: {
                    auction_id: auction.id,
                    listing_id: auction.listing_id,
                    buyer_id: winnerId,
                    seller_id: auction.listings.seller_id,
                  },
                });

                // Create order record
                const { error: orderError } = await supabase.from('orders').insert({
                  user_id: winnerId,
                  listing_id: auction.listing_id,
                  total_amount: highestBid.bid_amount,
                  payment_status: 'paid',
                  order_status: 'awaiting_shipment',
                  stripe_payment_intent_id: paymentIntent.id,
                });

                if (orderError) throw orderError;

                paymentProcessed = true;
                auctionStatus = 'completed';

                // Send notification to winner
                await supabase.from('messages').insert({
                  sender_id: auction.listings.seller_id,
                  recipient_id: winnerId,
                  subject: `You won! ${auction.listings.product_name}`,
                  message: `Congratulations! You won the auction for ${auction.listings.product_name}. Payment of £${highestBid.bid_amount.toFixed(2)} has been processed. Your item will be shipped soon.`,
                  listing_id: auction.listing_id,
                  status: 'unread',
                });

                // Send notification to seller
                await supabase.from('messages').insert({
                  sender_id: winnerId,
                  recipient_id: auction.listings.seller_id,
                  subject: `Auction ended - ${auction.listings.product_name}`,
                  message: `Your auction for ${auction.listings.product_name} has ended. The winning bid was £${highestBid.bid_amount.toFixed(2)}. Payment has been processed. Please ship the item to the buyer.`,
                  listing_id: auction.listing_id,
                  status: 'unread',
                });
              }
            } catch (paymentError) {
              console.error('Payment processing error:', paymentError);

              // Send notification to winner about manual payment
              await supabase.from('messages').insert({
                sender_id: auction.listings.seller_id,
                recipient_id: winnerId,
                subject: `Action Required: ${auction.listings.product_name}`,
                message: `You won the auction for ${auction.listings.product_name}! Your winning bid was £${highestBid.bid_amount.toFixed(2)}. Please complete your payment to proceed with the order.`,
                listing_id: auction.listing_id,
                status: 'unread',
              });
            }
          } else {
            // No payment method on file - notify winner
            await supabase.from('messages').insert({
              sender_id: auction.listings.seller_id,
              recipient_id: winnerId,
              subject: `You won! ${auction.listings.product_name}`,
              message: `Congratulations! You won the auction for ${auction.listings.product_name}. Your winning bid was £${highestBid.bid_amount.toFixed(2)}. Please complete your payment to proceed with the order.`,
              listing_id: auction.listing_id,
              status: 'unread',
            });
          }
        } else {
          // No winner - reserve not met or no bids
          await supabase.from('messages').insert({
            sender_id: 'system',
            recipient_id: auction.listings.seller_id,
            subject: `Auction ended - ${auction.listings.product_name}`,
            message: `Your auction for ${auction.listings.product_name} has ended without meeting the reserve price. You can relist the item or adjust the reserve price.`,
            listing_id: auction.listing_id,
            status: 'unread',
          });
        }

        // Update auction status
        const { error: updateError } = await supabase
          .from('auctions')
          .update({
            status: auctionStatus,
            winner_id: winnerId,
          })
          .eq('id', auction.id);

        if (updateError) throw updateError;

        // Update listing status
        await supabase
          .from('listings')
          .update({
            status: winnerId ? 'sold' : 'published',
          })
          .eq('id', auction.listing_id);

        results.push({
          auction_id: auction.id,
          listing_id: auction.listing_id,
          status: auctionStatus,
          winner_id: winnerId,
          payment_processed: paymentProcessed,
        });
      } catch (auctionError) {
        console.error(`Error processing auction ${auction.id}:`, auctionError);
        results.push({
          auction_id: auction.id,
          error: auctionError instanceof Error ? auctionError.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in process-auction-end:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to process auctions' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
