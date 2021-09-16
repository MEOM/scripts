# MEOM scripts

MEOM scripts is a wrapper config for [WordPress scripts package](https://www.npmjs.com/package/@wordpress/scripts).

The main idea is to build assets (JS and CSS) for all custom themes and plugins from the root of the project.

It's also build for blocks in mind.

In this context, root of the project means the same folder where your `package.json` file is.

## Usage
### Add webpack.settings.js file in the root

First, add `webpack.settings.js` file in the root.

```js
// Project settings, update these.
const projectSettings = {
    projectURL: 'https://wordpress.local',
    themePath: './htdocs/wp-content/themes/your-theme/',
    // Remove if you don't have child themes.
    childThemePath: './htdocs/wp-content/themes/your-child-child/',
};

// Project variables, update if needed.
const projectVariables = {
    blocksPluginPath: './htdocs/wp-content/plugins/your-blocks/',
    outPutFolder: 'build/',
};

// Project themes and plugins entries, update if needed.
const projectEntries = {
    // `parentTheme` is name for Webpack, it can be anything.
    parentTheme: {
        // You need to have `entries`.
        entries: {
            main: projectSettings.themePath + 'js/main.js',
            theme: projectSettings.themePath + 'scss/theme.scss',
            editor: projectSettings.themePath + 'scss/editor.scss',
        },
        // You need to have `outPutFolder`.
        outPutFolder: projectSettings.themePath + projectVariables.outPutFolder,
    },
    blocks: {
        entries: {
            main: projectVariables.blocksPluginPath + 'src/main.js',
        },
        outPutFolder:
            projectVariables.blocksPluginPath +
            projectVariables.outPutFolder +
            'blocks/',
        // Set externalType to `blocks` if this is the main block JS file.
        externalType: 'blocks',
    },
    // Add or remove any themes or plugins where you want to build assets.
    childTheme: {
        entries: {
            theme: projectSettings.childThemePath + 'scss/theme.scss',
        },
        outPutFolder:
            projectSettings.childThemePath + projectVariables.outPutFolder,
    },
};

// Browsersync settings, change for you liking.
const browserSyncSettings = {
    host: 'localhost',
    port: 3000,
    proxy: projectSettings.projectURL,
    open: true,
    files: [
       // Files you want to watch.
    ],
};

module.exports = {
    projectSettings,
    projectVariables,
    projectEntries,
    browserSyncSettings,
};
```

#### Generate assets automatically

It's also possible to build assets automatically from given folder without adding new entry points manually. This can be handy if you want to generate all the blocks assets automatically.

Add this object in `webpack.settings.js` file.

```js
// Generate JS and CSS automatically from wanted folder.
const generateAutomatically = {
    // Any name for Webpack.
    name: 'automaticAssets',
    // From which folder to look at.
    baseFolder: projectVariables.blocksPluginPath,
    // What kind of files to look at.
    blob: '{/blocks/**/*.js,/blocks/**/*.scss,/acf-blocks/**/*.js,/acf-blocks/**/*.scss}',
    // Which files to ignore.
    ignore: [
        `${projectVariables.blocksPluginPath}/blocks/**/block.js`,
        `${projectVariables.blocksPluginPath}/blocks/**/sidebar.js`,
    ],
    // Output folder.
    outPutFolder:
        projectVariables.blocksPluginPath + projectVariables.outPutFolder,
};
```

Then add `generateAutomatically` to exports also:

```js
module.exports = {
    projectSettings,
    projectVariables,
    projectEntries,
    browserSyncSettings,
    // Added in here.
    generateAutomatically,
};
```

### Add webpack.config.js file in the root
Then, add `webpack.config.js` file in the root and require MEOM scripts config.
```js
const config = require('@meom/scripts/webpack.config');

module.exports = config;
```