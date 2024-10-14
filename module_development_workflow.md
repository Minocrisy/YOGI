# YOGI Module Development Workflow

This document outlines the workflow for developing and integrating new modules into the YOGI project, addressing common issues and ensuring smooth functionality across all tabs and API keys.

## 1. Planning and Design

Before adding a new module:

1. Clearly define the module's purpose and functionality.
2. Identify which existing components it will interact with.
3. Determine any new API keys or external services required.
4. Design the module's interface and how it will integrate with the existing tab structure.

## 2. Module Development

When creating a new module:

1. Create a new file in the `public/js/modules/` directory, named appropriately (e.g., `newFeatureModule.js`).
2. Use the existing module structure as a template:
   ```javascript
   export function initNewFeatureModule() {
     // Module initialization code
     function internalFunction() {
       // Internal function definitions
     }
     // Event listeners and other setup
     return {
       // Public methods and properties
     };
   }
   ```
3. Keep the module self-contained, minimizing dependencies on other modules.
4. Use consistent naming conventions and code style.

## 3. API Key Management

To avoid issues with API keys:

1. Update the `apiKeyModule.js` file to include any new API keys required by the module.
2. In `server.js`, add the new API key to the `apiKeys` array:
   ```javascript
   let apiKeys = [
     // ... existing keys
     { id: 'new-service', name: 'New Service', value: process.env.NEW_SERVICE_API_KEY },
   ];
   ```
3. Update the `.env` file and `README.md` to include the new API key.
4. In the module, use the `getApiKey` function to retrieve the API key:
   ```javascript
   const apiKey = getApiKey('New Service');
   ```

## 4. Integrating with Tab Manager

To ensure the new module works with the existing tab structure:

1. Update `tabManager.js` to include the new module:
   ```javascript
   import { initNewFeatureModule } from './newFeatureModule.js';
   // ... in the initTabManager function
   const newFeatureModule = initNewFeatureModule();
   ```
2. Add a new tab in `index.html` for the module if necessary.
3. Ensure the tab content div has the correct id and class:
   ```html
   <div id="new-feature" class="tab-content">
     <!-- New feature content -->
   </div>
   ```

## 5. Updating Server Routes

If the new module requires server-side functionality:

1. Add new routes in `server.js` for any API endpoints the module needs.
2. Ensure proper error handling and logging for these routes.
3. Use the appropriate API client initialized with the correct API key.

## 6. Testing

Before integrating the new module:

1. Test the module in isolation to ensure its core functionality works.
2. Test the module's integration with the tab manager.
3. Verify that switching between tabs doesn't break the module's functionality.
4. Test API key management, ensuring the module can access its required keys.
5. Perform cross-browser testing if applicable.

## 7. Integration and Review

When integrating the new module:

1. Update `app.js` to import and initialize the new module.
2. Review all changes to ensure they don't negatively impact existing functionality.
3. Check for any unintended side effects in other modules or the main application.

## 8. Documentation

After successful integration:

1. Update the `README.md` file to include information about the new module.
2. Document any new environment variables or setup steps required.
3. Update this workflow document if any new best practices or issues were discovered during development.

## Common Issues and Solutions

1. **API Key Not Found**: Ensure the key is properly added to both `apiKeys` array and `.env` file.
2. **Module Not Initializing**: Check that the module is properly imported and initialized in `app.js` and `tabManager.js`.
3. **Tab Content Not Displaying**: Verify the tab content div has the correct id and class in `index.html`.
4. **Conflicts with Other Modules**: Minimize inter-module dependencies and use clear, unique naming for functions and variables.

By following this workflow, we can maintain a consistent structure across modules, minimize integration issues, and ensure that all components of YOGI continue to function smoothly as we expand its capabilities.
