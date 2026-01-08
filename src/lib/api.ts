/**
 * Utility for interacting with the external College App API.
 */

const VERIFY_COLLEGE_URL = 'https://us-central1-ai-edudigestapp.cloudfunctions.net/verifyCollege';
const SYNC_COUNT_URL = 'https://us-central1-ai-edudigestapp.cloudfunctions.net/syncStudentCount';
const INCREMENT_STUDENT_COUNT_URL = 'https://us-central1-ai-edudigestapp.cloudfunctions.net/incrementStudentCount';
const GET_COLLEGE_EVENTS_URL = 'https://us-central1-ai-edudigestapp.cloudfunctions.net/getCollegeEvents';

// Optional API key for securing College App HTTPS functions
const COLLEGE_API_KEY = (import.meta as any).env?.VITE_COLLEGE_API_KEY || '';

export interface VerifyCollegeResponse {
    valid: boolean;
    message?: string;
    collegeId?: string;
    collegeName?: string;
    reason?: 'NOT_FOUND' | 'INACTIVE' | 'PLAN_EXPIRED' | string;
}

/**
 * Validates a collegeId against the College App Cloud Function.
 */
export async function verifyCollegeId(collegeId: string): Promise<VerifyCollegeResponse> {
    if (!collegeId) {
        return { valid: false, message: 'College ID is required' };
    }

    try {
        const response = await fetch(VERIFY_COLLEGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ collegeId: collegeId.trim() }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            valid: !!data.valid,
            collegeId: data.collegeId,
            collegeName: data.collegeName,
            reason: data.reason,
            message: data.message || (data.valid ? 'Valid code' : 'Invalid or inactive college code'),
        };
    } catch (error) {
        console.error('Error verifying collegeId:', error);
        return {
            valid: false,
            message: 'Unable to verify college code. Please check your connection or try again later.'
        };
    }
}

/**
 * Syncs student count to College App (Non-blocking)
 */
export async function syncStudentCount(collegeId: string, action: 'created' | 'deleted' = 'created') {
    try {
        fetch(SYNC_COUNT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                collegeId,
                action
            })
        }).catch(error => {
            console.error('Student count sync error (non-critical):', error);
        });
    } catch (e) {
        // Silent fail
    }
}

/**
 * Increment student count in College App AFTER a student is successfully created
 * in this Student App (Auth user + Firestore doc). This is a best-effort,
 * non-blocking call — failures here should NOT prevent signup.
 */
export async function incrementStudentCount(collegeId: string) {
    if (!collegeId) return;

    try {
        fetch(INCREMENT_STUDENT_COUNT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collegeId: collegeId.trim() })
        }).catch(error => {
            console.error('incrementStudentCount error (non-critical):', error);
        });
    } catch (error) {
        // Completely swallow errors to avoid impacting signup UX
        console.error('incrementStudentCount unexpected error (non-critical):', error);
    }
}

// ---- College Events ----

export interface CollegeEvent {
    eventTitle: string;
    description: string;
    eventDate: string;
    eventTime: string;
    location?: string;
    // Allow flexible field names from College App
    title?: string;
    date?: string;
    time?: string;
}

/**
 * Fetch read-only college events for a given collegeId from the College App.
 * This uses an HTTPS Cloud Function and never touches the College Firestore directly.
 */
export async function getCollegeEvents(collegeId: string): Promise<CollegeEvent[]> {
    if (!collegeId) {
        console.warn('getCollegeEvents called without collegeId');
        return [];
    }

    const headers: Record<string, string> = {};

    // Attach API key if configured
    if (COLLEGE_API_KEY) {
        headers['x-api-key'] = COLLEGE_API_KEY;
    }

    try {
        console.log('Fetching college events for collegeId:', collegeId);
        // Use GET method with collegeId as query parameter
        const url = new URL(GET_COLLEGE_EVENTS_URL);
        url.searchParams.set('collegeId', collegeId.trim());
        const requestUrl = url.toString();
        console.log('Request URL:', requestUrl);

        const response = await fetch(requestUrl, {
            method: 'GET',
            headers,
        });

        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to fetch college events: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Raw API response:', data);

        // Handle different response formats:
        // 1. Direct array: [{ eventTitle, ... }, ...]
        // 2. Wrapped in object: { events: [...], data: [...], or result: [...] }
        let events: CollegeEvent[] = [];

        if (Array.isArray(data)) {
            events = data;
        } else if (data && typeof data === 'object') {
            // Try common wrapper keys
            events = data.events || data.data || data.result || data.items || [];
            if (!Array.isArray(events)) {
                console.warn('Unexpected events response shape from College App:', data);
                events = [];
            }
        } else {
            console.warn('Unexpected events response type from College App:', typeof data, data);
            events = [];
        }

        // Normalize field names to match our interface
        const normalizedEvents: CollegeEvent[] = events.map((event: any) => ({
            eventTitle: event.eventTitle || event.title || event.name || 'Untitled Event',
            description: event.description || event.desc || event.details || '',
            eventDate: event.eventDate || event.date || event.event_date || '',
            eventTime: event.eventTime || event.time || event.event_time || '',
            location: event.location || event.venue || event.place || undefined,
        }));

        console.log('Normalized events:', normalizedEvents);
        return normalizedEvents;
    } catch (error) {
        console.error('Error fetching college events:', error);
        // Re-throw so the UI can show error state
        throw error;
    }
}
