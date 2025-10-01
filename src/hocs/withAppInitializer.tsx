import React, { ComponentType, useEffect, useState } from "react";
import { initApp } from "../services/authApis";
import logo from "/logo.png";
import { ClientData, setClientInfo } from "../redux/slices/client-info.ts";
import { useDispatch } from "react-redux";
import AccountInactive from "../features/learn/pages/AccountInactive.tsx";

const withAppInitializer = <P extends object>(
  WrappedComponent: ComponentType<P>
) => {
  const AppInitializer: React.FC<P> = (props) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<ClientData>();
    const dispatch = useDispatch();
    const [isInactive, setIsInactive] = useState<boolean>(false);

    function setAppIcons(url: string) {
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

    useEffect(() => {
      const initialize = async () => {
        try {
          const clientId = import.meta.env.VITE_CLIENT_ID;
          if (!clientId) {
            throw new Error("Client ID is not configured");
          }
          const result: ClientData = await initApp(Number(clientId));
          if (result.is_active) {
            setResponse(result);
            /* Primary Colors */
            document.title = result.name || "AI Linc|App";

            setAppIcons(result.app_icon_url);
            if (
              result.theme_settings &&
              Object.keys(result.theme_settings).length > 0
            ) {
              document.body.style.setProperty(
                "--primary-50",
                result.theme_settings.primary50
              );
              document.body.style.setProperty(
                "--primary-100",
                result.theme_settings.primary100
              );
              document.body.style.setProperty(
                "--primary-200",
                result.theme_settings.primary200
              );
              document.body.style.setProperty(
                "--primary-300",
                result.theme_settings.primary300
              );
              document.body.style.setProperty(
                "--primary-400",
                result.theme_settings.primary400
              );
              document.body.style.setProperty(
                "--primary-500",
                result.theme_settings.primary500
              );

              document.body.style.setProperty(
                "--primary-600",
                result.theme_settings.primary600
              );
              document.body.style.setProperty(
                "--primary-700",
                result.theme_settings.primary700
              );
              document.body.style.setProperty(
                "--primary-800",
                result.theme_settings.primary800
              );
              document.body.style.setProperty(
                "--primary-900",
                result.theme_settings.primary900
              );

              /* Secondary Colors */
              document.body.style.setProperty(
                "--secondary-50",
                result.theme_settings.secondary50
              );
              document.body.style.setProperty(
                "--secondary-100",
                result.theme_settings.secondary100
              );
              document.body.style.setProperty(
                "--nav-background",
                result.theme_settings.navBackground
              );
              document.body.style.setProperty(
                "--font-dark-nav",
                result.theme_settings.fontDarkNav
              );
              document.body.style.setProperty(
                "--font-light-nav",
                result.theme_settings.fontLightNav
              );
              document.body.style.setProperty(
                "--secondary-200",
                result.theme_settings.secondary200
              );
              document.body.style.setProperty(
                "--secondary-300",
                result.theme_settings.secondary300
              );
              document.body.style.setProperty(
                "--secondary-400",
                result.theme_settings.secondary400
              );
              document.body.style.setProperty(
                "--secondary-500",
                result.theme_settings.secondary500
              );
              document.body.style.setProperty(
                "--nav-selected",
                result.theme_settings.navSelected
              );
              document.body.style.setProperty(
                "--secondary-600",
                result.theme_settings.secondary600
              );
              document.body.style.setProperty(
                "--secondary-700",
                result.theme_settings.secondary700
              );

              /* Accent Colors */
              document.body.style.setProperty(
                "--accent-yellow",
                result.theme_settings.accentYellow
              );
              document.body.style.setProperty(
                "--accent-blue",
                result.theme_settings.accentBlue
              );
              document.body.style.setProperty(
                "--accent-green",
                result.theme_settings.accentGreen
              );
              document.body.style.setProperty(
                "--accent-red",
                result.theme_settings.accentRed
              );
              document.body.style.setProperty(
                "--accent-orange",
                result.theme_settings.accentOrange
              );
              document.body.style.setProperty(
                "--accent-teal",
                result.theme_settings.accentTeal
              );
              document.body.style.setProperty(
                "--accent-purple",
                result.theme_settings.accentPurple
              );
              document.body.style.setProperty(
                "--accent-pink",
                result.theme_settings.accentPink
              );

              /* Neutral Colors */
              document.body.style.setProperty(
                "--neutral-50",
                result.theme_settings.neutral50
              );
              document.body.style.setProperty(
                "--neutral-100",
                result.theme_settings.neutral100
              );
              document.body.style.setProperty(
                "--neutral-200",
                result.theme_settings.neutral200
              );
              document.body.style.setProperty(
                "--neutral-300",
                result.theme_settings.neutral300
              );
              document.body.style.setProperty(
                "--neutral-400",
                result.theme_settings.neutral400
              );
              document.body.style.setProperty(
                "--neutral-500",
                result.theme_settings.neutral500
              );
              document.body.style.setProperty(
                "--neutral-600",
                result.theme_settings.neutral600
              );
              document.body.style.setProperty(
                "--neutral-700",
                result.theme_settings.neutral700
              );
              document.body.style.setProperty(
                "--neutral-800",
                result.theme_settings.neutral800
              );

              /* Success Colors */
              document.body.style.setProperty(
                "--success-50",
                result.theme_settings.success50
              );
              document.body.style.setProperty(
                "--success-100",
                result.theme_settings.success100
              );
              document.body.style.setProperty(
                "--success-500",
                result.theme_settings.success500
              );

              /* Warning Colors */
              document.body.style.setProperty(
                "--warning-100",
                result.theme_settings.warning100
              );
              document.body.style.setProperty(
                "--warning-500",
                result.theme_settings.warning500
              );

              /* Error Colors */
              document.body.style.setProperty(
                "--error-100",
                result.theme_settings.error100
              );
              document.body.style.setProperty(
                "--error-500",
                result.theme_settings.error500
              );
              document.body.style.setProperty(
                "--error-600",
                result.theme_settings.error600
              );

              /* Font Colors */
              document.body.style.setProperty(
                "--font-primary",
                result.theme_settings.fontPrimary
              );
              document.body.style.setProperty(
                "--font-secondary",
                result.theme_settings.fontSecondary
              );
              document.body.style.setProperty(
                "--font-tertiary",
                result.theme_settings.fontTertiary
              );
              document.body.style.setProperty(
                "--font-light",
                result.theme_settings.fontLight
              );

              /* Font Family */
              document.body.style.setProperty(
                "--font-family-primary",
                result.theme_settings.fontFamilyPrimary
              );

              /* Background (extra) */
              document.body.style.setProperty(
                "--main-background",
                result.theme_settings.backgroundColor
              );
              document.body.style.setProperty(
                "--default-primary",
                result.theme_settings.defaultPrimary
              );
              document.body.style.setProperty(
                "--font-dark",
                result.theme_settings.fontDark
              );
            }

            const manifest = {
              name: result.name,
              short_name: result.slug || result.name,
              description: "AI-powered learning and assessment platform",
              start_url: "/login",
              display: "standalone",
              background_color: "#ffffff",
              theme_color: "#ffffff",
              lang: "en",
              scope: "/",
              orientation: "portrait",
              id: "/",
              icons: [
                {
                  src: result.app_icon_url || "/pwa-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src: result.app_icon_url || "/pwa-512x512.png",
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

            let link: HTMLLinkElement | null = document.querySelector(
              'link[rel="manifest"]'
            );
            if (!link) {
              link = document.createElement("link");
              link.rel = "manifest";
              link.id = "app-manifest";
              document.head.appendChild(link);
            }
            link.href = manifestURL;
            link.id = "app-manifest";
            document.head.appendChild(link);

            // ✅ Dispatch event for PWA manager
            window.dispatchEvent(
              new CustomEvent("manifest-updated", {
                detail: { manifest, url: manifestURL },
              })
            );
          } else {
            setIsInactive(true);
          }
          // setClientInfo(response);
          setTimeout(() => {
            setIsInitialized(true);
          }, 1000);
        } catch (err: any) {
          setError(err.message || "App initialization failed.");
        }
      };

      initialize();
    }, []);

    useEffect(() => {
      if (response) {
        dispatch(setClientInfo(response));
      }
    }, [response, dispatch]);

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
          <img src={logo} alt="Logo" className="w-48 h-48 mb-4" />
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      );
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
