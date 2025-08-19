// Global types for Google Identity Services used across the app

interface GoogleAccountsGlobal {
	id: {
		initialize: (config: {
			client_id: string;
			callback: (response: { credential: string }) => void;
			auto_select?: boolean;
			cancel_on_tap_outside?: boolean;
		}) => void;
		renderButton: (
			element: HTMLElement | null,
			config: {
				theme: string;
				size: string;
				width: number;
				text: string;
				logo_alignment: string;
			}
		) => void;
	};
}

declare global {
	interface Window {
		google?: { accounts: GoogleAccountsGlobal };
	}
}

export {}; 