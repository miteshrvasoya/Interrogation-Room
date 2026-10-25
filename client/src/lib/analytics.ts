// Google Analytics 4 (GA4) Client Tracking Utility

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-NY18QNV9QJ';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Log pageviews on client-side route transitions
 */
export const pageview = (url: string, title?: string) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title || document.title,
  });
};

/**
 * Generic event tracker for custom viewer interactions
 */
export const trackEvent = (
  action: string,
  category?: string,
  label?: string,
  value?: number,
  extraParams?: Record<string, any>
) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    ...extraParams,
  });
};

/**
 * Specific typed event trackers for the Murder Mystery Courtroom Arena
 */
export const analytics = {
  // Navigation & Page Journey
  trackPageview: (url: string, title?: string) => pageview(url, title),

  // Case & Trial Actions
  trackCaseViewed: (caseId: string, caseTitle?: string) => {
    trackEvent('case_view', 'Trial', caseTitle || caseId, undefined, {
      case_id: caseId,
      case_title: caseTitle,
    });
  },

  trackCaseCreated: (
    caseId: string,
    caseTitle: string,
    mode: 'presets' | 'custom' | 'json' | 'template' | string
  ) => {
    trackEvent('case_create', 'Builder', caseTitle, undefined, {
      case_id: caseId,
      case_title: caseTitle,
      creation_mode: mode,
    });
  },

  // In-Courtroom Spectator Interactions
  trackReactionSent: (reactionType: string, caseId: string) => {
    trackEvent('courtroom_reaction', 'Spectator', reactionType, 1, {
      reaction_type: reactionType,
      case_id: caseId,
    });
  },

  trackBetPlaced: (characterId: string, characterName: string, amount: number, caseId: string) => {
    trackEvent('bet_placed', 'Wager', characterName, amount, {
      character_id: characterId,
      character_name: characterName,
      bet_amount: amount,
      case_id: caseId,
    });
  },

  trackSettingModeToggled: (mode: string, caseId: string) => {
    trackEvent('setting_toggle', '3D Stage', mode, undefined, {
      setting_mode: mode,
      case_id: caseId,
    });
  },

  trackFreeLookToggled: (enabled: boolean, caseId: string) => {
    trackEvent('freelook_toggle', '3D Camera', enabled ? 'enable' : 'disable', undefined, {
      case_id: caseId,
    });
  },

  trackReplayAction: (action: 'open' | 'seek' | 'close', caseId: string, details?: any) => {
    trackEvent(`replay_${action}`, 'Replay', caseId, undefined, {
      case_id: caseId,
      ...details,
    });
  },

  trackRevealViewed: (caseId: string, culpritName?: string) => {
    trackEvent('dramatic_reveal_viewed', 'Trial', culpritName || caseId, undefined, {
      case_id: caseId,
      culprit_name: culpritName,
    });
  },

  trackLlmAttached: (characterId: string, provider: string, model: string, caseId: string) => {
    trackEvent('attach_custom_llm', 'Agent', `${provider}:${model}`, undefined, {
      character_id: characterId,
      provider,
      model,
      case_id: caseId,
    });
  },

  // Social & Viral Shares
  trackShareModalOpened: (caseId?: string) => {
    trackEvent('share_modal_opened', 'Social', caseId || 'global', undefined, {
      case_id: caseId,
    });
  },

  trackSocialShare: (platform: 'twitter' | 'reddit' | 'linkedin' | 'copy_link', caseId?: string) => {
    trackEvent('share_content', 'Social', platform, undefined, {
      platform,
      case_id: caseId || 'global',
    });
  },
};
