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
    // Maps 1:1 to a preset id in client_theming/presets.py - see THEME_PRESETS.
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
  // admin_caps removed - every tenant now gets the full admin capability
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
    /** Legacy field - kept for prior in-flight drafts. */
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

/**
 * A draft with the classic catalogue import taken out: the Course library choice becomes "skip".
 *
 * "import" made launch copy each selected AI Linc catalogue course into the new tenant with the
 * backend's duplicate_course(), which creates CLASSIC courses. The Features step no longer offers
 * `course`, the only key that shows classic courses, so a tenant launched with an import got all
 * of those copies and no screen that lists them, while Review promised "5 courses". The Course
 * library step no longer offers the option. This also covers a draft saved with "import" before
 * that change, which could otherwise launch straight from Review.
 */
export function withoutClassicCourseImport(data: WizardData): WizardData {
  if (data.course_library?.choice === "skip") return data;
  return { ...data, course_library: { choice: "skip" } };
}
