export type BrowserName = "edge" | "chrome" | "safari" | "firefox" | "opera" | "other";
export type PlatformName = "windows" | "mac" | "linux" | "android" | "ios" | "other";

interface UADataBrand {
  brand: string;
  version: string;
}

interface UADataPlatform {
  platform?: string;
}

export function detectBrowser(): BrowserName {
  if (typeof navigator === "undefined") return "other";

  const uaData = (navigator as Navigator & {
    userAgentData?: { brands?: UADataBrand[] };
  }).userAgentData;

  if (uaData?.brands?.length) {
    const brands = uaData.brands.map((b) => b.brand.toLowerCase());
    if (brands.some((b) => b.includes("microsoft edge"))) return "edge";
    if (brands.some((b) => b.includes("opera") || b.includes("opr"))) return "opera";
    if (brands.some((b) => b.includes("google chrome") || b === "chromium")) return "chrome";
  }

  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "opera";
  if (/Firefox\//i.test(ua)) return "firefox";
  if (/Chrome\//i.test(ua)) return "chrome";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "safari";
  return "other";
}

export function isChromiumBased(): boolean {
  const b = detectBrowser();
  return b === "chrome" || b === "edge" || b === "opera";
}

export function detectPlatform(): PlatformName {
  if (typeof navigator === "undefined") return "other";

  const navWithUaData = navigator as Navigator & { userAgentData?: UADataPlatform };
  const uaDataPlatform = navWithUaData.userAgentData?.platform?.toLowerCase() || "";
  if (uaDataPlatform.includes("mac")) return "mac";
  if (uaDataPlatform.includes("win")) return "windows";
  if (uaDataPlatform.includes("android")) return "android";
  if (uaDataPlatform.includes("ios") || uaDataPlatform.includes("iphone") || uaDataPlatform.includes("ipad")) return "ios";
  if (uaDataPlatform.includes("linux")) return "linux";

  // UA sniff BEFORE navigator.platform: Android reports platform "Linux armv8l" (would
  // misclassify as linux on browsers without userAgentData, e.g. Firefox for Android), and
  // iPhones report "iPhone" in the UA.
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";

  const platform = (navigator.platform || "").toLowerCase();
  if (platform.includes("mac")) {
    // iPadOS 13+ masquerades as desktop Safari: platform "MacIntel", no iPad UA token. Real
    // Macs have no multi-touch - touch-capable "Mac" is an iPad (WebKit mobile rules apply).
    if ((navigator.maxTouchPoints || 0) > 1) return "ios";
    return "mac";
  }
  if (platform.includes("win")) return "windows";
  if (platform.includes("linux")) return "linux";
  if (platform.includes("iphone") || platform.includes("ipad") || platform.includes("ipod")) return "ios";

  return "other";
}

export function isMacPlatform(): boolean {
  return detectPlatform() === "mac";
}
