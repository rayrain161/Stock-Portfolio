---
description: How to deploy the Stock Portfolio application
---
# Deployment Workflow

Follow these steps to deploy the application to GitHub Pages.

1. **Commit and Push changes**:
   Stage, commit, and push all changes in one command (PowerShell compatible).
   ```powershell
   git add . ; git commit -m "feat: description of changes" ; git push origin master
   ```

3. **Build the Application**:
   Run the hybrid build script to generate the distribution files.
   // turbo
   ```powershell
   node build_hybrid.js
   ```

4. **Deploy to GitHub Pages**:
   Use the `gh-pages` script to publish the `dist` folder.
   // turbo
   ```powershell
   npm run deploy
   ```
