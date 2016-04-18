var gulp = require('gulp');
var shampoo = require('./shampoo');


// test task
gulp.task('shampoo', function(done) {

    shampoo({
        documentId: "0B0DrlaR4h0bLeTY2Y2lHSlRCMHM",
        activeLocales: [
            "en-US"
        ]
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
