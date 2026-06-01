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
    // Maps 1:1 to a preset id in client_theming/presets.py — see THEME_PRESETS.
    preset_id?:
      | "default"
      | "azure_bolt"
      | "sakura_day"
      | "sky_paper"
      | "mono_minimal";
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
    choice?: "import" | "skip";
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
