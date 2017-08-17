var gulp = require('gulp');
var gulpShampooDownload = require('./gulp-shampoo').gulpShampooDownload;


// test task
gulp.task('shampoo', function(done) {

    gulpShampooDownload({
        documentId: "0B5wrWftafh7fdUpLV2cyaTEzRVE",
        activeLocales: ["en-US", "en-GB"]
    }, function(err) {
        if (err) {
            return done(err); // return error
        }
        done(); // finished task
    });

});

gulp.task('test', ['shampoo'], function() {

});

gulp.task('default', [
    'test'
]);
