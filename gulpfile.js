const gulp = require('gulp');
const pug = require('gulp-pug');

const sass = require('gulp-sass');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');

const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');

const del = require('del');

const browserSync = require('browser-sync').create();

const gulpWebpack = require('gulp-webpack');
const webpack = require("webpack-stream");
const webpackConfig = require('./webpack.config.js');

const notify = require("gulp-notify");
const plumber = require('gulp-plumber');

const paths = {
    root: './build',
    templates: {
        pages: 'src/templates/pages/*.pug',
        src: 'src/templates/**/*.pug'
    },
    styles: {
        src: 'src/styles/**/*.scss',
        dest: 'build/assets/styles/'
    },
    images: {
        src: 'src/images/**/*.*',
        dest: 'build/assets/images/'
    },
    scripts: {
        src: 'src/scripts/**/*.js',
        dest: 'build/assets/scripts/',
        water: 'build/assets/scripts/water/'
    },
    fonts: {
        src: 'src/fonts/*.*',
        dest: 'build/assets/fonts/'
    },
    sprite: {
        src: 'src/images/icons/*.svg',
        dest: 'build/assets/images/icons/'
    }
};

const config = {
    mode: {
      symbol: {
        sprite: "../sprite.svg",
        example: {
          dest: '../tmp/spriteSvgDemo.html'
        }
      }
    }
  };
  
// pug
function templates(){
    return gulp.src(paths.templates.pages)
        .pipe(pug( { pretty: true } ))
        .pipe(gulp.dest(paths.root));
}

// scss
function styles() {
    return gulp.src('src/styles/app.scss')
        .pipe(sassGlob())
        .pipe(plumber({
            errorHandler: notify.onError(function(error){
                return {
                    title: 'Styles',
                    message: error.message
                };
            })
        }))
        .pipe(sourcemaps.init())
        .pipe(autoprefixer({
            browsers: ['>5%'],
            cascade: false
        }))
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(sourcemaps.write())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.styles.dest))
}

// clean
function clean() {
    return del(paths.root);
}

// webpack
function scripts() {
    return gulp.src("src/scripts/app.js")
      .pipe(webpack(require("./webpack.config.js")))
      .pipe(gulp.dest(paths.scripts.dest));
    }

// watcher
function watch() {
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.templates.src, templates);
    gulp.watch(paths.images.src, images);
    gulp.watch(paths.scripts.src, scripts);
}

// локальный сервер + lifereload
function server() {
    browserSync.init({
        server: paths.root
    });
    browserSync.watch(paths.root + '/**/*.*', browserSync.reload);
}

// просто перекладываем файлы
function images() {
    return gulp.src(paths.images.src)
        .pipe(gulp.dest(paths.images.dest));
}

function waterjs() {
    return gulp.src("src/scripts/common/water.js")
            .pipe(gulp.dest(paths.scripts.water));
}

function fonts() {
    return gulp.src(paths.fonts.src)
        .pipe(gulp.dest(paths.fonts.dest));
}

function sprite() {
    return gulp.src(paths.sprite.src)
        .pipe(svgmin({
            js2svg: {
            pretty: true
            }
        }))
        .pipe(cheerio({
            run: function($) {
            $('[fill]').removeAttr('fill');
            $('[stroke]').removeAttr('stroke');
            $('[style]').removeAttr('style');
            },
            parserOptions: {
            xmlMode: true
            }
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite(config))
        .pipe(gulp.dest(paths.sprite.dest));
}

exports.templates = templates;
exports.styles = styles;
exports.clean = clean;
exports.images = images;
exports.scripts = scripts;
exports.fonts = fonts;
exports.sprite = sprite;
exports.waterjs = waterjs;

gulp.task('default', gulp.series(
    clean,
    gulp.parallel(styles, templates, images, scripts, fonts, sprite, waterjs),
    gulp.parallel(watch, server)
));