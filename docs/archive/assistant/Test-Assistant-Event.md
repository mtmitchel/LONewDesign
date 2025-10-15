# Testing Assistant Event Creation

## Test Steps

1. Open the browser DevTools Console (F12)
2. Type in the assistant: "dentist appointment on saturday at 10am"
3. Watch for console logs and check:
   - Does button change to "Create event"?
   - What logs appear starting with `[QuickAssistant]`?
   - What logs appear starting with `[AssistantDialog]`?

## Expected Console Output

You should see logs like:
```
[AssistantDialog] No assistant provider configured  // OR Provider not configured
[QuickAssistant] 🔍 Classifying intent for input: dentist appointment on saturday at 10am
[QuickAssistant] 📊 Classification result: {type: "event", ...}
[QuickAssistant] 🗓️ Parsed date: saturday → 2025-01-18 
[QuickAssistant] 📅 Creating event with: {title: "dentist appointment", ...}
[QuickAssistant] 📤 Dispatching event: {id: "event-...", ...}
```

## After Submitting

Check in DevTools:
```javascript
// Check localStorage for events
JSON.parse(localStorage.getItem('calendar-events'))

// Should return array with your new event
```

## If Event Doesn't Show in Calendar

1. Is CalendarModule mounted/visible when you create the event?
2. Try refreshing the page and checking the Calendar
3. Check if the event appears in localStorage but not in UI

## Manual Test in Console

You can also test directly in browser console:
```javascript
// Dispatch a test event manually
window.dispatchEvent(new CustomEvent('assistant.create_event', {
  detail: {
    id: 'test-event-1',
    title: 'Test Event',
    startsAt: new Date('2025-01-18T10:00:00').toISOString(),
    endsAt: new Date('2025-01-18T11:00:00').toISOString(),
    location: 'Test Location',
    description: 'Test Description'
  }
}));

// Then check localStorage
JSON.parse(localStorage.getItem('calendar-events'))
```
