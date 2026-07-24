import SevenZSFXMaker from 'electron-forge-maker-7zsfx'

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  packagerConfig: {
    icon: import.meta.dirname.concat('/icon'),
  },
  makers: [new SevenZSFXMaker()],
}

export default config
