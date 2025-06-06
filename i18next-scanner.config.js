// Copyright 2019-2022 @bitriel/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');
const typescript = require('typescript');

function transform (file, enc, done) {
  const { ext } = path.parse(file.path);

  if (ext === '.tsx') {
    const content = fs.readFileSync(file.path, enc);

    const { outputText } = typescript.transpileModule(content, {
      compilerOptions: {
        target: 'es2018'
      },
      fileName: path.basename(file.path)
    });

    this.parser.parseFuncFromString(outputText);
  }

  done();
}

module.exports = {
  input: [
    'packages/extension-koni-ui/src/**/*.{ts,tsx}',
    'packages/extension-web-ui/src/**/*.{ts,tsx}',
    'packages/extension-base/src/**/*.{ts,tsx}',
    // Use ! to filter out files or directories
    '!packages/*/src/**/*.spec.{ts,tsx}',
    '!packages/*/src/i18n/**',
    '!**/node_modules/**'
  ],
  options: {
    debug: true,
    removeUnusedKeys: true,
    defaultLng: 'en',
    func: {
      extensions: ['.tsx', '.ts'],
      list: ['t', 'i18next.t', 'i18n.t', 'detectTranslate']
    },
    keySeparator: false, // key separator
    lngs: ['en', 'vi', 'zh', 'ja', 'ru'],
    nsSeparator: false, // namespace separator
    resource: {
      jsonIndent: 2,
      lineEnding: '\n',
      loadPath: 'packages/extension-koni/public/locales/{{lng}}/{{ns}}.json',
      savePath: 'packages/extension-koni/public/locales/{{lng}}/{{ns}}.json'
    },
    trans: {
      component: 'Trans'
    }
  },
  output: './',
  transform
};
