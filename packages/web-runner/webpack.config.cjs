// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

const general = require('@polkadot/dev/config/babel-general.cjs');
const plugins = require('@polkadot/dev/config/babel-plugins.cjs');
const presets = require('@polkadot/dev/config/babel-presets.cjs');

module.exports = {
  ...general,
  plugins: plugins(false, false),
  presets: presets(false)
};

const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

const CopyPlugin = require('copy-webpack-plugin');

const pkgJson = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const args = process.argv.slice(2);
let mode = 'production';

if (args) {
  args.forEach((p, index) => {
    if (p === '--mode') {
      mode = args[index + 1] || mode;
    }
  });
}

console.log('You are using ' + mode + ' mode.');

const envPath = mode === 'production' ? '.env' : '.env.local';

dotenv.config({ path: `../../${envPath}` });

const packages = [
  'extension-base',
  'extension-chains',
  'extension-dapp',
  'extension-inject',
  'extension-koni',
  'extension-koni-ui',
  'bitriel-api-sdk'
];

const polkadotDevOptions = require('@polkadot/dev/config/babel-config-webpack.cjs');

const _additionalEnv = {
  NFT_MINTING_HOST: JSON.stringify(process.env.NFT_MINTING_HOST),
  INFURA_API_KEY: JSON.stringify(process.env.INFURA_API_KEY),
  INFURA_API_KEY_SECRET: JSON.stringify(process.env.INFURA_API_KEY_SECRET),
  CHAINFLIP_BROKER_API: JSON.stringify(process.env.CHAINFLIP_BROKER_API),
  BITTENSOR_API_KEY_1: JSON.stringify(process.env.BITTENSOR_API_KEY_1),
  BITTENSOR_API_KEY_2: JSON.stringify(process.env.BITTENSOR_API_KEY_2),
  BITTENSOR_API_KEY_3: JSON.stringify(process.env.BITTENSOR_API_KEY_3),
  BITTENSOR_API_KEY_4: JSON.stringify(process.env.BITTENSOR_API_KEY_4),
  BITTENSOR_API_KEY_5: JSON.stringify(process.env.BITTENSOR_API_KEY_5),
  BITTENSOR_API_KEY_6: JSON.stringify(process.env.BITTENSOR_API_KEY_6),
  BITTENSOR_API_KEY_7: JSON.stringify(process.env.BITTENSOR_API_KEY_7),
  BITTENSOR_API_KEY_8: JSON.stringify(process.env.BITTENSOR_API_KEY_8),
  BITTENSOR_API_KEY_9: JSON.stringify(process.env.BITTENSOR_API_KEY_9),
  BITTENSOR_API_KEY_10: JSON.stringify(process.env.BITTENSOR_API_KEY_10),
  SIMPLE_SWAP_API_KEY: JSON.stringify(process.env.SIMPLE_SWAP_API_KEY),
  UNISWAP_API_KEY: JSON.stringify(process.env.UNISWAP_API_KEY),
  KYBER_CLIENT_ID: JSON.stringify(process.env.KYBER_CLIENT_ID),
  SUBWALLET_API: JSON.stringify(process.env.SUBWALLET_API),
  BLOCKFROST_API_KEY_MAIN: JSON.stringify(process.env.BLOCKFROST_API_KEY_MAIN),
  BLOCKFROST_API_KEY_PREP: JSON.stringify(process.env.BLOCKFROST_API_KEY_PREP),
  PARASPELL_API_KEY: JSON.stringify(process.env.PARASPELL_API_KEY)
};

// Overwrite babel babel config from polkadot dev

const createConfig = (entry, alias = {}, useSplitChunk = false) => {
  const result = {
    context: __dirname,
    devtool: false,
    entry,
    devServer: {
      static: {
        directory: path.join(__dirname, 'build')
      },
      allowedHosts: 'all',
      hot: false,
      liveReload: false,
      webSocketServer: false,
      compress: true,
      port: 9001
    },
    module: {
      rules: [
        {
          exclude: /(node_modules\/(?!(@equilab|@subwallet|@polkadot\/rpc-core)).*)/,
          test: /\.(js|mjs|ts|tsx)$/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: polkadotDevOptions
            }
          ]
        },
        {
          test: [/\.svg$/, /\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.woff2?$/],
          use: [
            {
              loader: require.resolve('url-loader'),
              options: {
                esModule: false,
                limit: 10000,
                name: 'static/[name].[ext]'
              }
            }
          ]
        }
      ]
    },
    output: {
      chunkFilename: '[name]-[contenthash].js',
      filename: '[name]-[contenthash].js',
      globalObject: '(typeof self !== \'undefined\' ? self : this)',
      path: path.join(__dirname, 'build'),
      publicPath: ''
    },
    performance: {
      hints: false
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser.js'
      }),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(mode),
          PKG_NAME: JSON.stringify(pkgJson.name),
          PKG_VERSION: JSON.stringify(pkgJson.version),
          TARGET_ENV: JSON.stringify('mobile'),
          BRANCH_NAME: JSON.stringify(process.env.BRANCH_NAME),
          ..._additionalEnv
        }
      }),
      new CopyPlugin({
        patterns: [{
          from: 'public',
          globOptions: {
            ignore: [
              '**/*.html'
            ]
          }
        }]
      }),
      new CopyPlugin({
        patterns: [{
          from: path.resolve(__dirname, './package.json'),
          to: path.resolve(__dirname, './build/package.json')
        }]
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'public/index.html'
      }),
      new webpack.NormalModuleReplacementPlugin(
        /@emurgo\/cardano-serialization-lib-nodejs/,
        '@emurgo/cardano-serialization-lib-browser'
      )
    ],
    resolve: {
      alias: packages.reduce((alias, p) => ({
        ...alias,
        [`@subwallet/${p}`]: path.resolve(__dirname, `../${p}/src`)
      }), {
        ...alias,
        'react/jsx-runtime': require.resolve('react/jsx-runtime')
      }),
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fallback: {
        crypto: false,
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        os: require.resolve('os-browserify/browser'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert'),
        zlib: false,
        url: false
      }
    },
    watch: false,
    experiments: {
      asyncWebAssembly: true
    }
  };

  return result;
};

module.exports = createConfig({
  fallback: './src/fallback.ts',
  'web-runner': './src/webRunner.ts'
}, {
  'manta-extension-sdk': './manta-extension-sdk-empty.ts'
}, false);
