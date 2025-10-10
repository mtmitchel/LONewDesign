// Run this in browser console to test event creation fix

// Test 1: Check if events are in localStorage
console.log('=== Current Events in localStorage ===');
const events = JSON.parse(localStorage.getItem('calendar-events') || '[]');
console.log('Total events:', events.length);
console.table(events);

// Test 2: Manually create a test event (simulating assistant)
function testEventCreation() {
  const testEvent = {
    id: `event-test-${Date.now()}`,
    title: 'Test Event from Console',
    calendarId: 'quick-assistant',
    startsAt: new Date('2025-01-18T10:00:00').toISOString(),
    endsAt: new Date('2025-01-18T11:00:00').toISOString(),
    location: 'Test Location',
    description: 'Created via console test',
    allDay: false,
  };
  
  const stored = localStorage.getItem('calendar-events');
  const existingEvents = stored ? JSON.parse(stored) : [];
  const updatedEvents = [testEvent, ...existingEvents];
  localStorage.setItem('calendar-events', JSON.stringify(updatedEvents));
  
  console.log('✅ Test event created:', testEvent);
  console.log('Total events now:', updatedEvents.length);
  
  // Also dispatch the event for UI update
  window.dispatchEvent(new CustomEvent('assistant.create_event', {
    detail: {
      id: testEvent.id,
      title: testEvent.title,
      startsAt: testEvent.startsAt,
      endsAt: testEvent.endsAt,
      location: testEvent.location,
      description: testEvent.description
    }
  }));
}

// Test 3: Parse natural language date
function parseDate(text) {
  const today = new Date();
  const lower = text.toLowerCase();
  
  if (lower.includes('saturday')) {
    const currentDay = today.getDay();
    let daysToAdd = 6 - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysToAdd);
    return saturday.toISOString().slice(0, 10);
  }
  
  if (lower.includes('monday')) {
    const currentDay = today.getDay();
    let daysToAdd = 1 - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToAdd);
    return monday.toISOString().slice(0, 10);
  }
  
  return today.toISOString().slice(0, 10);
}

console.log('=== Date Parsing Tests ===');
console.log('Saturday:', parseDate('saturday'));
console.log('Monday:', parseDate('monday'));

console.log('\n📝 To test event creation, run: testEventCreation()');
console.log('📅 Then refresh Calendar module to see the event');
