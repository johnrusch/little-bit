// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const exclusionList  = require('metro-config/src/defaults/exclusionList');

module.exports = {
  resolver: {
    blockList: exclusionList([/amplify\/#current-cloud-backend\/.*/], [/amplify\/backend\/function\/.*/]),
  },
};
