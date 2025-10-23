// Test script to verify UI flicker fix
// Run this in browser console after opening the app

console.log('🧪 Testing UI flicker fix...');

// Monitor fetchTasks calls
let fetchTasksCallCount = 0;
const originalFetchTasks = window.useTaskStore?.getState?.().fetchTasks;
if (originalFetchTasks) {
  window.useTaskStore.getState().fetchTasks = function(...args) {
    fetchTasksCallCount++;
    console.log(`📡 fetchTasks called (${fetchTasksCallCount} times) - Stack:`, new Error().stack);
    return originalFetchTasks.apply(this, args);
  };
}

// Monitor sync events
if (window.__TAURI__) {
  import('@tauri-apps/api/event').then(({ listen }) => {
    listen('tasks:sync:complete', () => {
      console.log('🔄 Full sync completed event received');
    });
    
    listen('tasks:sync:queue-processed', () => {
      console.log('⚡ Queue processed event received (should not trigger fetchTasks)');
    });
  });
}

console.log('✅ Test setup complete. Now try adding a subtask in board view.');
console.log('Expected behavior:');
console.log('- Should see "Queue processed event"');
console.log('- Should NOT see "fetchTasks called"');
console.log('- UI should update smoothly without flickering');