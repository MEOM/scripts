const glob = require('glob');
const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const { mode } = defaultConfig;

const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // eslint-disable-line
const MiniCSSExtractPlugin = require('mini-css-extract-plugin'); // eslint-disable-line
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

// Config settings.
const settings = require(path.resolve(process.cwd(), './webpack.settings.js'));

// Get all assets automatically.
const generateAutomatically = settings.generateAutomatically
    ? settings.generateAutomatically
    : {};

// Generate array of all assets.
const automaticAssets = glob.sync(
    `${generateAutomatically.baseFolder}${generateAutomatically.blob}`,
    {
        ignore: generateAutomatically.ignore,
    }
);

// Create entry object from automaticAssets array.
const automaticEntries = automaticAssets.reduce((acc, entryPath) => {
    // Get only filename. There is probably easier way.
    const entryNew = entryPath
        .substring(entryPath.lastIndexOf('/') + 1)
        .replace('.js', '')
        .replace('.scss', '');
    // Start adding as entry.
    acc[entryNew] = entryPath;
    return acc;
}, {});

// Is production.
const isProduction = mode === 'production';

// Extra plugins.
const extraPlugins = [
    // During rebuilds, all webpack assets that are not used anymore will be
    // removed automatically. There is an exception added in watch mode for
    // fonts and images. It is a known limitation:
    // https://github.com/johnagan/clean-webpack-plugin/issues/159
    new CleanWebpackPlugin({
        cleanAfterEveryBuildPatterns: ['!fonts/**', '!images/**'],
        cleanStaleWebpackAssets: false,
    }),
    new RemoveEmptyScriptsPlugin(),
    // MiniCSSExtractPlugin to extract the CSS thats gets imported into JavaScript.
    new MiniCSSExtractPlugin({ filename: '[name].css' }),
    new BrowserSyncPlugin(settings.browserSyncSettings, {
        injectCss: true,
        reload: false,
    }),
];

// Plugins.
const pluginsConfig = [...extraPlugins];

// Front-end related externals.
// --webpack-no-externals flag is used in package.json to disable Dependency Extraction Webpack Plugin.
const externalConfig = {
    jquery: 'jQuery',
};

// Externals for blocks.
const blocksExternalConfig = {
    // Utilize notable WordPress bundled scripts via globals.
    jquery: 'jQuery',
    tinymce: 'tinymce',
    moment: 'moment',
    react: 'React',
    'react-dom': 'ReactDOM',
    backbone: 'Backbone',
    lodash: 'lodash',
};

// CSS loaders.
const cssLoaders = [
    {
        loader: MiniCSSExtractPlugin.loader,
    },
    {
        loader: require.resolve('css-loader'),
        options: {
            sourceMap: !isProduction,
            modules: {
                auto: true,
            },
            // We want url() CSS rules as they are, and not do anything about fonts etc.
            url: false,
        },
    },
    {
        loader: require.resolve('postcss-loader'),
    },
];

// Module config.
const moduleConfig = {
    rules: [
        {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: require.resolve('babel-loader'),
                    options: {
                        // Babel uses a directory within local node_modules
                        // by default. Use the environment variable option
                        // to enable more persistent caching.
                        cacheDirectory:
                            process.env.BABEL_CACHE_DIRECTORY || true,

                        babelrc: false,
                        configFile: false,
                        presets: [
                            require.resolve('@wordpress/babel-preset-default'),
                        ],
                    },
                },
            ],
        },
        {
            test: /\.css$/,
            use: cssLoaders,
        },
        {
            test: /\.(sc|sa)ss$/,
            use: [
                ...cssLoaders,
                {
                    loader: require.resolve('sass-loader'),
                    options: {
                        sourceMap: !isProduction,
                    },
                },
            ],
        },
    ],
};

// Multiple array configuration from theme and plugin (or even more).
// @link: https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations
const config = [];

/**
 * Generate config.
 *
 * @param {string} name      Name of the config.
 * @param {Object} entries   Object for entries.
 * @param {string} output    Output folder.
 * @param {Object} externals Externals object for Webpack.
 * @return {Object} Config object.
 */
function setConfig(name, entries, output, externals) {
    return {
        // Use default config from WP scripts.
        // Overwrite needed config after that.
        ...defaultConfig,
        name,
        entry: entries,
        output: {
            path: path.resolve(process.cwd(), output),
        },
        externals,
        module: moduleConfig,
        plugins: pluginsConfig,
    };
}

// Add project related config if they exists.
const projectEntries = settings.projectEntries ? settings.projectEntries : {};
if (Object.entries(projectEntries).length > 0) {
    Object.entries(projectEntries).forEach(([name, value]) => {
        // By default use externalConfig.
        // But if externalType === 'blocks', use blocksExternalConfig
        const external =
            value.externalType === 'blocks'
                ? blocksExternalConfig
                : externalConfig;
        config.push(
            setConfig(name, value.entries, value.outPutFolder, external)
        );
    });
}

// Add automatic entries config if they exists.
if (Object.entries(automaticEntries).length > 0) {
    const externalAutomatic =
        generateAutomatically.externalType === 'blocks'
            ? blocksExternalConfig
            : externalConfig;
    config.push(
        setConfig(
            generateAutomatically.name,
            automaticEntries,
            generateAutomatically.outPutFolder,
            externalAutomatic
        )
    );
}

module.exports = config;
