/**
 * Template key -> translation key, in one place.
 *
 * Lived inside ResumeBuilder while the builder was the only thing that listed resumes. The saved
 * resumes list is now its own surface and needs the same readable name, and a second copy of this
 * map is exactly how one list ends up calling a template "twocolumn" while the other calls it
 * "Two column".
 */
export const TEMPLATE_KEYS: Record<string, string> = {
  modern: "templateModern",
  classic: "templateClassic",
  minimal: "templateMinimal",
  executive: "templateExecutive",
  creative: "templateCreative",
  technical: "templateTechnical",
  western: "templateWestern",
  luxsleek: "templateLuxsleek",
  twocolumn: "templateTwocolumn",
  accentbar: "templateAccentbar",
  rightsidebar: "templateRightsidebar",
  bubble: "templateBubble",
};
