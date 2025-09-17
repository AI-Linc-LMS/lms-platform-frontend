import React, {ComponentType, useEffect, useState} from 'react';
import {initApp} from '../services/authApis';
import logo from '/logo.png';
import {setClientInfo} from "../redux/slices/client-info.ts";
import {useDispatch} from "react-redux";

const withAppInitializer = <P extends object>(WrappedComponent: ComponentType<P>) => {
    const AppInitializer: React.FC<P> = (props) => {
        const [isInitialized, setIsInitialized] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [response, setResponse] = useState(null);
        const dispatch = useDispatch();

        useEffect(() => {
            const initialize = async () => {
                try {
                    const clientId = import.meta.env.VITE_CLIENT_ID;
                    if (!clientId) {
                        throw new Error('Client ID is not configured');
                    }
                    setResponse(await initApp(Number(clientId)));
                    // setClientInfo(response);
                    setTimeout(() => {
                        setIsInitialized(true);
                    }, 1000)
                } catch (err: any) {
                    setError(err.message || 'App initialization failed.');
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
                    <img src={logo} alt="Logo" className="w-48 h-48 mb-4"/>
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

        return <WrappedComponent {...props} />;
    };

    return AppInitializer;
};

export default withAppInitializer;
