import React, { ComponentType, useCallback, useEffect, useState } from "react";
import { initApp } from "../services/authApis";
import { ClientData, setClientInfo } from "../redux/slices/client-info.ts";
import { useDispatch } from "react-redux";
import AccountInactive from "../features/learn/pages/AccountInactive.tsx";

import ErrorPage from "./Errorpage.tsx";

let cachedClientInfo: ClientData | null = null;
let cachedClientId: number | null = null;
let clientInfoPromise: Promise<ClientData> | null = null;
let inflightClientId: number | null = null;

const loadClientInfo = async (clientId: number): Promise<ClientData> => {
  if (cachedClientInfo && cachedClientId === clientId) {
    return cachedClientInfo;
  }

  if (clientInfoPromise && inflightClientId === clientId) {
    return clientInfoPromise;
  }

  inflightClientId = clientId;
  clientInfoPromise = initApp(clientId)
    .then((data) => {
      cachedClientInfo = data;
      cachedClientId = clientId;
      return data;
    })
    .catch((error) => {
      // Reset cache on failure so future attempts retry.
      if (cachedClientId === clientId) {
        cachedClientInfo = null;
        cachedClientId = null;
      }
      throw error;
    })
    .finally(() => {
      clientInfoPromise = null;
      inflightClientId = null;
    });

  return clientInfoPromise;
};

const CLIENT_INFO_CACHE_KEY = "__client_info_cache__";
const CLIENT_INFO_TTL = 1000 * 60 * 60 * 6; // 6 hours

interface ClientInfoCacheEntry {
  timestamp: number;
  data: ClientData;
}

const withAppInitializer = <P extends object>(
  WrappedComponent: ComponentType<P>
) => {
  const AppInitializer: React.FC<P> = (props) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dispatch = useDispatch();
    const [isInactive, setIsInactive] = useState<boolean>(false);

    function setAppIcons(url?: string) {
      if (!url) return;
      const cacheBuster = `${url}${
        url?.includes("?") ? "&" : "?"
      }v=${Date.now()}`;

      // --- Remove old favicons ---
      document
        .querySelectorAll("link[rel='icon']")
        .forEach((el) => el.remove());

      // --- Add standard favicons (192 & 512) ---
      const faviconSizes = ["192x192", "512x512"];
      faviconSizes.forEach((size) => {
        const icon = document.createElement("link");
        icon.rel = "icon";
        icon.setAttribute("sizes", size); // ✅ type-safe fix
        icon.type = url?.endsWith(".svg") ? "image/svg+xml" : "image/png";
        icon.href = cacheBuster;
        document.head.appendChild(icon);
      });

      // --- Remove old apple-touch-icons ---
      document
        .querySelectorAll("link[rel='apple-touch-icon']")
        .forEach((el) => el.remove());

      // --- Add multiple apple-touch-icons (for iOS) ---
      const appleSizes = ["120x120", "152x152", "167x167", "180x180"];
      appleSizes.forEach((size) => {
        const appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        appleIcon.setAttribute("sizes", size); // ✅ type-safe fix
        appleIcon.href = cacheBuster;
        document.head.appendChild(appleIcon);
      });

      // --- Mask Icon (Safari pinned tabs) ---
      document
        .querySelectorAll("link[rel='mask-icon']")
        .forEach((el) => el.remove());
      const maskIcon = document.createElement("link");
      maskIcon.rel = "mask-icon";
      maskIcon.href = cacheBuster;
      document.head.appendChild(maskIcon);
    }

    function updateOpenGraphTags(data: ClientData) {
      if (!data.name) return; // Only update if we have a client name

      const origin = window.location.origin;
      const appName = data.name;
      const appIcon = data.app_icon_url || `${origin}/pwa-512x512.png`;
      const currentUrl = window.location.href;

      // Update or create Open Graph tags
      const updateOrCreateMeta = (property: string, content: string) => {
        let meta = document.querySelector(
          `meta[property="${property}"]`
        ) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("property", property);
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
      };

      const updateOrCreateMetaName = (name: string, content: string) => {
        let meta = document.querySelector(
          `meta[name="${name}"]`
        ) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("name", name);
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
      };

      // Open Graph tags
      updateOrCreateMeta("og:title", appName);
      updateOrCreateMeta("og:image", appIcon);
      updateOrCreateMeta("og:url", currentUrl);
      updateOrCreateMeta(
        "og:description",
        "AI-powered learning and assessment platform"
      );

      // Twitter Card tags
      updateOrCreateMetaName("twitter:title", appName);
      updateOrCreateMetaName("twitter:image", appIcon);
      updateOrCreateMetaName(
        "twitter:description",
        "AI-powered learning and assessment platform"
      );

      // Store client ID for future page loads
      try {
        const configScript = document.getElementById(
          "app-config"
        ) as HTMLScriptElement;
        if (configScript && import.meta.env.VITE_CLIENT_ID) {
          configScript.dataset.clientId = import.meta.env.VITE_CLIENT_ID;
        }
        if (import.meta.env.VITE_CLIENT_ID) {
          localStorage.setItem("__client_id__", import.meta.env.VITE_CLIENT_ID);
        }
      } catch (e) {
        // Silently fail
      }
    }

    function updateManifest(data: ClientData) {
      const origin = window.location.origin;
      const manifest = {
        name: data.name,
        short_name: data.slug || data.name,
        description: "AI-powered learning and assessment platform",
        start_url: `${origin}/login`,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        lang: "en",
        scope: `${origin}/`,
        orientation: "portrait",
        id: "/",
        icons: [
          {
            src: data.app_icon_url || `${origin}/pwa-192x192.png`,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: data.app_icon_url || `${origin}/pwa-512x512.png`,
            sizes: "512x512",
            type: "image/png",
          },
        ],
      };

      const stringManifest = JSON.stringify(manifest);
      const blob = new Blob([stringManifest], {
        type: "application/json",
      });
      const manifestURL = URL.createObjectURL(blob);

      let link = document.querySelector(
        'link[rel="manifest"]'
      ) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "manifest";
        link.id = "app-manifest";
        document.head.appendChild(link);
      }
      link.href = manifestURL;

      window.dispatchEvent(
        new CustomEvent("manifest-updated", {
          detail: { manifest, url: manifestURL },
        })
      );
    }

    function applyThemeSettings(themeSettings?: ClientData["theme_settings"]) {
      if (!themeSettings || Object.keys(themeSettings).length === 0) {
        return;
      }

      document.body.style.setProperty("--primary-50", themeSettings.primary50);
      document.body.style.setProperty(
        "--primary-100",
        themeSettings.primary100
      );
      document.body.style.setProperty(
        "--primary-200",
        themeSettings.primary200
      );
      document.body.style.setProperty(
        "--primary-300",
        themeSettings.primary300
      );
      document.body.style.setProperty(
        "--primary-400",
        themeSettings.primary400
      );
      document.body.style.setProperty(
        "--primary-500",
        themeSettings.primary500
      );
      document.body.style.setProperty(
        "--primary-600",
        themeSettings.primary600
      );
      document.body.style.setProperty(
        "--primary-700",
        themeSettings.primary700
      );
      document.body.style.setProperty(
        "--primary-800",
        themeSettings.primary800
      );
      document.body.style.setProperty(
        "--primary-900",
        themeSettings.primary900
      );

      document.body.style.setProperty(
        "--secondary-50",
        themeSettings.secondary50
      );
      document.body.style.setProperty(
        "--secondary-100",
        themeSettings.secondary100
      );
      document.body.style.setProperty(
        "--nav-background",
        themeSettings.navBackground
      );
      document.body.style.setProperty(
        "--font-dark-nav",
        themeSettings.fontDarkNav
      );
      document.body.style.setProperty(
        "--font-light-nav",
        themeSettings.fontLightNav
      );
      document.body.style.setProperty(
        "--secondary-200",
        themeSettings.secondary200
      );
      document.body.style.setProperty(
        "--secondary-300",
        themeSettings.secondary300
      );
      document.body.style.setProperty(
        "--secondary-400",
        themeSettings.secondary400
      );
      document.body.style.setProperty(
        "--secondary-500",
        themeSettings.secondary500
      );
      document.body.style.setProperty(
        "--nav-selected",
        themeSettings.navSelected
      );
      document.body.style.setProperty(
        "--secondary-600",
        themeSettings.secondary600
      );
      document.body.style.setProperty(
        "--secondary-700",
        themeSettings.secondary700
      );

      document.body.style.setProperty(
        "--accent-yellow",
        themeSettings.accentYellow
      );
      document.body.style.setProperty(
        "--accent-blue",
        themeSettings.accentBlue
      );
      document.body.style.setProperty(
        "--accent-green",
        themeSettings.accentGreen
      );
      document.body.style.setProperty("--accent-red", themeSettings.accentRed);
      document.body.style.setProperty(
        "--accent-orange",
        themeSettings.accentOrange
      );
      document.body.style.setProperty(
        "--accent-teal",
        themeSettings.accentTeal
      );
      document.body.style.setProperty(
        "--accent-purple",
        themeSettings.accentPurple
      );
      document.body.style.setProperty(
        "--accent-pink",
        themeSettings.accentPink
      );

      document.body.style.setProperty("--neutral-50", themeSettings.neutral50);
      document.body.style.setProperty(
        "--neutral-100",
        themeSettings.neutral100
      );
      document.body.style.setProperty(
        "--neutral-200",
        themeSettings.neutral200
      );
      document.body.style.setProperty(
        "--neutral-300",
        themeSettings.neutral300
      );
      document.body.style.setProperty(
        "--neutral-400",
        themeSettings.neutral400
      );
      document.body.style.setProperty(
        "--neutral-500",
        themeSettings.neutral500
      );
      document.body.style.setProperty(
        "--neutral-600",
        themeSettings.neutral600
      );
      document.body.style.setProperty(
        "--neutral-700",
        themeSettings.neutral700
      );
      document.body.style.setProperty(
        "--neutral-800",
        themeSettings.neutral800
      );

      document.body.style.setProperty("--success-50", themeSettings.success50);
      document.body.style.setProperty(
        "--success-100",
        themeSettings.success100
      );
      document.body.style.setProperty(
        "--success-500",
        themeSettings.success500
      );

      document.body.style.setProperty(
        "--warning-100",
        themeSettings.warning100
      );
      document.body.style.setProperty(
        "--warning-500",
        themeSettings.warning500
      );

      document.body.style.setProperty("--error-100", themeSettings.error100);
      document.body.style.setProperty("--error-500", themeSettings.error500);
      document.body.style.setProperty("--error-600", themeSettings.error600);

      document.body.style.setProperty(
        "--font-primary",
        themeSettings.fontPrimary
      );
      document.body.style.setProperty(
        "--font-secondary",
        themeSettings.fontSecondary
      );
      document.body.style.setProperty(
        "--font-tertiary",
        themeSettings.fontTertiary
      );
      document.body.style.setProperty("--font-light", themeSettings.fontLight);
      document.body.style.setProperty("--course-cta", themeSettings.courseCta);
      document.body.style.setProperty(
        "--font-family-primary",
        themeSettings.fontFamilyPrimary
      );

      document.body.style.setProperty(
        "--main-background",
        themeSettings.backgroundColor
      );
      document.body.style.setProperty(
        "--default-primary",
        themeSettings.defaultPrimary
      );
      document.body.style.setProperty("--font-dark", themeSettings.fontDark);
    }

    const loadCachedClientInfo = useCallback((): ClientData | null => {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem(CLIENT_INFO_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ClientInfoCacheEntry;
        if (!parsed?.data) return null;
        if (Date.now() - parsed.timestamp > CLIENT_INFO_TTL) {
          localStorage.removeItem(CLIENT_INFO_CACHE_KEY);
          return null;
        }
        return parsed.data;
      } catch {
        return null;
      }
    }, []);

    const cacheClientInfo = useCallback((data: ClientData) => {
      if (typeof window === "undefined") return;
      try {
        const payload: ClientInfoCacheEntry = {
          timestamp: Date.now(),
          data,
        };
        localStorage.setItem(CLIENT_INFO_CACHE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore storage failures
      }
    }, []);

    const applyClientBranding = useCallback(
      (data: ClientData) => {
        if (!data.is_active) {
          setIsInactive(true);
          return;
        }

        document.title = data.name || "";
        setAppIcons(data.app_icon_url);
        updateOpenGraphTags(data);
        applyThemeSettings(data.theme_settings);
        updateManifest(data);
        dispatch(setClientInfo(data));
        setIsInactive(false);
      },
      [dispatch]
    );

    useEffect(() => {
      const clientId = import.meta.env.VITE_CLIENT_ID;
      if (!clientId) {
        setError("Client ID is not configured");
        return;
      }

      const cached = loadCachedClientInfo();
      if (cached) {
        applyClientBranding(cached);
        setIsInitialized(true);
      }

      const initialize = async () => {
        try {
          const result: ClientData = await loadClientInfo(Number(clientId));
          if (!result.is_active) {
            setIsInactive(true);
            cacheClientInfo(result);
            setIsInitialized(true);
            return;
          }

          applyClientBranding(result);
          cacheClientInfo(result);
          setIsInitialized(true);
        } catch (err: any) {
          if (!cached) {
            setError(err.message || "App initialization failed.");
          }
        }
      };

      initialize();
    }, [applyClientBranding, cacheClientInfo, loadCachedClientInfo]);

    if (error) {
      return <ErrorPage />;
    }

    if (!isInitialized) {
      return (
        <div className="flex flex-col gap-4 items-center justify-center h-screen">
          <div className="loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-teal-600 text-center text-xl">
            🚀 Launching your learning journey...
          </p>
          <style>{`
                        .loader {
                            display: flex;
                            gap: 0.5rem;
                        }


                        .loader span {
                            display: block;
                            width: 12px;
                            height: 12px;
                            background: #14b8a6; /* Teal-500 */
                            border-radius: 50%;
                            animation: bounce 0.6s infinite alternate;
                        }


                        .loader span:nth-child(2) {
                            animation-delay: 0.2s;
                        }


                        .loader span:nth-child(3) {
                            animation-delay: 0.4s;
                        }


                        @keyframes bounce {
                            from {
                                transform: translateY(0);
                                opacity: 0.6;
                            }
                            to {
                                transform: translateY(-15px);
                                opacity: 1;
                            }
                        }
                    `}</style>
        </div>
      );
    }

    if (isInactive) {
      return <AccountInactive />;
    }

    return <WrappedComponent {...props} />;
  };

  return AppInitializer;
};

export default withAppInitializer;
