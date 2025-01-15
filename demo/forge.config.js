const SevenZSFXMaker = require('../')

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  makers: [new SevenZSFXMaker()],
}

module.exports = config
