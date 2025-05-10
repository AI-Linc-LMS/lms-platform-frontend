export interface DevelopmentProject {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  initialHtml: string;
  initialCss: string;
  initialJs: string;
}

export const mockDevelopmentProjects: Record<string, DevelopmentProject> = {
  "dev1": {
    id: "dev1",
    title: "HTML and CSS Styling For Inline Heading And Block Paragraphs",
    description: "You are tasked with styling an inline heading and 2 block paragraphs using HTML and CSS. The inline heading should be styled with the color blue (#0000FF) and a font size of 24 pixels, and the block paragraphs should be styled with the color black (#000000), a font size of 16 pixels, and a margin bottom of 10 pixels, making them visually distinct.",
    difficulty: "Easy",
    initialHtml: `<span class="inline-heading">This is an inline heading</span>
<p class="block-paragraph">This is a block paragraph.</p>
<p class="block-paragraph">Another block paragraph.</p>`,
    initialCss: `/* Add your CSS styles here */
`,
    initialJs: `// You don't need JavaScript for this task
// But you can use it if you want to add any interactive features
`
  },
  "dev2": {
    id: "dev2",
    title: "Interactive Form Validation",
    description: "Build a form with client-side validation using JavaScript. The form should have fields for name, email, and password with specific validation requirements.",
    difficulty: "Medium",
    initialHtml: `<form id="validation-form">
  <div class="form-group">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name">
    <div class="error-message" id="name-error"></div>
  </div>
  
  <div class="form-group">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email">
    <div class="error-message" id="email-error"></div>
  </div>
  
  <div class="form-group">
    <label for="password">Password:</label>
    <input type="password" id="password" name="password">
    <div class="error-message" id="password-error"></div>
  </div>
  
  <button type="submit">Submit</button>
</form>`,
    initialCss: `.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.error-message {
  color: red;
  font-size: 12px;
  margin-top: 5px;
  min-height: 15px;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}`,
    initialJs: `// Add your form validation logic here
document.getElementById('validation-form').addEventListener('submit', function(event) {
  // Prevent the form from submitting
  event.preventDefault();
  
  // Get form values
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // TODO: Implement validation rules
  // 1. Name should not be empty
  // 2. Email should be a valid email format
  // 3. Password should be at least 8 characters with at least one number and one special character
  
  // Display validation results
  
});`
  },
  "dev3": {
    id: "dev3",
    title: "Todo List Application",
    description: "Create a functional todo list application with features to add, edit, and delete tasks. Your implementation should use proper event handling and DOM manipulation.",
    difficulty: "Medium",
    initialHtml: `<div class="todo-app">
  <h1>Todo List</h1>
  
  <form id="todo-form">
    <input type="text" id="todo-input" placeholder="Add a new task...">
    <button type="submit">Add</button>
  </form>
  
  <ul id="todo-list">
    <!-- Todo items will be added here -->
  </ul>
</div>`,
    initialCss: `.todo-app {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
}

#todo-form {
  display: flex;
  margin-bottom: 20px;
}

#todo-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
}

button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

#todo-list {
  list-style-type: none;
  padding: 0;
}

/* You'll need to add styles for todo items */`,
    initialJs: `// Todo List Application logic
document.addEventListener('DOMContentLoaded', function() {
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  
  // TODO: Implement functionality to:
  // 1. Add new todo items
  // 2. Mark items as complete
  // 3. Delete items
  // 4. Edit items (bonus)
  
  todoForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Add your code to handle adding new todos
    
  });
});`
  },
  "dev4": {
    id: "dev4",
    title: "Responsive Dashboard Layout",
    description: "Design and implement a responsive dashboard layout that adapts to different screen sizes. The dashboard should include a header, sidebar, and main content area with cards.",
    difficulty: "Hard",
    initialHtml: `<div class="dashboard">
  <header class="header">
    <div class="logo">Dashboard</div>
    <nav class="nav">
      <a href="#" class="nav-item active">Home</a>
      <a href="#" class="nav-item">Reports</a>
      <a href="#" class="nav-item">Settings</a>
    </nav>
    <div class="user-profile">
      <span>User</span>
    </div>
  </header>
  
  <div class="main-container">
    <aside class="sidebar">
      <ul class="sidebar-menu">
        <li class="menu-item active">Dashboard</li>
        <li class="menu-item">Analytics</li>
        <li class="menu-item">Sales</li>
        <li class="menu-item">Customers</li>
        <li class="menu-item">Products</li>
      </ul>
    </aside>
    
    <main class="content">
      <h1>Dashboard Overview</h1>
      
      <div class="card-grid">
        <!-- Sample cards, you should create at least 4 -->
        <div class="card">
          <h2>Total Sales</h2>
          <p class="card-value">$24,500</p>
        </div>
        
        <!-- Add more cards here -->
      </div>
    </main>
  </div>
</div>`,
    initialCss: `/* Base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
}

/* TODO: Implement responsive dashboard styles */
/* 1. Create a fixed header at the top */
/* 2. Create a sidebar that collapses on mobile */
/* 3. Create a responsive grid for dashboard cards */
/* 4. Add media queries for different screen sizes */

/* Header styles */
.header {
  /* Add your styles */
}

/* Sidebar styles */
.sidebar {
  /* Add your styles */
}

/* Content area styles */
.content {
  /* Add your styles */
}

/* Card styles */
.card {
  /* Add your styles */
}

/* Media queries for responsiveness */
@media (max-width: 768px) {
  /* Add responsive adjustments */
}`,
    initialJs: `// You can use JavaScript to handle the responsive behavior
// For example, toggle the sidebar on mobile

document.addEventListener('DOMContentLoaded', function() {
  // Add any interactive features for your dashboard here
  
  // For example, you could add a sidebar toggle button for mobile
});`
  }
}; 