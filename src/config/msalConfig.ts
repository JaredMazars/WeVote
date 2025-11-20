import { Configuration, PublicClientApplication } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'your-client-id-here',
    // Use 'common' for multi-tenant support
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID || 'organizations'}`,
    redirectUri: `${window.location.origin}/`,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage', // Changed from sessionStorage
    storeAuthStateInCookie: true, // Changed to true for better popup support
  },
  system: {
    // allowNativeBroker: false, // Disable native broker
    windowHashTimeout: 60000, // Increase timeout
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    loggerOptions: {
      logLevel: 3, // Verbose logging for debugging
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // LogLevel.Error
            console.error(message);
            return;
          case 1: // LogLevel.Warning
            console.warn(message);
            return;
          case 2: // LogLevel.Info
            console.info(message);
            return;
          case 3: // LogLevel.Verbose
            console.debug(message);
            return;
        }
      }
    }
  }
};

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
msalInstance.initialize().then(() => {
  console.log('MSAL initialized successfully');
}).catch((error) => {
  console.error('MSAL initialization failed:', error);
});
// Login request configuration
export const loginRequest = {
  scopes: ['User.Read'], // Minimal scopes to avoid permission issues
  prompt: 'select_account',
  forceRefresh: false,
  redirectUri: `${window.location.origin}/`,
};