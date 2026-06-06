import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform?.() ?? false;

export async function initAdMob() {
  if (!isNative()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize();
  } catch (e) {
    console.warn("AdMob init failed", e);
  }
}

export async function showBottomBanner() {
  if (!isNative()) return;
  try {
    const { AdMob, BannerAdSize, BannerAdPosition } = await import(
      "@capacitor-community/admob"
    );
    await AdMob.showBanner({
      adId: "ca-app-pub-7050739517296841/4327196775",
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    });
  } catch (e) {
    console.warn("AdMob banner failed", e);
  }
}

export async function hideBanner() {
  if (!isNative()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.hideBanner();
    await AdMob.removeBanner();
  } catch {
    /* noop */
  }
}

let interstitialShown = false;
export async function showInterstitialOncePerSession() {
  if (!isNative()) return;
  if (interstitialShown) return;
  interstitialShown = true;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.prepareInterstitial({
      adId: "ca-app-pub-7050739517296841/6515366092",
    });
    await AdMob.showInterstitial();
  } catch (e) {
    console.warn("AdMob interstitial failed", e);
  }
}
