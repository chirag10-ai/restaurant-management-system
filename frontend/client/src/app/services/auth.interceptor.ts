import { HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  // Only run in browser (not during SSR)
  if (isPlatformBrowser(platformId)) {
    // Get tab-specific token
    const tabId = getOrCreateTabId();
    const tokenKey = `token_${tabId}`;
    const token = sessionStorage.getItem(tokenKey);
    
    if (token) {
      // Clone the request and add the authorization header
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(authReq);
    }
  }
  
  // If no token or not in browser, pass the request unchanged
  return next(req);
};

// Helper function to get or create tab ID
function getOrCreateTabId(): string {
  // Try to get existing tab ID from window name
  if (window.name && window.name.startsWith('tab_')) {
    return window.name;
  }
  
  // Generate new unique ID for this tab
  const newTabId = 'tab_' + Math.random().toString(36).substr(2, 9);
  window.name = newTabId;
  return newTabId;
}