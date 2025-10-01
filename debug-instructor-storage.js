// Instructor Debug Utility
// Run this in browser console to debug instructor storage

function debugInstructorStorage() {
  const INSTRUCTOR_KEY = "course_instructors";
  const TAG_KEY = "course_tags";

  console.log("🔍 INSTRUCTOR STORAGE DEBUG");
  console.log("============================");

  // Check instructor storage
  const instructorData = localStorage.getItem(INSTRUCTOR_KEY);
  if (instructorData) {
    console.log("📦 Instructor Storage Found:", JSON.parse(instructorData));
  } else {
    console.log("❌ No instructor storage found");
  }

  // Check tag storage
  const tagData = localStorage.getItem(TAG_KEY);
  if (tagData) {
    console.log("🏷️ Tag Storage Found:", JSON.parse(tagData));
  } else {
    console.log("❌ No tag storage found");
  }

  console.log("============================");
}

function testInstructorSave(courseId = 1) {
  const INSTRUCTOR_KEY = "course_instructors";

  console.log(`🧪 Testing instructor save for course ${courseId}`);

  const testInstructors = [
    {
      id: 1,
      name: "Test Instructor 1",
      profile_pic_url: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      name: "Test Instructor 2",
      profile_pic_url: "https://via.placeholder.com/150",
    },
  ];

  // Store test data
  const stored = localStorage.getItem(INSTRUCTOR_KEY);
  const data = stored ? JSON.parse(stored) : {};
  data[courseId] = testInstructors;
  localStorage.setItem(INSTRUCTOR_KEY, JSON.stringify(data));

  console.log("✅ Test instructors saved:", testInstructors);
  console.log(
    "📦 Storage now contains:",
    JSON.parse(localStorage.getItem(INSTRUCTOR_KEY))
  );

  return testInstructors;
}

function clearInstructorStorage() {
  const INSTRUCTOR_KEY = "course_instructors";
  localStorage.removeItem(INSTRUCTOR_KEY);
  console.log("🗑️ Instructor storage cleared");
}

// Make functions available globally
window.debugInstructorStorage = debugInstructorStorage;
window.testInstructorSave = testInstructorSave;
window.clearInstructorStorage = clearInstructorStorage;

console.log("🛠️ Instructor debug utilities loaded!");
console.log("Available functions:");
console.log("- debugInstructorStorage() - Check current storage");
console.log("- testInstructorSave(courseId) - Save test data");
console.log("- clearInstructorStorage() - Clear all instructor data");
console.log("");
console.log("🚀 Run debugInstructorStorage() to start debugging");
