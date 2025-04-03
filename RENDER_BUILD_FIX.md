# ChickFarms Render Build Fix Guide

## Quick Fix for Common Build Errors

If you're encountering build errors when deploying to Render, this quick guide provides solutions.

### Fix 1: Use the Enhanced Build Script

The most reliable fix is to use our enhanced `render-build.js` script instead of direct build commands:

1. **Update your render.yaml**:
   ```yaml
   services:
     - type: web
       name: chickfarms
       env: node
       buildCommand: node render-build.js
       startCommand: node server.js
   ```

2. **Verify script permissions**: Make sure `render-build.js` is executable

### Fix 2: Install Required Build Dependencies

If you prefer not to use the enhanced build script, ensure you install ALL required dependencies:

```
npm install && 
npm install --save vite esbuild @vitejs/plugin-react typescript @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-shadcn-theme-json tailwindcss tailwindcss-animate postcss autoprefixer && 
export NODE_ENV=production && 
npx vite build && 
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### Fix 3: Use Updated server.js

The updated `server.js` file includes:
- Better ESM/CommonJS module handling
- Improved error logging
- More robust route loading

### Common Error Messages & Solutions

| Error | Solution |
|-------|----------|
| "Cannot find package 'vite'" | Use the enhanced build script that installs all dependencies |
| "ERR_MODULE_NOT_FOUND" | Use updated server.js with proper module loading |
| "command not found" (status 127) | Ensure build tools are installed during build |
| "Unknown file extension .ts" | The esbuild bundle command correctly compiles TS files |

## Emergency Options

If all else fails:

1. Use the Render Shell tab to access your deployment
2. Run `npm install -g vite esbuild typescript`
3. Manually run the build steps:
   ```
   export NODE_ENV=production
   npx vite build
   npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
   ```
4. Restart your service

For detailed deployment instructions, see the complete [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md).