const SevenZSFXMaker = require('../')

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  packagerConfig: {
    icon: __dirname.concat('/icon'),
  },
  makers: [new SevenZSFXMaker()],
}

module.exports = config
