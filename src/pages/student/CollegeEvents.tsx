import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, RefreshCcw } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { getCollegeEvents, CollegeEvent } from '../../lib/api';

export default function CollegeEvents() {
  const { collegeId, collegeName } = useUser();
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!collegeId) {
      console.warn('CollegeEvents: No collegeId available. User profile may not be loaded yet.');
      setEvents([]);
      setLoading(false);
      setError('College ID not found. Please ensure your profile is set up correctly.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('CollegeEvents: Loading events for collegeId:', collegeId);
      const data = await getCollegeEvents(collegeId);
      console.log('CollegeEvents: Received events:', data);
      setEvents(data || []);
    } catch (err: any) {
      console.error('Failed to load college events:', err);
      const errorMessage = err?.message || 'Unable to load events right now. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    // Fetch events only after user is logged in and we have a collegeId
    loadEvents();
  }, [loadEvents]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white/70 border border-light-accent rounded-2xl p-4 shadow-sm"
            >
              <div className="h-4 w-1/3 bg-gray-200 rounded mb-3" />
              <div className="h-3 w-1/4 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-3/4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-text-secondary text-sm text-center max-w-md">
            {error}
          </p>
          <button
            onClick={loadEvents}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warm-brown text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    if (!events.length) {
      return (
        <div className="mt-8 text-center text-text-secondary text-sm">
          No events available for your college
        </div>
      );
    }

    return (
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {events.map((event, index) => (
          <motion.div
            key={`${event.eventTitle}-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-light-accent rounded-2xl p-5 shadow-card hover:shadow-hover transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {event.eventTitle}
                </h3>
                <div className="flex items-center text-xs text-medium-gray gap-2 mb-3">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {event.eventDate} • {event.eventTime}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-text-secondary mb-3">
              {event.description}
            </p>

            {event.location && (
              <div className="inline-flex items-center gap-1.5 text-xs text-medium-gray bg-cream-bg px-3 py-1.5 rounded-full">
                <MapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl font-bold text-text-primary">College Events</h1>
        <p className="text-sm text-text-secondary mt-1">
          Showing events for{' '}
          <span className="font-semibold">
            {collegeName || 'your college'}
          </span>
          {collegeId && (
            <span className="text-xs text-medium-gray ml-2">
              (ID: {collegeId})
            </span>
          )}
        </p>
      </motion.div>

      {renderContent()}
    </div>
  );
}


