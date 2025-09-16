import React, { ComponentType, useEffect, useState } from 'react';
import { initApp } from '../services/authApis';
import logo from '/logo.png';
import {setClientInfo} from "../redux/slices/client-info.ts";

const withAppInitializer = <P extends object>(WrappedComponent: ComponentType<P>) => {
    const AppInitializer: React.FC<P> = (props) => {
        const [isInitialized, setIsInitialized] = useState(false);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
            const initialize = async () => {
                try {
                    const clientId = import.meta.env.VITE_CLIENT_ID;
                    if (!clientId) {
                        throw new Error('Client ID is not configured');
                    }
                    const response = await initApp(Number(clientId));
                    setClientInfo(response);
                    setIsInitialized(true);
                } catch (err: any) {
                    setError(err.message || 'App initialization failed.');
                }
            };

            initialize();
        }, []);

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
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                    <img src={logo} alt="Logo" className="w-48 h-48 mb-4" />
                    <div className="text-lg">Initializing...</div>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };

    return AppInitializer;
};

export default withAppInitializer;
