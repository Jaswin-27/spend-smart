/// <reference types="vite/client" />

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize, RewardAdPluginEvents } from '@capacitor-community/admob';

// Detect if we are in local development / debug build
const IS_DEV = import.meta.env.DEV;

// AdMob App IDs
export const ADMOB_APP_ID = 'ca-app-pub-4624646043793941~5280297744';

// Banner Ad Unit ID: Test during Dev, Real in Production
export const BANNER_AD_UNIT_ID = IS_DEV
  ? 'ca-app-pub-3940256099942544/6300978111' // Official Google Test Banner Ad unit
  : 'ca-app-pub-4624646043793941/6600128591'; // Real Banner Ad unit

// Rewarded Ad Unit ID: Test during Dev, Real in Production
export const REWARDED_AD_UNIT_ID = IS_DEV
  ? 'ca-app-pub-3940256099942544/5224354917' // Official Google Test Rewarded Ad unit
  : 'ca-app-pub-4624646043793941/2926431298'; // Real Rewarded Ad unit

class AdMobService {
  private initialized = false;
  private isNative = Capacitor.isNativePlatform();

  // Initialize AdMob
  public async initialize(): Promise<void> {
    if (!this.isNative) {
      console.log('[AdMob Service] Running in web/iframe. Mock Ads enabled.');
      this.initialized = true;
      return;
    }

    try {
      console.log('[AdMob Service] Initializing native Google AdMob SDK...');
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: IS_DEV,
      });
      this.initialized = true;
      console.log('[AdMob Service] Native Google AdMob initialized successfully!');
    } catch (error) {
      console.error('[AdMob Service] Native AdMob failed to initialize:', error);
    }
  }

  // Show bottom banner ad
  public async showBanner(onWebShowSimulated?: (show: boolean) => void): Promise<void> {
    if (!this.isNative) {
      console.log('[AdMob Service] Web simulated banner ad requested.');
      if (onWebShowSimulated) {
        onWebShowSimulated(true);
      }
      return;
    }

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`[AdMob Service] Requesting native banner. Unit ID: ${BANNER_AD_UNIT_ID}`);
      await AdMob.showBanner({
        adId: BANNER_AD_UNIT_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 50, // Space bottom for navigation bar overlay
        isTesting: IS_DEV,
      });
    } catch (error) {
      console.error('[AdMob Service] Failed to show native banner:', error);
    }
  }

  // Hide bottom banner ad
  public async hideBanner(onWebHideSimulated?: () => void): Promise<void> {
    if (!this.isNative) {
      if (onWebHideSimulated) {
        onWebHideSimulated();
      }
      return;
    }

    try {
      await AdMob.hideBanner();
    } catch (error) {
      console.warn('[AdMob Service] Failed to hide native banner (safe warning):', error);
    }
  }

  // Remove bottom banner ad
  public async removeBanner(): Promise<void> {
    if (!this.isNative) return;
    try {
      await AdMob.removeBanner();
    } catch (error) {
      console.warn('[AdMob Service] Failed to remove native banner:', error);
    }
  }

  // Prepare and Show Rewarded ad with event listeners
  public async playRewardedAd(
    onRewarded: (rewardType: string, rewardAmount: number) => void,
    onAdErrorOrDismissed: (errorMsg: string) => void,
    onWebMockActive?: (isActive: boolean) => void
  ): Promise<void> {
    if (!this.isNative) {
      console.log('[AdMob Service] Playing Mock Web Rewarded Ad...');
      if (onWebMockActive) {
        onWebMockActive(true);
      }
      return;
    }

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log('[AdMob Service] Preparing native rewarded video ad...', REWARDED_AD_UNIT_ID);

      let isRewarded = false;
      let rewardItem: { type: string; amount: number } = { type: 'coins', amount: 1 };

      // Set up listeners safely
      const rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (reward) => {
          console.log('[AdMob Service] Event: Rewarded!', reward);
          isRewarded = true;
          if (reward) {
            rewardItem = { type: reward.type, amount: reward.amount };
          }
        }
      );

      const dismissedListener = await AdMob.addListener(
        RewardAdPluginEvents.Dismissed,
        async () => {
          console.log('[AdMob Service] Event: Dismissed.');
          // Clean up listeners
          rewardListener.remove();
          dismissedListener.remove();
          failedToLoadListener.remove();
          failedToShowListener.remove();

          if (isRewarded) {
            onRewarded(rewardItem.type, rewardItem.amount);
          } else {
            onAdErrorOrDismissed('You closed the ad before standard completion. Please watch the full ad to proceed.');
          }
        }
      );

      const failedToLoadListener = await AdMob.addListener(
        RewardAdPluginEvents.FailedToLoad,
        (err) => {
          console.error('[AdMob Service] Event: FailedToLoad', err);
          rewardListener.remove();
          dismissedListener.remove();
          failedToLoadListener.remove();
          failedToShowListener.remove();
          onAdErrorOrDismissed(`Failed to load rewarded ad. Details: ${err.message || 'Check network connection'}`);
        }
      );

      const failedToShowListener = await AdMob.addListener(
        RewardAdPluginEvents.FailedToShow,
        (err) => {
          console.error('[AdMob Service] Event: FailedToShow', err);
          rewardListener.remove();
          dismissedListener.remove();
          failedToLoadListener.remove();
          failedToShowListener.remove();
          onAdErrorOrDismissed(`Failed to display rewarded ad. Details: ${err.message || 'Incompatible device or system state'}`);
        }
      );

      // Prepare 
      await AdMob.prepareRewardVideoAd({
        adId: REWARDED_AD_UNIT_ID,
        isTesting: IS_DEV,
      });

      // Show
      await AdMob.showRewardVideoAd();
    } catch (error: any) {
      console.error('[AdMob Service] Error during playRewardedAd execution flow:', error);
      onAdErrorOrDismissed(error?.message || 'Error occurred while loading are showing native ad.');
    }
  }

  // Check if native platform
  public isNativePlatform(): boolean {
    return this.isNative;
  }
}

export const admobService = new AdMobService();
