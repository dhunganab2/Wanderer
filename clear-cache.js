// Simple script to help with cache issues
console.log('🔄 Clearing browser cache...');

// Add a timestamp to force cache refresh
const timestamp = new Date().getTime();
const links = document.querySelectorAll('link[rel="stylesheet"], script[src]');
links.forEach(link => {
  if (link.href) {
    const url = new URL(link.href);
    url.searchParams.set('v', timestamp);
    link.href = url.toString();
  }
});

// Force reload
window.location.reload(true);
