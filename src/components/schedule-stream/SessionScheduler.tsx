import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, X, ShoppingBag, Package, Edit2 } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScheduledShow, Product } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { TIME_SLOTS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { fetchLivestreamProducts, createScheduledShowProducts, createStream } from '@/services/streams';
import { isFailure } from '@/types/api';

interface SessionSchedulerProps {
  isMultiSchedule: boolean;
  onMultiScheduleChange: (value: boolean) => void;
  selectedDate?: Date;
  onSelectedDateChange: (date: Date | undefined) => void;
  selectedTime: string;
  onSelectedTimeChange: (time: string) => void;
  scheduledShows: ScheduledShow[];
  onScheduledShowsChange: (shows: ScheduledShow[]) => void;
  streamTitle?: string;
  streamData: any;
}

export interface SessionSchedulerRef {
  saveShows: () => Promise<void>;
}

export const SessionScheduler = forwardRef<SessionSchedulerRef, SessionSchedulerProps>(
  (
    {
      isMultiSchedule,
      onMultiScheduleChange,
      selectedDate,
      onSelectedDateChange,
      selectedTime,
      onSelectedTimeChange,
      scheduledShows,
      onScheduledShowsChange,
      streamTitle,
      streamData,
    },
    ref,
  ) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State for repeat sessions
    const [isWeeklyRepeat, setIsWeeklyRepeat] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [repeatStartDate, setRepeatStartDate] = useState<Date>();
    const [repeatWeeks, setRepeatWeeks] = useState<number>(1);
    const [repeatShows, setRepeatShows] = useState<ScheduledShow[]>([]);
    const [editingShowTitle, setEditingShowTitle] = useState<string | null>(null);

    // Fetch existing livestream products for this user
    const { data: existingProducts = [] } = useQuery({
      queryKey: ['livestream-products', user?.id],
      queryFn: async () => {
        if (!user?.id) return [];

        const result = await fetchLivestreamProducts(user.id);
        if (isFailure(result)) {
          console.error('Error fetching livestream products:', result.error);
          return [];
        }

        return result.data;
      },
      enabled: !!user?.id,
    });

    // Timezone options
    const timezones = [
      { value: 'UTC', label: 'UTC (GMT+0)' },
      { value: 'Europe/London', label: 'London (GMT+0/+1)' },
      { value: 'Europe/Paris', label: 'Paris (GMT+1/+2)' },
      { value: 'America/New_York', label: 'New York (GMT-5/-4)' },
      { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8/-7)' },
      { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
      { value: 'Australia/Sydney', label: 'Sydney (GMT+10/+11)' },
    ];

    // Duration options in hours
    const durations = [
      { value: '0.5', label: '30 minutes' },
      { value: '1', label: '1 hour' },
      { value: '1.5', label: '1.5 hours' },
      { value: '2', label: '2 hours' },
      { value: '3', label: '3 hours' },
      { value: '4', label: '4 hours' },
      { value: '6', label: '6 hours' },
      { value: '8', label: '8 hours' },
    ];

    // Generate repeat shows based on selected days and weeks
    const generateRepeatShows = () => {
      if (!repeatStartDate || selectedDays.length === 0 || scheduledShows.length === 0) {
        setRepeatShows([]);
        return;
      }

      const shows: ScheduledShow[] = [];
      const dayMapping = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };

      // Use values from first scheduled show
      const firstShow = scheduledShows[0];
      const showTime = firstShow.time || '10:00';
      const showDuration = firstShow.duration || '2';
      const showTimezone = firstShow.timezone || 'Europe/London';
      const showTitle = streamTitle || 'Live Stream';

      for (let week = 0; week < repeatWeeks; week++) {
        selectedDays.forEach((dayName) => {
          const targetDayIndex = dayMapping[dayName as keyof typeof dayMapping];
          const weekStart = addWeeks(startOfWeek(repeatStartDate, { weekStartsOn: 0 }), week);
          const showDate = addDays(weekStart, targetDayIndex);

          // Only add if within 4 weeks and not in the past
          const now = new Date();
          const fourWeeksFromNow = new Date(now.getTime() + 4 * 7 * 24 * 60 * 60 * 1000);

          if (showDate >= new Date(now.setHours(0, 0, 0, 0)) && showDate <= fourWeeksFromNow) {
            shows.push({
              id: `repeat-${week}-${dayName}-${Date.now()}`,
              title: showTitle,
              date: showDate,
              time: showTime,
              duration: showDuration,
              timezone: showTimezone,
              products: [],
            });
          }
        });
      }

      setRepeatShows(shows.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()));
    };

    useEffect(() => {
      generateRepeatShows();
    }, [repeatStartDate, selectedDays, repeatWeeks, scheduledShows]);

    // Set repeat start date to day after show 1 date
    useEffect(() => {
      if (scheduledShows.length > 0 && scheduledShows[0].date) {
        const dayAfterShow1 = addDays(scheduledShows[0].date, 1);
        setRepeatStartDate(dayAfterShow1);
      }
    }, [scheduledShows]);

    // Days of the week for repeat scheduling
    const daysOfWeek = [
      { value: 'monday', label: 'Monday' },
      { value: 'tuesday', label: 'Tuesday' },
      { value: 'wednesday', label: 'Wednesday' },
      { value: 'thursday', label: 'Thursday' },
      { value: 'friday', label: 'Friday' },
      { value: 'saturday', label: 'Saturday' },
      { value: 'sunday', label: 'Sunday' },
    ];
    const toggleDaySelection = (day: string) => {
      setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
    };

    const updateRepeatShow = (id: string, field: keyof ScheduledShow, value: any) => {
      setRepeatShows((prev) => prev.map((show) => (show.id === id ? { ...show, [field]: value } : show)));
    };

    const addScheduledShow = () => {
      const newShow: ScheduledShow = {
        id: Date.now().toString(),
        title: '',
        date: undefined,
        time: '',
        products: [],
      };
      onScheduledShowsChange([...scheduledShows, newShow]);
    };

    const removeScheduledShow = (id: string) => {
      if (scheduledShows.length > 1) {
        onScheduledShowsChange(scheduledShows.filter((show) => show.id !== id));
      }
    };

    const updateScheduledShow = (id: string, field: keyof ScheduledShow, value: any) => {
      onScheduledShowsChange(scheduledShows.map((show) => (show.id === id ? { ...show, [field]: value } : show)));
    };

    const addProductToShow = (showId: string, existingProductId?: string) => {
      if (existingProductId) {
        // Add existing product
        const existingProduct = existingProducts.find((p) => p.id === existingProductId);
        if (existingProduct) {
          onScheduledShowsChange(
            scheduledShows.map((show) =>
              show.id === showId
                ? { ...show, products: [...show.products, { ...existingProduct, id: Date.now().toString() }] }
                : show,
            ),
          );
        }
      } else {
        // Add new product
        const newProduct: Product = {
          id: Date.now().toString(),
          name: '',
          description: '',
          price: '',
          itemCount: 1,
        };

        onScheduledShowsChange(
          scheduledShows.map((show) =>
            show.id === showId ? { ...show, products: [...show.products, newProduct] } : show,
          ),
        );
      }
    };

    const updateProduct = (showId: string, productId: string, field: keyof Product, value: any) => {
      onScheduledShowsChange(
        scheduledShows.map((show) =>
          show.id === showId
            ? {
                ...show,
                products: show.products.map((product) =>
                  product.id === productId ? { ...product, [field]: value } : product,
                ),
              }
            : show,
        ),
      );
    };

    const removeProduct = (showId: string, productId: string) => {
      onScheduledShowsChange(
        scheduledShows.map((show) =>
          show.id === showId ? { ...show, products: show.products.filter((p) => p.id !== productId) } : show,
        ),
      );
    };

    // Save shows to database
    const saveShowsToDatabase = async () => {
      if (!user?.id) return;

      try {
        // Combine main shows and repeat shows
        const allShows = [...scheduledShows, ...repeatShows];

        for (const show of allShows) {
          if (!show.date || !show.time) continue;

          // Create proper datetime using the show's timezone
          const [hours, minutes] = show.time.split(':');
          const showDateTime = new Date(show.date);
          showDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Create stream entry
          const streamResult = await createStream({
            seller_id: user.id,
            title: show.title || streamTitle || 'Live Stream',
            description: streamData?.description || '',
            category: streamData?.category || 'General',
            thumbnail: streamData?.thumbnail,
            start_time: showDateTime.toISOString(),
            status: 'scheduled',
            duration: show.duration || '2',
            timezone: show.timezone || 'Europe/London',
          });

          if (isFailure(streamResult)) {
            console.error('Error creating stream:', streamResult.error);
            continue;
          }

          const newStreamData = streamResult.data;

          // Add products for this show
          if (show.products.length > 0) {
            const productsToInsert = show.products.map((product) => ({
              show_id: newStreamData.id,
              product_id: product.id,
              product_name: product.name,
              product_price: parseFloat(product.price) || 0,
              quantity: product.itemCount,
            }));

            const productsResult = await createScheduledShowProducts(productsToInsert);

            if (isFailure(productsResult)) {
              console.error('Error adding show products:', productsResult.error);
            }
          }
        }

        // Show success message and navigate
        toast.success('Shows scheduled successfully!');
        navigate('/seller?tab=streams');
      } catch (error) {
        console.error('Error saving shows:', error);
        toast.error('Failed to schedule shows');
      }
    };

    // Expose the save function to parent component
    useImperativeHandle(ref, () => ({
      saveShows: saveShowsToDatabase,
    }));

    return (
      <div className="space-y-6">
        {/* Session Configuration */}
        <Card className="p-6">
          <h2 className="mb-6 flex items-center text-xl font-semibold">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Schedule Show
          </h2>

          <div className="space-y-6">
            {!isMultiSchedule ? (
              // Single Session Mode
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-base font-medium">Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'mt-2 w-full justify-start text-left font-normal',
                          !selectedDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={onSelectedDateChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-base font-medium">Time *</Label>
                  <Select value={selectedTime} onValueChange={onSelectedTimeChange}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              // Multi Session Mode
              <div className="space-y-4">
                {scheduledShows.map((show, index) => (
                  <div key={show.id} className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Show {index + 1}</h4>
                      {scheduledShows.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeScheduledShow(show.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div>
                        <Label className="text-sm font-medium">Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'mt-1 w-full justify-start text-left font-normal',
                                !show.date && 'text-muted-foreground',
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {show.date ? format(show.date, 'PPP') : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={show.date}
                              onSelect={(date) => updateScheduledShow(show.id, 'date', date)}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                              className={cn('pointer-events-auto p-3')}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Time *</Label>
                        <Select
                          value={show.time}
                          onValueChange={(value) => updateScheduledShow(show.id, 'time', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Timezone</Label>
                        <Select
                          defaultValue="Europe/London"
                          onValueChange={(value) => updateScheduledShow(show.id, 'timezone', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Duration</Label>
                        <Select
                          defaultValue="2"
                          onValueChange={(value) => updateScheduledShow(show.id, 'duration', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {durations.map((duration) => (
                              <SelectItem key={duration.value} value={duration.value}>
                                {duration.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Products section for each session */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <Label className="flex items-center text-sm font-medium">
                          <Package className="mr-2 h-4 w-4" />
                          Show Products
                        </Label>
                      </div>

                      {existingProducts.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed bg-muted/20 py-8 text-center">
                          <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                          <p className="mb-3 text-sm text-muted-foreground">No livestream products found</p>
                          <p className="text-xs text-muted-foreground">
                            Create livestream products first to select them for sessions
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                          {existingProducts.map((product) => {
                            const isSelected = show.products.some((p) => p.name === product.name);
                            return (
                              <Card
                                key={product.id}
                                className={cn(
                                  'cursor-pointer transition-all',
                                  isSelected ? 'bg-primary/5 ring-2 ring-primary' : 'hover:bg-muted/50',
                                )}
                                onClick={() => {
                                  if (isSelected) {
                                    // Remove product
                                    const showProduct = show.products.find((p) => p.name === product.name);
                                    if (showProduct) {
                                      removeProduct(show.id, showProduct.id);
                                    }
                                  } else {
                                    // Add product
                                    addProductToShow(show.id, product.id);
                                  }
                                }}
                              >
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    {/* Product Image */}
                                    <div className="w-full">
                                      <div className="flex h-20 w-full items-center justify-center rounded border bg-muted">
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="space-y-1">
                                      <h4 className="truncate text-sm font-medium text-foreground">{product.name}</h4>
                                      <div className="text-sm font-medium text-primary">£{product.price}</div>
                                      {isSelected && <div className="text-xs font-medium text-primary">✓ Selected</div>}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Repeat Shows Card */}
        <Card className="p-6">
          <h2 className="mb-6 flex items-center text-xl font-semibold">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Repeat Shows
          </h2>

          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch id="weekly-repeat" checked={isWeeklyRepeat} onCheckedChange={setIsWeeklyRepeat} />
              <Label htmlFor="weekly-repeat" className="text-base font-medium">
                Schedule weekly recurring shows
              </Label>
            </div>

            {isWeeklyRepeat && (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="col-span-3">
                    <Label className="text-sm font-medium">Select Days</Label>
                    <div className="mt-2 grid grid-cols-7 gap-1">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day.value}
                          variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleDaySelection(day.value)}
                          className="text-xs"
                        >
                          {day.label.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Repeat For (Weeks)</Label>
                    <Select value={repeatWeeks.toString()} onValueChange={(value) => setRepeatWeeks(parseInt(value))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select weeks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Week</SelectItem>
                        <SelectItem value="2">2 Weeks</SelectItem>
                        <SelectItem value="3">3 Weeks</SelectItem>
                        <SelectItem value="4">4 Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Start Date (Day after Show 1)</Label>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {repeatStartDate ? format(repeatStartDate, 'PPP') : 'Automatically set to day after Show 1'}
                  </div>
                </div>

                {/* Generated Shows */}
                {repeatShows.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Generated Shows ({repeatShows.length})</h3>
                    <div className="space-y-3">
                      {repeatShows.map((show, index) => (
                        <div key={show.id} className="rounded-lg border bg-muted/20 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">Show {index + 2}</h4>
                              {editingShowTitle === show.id ? (
                                <Input
                                  value={show.title}
                                  onChange={(e) => updateRepeatShow(show.id, 'title', e.target.value)}
                                  onBlur={() => setEditingShowTitle(null)}
                                  onKeyDown={(e) => e.key === 'Enter' && setEditingShowTitle(null)}
                                  className="h-8 w-48"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">{show.title}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingShowTitle(show.id)}
                                    className="h-6 w-6"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">
                              {show.date ? format(show.date, 'E MMM do yyyy') : 'No date'}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                              <Label className="text-sm font-medium">Date</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'mt-1 w-full justify-start text-left font-normal',
                                      !show.date && 'text-muted-foreground',
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {show.date ? format(show.date, 'PPP') : 'Select date'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={show.date}
                                    onSelect={(date) => updateRepeatShow(show.id, 'date', date)}
                                    disabled={(date) => {
                                      const now = new Date();
                                      const fourWeeksFromNow = new Date(now.getTime() + 4 * 7 * 24 * 60 * 60 * 1000);
                                      return (
                                        date < new Date(new Date().setHours(0, 0, 0, 0)) || date > fourWeeksFromNow
                                      );
                                    }}
                                    initialFocus
                                    className={cn('pointer-events-auto p-3')}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Time</Label>
                              <Select
                                value={show.time}
                                onValueChange={(value) => updateRepeatShow(show.id, 'time', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_SLOTS.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Duration</Label>
                              <Select
                                value={show.duration}
                                onValueChange={(value) => updateRepeatShow(show.id, 'duration', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                  {durations.map((duration) => (
                                    <SelectItem key={duration.value} value={duration.value}>
                                      {duration.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Timezone</Label>
                              <Select
                                value={show.timezone}
                                onValueChange={(value) => updateRepeatShow(show.id, 'timezone', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timezones.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                      {tz.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="text-sm text-muted-foreground">
              <p>• Shows can only be scheduled up to 4 weeks in advance</p>
              <p>• Select the days of the week you want to repeat shows</p>
              <p>• Each recurring show will use the same stream details</p>
            </div>
          </div>
        </Card>
      </div>
    );
  },
);

SessionScheduler.displayName = 'SessionScheduler';
