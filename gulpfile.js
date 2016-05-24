var 
    // babel         = require('gulp-babel'),
    // config        = require('./gulp/gulp-config.js'),
    // fileInclude   = require('gulp-file-include'),
    gulp          = require('gulp'),
    // livereload    = require('gulp-livereload'),
    // eslint        = require('gulp-eslint'),
    filelog       = require('gulp-filelog'),
    // sourcemaps    = require('gulp-sourcemaps'),
    path          = require('path'),
    webserver     = require('gulp-webserver'),

    //Build only
    gulpif        = require('gulp-if'),
    // gutil         = require('gulp-util'),
    shell         = require('gulp-shell'),
    yargs         = require('yargs');


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
  
  // /* Localhost */
  // var client = gulp.src('dist');
  // client.pipe(webserver());

  // /* External server */
  // if(ip){
  //   client.pipe(webserver({
  //       host: ip,
  //       livereload: true
  //   }));
  // }


  /* start */
  stream.pipe(shell([
    `nodemon --debug --ignore src/ --ignore dist/ --ignore test/ & 
    node-inspector --preload false`
  ]));

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
// var wpConfig = prod ? require('./gulp/webpack.prod.js') : require('./gulp/webpack.dev.js');

// wpConfig.output = {
//   path: path.join(__dirname, "dist/js"),
//   filename: "bundle.js"
// };
// wpConfig.entry = './' + config.js.entry;

// var webpack = require('webpack');
// var compiler = webpack(wpConfig);
// gulp.task('js', ['lint:js'], function(cb){
//   compiler.run(function(err, stats){
//     cb();
//     livereload.changed(config.js.dist + '/bundle.js');
//   });
// });




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
// var esconfig = require('./gulp/eslintrc.js');
// var eslintPassed;
// gulp.task('lint:js', function () {
//   return gulp.src([path.join(config.js.entry), 'index.js'])
//   // .pipe(gulpif( !prod, newer(path.join(config.copy.dist, 'base/js/') )))
//   .pipe(eslint(esconfig))
//   .pipe(eslint.format())
//   .pipe(eslint.result(function(result){
//     if(result.errorCount > 0){
//       eslintPassed = false;
//     }
//     else{
//       eslintPassed = true;
//     }
//   }))
//   .pipe(eslint.failAfterError())
//   .on('error', handleError)
// });




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
gulp.task('default', ['server']);
