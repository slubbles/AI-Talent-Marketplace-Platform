const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo for changes
config.watchFolders = [monorepoRoot];

// Resolve from mobile's own node_modules first, then root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force react to resolve from mobile's local copy (19.2.0)
// instead of root's copy (18.3.1 used by the web app)
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
};

module.exports = config;
