// Test script to verify no UI flicker when adding subtasks
// Run this in browser console

console.log('🧪 Testing no-flicker subtask addition...');

// Track task updates
let taskUpdateCount = 0;
const originalLog = console.log;
console.log = function(...args) {
  if (args[0] && args[0].includes && args[0].includes('updateTask')) {
    taskUpdateCount++;
    console.log(`📝 Task update #${taskUpdateCount} detected`);
  }
  originalLog.apply(console, args);
};

// Monitor store state changes
if (window.useTaskStore) {
  const store = window.useTaskStore.getState();
  let lastTaskState = null;
  
  // Check for rapid state changes (indicates flickering)
  const checkInterval = setInterval(() => {
    const currentTask = store.tasksById[store.taskOrder[0]]; // Get first task
    if (currentTask && lastTaskState) {
      const subtasksChanged = JSON.stringify(currentTask.subtasks) !== JSON.stringify(lastTaskState.subtasks);
      if (subtasksChanged && taskUpdateCount > 0) {
        console.log('⚠️  Potential flicker detected - subtasks changed rapidly');
      }
    }
    lastTaskState = currentTask ? { ...currentTask } : null;
  }, 100);
  
  // Stop checking after 10 seconds
  setTimeout(() => clearInterval(checkInterval), 10000);
}

console.log('✅ Test setup complete. Now add a subtask in board view.');
console.log('Expected behavior:');
console.log('- Subtask should appear immediately');
console.log('- No rapid re-renders or flickering');
console.log('- Task should sync in background without UI disruption');