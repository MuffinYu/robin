var gulp = require('gulp');
var browserSync = require('browser-sync');
var path = require('path');
var ejs = require("gulp-ejs")
var ejsCompiler = require("ejs")
var less = require('gulp-less');
var babel = require('gulp-babel');
const markdownToJSON = require('gulp-markdown-to-json');
const marked = require('marked');
const fs = require('fs');
var through = require('through2');

var reload = browserSync.reload;  
var { parallel, series } = gulp;
function postPick() {
  const post = './dist/posts';
  // let briefPost = [];
  return new Promise((resolve, reject) => {
    fs.readdir(post, (err, files) => {
      if (err) reject(err);
      resolve(files);
    });
  }).then(files => {
    return Promise.all(files.map(file => {
      return new Promise((resolve1, reject1) => {
        fs.readFile(path.join(post, file), (err, data) => {
          if (err) {
            resolve1({});
            return console.error(err);
          } else {
            const content = JSON.parse(data.toString());
            content.href = content.title.trim().replace(/\s+/g, '-');
            // const { slug, title, layout } = content;
            console.log(`file: ${file}`, content.title);
            resolve1(content);
          }
        });
      })
    }))
  });
}

function makeIndex(content) {
  var brief = content.map(({ slug, title, layout, href, createAt, updatedAt }) => ({
    slug,
    title,
    layout,
    href,
    body: '',
    updatedAt: updatedAt.split('T')[0],
    createAt: createAt ? new Date(createAt).toISOString().split('T')[0] : '-',
  }));
  return new Promise((resolve, reject) => {
    gulp.src("./*.ejs")
        .pipe(ejs({
          brief: brief,
        }, {}, { ext: '.html' }))
        .pipe(gulp.dest("./dist"))
        .pipe(reload({ stream: true }))
        .pipe(resolve());
  })
}

function makeArchives(item) {
  return new Promise((resolve, reject) => {
    ejsCompiler.renderFile('./views/article_brief.ejs', item, (err, str) => {
      fs.writeFile(`./dist/archives/${item.href}.html`, str, (err) => {
        if (err) throw err;
        console.log('文件已被保存');
        resolve();
      })
    });
  })
}

function compileEjs(done) {
  postPick().then((content) => {
    Promise.all(content.map(makeArchives).concat(makeIndex(content)))
           .then((res) => done())
  });
}

function compileLess() {
  return gulp.src("./styles/index.less")
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest("./dist/styles"))
    .pipe(reload({ stream: true }))
}

// function makeArchives() {
//   return through.obj(function(file, encode, cb) {
//     if (file.isNull()) { // 返回空文件
//       cb(null, file);
//     }
//     var post = file.contents.toString();
//     console.log('file.toString()', post);
//     cb(null, ejs(post, {}, { ext: '.html' }));
//   });
// }

marked.setOptions({
  pedantic: true,
  smartypants: true
});

function compileMarkdown() {
  return gulp.src("./posts/*.md")
    .pipe(markdownToJSON(marked))
    .pipe(gulp.dest('./dist/posts'))
    // .pipe(makeArchives())
    // .pipe(gulp.dest('./dist/archives'))
    .pipe(reload({ stream: true }));
    // return done();
}
/*
	功能：将ES6语法转为ES5
 */
function compileJs() {
  return gulp
    .src(["./scripts/*.js"])
    .pipe(
      babel({
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                browsers: ['safari>=9', 'android>=5', 'ios>=9'] //可取值：chrome, opera, edge, firefox, safari, ie, ios, android, node, electron.
              },
              modules: 'umd', //可取值"amd" | "umd" | "systemjs" | "commonjs" | false, defaults to "commonjs".
              useBuiltIns: false, //使用'babel-polyfill'
              debug: false //这里按server环境来区分是否debug有些欠妥 以后遇到问题再改 @liuxuefeng 20180306
            }
          ]
        ],
        plugins: ["@babel/plugin-transform-runtime"]
      })
    )
    .pipe(gulp.dest("./dist/scripts"))
    .pipe(reload({ stream: true }))
}
// 复制静态资源
function copyAsserts() {
  return gulp
    .src("./asserts/*")
    .pipe(gulp.dest("./dist/asserts"))
    .pipe(reload({ stream: true }));
}
function copyPWA() {
  return gulp
    .src(["./favicon.ico", "./manifest.json", "./service-worker.js"])
    .pipe(gulp.dest("./dist"))
    .pipe(reload({ stream: true }));
}

gulp.task('js', compileJs);
gulp.task('ejs', compileEjs);
gulp.task('less', compileLess);
gulp.task('markdown', compileMarkdown);
gulp.task('copy', parallel(copyAsserts, copyPWA));
// gulp.task('postPick', postPick);


/*自动刷新*/
gulp.task('server', function() {
  browserSync.init({
    watch: true,
    server: {
      baseDir: "./dist",
      index: "index.html"
    },
    port: 8886,
    notify: false,
    ghostMode: false, // Clicks, Scrolls & Form inputs on any device will be mirrored to all others.
    open: "external",
    callbacks: {
      /**
       * This 'ready' callback can be used
       * to access the Browsersync instance
       */
      ready: function(err, bs) {
        console.log('无需再按F5刷新啦！！');
        gulp.watch(["./scripts/*.js"], gulp.series('js'));
        gulp.watch(["./*.ejs", "./views/*.ejs"], gulp.series('ejs'));
        gulp.watch(["./styles/*.less"], gulp.series('less'));
        gulp.watch(["./posts/*.md"], gulp.series('markdown'));
        // var ejsWatcher = gulp.watch(["./*.ejs", "./views/*.ejs"], function(event) {
        //   console.log('ejs: File ' + event.path + ' was ' + event.type + ', running tasks...');
        //   return compileEjs().pipe(browserSync.reload({ stream: true }));
        // });
        // gulp.watch(["./styles/*.less"], function(event) {
        //   console.log('less: File ' + event.path + ' was ' + event.type + ', running tasks...');
        //   return compileLess().pipe(browserSync.reload({ stream: true }));
        // });
        // gulp.watch(["./posts/*.md"], function(event) {
        //   console.log('md: File ' + event.path + ' was ' + event.type + ', running tasks...');
        //   return compileMarkdown().pipe(browserSync.reload({ stream: true }));
        // });
        console.log('add watcher');
      }
    },
  });
})

gulp.task('default', gulp.parallel([ gulp.series('markdown', 'ejs'), 'less', 'js', 'copy', 'server']));
