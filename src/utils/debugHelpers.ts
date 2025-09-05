// Debug helper functions for development

export const clearAllAppData = () => {
  // Clear all local storage data
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('wander') || key.startsWith('migration') || key.includes('firebase')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('🧹 All app data cleared from localStorage');
  
  // Clear session storage too
  sessionStorage.clear();
  
  console.log('🧹 Session storage cleared');
  
  // Reload the page
  window.location.reload();
};

export const debugUserState = () => {
  console.log('🔍 Debug: Current localStorage data:');
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('wander') || key.startsWith('migration')) {
      console.log(`${key}:`, JSON.parse(localStorage.getItem(key) || '{}'));
    }
  });
};

export const resetForNewUser = (userId: string) => {
  // Clear migration flags for specific user
  const migrationKey = `migration-done-${userId}`;
  localStorage.removeItem(migrationKey);
  
  // Clear wanderer app store
  localStorage.removeItem('wander-app-store');
  localStorage.removeItem('wanderer-offline-data');
  
  console.log('🔄 Reset completed for user:', userId);
};

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).debugWanderer = {
    clearAllData: clearAllAppData,
    debugState: debugUserState,
    resetUser: resetForNewUser
  };
}