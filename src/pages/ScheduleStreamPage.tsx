import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { StreamDetailsForm } from '@/components/schedule-stream/StreamDetailsForm';
import { SessionScheduler, SessionSchedulerRef } from '@/components/schedule-stream/SessionScheduler';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useStreamCategories } from '@/hooks/useSellerData';
import { createStream, createStreams, fetchStreamById, updateStream } from '@/services/streams';
import { isFailure } from '@/types/api';
import { StreamFormData, ScheduledShow } from '@/types';

const ScheduleStreamPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editStreamId = searchParams.get('edit');
  const isEditing = !!editStreamId;
  const sessionSchedulerRef = useRef<SessionSchedulerRef>(null);

  const [isMultiSchedule, setIsMultiSchedule] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [scheduledShows, setScheduledShows] = useState<ScheduledShow[]>([
    { id: '1', title: '', date: undefined, time: '', products: [] },
  ]);
  const [streamData, setStreamData] = useState<StreamFormData>({
    title: '',
    description: '',
    category: '',
    thumbnail: '',
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [showImageDialog, setShowImageDialog] = useState(false);

  // Fetch categories using custom hook
  const { data: categories = [] } = useStreamCategories();

  // Fetch existing stream data if editing
  const { data: existingStream } = useQuery({
    queryKey: ['stream', editStreamId],
    queryFn: async () => {
      if (!editStreamId || !user?.id) return null;

      const result = await fetchStreamById(editStreamId, user.id);

      if (isFailure(result)) {
        console.error('Error fetching stream:', result.error);
        return null;
      }

      const data = result.data;

      // Pre-populate form data
      setStreamData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        thumbnail: data.thumbnail || '',
      });

      if (data.thumbnail) {
        setThumbnailPreview(data.thumbnail);
      }

      if (data.start_time) {
        const startDate = new Date(data.start_time);
        setSelectedDate(startDate);
        setSelectedTime(
          startDate.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        );
      }

      return data;
    },
    enabled: !!editStreamId && !!user?.id,
  });

  const handleThumbnailChange = (thumbnail: string) => {
    setThumbnailPreview(thumbnail);
    setStreamData({ ...streamData, thumbnail });
  };

  const handleScheduleStream = async () => {
    if (!streamData.title || !streamData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!streamData.thumbnail) {
      toast.error('Please select or upload a thumbnail image');
      return;
    }

    // For multi-schedule mode, use the SessionScheduler's save function
    if (isMultiSchedule && sessionSchedulerRef.current) {
      try {
        await sessionSchedulerRef.current.saveShows();
      } catch (error) {
        console.error('Error saving shows:', error);
        toast.error('Failed to schedule shows');
      }
      return;
    }

    // Validate scheduling data for single show mode
    const showsToSchedule = isMultiSchedule
      ? scheduledShows
      : [{ id: '1', title: streamData.title, date: selectedDate, time: selectedTime, products: [] }];

    for (const show of showsToSchedule) {
      if (!show.date || !show.time) {
        toast.error('Please fill in all date and time fields');
        return;
      }

      // Combine date and time
      const [hours, minutes] = show.time.split(':');
      const scheduledDateTime = new Date(show.date);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      // Check if scheduled time is in the future (only for new streams)
      if (!isEditing && scheduledDateTime <= new Date()) {
        toast.error('All scheduled times must be in the future');
        return;
      }
    }

    try {
      if (!user) {
        toast.error('You must be logged in to schedule a stream');
        return;
      }

      if (isEditing && editStreamId) {
        // Update existing stream
        const show = showsToSchedule[0]; // For editing, we only handle single shows
        const [hours, minutes] = show.time!.split(':');
        const scheduledDateTime = new Date(show.date!);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

        await updateStream(editStreamId, user.id, {
          title: streamData.title,
          description: streamData.description,
          category: streamData.category,
          thumbnail: streamData.thumbnail,
          start_time: scheduledDateTime.toISOString(),
        });

        toast.success('Show updated successfully!');
      } else {
        // Create new streams for each scheduled show
        const streamInserts = showsToSchedule.map((show) => {
          const [hours, minutes] = show.time!.split(':');
          const scheduledDateTime = new Date(show.date!);
          scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

          return {
            seller_id: user.id,
            title: isMultiSchedule ? show.title || streamData.title : streamData.title,
            description: streamData.description,
            category: streamData.category,
            thumbnail: streamData.thumbnail,
            start_time: scheduledDateTime.toISOString(),
            status: 'scheduled',
          };
        });

        if (streamInserts.length === 1) {
          const result = await createStream(streamInserts[0]);
          if (isFailure(result)) throw result.error;
        } else {
          const result = await createStreams(streamInserts);
          if (isFailure(result)) throw result.error;
        }

        toast.success(`${streamInserts.length > 1 ? 'Shows' : 'Show'} scheduled successfully!`);
      }

      navigate('/seller');
    } catch (error) {
      console.error('Error scheduling stream:', error);
      toast.error('Failed to schedule stream. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate('/seller')} className="mb-4">
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{isEditing ? 'Edit Show' : 'Schedule Live Show'}</h1>
            <p className="mt-2 text-muted-foreground">
              {isEditing
                ? 'Update your show details and scheduling'
                : 'Set up your upcoming live show with all the details'}
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Stream Details - Full Width */}
            <StreamDetailsForm
              streamData={streamData}
              categories={categories}
              onStreamDataChange={setStreamData}
              thumbnailPreview={thumbnailPreview}
              onThumbnailChange={handleThumbnailChange}
              showImageDialog={showImageDialog}
              onShowImageDialogChange={setShowImageDialog}
            />

            {/* Show Scheduling */}
            <SessionScheduler
              ref={sessionSchedulerRef}
              isMultiSchedule={isMultiSchedule}
              onMultiScheduleChange={setIsMultiSchedule}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              selectedTime={selectedTime}
              onSelectedTimeChange={setSelectedTime}
              scheduledShows={scheduledShows}
              onScheduledShowsChange={setScheduledShows}
              streamTitle={streamData.title}
              streamData={streamData}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pt-6 sm:flex-row">
            <Button variant="outline" onClick={() => navigate('/seller')} className="w-full sm:flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleScheduleStream}
              className="w-full bg-green-600 text-white hover:bg-green-700 sm:flex-1"
            >
              {isEditing ? 'Update Stream' : 'Schedule Stream'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScheduleStreamPage;
