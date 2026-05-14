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
    template?: "minimal" | "academic" | "vibrant" | "corporate";
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
  admin_caps?: {
    bulk_import?: boolean;
    ai_builder?: boolean;
    analytics_depth?: "basic" | "advanced";
    sub_admin_creation?: boolean;
    api_access?: boolean;
  };
  course_library?: {
    choice?: "import" | "build" | "skip";
    import_count?: number;
  };
}

export const TOTAL_WIZARD_STEPS = 8;

export const STEP_TITLES = [
  "Welcome",
  "Brand identity",
  "URL",
  "Theme",
  "Features",
  "Admin capabilities",
  "Course library",
  "Review & launch",
] as const;
