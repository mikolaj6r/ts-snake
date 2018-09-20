let gulp = require('gulp'),
	sass = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	cssnano = require('gulp-cssnano'),
  rename = require('gulp-rename');
  
let ts = require("gulp-typescript"),
    tsProject = ts.createProject("tsconfig.json"),
    babel = require('gulp-babel');

gulp.task("sass", () => gulp.src("src/sass/*.scss")
  .pipe(sass())
  .pipe(autoprefixer())
  .pipe(gulp.dest("dist"))
  .pipe(rename({suffix: '.min'}))
  .pipe(cssnano())
  .pipe(gulp.dest("dist")));
 
gulp.task("ts", function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(babel({
          plugins: ["transform-class-properties"]
        })).pipe(gulp.dest("dist"));
});

gulp.task("default", () => {
  gulp.watch("src/sass/*.scss", ["sass"]);
  gulp.watch("src/ts/*.ts", ["ts"]);
});

