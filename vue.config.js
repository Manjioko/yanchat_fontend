const { defineConfig } = require('@vue/cli-service')
const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')
const fs = require('fs')
const path = require('path')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  },
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  devServer: {
    // host: 'localhost',
    // port: 8080,
    // open: true,
    https: {
      cert: fs.readFileSync(path.join(__dirname, './cert/cert.pem')),
      key: fs.readFileSync(path.join(__dirname, './cert/cert-key.pem'))
    },
    // proxy: {
    //   "/api": {
    //     target: 'http://192.168.9.99:9999',
    //     changeOrigin: true,
    //     pathRewrite: {
    //       "^/api": " "
    //     }
    //   }
    // }
  }
})
