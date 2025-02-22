import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { existsSync as exists } from 'node:fs'
import { cp, open, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { MakerBase, type MakerOptions } from '@electron-forge/maker-base'
import { type OptionalSignToolOptions, sign } from '@electron/windows-sign'
import type { VersionStringOptions } from 'rcedit'
import RcEdit from 'rcedit'
import which from 'which'

const ROOT_DIR = resolve(fileURLToPath(import.meta.url), '../../')
const SevenZSD_SFX = resolve(ROOT_DIR, 'bin/7zSD.sfx')
const SevenZSD_SFX_MANIFEST = resolve(ROOT_DIR, 'bin/7zSD.sfx.manifest')

export interface SfxOptions {
  [key: string]: string | undefined
  Title?: string
  BeginPrompt?: string
  Progress?: 'yes' | 'no'
  RunProgram?: string
  Directory?: string
  ExecuteFile?: string
  ExecuteParameters?: string
}

export interface SevenZSFXMakerConfigOptions {
  /**
   * @see {import('@electron/windows-sign').OptionalSignToolOptions}
   */
  certificateFile?: OptionalSignToolOptions['certificateFile']
  /**
   * @see {import('@electron/windows-sign').OptionalSignToolOptions}
   */
  certificatePassword?: OptionalSignToolOptions['certificatePassword']
  /**
   * sfx exe icon, default is `packagerConfig.icon`.
   */
  icon?: string
  /**
   * If true, the sfx exe manifest's `requestedExecutionLevel` value is `requireAdministrator`
   *
   * @see {https://learn.microsoft.com/windows/win32/sbscs/application-manifests#trustinfo}
   */
  requireAdministrator?: boolean
  /**
   * 7z sfx config.txt.
   *
   * @see {https://documentation.help/7-Zip/sfx.htm}
   */
  sfxConfig?: SfxOptions
  /**
   * Command line switches passed to 7zr.exe.
   *
   * @see {https://documentation.help/7-Zip/add1.htm}
   */
  switches?: string[]
  /**
   * @see {import('rcedit').VersionStringOptions}
   */
  versionStrings?: VersionStringOptions
}

// noinspection JSUnusedGlobalSymbols
export default class SevenZSFXMaker extends MakerBase<SevenZSFXMakerConfigOptions> {
  name = 'SevenZSFXMaker'

  defaultPlatforms = ['win32']

  static SevenZVersion = '24.09'

  static Get7zrCli() {
    return process.platform === 'win32'
      ? resolve(ROOT_DIR, 'bin/7zr.exe')
      : which.sync('7zr')
  }

  constructor(config: SevenZSFXMakerConfigOptions) {
    super(config)
    this.config ??= {}
  }

  async #packTo7zArchive(dir: string, out: string, switches: string[]) {
    return new Promise<void>((resolve, reject) => {
      spawn(SevenZSFXMaker.Get7zrCli(), ['a', ...switches, out, '.'], {
        cwd: dir,
        stdio: 'inherit',
      })
        .once('error', reject)
        .once('exit', (code) =>
          code === 0
            ? resolve()
            : reject(`Error: 7zr process exit code is ${code}`),
        )
    })
  }

  #sfxConfigToBuffer(config: SfxOptions) {
    let text = ''

    for (const key in config) {
      if (typeof config[key] === 'string') {
        const value = config[key]
          .replaceAll('\n', '\\n')
          .replaceAll('\t', '\\t')
          .replaceAll('"', '\\"')
          .replaceAll('\\', '\\\\')
        text += `${key}="${value}"\r\n`
      }
    }

    return Buffer.from(
      `;!@Install@!UTF-8!\r\n${text};!@InstallEnd@!\r\n`,
      'utf-8',
    )
  }

  override isSupportedOnCurrentPlatform() {
    return exists(SevenZSFXMaker.Get7zrCli())
  }

  override async make({
    appName,
    dir,
    forgeConfig: { packagerConfig },
    makeDir,
    targetPlatform,
    targetArch,
    packageJSON,
  }: MakerOptions): Promise<string[]> {
    const appVersion = packagerConfig.appVersion ?? packageJSON.version
    const switches = this.config.switches ?? ['-mx', '-mf=BCJ2']
    const artifact = resolve(
      makeDir,
      '7zsfx',
      targetPlatform,
      targetArch,
      `${appName}-${appVersion}.exe`,
    )
    const archiveFile = artifact.replace(/\.exe$/, '.7z')
    const manifestFile = `${artifact}.manifest`
    const sfxConfigFile = `${artifact}.config`
    const icon = [
      this.config.icon,
      packagerConfig.icon,
      packagerConfig.icon?.concat('.ico'),
    ].find((v) => (v ? exists(v) : false))

    await this.ensureFile(artifact)
    await this.ensureFile(archiveFile)
    await this.ensureFile(manifestFile)
    await this.ensureFile(sfxConfigFile)

    await this.#packTo7zArchive(dir, archiveFile, switches)

    await cp(SevenZSD_SFX, artifact)
    await writeFile(
      manifestFile,
      (await readFile(SevenZSD_SFX_MANIFEST, { encoding: 'utf8' })).replaceAll(
        '{{ requestedExecutionLevel }}',
        this.config.requireAdministrator ? 'requireAdministrator' : 'asInvoker',
      ),
      { encoding: 'utf-8' },
    )
    await RcEdit(artifact, {
      'application-manifest': manifestFile,
      'file-version': this.normalizeWindowsVersion(appVersion),
      icon,
      'product-version': appVersion,
      'version-string': {
        CompanyName: packagerConfig.win32metadata?.CompanyName ?? '',
        FileDescription: `${appName} Setup`,
        LegalCopyright: packagerConfig.appCopyright ?? '',
        ProductName: packagerConfig.win32metadata?.ProductName ?? appName,
        ...(this.config.versionStrings ?? {}),
      },
    })

    const archiveHandle = await open(archiveFile, 'r')
    const artifactHandle = await open(artifact, 'a')
    const sfxConfig = this.#sfxConfigToBuffer(
      this.config.sfxConfig ?? {
        RunProgram: `${packagerConfig.executableName ?? appName}.exe`,
      },
    )

    await writeFile(sfxConfigFile, sfxConfig)
    await artifactHandle.appendFile(sfxConfig)
    await pipeline(
      archiveHandle.createReadStream(),
      artifactHandle.createWriteStream(),
    )
    await archiveHandle.close()
    await artifactHandle.close()

    if (this.config.certificateFile) {
      await sign({
        certificateFile: this.config.certificateFile,
        certificatePassword: this.config.certificatePassword,
        files: [artifact],
      })
    }

    return [artifact]
  }
}
