/*
 ======================================================
 * @author hao
 * @time 202111
 * MIT
 * gulp 入口文件
 * 文件操作API 和 插件使用
 * 插件：
 * gulp-clean-css 压缩css
 * gulp-rename 重命名扩展名 rename({extname: '.min.css'})
 * gulp-sass sass({outputStyle: 'expanded'})  样式编译
 * gulp-babel(平台) @babel/core @babel/preset-env 脚本编译
 * gulp-swig 模板编译
 * gulp-imagemin 图片压缩 通过c++完成的模块  需要下载二进制的程序集(都在国外)
 * del 文件清除
 * gulp-load-plugins 自动加载插件
 * browser-sync 自动构建插件 热更新开发服务器
 * gulp-useref 通过注释完成打包过程的文件合并和使用别的引用路径
 * gulp-htmlmin 压缩html
 * gulp-uglify 压缩js
 * gulp-clean-css 压缩css
 * gulp-if 条件判断
 * gulp-browserify 解析浏览器无法识别的require等api
 * gulp-util 提示信息
 * gulp-file-include 模板组合
 * gulp-autoprefixer css前缀
 ======================================================
*/

const del = require('del')
const yargs = require('yargs')
const Path = require('path')
const webpack = require('webpack-stream')
const webpackConfig = require("./webpack.config.js")
const named = require('vinyl-named')
const through2 = require('through2')
const gulpif = require('gulp-if')

const { series, parallel, src, dest, watch } = require('gulp')
const browsersync = require('browser-sync')
const bs = browsersync.create()
const cwd = process.cwd() // 会返回当前命令行的工作目录
let config = {
  data: {},
  build: {
    src: 'src',
    dist: 'dist',
    prod: 'prod',
    temp: 'temp',
    public: 'public',
    watch: {
      styles: 'assets/css/**/*.scss',
    },
    paths: {
      styles: 'assets/css/*.scss',
      scripts: 'assets/js/*.js',
      pages: '*.html',
      pages1: 'en/*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**',
      video: 'assets/video/**'
    }
  }
}

// 环境判断
const { argv } = yargs
let isProd = true
if (argv._[0] !== 'build') {
  isProd = false
}

try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  if (loadConfig.build) {
    loadConfig.build = Object.assign({}, config.build, loadConfig.build)
  }
  config = Object.assign({}, config, loadConfig)
} catch (error) {

}

const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
const {
  // babel,
  util,
  swig,
  useref,
  imagemin,
  fileInclude,
  autoprefixer,
  cleanCss
} = plugins

const watchs = require('gulp-watch')
const scss = require('gulp-sass')(require('sass'))

/*
*  错误提示配置
*/
function report(origin = 'script', detail) {
  util.log(`[${origin}]`, detail.toString({
    modules: false,
    errorDetails: false,
    timings: false,
    cached: false,
    colors: true
  }))
}

/*
* 样式文件迁移
*/
const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(scss({ outputStyle: 'expanded' }))
    .pipe(autoprefixer())
  // .pipe(rename({extname: '.min.css'}))
    .pipe(gulpif(isProd, cleanCss()))
    .pipe(dest(isProd ? config.build.dist : config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

/*
* JavaScript文件迁移
*/
const scripts = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    // .pipe(babel({
    //   plugins: [['@babel/plugin-transform-runtime', {
    //     absoluteRuntime: false,
    //     corejs: 3,
    //     helpers: true,
    //     regenerator: true,
    //     useESModules: false
    //   }]],
    //   presets: ['@babel/preset-env'] // 往上级查找
    // }))
    .pipe(named(function (file) {
      return file.relative.slice(0, -Path.extname(file.path).length)
    }))
    .pipe(webpack(webpackConfig))
    .pipe(dest(isProd ? config.build.dist : config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

/*
* 页面文件迁移
*/
const page = () => {
  return src([config.build.paths.pages, config.build.paths.pages1], { base: config.build.src, cwd: config.build.src })
    .pipe(through2.obj(function(file, _, cb) {
      if (file.isBuffer()) {
        if (Path.dirname(file.path).includes('en')) {
          let code = file.contents.toString()
          // code = code.replace(/\.\/template\/header\.html/g, './template/header-en.html')
          // code = code.replace(/\.\/template\/footer\.html/g, './template/footer-en.html')
          file.contents = Buffer.from(code)
        }
      }
      cb(null, file)
    }))
    .pipe(fileInclude({
      prefix: '@@',
      basepath: `./${config.build.src}/`,
      indent: true
    }).on('error', (error) => {
      report('template', error)
    }))
    .pipe(through2.obj(function(file, _, cb) {
      if (file.isBuffer()) {
        if (Path.dirname(file.path).includes('en')) {
          let code = file.contents.toString()
          code = code.replace(/favicon.ico/g, '../favicon.ico')
          code = code.replace(/assets\/css/g, '../assets/css')
          code = code.replace(/assets\/js/g, '../assets/js')
          code = code.replace(/\.\.\/assets\/images/g, 'assets/images')
          code = code.replace(/assets\/images/g, '../assets/images')
          code = code.replace(/assets\/video/g, '../assets/video')
          file.contents = Buffer.from(code)
        }
      }
      cb(null, file)
    }))
    .pipe(swig({ data: config.data, defaults: { cache: false } }))
    .pipe(dest(config.build.temp))
}

/*
* 图片文件迁移
*/
const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    // .pipe(imagemin())
    .pipe(dest(config.build.dist))
}

/*
* 字体文件迁移
*/
const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    // .pipe(imagemin())
    .pipe(dest(config.build.dist))
}

/*
*  视频文件迁移
*/
const video = () => {
  return src(config.build.paths.video, { base: config.build.src, cwd: config.build.src })
    .pipe(dest(config.build.dist))
}

/*
* 公用文件迁移
*/
const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

/*
* 清空文件夹
*/
const clean = () => {
  return del([config.build.dist, config.build.temp], { force: true })
}

/*
* 编译Html 修改其中的node_modules引用并打包
*/
const userefMethod = () => {
  return src([`${config.build.temp}/${config.build.paths.pages}`, `${config.build.temp}/${config.build.paths.pages1}`], { base: config.build.temp })
    .pipe(useref({ searchPath: [config.build.temp,config.build.src, '.'] })) // '.'表示当前目录
    // .pipe(plugins.if(/$\/node_modules+\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist))
}

/*
* 静态服务器及文件监听
*/
const serve = () => {
  watch(config.build.watch.styles, { events: 'all', cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { events: 'all', cwd: config.build.src }, scripts)
  watchs(`${config.build.src}/**/${config.build.paths.pages}`, series(page, bs.reload))

  watch([
    config.build.paths.images,
    config.build.paths.fonts,
    `${config.build.public}/**`
  ], { events: 'all', cwd: config.build.src }, series(image, font, extra, bs.reload))

  bs.init({
    // notify: false, // 提示
    // port: 3080, // 端口
    // open: false, // 是否自动打开浏览器
    // files: 'dist/**', // 监听的文件路径
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      directory: true,
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}


// const useCOS = () => {
//   return src([
//     'dist/**/*.html',
//     'dist/**/*.css',
//     'dist/**/*.js'
//   ])
//   .pipe(through2.obj(function(file, _, cb) {
//     console.log(file.path)
//     if (file.isBuffer()) {
//       let code = file.contents.toString()
//       if (Path.dirname(file.path).includes('en')) {
//         code = code.replace(/\.\.\/assets\//g, '')
//         code = code.replace(/\.\.\/favicon.ico/g, '')
//       } else {
//         code = code.replace(/assets\//g, '')
//         code = code.replace(/favicon.ico/g, '')
//       }
//       file.contents = Buffer.from(code)
//     }
//     cb(null, file)
//   }))
//   .pipe(dest(config.build.dist))
// }

/*
* 暴露命令
*/
const compile = series(style, scripts, page)
exports.clean = clean
exports.dev = series(compile, serve)
exports.build = series(
  clean,
  parallel(
    series(compile, userefMethod),
    image,
    font,
    video,
    extra
  )
)
// exports.cos = series(
  // image,
  // font,
  // video,
  // extra,
  // useCOS
// )