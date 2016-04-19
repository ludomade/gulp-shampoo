# gulp-shampoo

> A grunt plugin to retrieve data from Ludomade's Shampoo app.

## Getting Started

This plugin requires Gulp `^3.9.1`

If you haven't used [Gulp](http://gulpjs.com/) before, be sure to check out the [Getting Started](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) guide, as it explains how to create a Gulpfile.js. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install gulp-shampoo --save-dev
```

Once you've got a basic gulpfile setup, add the following task.

```js
var shampoo = require('gulp-shampoo');
gulp.task('shampoo', function(done) {

    shampoo({ //see below for an explanation of each option.
        documentId: "MY-SHAMPOO-DOCUMENT-ID-HERE",
        outputDir: "locales/"
        activeLocales: ["en-US"]
    }, function(err) {
        if (err) {
            return done(err); // return error
        }
        done(); // finished task
    });

});
```

**A note about other gulp async tasks and shampoo**

The shampoo task is best setup as a 'synchronous' task - as it's got a few entry prompts in the terminal window.  If other asynchronous tasks are started at the same time, the prompts may get lost within the output.  For an explanation on how to set this up, see this [article](http://schickling.me/synchronous-tasks-gulp/).

### Options

The first argument of the shampoo function takes an object of options.

#### options.documentId
Type: `String`
Default value: ``

The document ID which you want to pull data down from.  To find your document ID, open your Shampoo document in the browser.  The document ID is displayed in the URL, after `/#/edit/`.  For example: `/#/edit/{documentId}`.

#### options.activeLocales
Type: `Array<String>`
Default value: ``

Enter an array of strings of locales you wish to pull down.  Ie, `['en-US', 'en-GB', 'en-AU']`.  The locale codes must match the code setup within Shampoo.

#### options.outputDir
Type: `String`
Default value: `locales/`

Enter a path relative to the gulpfile which indicates where the data from shampoo will be saved.


## First run on a project

Once you've got your gulp file setup and running, run `gulp shampoo`
For the first time, the task will prompt you for a few details.  

1. First it will prompt you with "Please enter your google ClientID.".  If you don't know what this is, ask a shampoo admin.
2. Secondly, it will prompt you with "Please enter your google ClientSecret.".  If you don't know what this is, ask a shampoo admin.
3. Lastly, it will open a browser window with a Google sign-in and authorization request screen.  Upon clicking the 'accept' button, it will provide you with a key to save.  Copy this key, and paste it into the terminal prompt.
4. You're done.  The credentials used above will get saved down, and remembered next time.  If all went well, you should have locales/en-US.json, filled with data.
