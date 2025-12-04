import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Share2, Settings, Timer, Gift, Box, Plus, Play } from 'lucide-react';
import Header from '@/components/Header';
import BiddingSection from '@/components/BiddingSection';
import LiveChat from '@/components/LiveChat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgora } from '@/hooks/useAgora';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchOrdersByStreamId } from '@/services/orders';
import { fetchProductsByIds, createStreamAuctionListing, endStreamAuction } from '@/services/products';
import { subscribeToPostgresChanges } from '@/services/realtime';
import { isFailure } from '@/types/api';

interface MysteryBox {
  id: string;
  name: string;
  boxCount: number;
  createdAt: Date;
}

interface Giveaway {
  id: string;
  title: string;
  description: string;
  duration: number;
  createdAt: Date;
}

const StartStreamPage = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const currentStreamId = streamId || `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const [isLive, setIsLive] = useState(false);
  const [viewerCount] = useState(0);
  const [auctionPrice, setAuctionPrice] = useState('');
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [auctionEndTime, setAuctionEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeListing, setActiveListing] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Show features state (mock data - in real app would come from MyShow)
  const [mysteryBoxes] = useState<MysteryBox[]>([
    { id: 'mb-1', name: 'Vintage Surprise Box', boxCount: 5, createdAt: new Date() },
    { id: 'mb-2', name: 'Designer Items Mystery', boxCount: 3, createdAt: new Date() },
  ]);
  const [giveaways] = useState<Giveaway[]>([
    {
      id: 'g-1',
      title: 'Stream Milestone Giveaway',
      description: 'Celebrate 100 viewers!',
      duration: 15,
      createdAt: new Date(),
    },
  ]);
  const [selectedShowFeatures, setSelectedShowFeatures] = useState<string[]>([]);
  const [runningFeatures, setRunningFeatures] = useState<string[]>([]);
  const [showFeaturesDialog, setShowFeaturesDialog] = useState(false);

  // Quick price selection
  const [quickPrices, setQuickPrices] = useState(['1', '2', '5', '10']);
  const [selectedQuickPrice, setSelectedQuickPrice] = useState<string | null>(null);
  const [showPriceSettings, setShowPriceSettings] = useState(false);

  // Auction duration controls
  const [quickDurations, setQuickDurations] = useState([10, 15, 20, 30]);
  const [auctionDuration, setAuctionDuration] = useState(30); // default 30 seconds
  const [customDuration, setCustomDuration] = useState('');
  const [showDurationSettings, setShowDurationSettings] = useState(false);

  // Sales tracking
  const [recentSales, setRecentSales] = useState<
    Array<{
      id: string;
      itemName: string;
      price: number;
      soldAt: Date;
    }>
  >([]);

  const videoContainerRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    configLoaded,
    configError,
    remoteUsers,
    startVideo,
    stopVideo,
    startAudio,
    stopAudio,
    playLocalVideo,
  } = useAgora({
    channelName: currentStreamId,
    isHost: true,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  // Fetch recent sales for this stream
  useEffect(() => {
    const fetchRecentSales = async () => {
      if (!user) return;

      try {
        const ordersResult = await fetchOrdersByStreamId(currentStreamId, {
          status: 'completed',
          limit: 10,
        });

        if (isFailure(ordersResult)) {
          console.error('Error fetching recent sales:', ordersResult.error);
          return;
        }

        const orders = ordersResult.data;
        if (orders && orders.length > 0) {
          // Get listing details for each order
          const listingIds = orders.map((order) => order.listing_id);
          const listingsResult = await fetchProductsByIds(listingIds);
          const listings = isFailure(listingsResult) ? [] : listingsResult.data;

          const salesData = orders.map((order, index) => {
            const listing = listings?.find((l) => l.id === order.listing_id);
            return {
              id: order.id,
              itemName: listing?.product_name || `Item ${index + 1}`,
              price: Number(order.order_amount),
              soldAt: new Date(order.created_at),
            };
          });
          setRecentSales(salesData);
        }
      } catch (error) {
        console.error('Error fetching recent sales:', error);
      }
    };

    fetchRecentSales();

    // Set up real-time subscription for new sales
    const unsubscribe = subscribeToPostgresChanges(
      'orders-changes',
      {
        table: 'orders',
        filter: `stream_id=eq.${currentStreamId}`,
        event: 'INSERT',
      },
      () => {
        // Refetch sales when new order is created
        fetchRecentSales();
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user, currentStreamId]);

  // Auto-play local video when enabled
  useEffect(() => {
    if (isVideoEnabled && videoContainerRef.current) {
      playLocalVideo(videoContainerRef.current);
    }
  }, [isVideoEnabled, playLocalVideo]);

  // Countdown timer for auction
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isAuctionActive && auctionEndTime) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const end = auctionEndTime.getTime();
        const diff = end - now;

        if (diff <= 0) {
          setTimeRemaining(0);
          setIsAuctionActive(false);
          endAuction();
        } else {
          setTimeRemaining(Math.floor(diff / 1000));
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuctionActive, auctionEndTime]);

  const endAuction = async () => {
    if (!activeListing) return;

    try {
      const result = await endStreamAuction(activeListing);
      if (isFailure(result)) throw result.error;

      setIsAuctionActive(false);
      setAuctionEndTime(null);
      setActiveListing(null);

      toast({
        title: 'Auction Ended',
        description: 'The auction has been completed',
      });
    } catch (error) {
      console.error('Error ending auction:', error);
      toast({
        title: 'Error',
        description: 'Failed to end auction',
        variant: 'destructive',
      });
    }
  };

  const handleStartStream = async () => {
    try {
      if (!isConnected) {
        toast({
          title: 'Connection Required',
          description: 'Please wait for Agora connection to complete',
          variant: 'destructive',
        });
        return;
      }

      if (!isVideoEnabled) await startVideo();
      if (!isAudioEnabled) await startAudio();
      setIsLive(true);

      toast({
        title: 'Stream started!',
        description: 'Your stream is now live',
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: 'Failed to start stream',
        description: error instanceof Error ? error.message : 'Please check your camera and microphone permissions',
        variant: 'destructive',
      });
    }
  };

  const handleStopStream = async () => {
    try {
      if (isVideoEnabled) await stopVideo();
      if (isAudioEnabled) await stopAudio();
      setIsLive(false);

      toast({
        title: 'Stream ended',
        description: 'Your stream has been stopped',
      });
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  };

  const handleShareStream = () => {
    const streamUrl = `${window.location.origin}/stream/${currentStreamId}`;
    navigator.clipboard.writeText(streamUrl);
    toast({
      title: 'Stream link copied!',
      description: 'Share this link with your viewers',
    });
  };

  const handleToggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        await stopVideo();
      } else {
        await startVideo();
      }
    } catch (error) {
      toast({
        title: 'Camera error',
        description: 'Failed to toggle camera',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAudio = async () => {
    try {
      if (isAudioEnabled) {
        await stopAudio();
      } else {
        await startAudio();
      }
    } catch (error) {
      toast({
        title: 'Microphone error',
        description: 'Failed to toggle microphone',
        variant: 'destructive',
      });
    }
  };

  const handleStartAuction = async () => {
    if (!auctionPrice || !user) return;

    try {
      const endTime = new Date(Date.now() + auctionDuration * 1000);
      const result = await createStreamAuctionListing({
        seller_id: user.id,
        stream_id: currentStreamId,
        product_name: 'Auction Item',
        product_description: 'Live auction item from stream',
        starting_price: parseFloat(auctionPrice),
        current_bid: parseFloat(auctionPrice),
        auction_end_time: endTime.toISOString(),
      });

      if (isFailure(result)) throw result.error;

      setActiveListing(result.data.id);
      setIsAuctionActive(true);
      setAuctionEndTime(endTime);

      toast({
        title: 'Auction Started!',
        description: `${auctionDuration}-second auction is now live`,
      });
    } catch (error) {
      toast({
        title: 'Failed to start auction',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleEndAuction = async () => {
    if (!activeListing) return;
    await endAuction();
  };

  const handleToggleShowFeature = (featureId: string, type: 'mystery-box' | 'giveaway') => {
    setSelectedShowFeatures((prev) => {
      if (prev.includes(featureId)) {
        return prev.filter((id) => id !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
  };

  const handleStartFeature = (featureId: string, type: 'mystery-box' | 'giveaway') => {
    setRunningFeatures((prev) => [...prev, featureId]);

    const featureName =
      type === 'mystery-box'
        ? mysteryBoxes.find((mb) => mb.id === featureId)?.name
        : giveaways.find((g) => g.id === featureId)?.title;

    toast({
      title: 'Feature Started',
      description: `${featureName} is now running`,
    });

    // Auto-stop after feature duration for giveaways
    if (type === 'giveaway') {
      const giveaway = giveaways.find((g) => g.id === featureId);
      if (giveaway) {
        setTimeout(
          () => {
            setRunningFeatures((prev) => prev.filter((id) => id !== featureId));
            toast({
              title: 'Giveaway Ended',
              description: `${giveaway.title} has finished`,
            });
          },
          giveaway.duration * 60 * 1000,
        );
      }
    }
  };

  const handleStopFeature = (featureId: string, type: 'mystery-box' | 'giveaway') => {
    setRunningFeatures((prev) => prev.filter((id) => id !== featureId));

    const featureName =
      type === 'mystery-box'
        ? mysteryBoxes.find((mb) => mb.id === featureId)?.name
        : giveaways.find((g) => g.id === featureId)?.title;

    toast({
      title: 'Feature Stopped',
      description: `${featureName} has ended`,
    });
  };

  const handleQuickPriceSelect = (price: string) => {
    setSelectedQuickPrice(price);
    setAuctionPrice(price);
  };

  const handleQuickTimeSelect = (seconds: number) => {
    setAuctionDuration(seconds);
    setCustomDuration('');
  };

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value);
    if (value && !isNaN(Number(value))) {
      setAuctionDuration(Number(value));
    }
  };

  const handleExtendAuction = () => {
    if (auctionEndTime) {
      const extendedTime = new Date(auctionEndTime.getTime() + 60 * 1000);
      setAuctionEndTime(extendedTime);
      toast({
        title: 'Auction Extended',
        description: 'Added 60 seconds to the auction',
      });
    }
  };

  const allFeatures = [
    ...mysteryBoxes.map((mb) => ({
      ...mb,
      type: 'mystery-box' as const,
      displayName: mb.name,
      details: `${mb.boxCount} boxes`,
    })),
    ...giveaways.map((g) => ({ ...g, type: 'giveaway' as const, displayName: g.title, details: `${g.duration} min` })),
  ];

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex h-[calc(100vh-80px)] flex-1 overflow-hidden">
        {/* Left Sidebar - Stream Setup */}
        <div className="w-[30%] overflow-y-auto border-r bg-card">
          <div className="space-y-4 p-4">
            <div className="space-y-4">
              {/* Show Features Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Show Features</h4>
                  <Dialog open={showFeaturesDialog} onOpenChange={setShowFeaturesDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <Plus className="mr-1 h-3 w-3" />
                        Select
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select Show Features</DialogTitle>
                        <DialogDescription>Choose features to include in your stream</DialogDescription>
                      </DialogHeader>
                      <div className="max-h-96 space-y-3 overflow-y-auto">
                        {allFeatures.map((feature) => (
                          <div key={feature.id} className="flex items-center justify-between rounded border p-3">
                            <div className="flex items-center gap-3">
                              {feature.type === 'mystery-box' ? (
                                <Box className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Gift className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{feature.displayName}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {feature.type === 'mystery-box' ? 'Mystery Box' : 'Giveaway'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{feature.details}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant={selectedShowFeatures.includes(feature.id) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleShowFeature(feature.id, feature.type)}
                            >
                              {selectedShowFeatures.includes(feature.id) ? 'Selected' : 'Select'}
                            </Button>
                          </div>
                        ))}
                        {allFeatures.length === 0 && (
                          <div className="py-4 text-center text-muted-foreground">
                            <p className="text-sm">No show features available</p>
                            <p className="text-xs">Create features in My Show tab</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Selected Features */}
                <div className="space-y-2">
                  {selectedShowFeatures.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground">
                      <p className="text-sm">No features selected</p>
                      <p className="text-xs">Click Select to add features</p>
                    </div>
                  ) : (
                    selectedShowFeatures.map((featureId) => {
                      const feature = allFeatures.find((f) => f.id === featureId);
                      if (!feature) return null;

                      const isRunning = runningFeatures.includes(featureId);

                      return (
                        <div key={featureId} className="flex items-center justify-between rounded border bg-card p-3">
                          <div className="flex items-center gap-3">
                            {feature.type === 'mystery-box' ? (
                              <Box className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Gift className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{feature.displayName}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {feature.type === 'mystery-box' ? 'Mystery Box' : 'Giveaway'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{feature.details}</span>
                                {isRunning && (
                                  <Badge variant="default" className="text-xs">
                                    Running
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant={isRunning ? 'outline' : 'default'}
                            size="sm"
                            onClick={() =>
                              isRunning
                                ? handleStopFeature(featureId, feature.type)
                                : handleStartFeature(featureId, feature.type)
                            }
                            className="h-8"
                          >
                            {isRunning ? (
                              <>Stop</>
                            ) : (
                              <>
                                <Play className="mr-1 h-3 w-3" />
                                Start
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Auction Price Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Starting Auction Price</Label>
                  <Dialog open={showPriceSettings} onOpenChange={setShowPriceSettings}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Customize Price Buttons</DialogTitle>
                        <DialogDescription>Set your preferred quick price values</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                          {quickPrices.map((price, index) => (
                            <Input
                              key={index}
                              type="number"
                              value={price}
                              onChange={(e) => {
                                const newPrices = [...quickPrices];
                                newPrices[index] = e.target.value;
                                setQuickPrices(newPrices);
                              }}
                              className="text-center text-xs"
                              min="0"
                              step="0.01"
                            />
                          ))}
                        </div>
                        <Button onClick={() => setShowPriceSettings(false)} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex gap-2">
                  <div className="grid flex-1 grid-cols-4 gap-1">
                    {quickPrices.map((price) => (
                      <Button
                        key={price}
                        variant={selectedQuickPrice === price ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleQuickPriceSelect(price)}
                        className="h-8 text-xs"
                      >
                        £{price}
                      </Button>
                    ))}
                  </div>
                  <div className="relative w-20">
                    <Input
                      type="number"
                      placeholder="£"
                      value={auctionPrice}
                      onChange={(e) => {
                        setAuctionPrice(e.target.value);
                        setSelectedQuickPrice(null);
                      }}
                      className="h-8 text-center text-xs"
                      min="0"
                      step="0.01"
                      disabled={isAuctionActive}
                    />
                  </div>
                </div>
              </div>

              {/* Auction Time Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Auction Duration</Label>
                  <Dialog open={showDurationSettings} onOpenChange={setShowDurationSettings}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Customize Duration Buttons</DialogTitle>
                        <DialogDescription>Set your preferred quick duration values (seconds)</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                          {quickDurations.map((duration, index) => (
                            <Input
                              key={index}
                              type="number"
                              value={duration}
                              onChange={(e) => {
                                const newDurations = [...quickDurations];
                                newDurations[index] = Number(e.target.value);
                                setQuickDurations(newDurations);
                              }}
                              className="text-center text-xs"
                              min="1"
                            />
                          ))}
                        </div>
                        <Button onClick={() => setShowDurationSettings(false)} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex gap-2">
                  <div className="grid flex-1 grid-cols-4 gap-1">
                    {quickDurations.map((seconds) => (
                      <Button
                        key={seconds}
                        variant={auctionDuration === seconds && !customDuration ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleQuickTimeSelect(seconds)}
                        className="h-8 text-xs"
                        disabled={isAuctionActive}
                      >
                        {seconds}s
                      </Button>
                    ))}
                  </div>
                  <div className="relative w-20">
                    <Input
                      type="number"
                      placeholder="s"
                      value={customDuration}
                      onChange={(e) => handleCustomDurationChange(e.target.value)}
                      className="h-8 text-center text-xs"
                      min="1"
                      disabled={isAuctionActive}
                    />
                  </div>
                </div>
                {isAuctionActive && (
                  <Button onClick={handleExtendAuction} variant="outline" size="sm" className="w-full">
                    <Plus className="mr-1 h-3 w-3" />
                    Extend +60s
                  </Button>
                )}
              </div>

              {/* Auction Controls */}
              <div className="space-y-3 pt-4">
                {!isAuctionActive ? (
                  <Button
                    onClick={handleStartAuction}
                    disabled={!auctionPrice || !isLive}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    Start Auction
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 p-3 text-center">
                      <Timer className="h-5 w-5 text-primary" />
                      <span className="font-mono text-lg font-bold">
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <Button onClick={handleEndAuction} variant="outline" className="w-full" size="lg">
                      End Auction
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Auction Status */}
            {isAuctionActive && (
              <div className="border-t pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Timer className="h-4 w-4" />
                      Live Auction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">${auctionPrice}</p>
                      <p className="text-sm text-muted-foreground">Starting Price</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Stream Stats */}
            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium">Stream Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isLive ? 'default' : 'secondary'}>{isLive ? 'Live' : 'Offline'}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Viewers</span>
                  <span className="font-medium">{viewerCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Connection</span>
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Video Player */}
        <div className="flex flex-1 flex-col bg-background">
          {/* Stream Actions */}
          <div className="flex h-20 items-center justify-center border-b border-border p-4">
            <div className="flex justify-center gap-3">
              {!isLive ? (
                <Button onClick={handleStartStream} className="bg-red-500 text-white hover:bg-red-600" size="lg">
                  Start Streaming
                </Button>
              ) : (
                <Button onClick={handleStopStream} variant="outline" size="lg">
                  End Stream
                </Button>
              )}

              <Button onClick={handleShareStream} variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share Stream
              </Button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-4">
            <div className="w-full max-w-xs">
              <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-black">
                {configError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 text-white">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
                        <VideoOff className="h-8 w-8" />
                      </div>
                      <p className="text-lg font-medium">Configuration Error</p>
                      <p className="text-sm text-gray-300">{configError}</p>
                    </div>
                  </div>
                ) : !configLoaded ? (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent bg-white/40" />
                      </div>
                      <p className="text-lg font-medium">Loading Stream...</p>
                      <p className="text-sm text-gray-300">Setting up your camera</p>
                    </div>
                  </div>
                ) : !isConnected ? (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                        <Video className="h-8 w-8" />
                      </div>
                      <p className="text-lg font-medium">Connecting...</p>
                      <p className="text-sm text-gray-300">Preparing your stream</p>
                    </div>
                  </div>
                ) : !isVideoEnabled ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                        <VideoOff className="h-8 w-8" />
                      </div>
                      <p className="text-lg font-medium">Camera Off</p>
                      <p className="text-sm text-gray-300">Click the camera button to turn on</p>
                    </div>
                  </div>
                ) : (
                  <div ref={videoContainerRef} className="absolute inset-0 h-full w-full" />
                )}

                {/* Stream Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 rounded-lg bg-black/50 p-2 backdrop-blur-sm">
                    <Button
                      size="sm"
                      variant={isVideoEnabled ? 'default' : 'secondary'}
                      onClick={handleToggleVideo}
                      disabled={!configLoaded}
                    >
                      {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>

                    <Button
                      size="sm"
                      variant={isAudioEnabled ? 'default' : 'secondary'}
                      onClick={handleToggleAudio}
                      disabled={!configLoaded}
                    >
                      {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>

                    <Button size="sm" variant="outline" disabled>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Live Indicator */}
                {isLive && (
                  <div className="absolute left-4 top-4">
                    <Badge className="bg-red-500 text-white">
                      <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-white" />
                      LIVE
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Live Chat & Sales */}
        <div className="flex h-[calc(100vh-80px)] w-[30%] flex-1 flex-col border-l bg-card">
          <div className="flex h-full flex-1 flex-col">
            {/* Bidding Section */}
            {isAuctionActive && (
              <div className="border-b">
                <BiddingSection streamId={currentStreamId} isStreamer={true} />
              </div>
            )}

            {/* Live Chat - Expanded */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <LiveChat streamId={currentStreamId} />
            </div>

            {/* Recent Sales List */}
            <div className="max-h-48 overflow-y-auto border-t bg-background/50">
              <div className="p-3">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                  Recent Sales ({recentSales.length})
                </h4>
                <div className="space-y-2">
                  {recentSales.length > 0 ? (
                    recentSales.map((sale, index) => (
                      <div key={sale.id} className="flex items-center justify-between py-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="px-1 text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="truncate font-medium">{sale.itemName}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">£{sale.price.toFixed(2)}</div>
                          <div className="text-muted-foreground">
                            {sale.soldAt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">No sales yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StartStreamPage;
