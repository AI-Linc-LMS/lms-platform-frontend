export interface WizardData {
  welcome?: {
    confirmed_org_name?: string;
    confirmed_contact_name?: string;
  };
  brand?: {
    light_logo_url?: string;
    dark_logo_url?: string;
    favicon_url?: string;
    primary_color?: string;
    accent_color?: string;
  };
  url?: {
    subdomain?: string;
    custom_domain?: string;
  };
  theme?: {
    /**
     * One of the 4 starter presets exposed in step 4 of the wizard. Maps 1:1
     * to a preset id in client_theming/presets.py on the backend, so the
     * launch handler can hydrate `client.theme_settings` from the matching
     * preset's full theme dict. More presets are available post-launch via
     * Settings → Branding (admin page hits the same preset registry).
     */
    preset_id?: "default" | "azure_bolt" | "graphite_night" | "sky_paper";
    /**
     * Default UI mode the LMS opens in for first-time visitors. Each preset
     * has a "natural" mode but the user can still override (e.g. pick the
     * Sky Paper preset but prefer the dark variant on first load).
     */
    default_mode?: "dark" | "light";
    hero_image_url?: string;
    welcome_message?: string;
  };
  features?: {
    selected_feature_ids?: number[];
    ai_tutor?: boolean;
    ai_grading?: boolean;
    proctoring?: boolean;
    blockchain_certificates?: boolean;
    forums?: boolean;
    live_classes?: boolean;
  };
  // admin_caps removed — every tenant now gets the full admin capability
  // set by default. The dedicated wizard step was dropped; admins can still
  // refine permissions post-launch via Settings → Admin permissions.

  course_library?: {
    choice?: "import" | "build" | "skip";
    /**
     * Course IDs picked from the AI Linc master catalogue. The launch
     * handler duplicates each one into the new tenant's client so the
     * tenant starts with a real library rather than empty shelves.
     * Only meaningful when `choice === "import"`.
     */
    selected_course_ids?: number[];
    /** Display-friendly titles cached for the review-step summary. */
    selected_course_titles?: string[];
    /** Legacy field — kept for prior in-flight drafts. */
    import_count?: number;
  };
}

export const TOTAL_WIZARD_STEPS = 7;

export const STEP_TITLES = [
  "Welcome",
  "Brand identity",
  "URL",
  "Theme",
  "Features",
  "Course library",
  "Review & launch",
] as const;
