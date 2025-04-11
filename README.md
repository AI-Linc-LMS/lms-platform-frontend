# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Frontend Development Best Practices & Git Workflow

## 1. Coding Best Practices

### Project Structure
- Follow consistent folder and file naming conventions (e.g., `camelCase`, `kebab-case`).
- Keep components modular and reusable.
- Group related files together (e.g., component + styles + tests).
- Organize your project into a clear hierarchy:
  - `src/` - Main source folder
    - `components/` - Reusable components that can be shared across different parts of the application.
    - `pages/` - Page components for routing, where each file corresponds to a route in the application.
    - `features/` - Feature-specific components and logic, organized by domain or functionality.
    - `styles/` - Global styles and theme files, including CSS or styled-components.
    - `hooks/` - Custom hooks that encapsulate reusable logic.
    - `utils/` - Utility functions that can be used throughout the application.
    - `assets/` - Images, fonts, and other static assets that are used in the application.
- Example folder structure:
  ```
  src/
  ├── components/
  ├── pages/
  ├── features/
  ├── styles/
  ├── hooks/
  ├── utils/
  └── assets/
  ```

### Code Style
- Use team-preferred linting tools (e.g., ESLint, Prettier).
- Write meaningful variable, function, and component names.
- Avoid commented-out or unused code in commits.
- Keep functions small, testable, and focused.

### React/Next.js Best Practices
- Use functional components and React Hooks.
- Avoid prop drilling – use Context or Redux if needed.
- Use `useEffect` carefully to avoid infinite loops or unnecessary re-renders.
- Use lazy loading (`next/dynamic`) where necessary.

### Performance & Accessibility
- Use semantic HTML elements.
- Ensure color contrast, keyboard navigation, and alt texts for images.
- Optimize images and use `next/image`.
- Use memoization (`React.memo`, `useMemo`, `useCallback`) when necessary.

---

## 2. Git Workflow Guidelines

### Branching Strategy
- Never push directly to `main`.
- Create a new branch from `main`:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/your-feature-name
  ```

#### Branch Naming Conventions
- `feature/feature-name`
- `bugfix/bug-description`
- `hotfix/urgent-fix`
- `refactor/code-improvement`

### Commit Message Guidelines

Use the format:```
<type>: <short description>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Styling only
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Miscellaneous tasks

**Examples:**
```bash
feat: implement course listing page
fix: resolve image alignment issue on mobile
```

### Pushing Code
```bash
git add .
git commit -m "feat: implement signup form"
git push origin feature/signup-form
```

---

## 3. Creating & Merging Pull Requests

- Create PRs to `main` or `develop`.
- Add a descriptive title and description.
- Request a peer review.
- Address review comments.
- Use **Squash & Merge** strategy to maintain clean history.
- Delete feature branch after merge.

---

## 4. General Tips

- Always `git pull` before creating a new branch.
- Regularly sync your branch with `main`.
- Use `.env.example` for shared environment variables.
- Document any new modules/components in `README.md`.

---

## 5. Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [React Docs](https://react.dev/)
- [Next.js Docs](https://nextjs.org/docs)

