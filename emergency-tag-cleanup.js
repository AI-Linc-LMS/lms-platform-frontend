// Emergency Tag Cleanup Script
// Run this in browser console to immediately remove problematic tags

function emergencyTagCleanup() {
  const COURSE_TAGS_STORAGE_KEY = "course_tags_storage";

  try {
    const stored = localStorage.getItem(COURSE_TAGS_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const problematicTags = [
        "adsfdasfadf",
        "data",
        "science",
        "complete",
        "course",
        "sql",
        "SQL",
      ];

      let cleaned = false;

      Object.keys(data).forEach((courseId) => {
        const originalTags = data[courseId] || [];
        const cleanedTags = originalTags.filter((tag) => {
          return !problematicTags.some(
            (problematic) =>
              tag.toLowerCase() === problematic.toLowerCase() ||
              tag === "adsfdasfadf" ||
              /^[a-z]{10,}$/.test(tag.toLowerCase())
          );
        });

        if (cleanedTags.length !== originalTags.length) {
          data[courseId] = cleanedTags;
          cleaned = true;
          console.log(`🧹 Cleaned course ${courseId}:`, {
            before: originalTags,
            after: cleanedTags,
          });
        }
      });

      if (cleaned) {
        localStorage.setItem(COURSE_TAGS_STORAGE_KEY, JSON.stringify(data));
        console.log("✅ Emergency cleanup completed! Reload the page.");
        return true;
      } else {
        console.log("📝 No problematic tags found.");
        return false;
      }
    } else {
      console.log("📋 No stored tags found.");
      return false;
    }
  } catch (error) {
    console.error("❌ Error during emergency cleanup:", error);
    return false;
  }
}

// Run the cleanup immediately
console.log("🚨 Running emergency tag cleanup...");
const result = emergencyTagCleanup();

if (result) {
  console.log(
    "🎉 Success! Please reload your browser page to see the changes."
  );
} else {
  console.log("ℹ️ No changes needed or no data found.");
}

// Make function available globally
window.emergencyTagCleanup = emergencyTagCleanup;
console.log("💡 You can run emergencyTagCleanup() again if needed.");
