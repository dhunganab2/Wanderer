// Force refresh script to clear cache
console.log('🔄 Forcing hard refresh...');

// Clear all caches
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
    }
    console.log('✅ Caches cleared');
  });
}

// Force reload
window.location.reload(true);
