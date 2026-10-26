Jenkins + test files bundle

Files:
- Jenkinsfile: Windows-compatible Jenkins pipeline, backend and frontend tests only.
- Backend/test/app.test.js: tests the existing GET / backend status endpoint.
- Frontend/src/pages/Home.test.jsx: Vitest/Testing Library tests for the Home page.

IMPORTANT:
1. Put Jenkinsfile in the repository root.
2. Add the two test files at their listed paths.
3. Merge "test": "node --test" into Backend/package.json scripts.
4. Merge "test": "vitest" into Frontend/package.json scripts.
5. Add frontend test dependencies to Frontend/package.json:
   @testing-library/jest-dom, @testing-library/react, jsdom, vitest.
   Keep all existing dependencies; do not replace package.json with a template.
6. Run npm install in Backend and Frontend, then commit package.json and package-lock.json.
7. Jenkins Windows service must be able to find node.exe and npm.cmd in PATH.

The tests are based on the current repository's Express root route and Home component behavior.
If your local branch has changed these files, adjust the tests to match the current implementation.
