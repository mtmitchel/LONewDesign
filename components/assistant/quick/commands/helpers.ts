// ============================================================================
// DATE/TIME UTILITIES
// ============================================================================

// Convert natural language date (e.g., "tuesday", "next monday", "in 3 days") to ISO date
export function parseNaturalDate(naturalDate: string): string {
  const today = new Date();
  const lower = naturalDate.toLowerCase().trim();
  
  // Handle "today"
  if (lower === "today") {
    return today.toISOString().slice(0, 10);
  }
  
  // Handle "tomorrow"
  if (lower === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }
  
  // Handle "this weekend" (Saturday)
  if (lower.includes("this weekend") || lower === "weekend") {
    const currentDay = today.getDay();
    const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    return saturday.toISOString().slice(0, 10);
  }
  
  // Handle "next weekend" (Saturday of next week)
  if (lower.includes("next weekend")) {
    const currentDay = today.getDay();
    const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday + 7);
    return nextSaturday.toISOString().slice(0, 10);
  }
  
  // Handle "this week" (end of week - Friday)
  if (lower.includes("this week")) {
    const currentDay = today.getDay();
    const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
    const friday = new Date(today);
    friday.setDate(today.getDate() + daysUntilFriday);
    return friday.toISOString().slice(0, 10);
  }
  
  // Handle "next week" (Monday of next week)
  if (lower.includes("next week")) {
    const currentDay = today.getDay();
    const daysUntilMonday = (1 - currentDay + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday + 7);
    return nextMonday.toISOString().slice(0, 10);
  }
  
  // Handle "in X days/weeks"
  const inDaysMatch = lower.match(/in (\d+) days?/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + days);
    return targetDate.toISOString().slice(0, 10);
  }
  
  const inWeeksMatch = lower.match(/in (\d+) weeks?/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1], 10);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (weeks * 7));
    return targetDate.toISOString().slice(0, 10);
  }
  
  // Handle day names (monday, tuesday, etc.)
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const targetDay = dayNames.findIndex(day => lower.includes(day));
  
  if (targetDay !== -1) {
    const currentDay = today.getDay();
    let daysToAdd = targetDay - currentDay;
    
    // If the day has passed this week, go to next week
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    // Handle "next [day]" explicitly - always go to next week
    if (lower.startsWith("next ")) {
      if (daysToAdd < 7) daysToAdd += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    return targetDate.toISOString().slice(0, 10);
  }
  
  // Fallback to today if we can't parse
  return today.toISOString().slice(0, 10);
}

// Convert 12-hour time (e.g., "2pm", "10am") to 24-hour format (e.g., "14:00", "10:00")
export function convertTo24Hour(time12: string): string {
  const match = time12.match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
  if (!match) return "09:00"; // Default to 9am if parse fails
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2] || "00";
  const meridiem = match[3].toLowerCase();
  
  if (meridiem === "pm" && hours !== 12) {
    hours += 12;
  } else if (meridiem === "am" && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function combineDateTime(date: string, time?: string) {
  if (!time) {
    return new Date(`${date}T09:00:00`);
  }
  
  // Convert 12-hour format to 24-hour if needed
  const time24 = time.match(/am|pm/i) ? convertTo24Hour(time) : time;
  
  if (time24.length === 5) {
    return new Date(`${date}T${time24}:00`);
  }
  return new Date(`${date}T${time24}`);
}