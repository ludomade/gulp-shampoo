var gulp = require('gulp');
var shampoo = require('./shampoo');


// test task
gulp.task('shampoo', function(done) {

    shampoo({
        documentId: "0Bz-OjbqJG4dfVDFMRThMcDV3Z00",
        activeLocales: ["en-US", "fr-FR"]
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
