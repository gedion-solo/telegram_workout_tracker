/**
 * Telegram WebApp SDK Integration & User Identity Helper
 * Handles extraction of the Telegram user ID and safe fallback for browser development.
 */

export interface TelegramUser {
  id: string;
  username?: string;
  firstName: string;
  lastName?: string;
  isTelegram: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date?: number;
          hash?: string;
        };
      };
    };
  }
}

const DEV_USER_STORAGE_KEY = 'duofit_dev_user_id';

/**
 * Retrieves the current user's identity.
 * - Inside Telegram Mini App: Reads real Telegram User ID & info.
 * - Outside Telegram (browser/dev): Generates or retrieves a persistent demo/local ID.
 */
export const getTelegramUser = (): TelegramUser => {
  if (typeof window !== 'undefined') {
    const webApp = window.Telegram?.WebApp;

    // 1. Direct initDataUnsafe user object
    if (webApp?.initDataUnsafe?.user?.id) {
      const tgUser = webApp.initDataUnsafe.user;
      return {
        id: tgUser.id.toString(),
        username: tgUser.username,
        firstName: tgUser.first_name || 'Athlete',
        lastName: tgUser.last_name,
        isTelegram: true,
      };
    }

    // 2. Fallback: Parse raw initData query string if initDataUnsafe was delayed
    if (webApp?.initData) {
      try {
        const params = new URLSearchParams(webApp.initData);
        const userParam = params.get('user');
        if (userParam) {
          const parsed = JSON.parse(decodeURIComponent(userParam));
          if (parsed && parsed.id) {
            return {
              id: parsed.id.toString(),
              username: parsed.username,
              firstName: parsed.first_name || 'Athlete',
              lastName: parsed.last_name,
              isTelegram: true,
            };
          }
        }
      } catch (err) {
        console.warn('Telegram initData parse error:', err);
      }
    }
  }

  // Fallback for regular browser preview / local testing
  let devId = localStorage.getItem(DEV_USER_STORAGE_KEY);
  if (!devId) {
    devId = 'dev_user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(DEV_USER_STORAGE_KEY, devId);
  }

  return {
    id: devId,
    username: 'dev_preview',
    firstName: 'Dev Guest',
    isTelegram: false,
  };
};

/**
 * Initializes the Telegram Mini App view (expands full height & themes header).
 */
export const initTelegramApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const webApp = window.Telegram.WebApp;
    try {
      webApp.ready();
      webApp.expand();
      if (webApp.setHeaderColor) {
        webApp.setHeaderColor('#051F20');
      }
      if (webApp.setBackgroundColor) {
        webApp.setBackgroundColor('#051F20');
      }
    } catch (e) {
      console.warn('Telegram WebApp setup warning:', e);
    }
  }
};

