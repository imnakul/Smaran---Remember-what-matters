const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

/*
 * The marketing site lives in `landing-page/` and builds with its own Next.js
 * toolchain and its own `node_modules`. Metro must not crawl it: that tree
 * contains a second copy of React, which surfaces as duplicate-module errors
 * and a much slower startup while Metro watches thousands of irrelevant files.
 */
const landingPage = /[/\\]landing-page[/\\].*/;
config.resolver.blockList = config.resolver.blockList
  ? [].concat(config.resolver.blockList, landingPage)
  : landingPage;

module.exports = withNativeWind(config, { input: "./global.css" });
