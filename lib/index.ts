import hash from 'hash.js';
import fs from 'node:fs';
import type { OutputAsset, OutputPlugin } from 'rollup';

interface ImportmapPluginOptions {
  base: string;
  external: boolean;
}

interface ImportMap {
  imports: {
    [importName in string]?: string;
  };
}

function createImportMapAsset (importMap: ImportMap): OutputAsset {
  const source = JSON.stringify(importMap);
  const hashValue = hash.sha1().update(importMap).digest('hex');

  return {
    type: 'asset',
    name: 'importMap',
    fileName: `import-map.${hashValue}.importmap`,
    source,
  };
}

function createImportMapScript (importMapAsset: OutputAsset, systemJs: boolean, external?: boolean): string {
  const importMapSource = String(importMapAsset.source);
  const type = systemJs ? 'systemjs-importmap' : 'importmap';

  return external
    ? `<script type="${type}" src="/${importMapAsset.fileName}"></script>`
    : `<script type="${type}">${importMapSource}</script>`;
}

export default function ImportmapPlugin ({ base, external = false }: ImportmapPluginOptions): OutputPlugin {
  const importMap: ImportMap = { imports: {} };

  return {
    name: 'importmap-plugin',
    generateBundle (config, bundle) {
      importMap.imports = {};

      Object.entries(bundle).forEach(([filename, chunk]) => {
        if (chunk.type !== 'chunk') return;

        const hashValue = hash.sha1().update(chunk.code).digest('hex');

        importMap.imports[`${base}${filename}`] = `${base}${filename}`.replace(/\.js$/, `.${hashValue}.js`);
      });

      if (external) {
        bundle.importMap = createImportMapAsset(importMap);
      }
    },
    writeBundle (config, bundle) {
      const { dir = './dist', entryFileNames } = config;
      const systemJs = config.format === 'system';
      const importMapAsset = (bundle.importMap as OutputAsset | undefined) ?? createImportMapAsset(importMap);
      const importMapScript = createImportMapScript(importMapAsset, systemJs, external);
      const entryFileName = `/${String(entryFileNames)}`;
      const indexPath = `${dir}/index.html`;

      if (!systemJs && config.format !== 'es') {
        throw new Error('Only system and es formats are supported');
      }

      Object.keys(importMap.imports).forEach(filename => {
        if (fs.existsSync(`${dir}${filename}`)) {
          fs.renameSync(`${dir}${filename}`, `${dir}${importMap.imports[filename]!}`);
        } else {
          this.warn(`Failed to rename ${dir}${filename} to ${dir}${importMap.imports[filename]!}`);
        }
      });

      let indexHtml = fs
        .readFileSync(indexPath, 'utf-8')
        .replace('</title>', `</title>\n${importMapScript}`)
        .replace(`src="${entryFileName}"`, `src="${importMap.imports[entryFileName]!}"`);

      if (systemJs) {
        const systemJsScript = fs.readFileSync(require.resolve('systemjs/dist/s.js'), 'utf8');
        indexHtml = indexHtml.replace(
          '</title>',
          `</title>\n<script>${systemJsScript}</script>`
        );
      }

      fs.writeFileSync(indexPath, indexHtml);
    },
  };
}
