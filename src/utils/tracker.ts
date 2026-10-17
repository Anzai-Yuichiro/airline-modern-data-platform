// src/utils/tracker.ts

// Helper to generate a simple UUID-like string
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Retrieve or generate a session ID that persists during the browser session
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('airline_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem('airline_session_id', sessionId);
  }
  return sessionId;
};

// Interface for structured analytics event
interface AnalyticsEvent {
  event_id: string;
  session_id: string;
  member_number?: string;
  event_name: string;
  timestamp: string;
  user_agent: string;
  page_url: string;
  properties: Record<string, any>;
}

export const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
  let memberNumber: string | undefined = undefined;
  try {
    const memberStr = localStorage.getItem('airline_logged_in_member');
    if (memberStr) {
      const member = JSON.parse(memberStr);
      memberNumber = member.member_number || undefined;
    }
  } catch (e) {
    console.error('[Tracker] Error reading logged in member:', e);
  }

  const event: AnalyticsEvent = {
    event_id: generateUUID(),
    session_id: getSessionId(),
    member_number: memberNumber,
    event_name: eventName,
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent,
    page_url: window.location.href,
    properties: properties
  };

  // Send to our Ingestion API via fetch (asynchronous)
  fetch('/api/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
  .then((response) => {
    if (!response.ok) {
      console.warn('[Tracker] Failed to send event:', response.statusText);
    }
  })
  .catch((error) => {
    console.error('[Tracker] Network error sending event:', error);
  });
};
