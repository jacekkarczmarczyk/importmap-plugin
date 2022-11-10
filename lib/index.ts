import hash from 'hash.js';
import fs from 'node:fs';
import type { OutputAsset, OutputPlugin } from 'rollup';
import MagicString from 'magic-string';

interface ImportmapPluginOptions {
  // External import maps are not supported yet
  external?: boolean;
  base: string;
  type?: 'inline' | 'external' | 'systemjs';
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

function createImportMapScript (importMapAsset: OutputAsset, external?: boolean): string {
  const importMapSource = String(importMapAsset.source);

  return external
    ? `<script type="importmap" src="/${importMapAsset.fileName}"></script>`
    : `<script type="importmap">${importMapSource}</script>`;
}

export default function ImportmapPlugin ({
                                           base,
                                           type = 'inline',
                                         }: ImportmapPluginOptions): OutputPlugin {
  const importMap: ImportMap = { imports: {} };
  let contentToInclude = '';

  function before (content: string): string {
    return `if(!window.System){ ${content} }`;
  }

  function after (fileName: string): string {
    return `System.import('${base}${fileName}')`;
  }

  return {
    name: 'importmap-plugin',
    renderStart () {
      if (type !== 'systemjs') return;

      contentToInclude = fs.readFileSync(require.resolve('systemjs/dist/s.js'), 'utf8');
    },
    augmentChunkHash (chunk) {
      if (type === 'systemjs' && chunk.isEntry) {
        return before(contentToInclude) + after(chunk.name);
      }
    },
    async renderChunk (code, chunk, options) {
      if (type !== 'systemjs' || !chunk.isEntry) {
        return null;
      }

      const magicString = new MagicString(code, { filename: chunk.fileName });

      magicString
        .prepend(before(contentToInclude))
        .append(after(chunk.fileName));

      return {
        code: magicString.toString(),
        map: options.sourcemap ? magicString.generateMap() : null,
      };
    },
    generateBundle (config, bundle) {
      importMap.imports = {};

      Object.entries(bundle).forEach(([filename, chunk]) => {
        if (chunk.type !== 'chunk') return;

        const hashValue = hash.sha1().update(chunk.code).digest('hex');
        const basePath = '/';

        importMap.imports[`${basePath}${filename}`] = `${basePath}${filename}`.replace(/\.js$/, `.${hashValue}.js`);
      });

      bundle.importMap = createImportMapAsset(importMap);
    },
    writeBundle (config, bundle) {
      if (type === 'systemjs') {
        return;
      }

      const { dir = './dist', entryFileNames } = config;
      const entryFileName = `/${String(entryFileNames)}`;
      const importMapCode = createImportMapScript(bundle.importMap as OutputAsset, type === 'external');
      const indexPath = `${dir}/index.html`;
      const indexHtml = fs.readFileSync(indexPath, 'utf-8');

      if (type !== 'external') {
        fs.unlinkSync(`${dir}/${bundle.importMap.fileName}`);
      }

      Object.keys(importMap.imports).forEach(filename => {
        if (fs.existsSync(`${dir}${filename}`)) {
          fs.renameSync(`${dir}${filename}`, `${dir}${importMap.imports[filename]!}`);
        } else {
          this.warn(`Failed to rename ${dir}${filename} to ${dir}${importMap.imports[filename]!}`);
        }
      });

      fs.writeFileSync(
        indexPath,
        indexHtml
          .replace('</title>', `</title>\n${importMapCode}`)
          .replace(`src="${entryFileName}"`, `src="${importMap.imports[entryFileName]!}"`),
      );
    },
  };
}
