var 
    babel         = require('gulp-babel'),
    // cache         = require('gulp-cached'),
    config        = require('./gulp/gulp-config.js'),
    fileInclude   = require('gulp-file-include'),
    gulp          = require('gulp'),
    livereload    = require('gulp-livereload'),
    prefix        = require('gulp-autoprefixer'),
    eslint        = require('gulp-eslint'),
    filelog       = require('gulp-filelog'),
    // react         = require('gulp-react'),
    // remember      = require('gulp-remember'),
    // rollup        = require('rollup-stream'),
    sass          = require('gulp-sass'),
    sourcemaps    = require('gulp-sourcemaps'),
    // gutil         = require('gulp-util'),
    path          = require('path'),
    webserver     = require('gulp-webserver'),
    // webpack       = require('webpack'),
    webpackStream = require('webpack-stream'),
    //Build only
    extend        = require('extend'),
    gulpif        = require('gulp-if'),
    gutil         = require('gulp-util'),
    htmlmin       = function(){},
    minifyCSS     = function(){},
    shell         = require('gulp-shell'),
    uglify        = function(){},
    yargs         = require('yargs'),
    bulkSass      = require('gulp-sass-bulk-import');
    // concat        = require('gulp-concat'),
    // eslint        = require('gulp-eslint'),


var prod = yargs.argv.prod;
var handleError = function(err) {
  console.log("\x07");
  console.log(err.toString());
  this.emit('end');
};



/*==============================
=            Server            =
==============================*/
gulp.task('server', function(){
  var ip = require('get-my-ip')();
  var stream = gulp.src('');
  

  //=== Client testing server
  var client = gulp.src('dist');
  client.pipe(webserver());
  if(ip){
    client.pipe(webserver({
        host: ip,
        livereload: true
    }));
  }


  //== nodejs server (client/admin)
  stream.pipe(shell([
    `nodemon --debug --harmony_default_parameters --ignore src/ --ignore dist/ --ignore test/ & 
    node-inspector --preload false`
  ]));

  //=== Start postgres
  var isWin = /^win/.test(process.platform);
  if(isWin){
    // @todo: get windows version working with config
    // http://www.postgresql.org/docs/9.4/static/app-pg-ctl.html
    stream.pipe(shell([
      "%PROGRAMFILES%\PostgreSQL\9.5\bin\pg_ctl.exe -start"
    ]));
  }
  else{
    stream.pipe(shell([
      'open -a Postgres'
    ]));
  }
});


/*============================
=            HTML            =
============================*/
gulp.task('html', function(){
  return gulp.src(config.html.src)
  .pipe(fileInclude({
    prefix: '@@',
    basepath: path.join(config.src, 'html')
  }))
  .on('error', handleError)
  .pipe(gulp.dest(config.dist))
  .pipe(livereload())
});



/*==================================
=            JavaScript            =
==================================*/
var wpConfig = prod ? require('./gulp/webpack.prod.js') : require('./gulp/webpack.dev.js');

wpConfig.output = {
  path: path.join(__dirname, "dist/js"),
  filename: "bundle.js"
};
wpConfig.entry = './' + config.js.entry;

var webpack = require('webpack');
var compiler = webpack(wpConfig);
gulp.task('js', ['lint:js'], function(cb){
  compiler.run(function(err, stats){
    cb();
    livereload.changed(config.js.dist + '/bundle.js');
  });
});


gulp.task('js:old', function(cb){
  return gulp.src(config.js.entry)
  // .pipe(cache('scripts'))
  // babel task here
  // .pipe(remember('scripts'))
  .pipe(
    webpackStream(wpConfig)
    // .on('error', handleError)
  )
  .pipe(gulp.dest(config.js.dist))
  .pipe(livereload())
});




/*============================
=            Sass            =
============================*/
gulp.task('sass', function(){
  return gulp.src(config.sass.src)
  .pipe(bulkSass())
  .pipe(sourcemaps.init())
  .pipe(sass( {style:'compressed', precision: 10} ))
  .on('error', handleError)
  .pipe(prefix())
  .on('error', handleError)
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(config.sass.dist))
});



/*===============================
=            Linting            =
===============================*/
var esconfig = require('./gulp/eslintrc.js');
var eslintPassed;
gulp.task('lint:js', function () {
  return gulp.src([path.join(config.js.entry), 'index.js'])
  // .pipe(gulpif( !prod, newer(path.join(config.copy.dist, 'base/js/') )))
  .pipe(eslint(esconfig))
  .pipe(eslint.format())
  .pipe(eslint.result(function(result){
    if(result.errorCount > 0){
      eslintPassed = false;
    }
    else{
      eslintPassed = true;
    }
  }))
  .pipe(eslint.failAfterError())
  .on('error', handleError)
});




/*=============================
=            Watch            =
=============================*/
var timer;
gulp.task('watch', function(){
  livereload.listen();
  // gulp.watch([config.js.watch, config.js.devwatch]).on('change', function(e){
  // });
  gulp.watch(config.js.devwatch, ['js'])
  gulp.watch('index.js', ['lint:js']);
  // gulp.watch(config.js.watch).on('change', livereload.changed);
  gulp.watch(config.html.watch, ['html']);
  gulp.watch(config.sass.watch, ['sass']);
  gulp.watch(config.sass.dist + '/**/*.css').on('change', livereload.changed);
});




/*===========================
=            CLI            =
===========================*/
if(prod){
  gulp.task('default', ['html', 'js']);
}
else{
  gulp.task('default', ['server', 'watch', 'js', 'html']);  
}
