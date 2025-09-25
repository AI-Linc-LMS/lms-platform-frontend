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
            if (result.themeDetails) {
              document.body.style.setProperty(
                "--primary-50",
                result.themeDetails.primary50
              );
              document.body.style.setProperty(
                "--primary-100",
                result.themeDetails.primary100
              );
              document.body.style.setProperty(
                "--primary-200",
                result.themeDetails.primary200
              );
              document.body.style.setProperty(
                "--primary-300",
                result.themeDetails.primary300
              );
              document.body.style.setProperty(
                "--primary-400",
                result.themeDetails.primary400
              );
              document.body.style.setProperty(
                "--primary-500",
                result.themeDetails.primary500
              );

              document.body.style.setProperty(
                "--primary-600",
                result.themeDetails.primary600
              );
              document.body.style.setProperty(
                "--primary-700",
                result.themeDetails.primary700
              );
              document.body.style.setProperty(
                "--primary-800",
                result.themeDetails.primary800
              );
              document.body.style.setProperty(
                "--primary-900",
                result.themeDetails.primary900
              );

              /* Secondary Colors */
              document.body.style.setProperty(
                "--secondary-50",
                result.themeDetails.secondary50
              );
              document.body.style.setProperty(
                "--secondary-100",
                result.themeDetails.secondary100
              );
              document.body.style.setProperty(
                "--secondary-200",
                result.themeDetails.secondary200
              );
              document.body.style.setProperty(
                "--secondary-300",
                result.themeDetails.secondary300
              );
              document.body.style.setProperty(
                "--secondary-400",
                result.themeDetails.secondary400
              );
              document.body.style.setProperty(
                "--secondary-500",
                result.themeDetails.secondary500
              );
              document.body.style.setProperty(
                "--nav-selected",
                result.themeDetails.navSelected
              );
              document.body.style.setProperty(
                "--secondary-600",
                result.themeDetails.secondary600
              );
              document.body.style.setProperty(
                "--secondary-700",
                result.themeDetails.secondary700
              );

              /* Accent Colors */
              document.body.style.setProperty(
                "--accent-yellow",
                result.themeDetails.accentYellow
              );
              document.body.style.setProperty(
                "--accent-blue",
                result.themeDetails.accentBlue
              );
              document.body.style.setProperty(
                "--accent-green",
                result.themeDetails.accentGreen
              );
              document.body.style.setProperty(
                "--accent-red",
                result.themeDetails.accentRed
              );
              document.body.style.setProperty(
                "--accent-orange",
                result.themeDetails.accentOrange
              );
              document.body.style.setProperty(
                "--accent-teal",
                result.themeDetails.accentTeal
              );
              document.body.style.setProperty(
                "--accent-purple",
                result.themeDetails.accentPurple
              );
              document.body.style.setProperty(
                "--accent-pink",
                result.themeDetails.accentPink
              );

              /* Neutral Colors */
              document.body.style.setProperty(
                "--neutral-50",
                result.themeDetails.neutral50
              );
              document.body.style.setProperty(
                "--neutral-100",
                result.themeDetails.neutral100
              );
              document.body.style.setProperty(
                "--neutral-200",
                result.themeDetails.neutral200
              );
              document.body.style.setProperty(
                "--neutral-300",
                result.themeDetails.neutral300
              );
              document.body.style.setProperty(
                "--neutral-400",
                result.themeDetails.neutral400
              );
              document.body.style.setProperty(
                "--neutral-500",
                result.themeDetails.neutral500
              );
              document.body.style.setProperty(
                "--neutral-600",
                result.themeDetails.neutral600
              );
              document.body.style.setProperty(
                "--neutral-700",
                result.themeDetails.neutral700
              );
              document.body.style.setProperty(
                "--neutral-800",
                result.themeDetails.neutral800
              );

              /* Success Colors */
              document.body.style.setProperty(
                "--success-50",
                result.themeDetails.success50
              );
              document.body.style.setProperty(
                "--success-100",
                result.themeDetails.success100
              );
              document.body.style.setProperty(
                "--success-500",
                result.themeDetails.success500
              );

              /* Warning Colors */
              document.body.style.setProperty(
                "--warning-100",
                result.themeDetails.warning100
              );
              document.body.style.setProperty(
                "--warning-500",
                result.themeDetails.warning500
              );

              /* Error Colors */
              document.body.style.setProperty(
                "--error-100",
                result.themeDetails.error100
              );
              document.body.style.setProperty(
                "--error-500",
                result.themeDetails.error500
              );
              document.body.style.setProperty(
                "--error-600",
                result.themeDetails.error600
              );

              /* Font Colors */
              document.body.style.setProperty(
                "--font-primary",
                result.themeDetails.fontPrimary
              );
              document.body.style.setProperty(
                "--font-secondary",
                result.themeDetails.fontSecondary
              );
              document.body.style.setProperty(
                "--font-tertiary",
                result.themeDetails.fontTertiary
              );
              document.body.style.setProperty(
                "--font-light",
                result.themeDetails.fontLight
              );

              /* Font Family */
              document.body.style.setProperty(
                "--font-family-primary",
                result.themeDetails.fontFamilyPrimary
              );

              /* Background (extra) */
              document.body.style.setProperty(
                "--main-background",
                result.themeDetails.backgroundColor
              );
              document.body.style.setProperty(
                "--default-primary",
                result.themeDetails.defaultPrimary
              );
              document.body.style.setProperty(
                "--font-dark",
                result.themeDetails.fontDark
              );
            }
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
