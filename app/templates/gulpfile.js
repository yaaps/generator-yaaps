var settings = require("./settings");
var gulp = require("gulp");
var spsave = require("gulp-spsave");
var replace = require("gulp-replace");
var tap = require("gulp-tap");
var gutil = require("gulp-util");
var del = require("del");
var prompt = require("gulp-prompt");
var inquirer = require("inquirer");
var urlParser = require("url");
var runSequence = require("run-sequence");
var merge = require("merge-stream");
var plumber = require("gulp-plumber");
var pathUtil = require("path");
var Cpass = require("cpass");

var _ = require("lodash");

var styleSettings = _.defaults({folder: "Style Library"}, settings);
var catalogSettings = _.defaults({folder: "_catalogs/wp"}, settings);

function setUsername(username){
    styleSettings = _.extend(styleSettings, { username });
    catalogSettings = _.extend(catalogSettings, { username });
}

function setPassword(password){
    styleSettings = _.extend(styleSettings, { password });
    catalogSettings = _.extend(catalogSettings, { password });
}

function setSiteUrl(url){

    var urlObject = urlParser.parse(url);
    var newSite = { siteUrl: urlObject.href, basePath: urlObject.pathname };

    settings = _.extend(settings, newSite);
    styleSettings = _.extend(styleSettings, newSite);
    catalogSettings = _.extend(catalogSettings, newSite);

}

gulp.task("check-site", function(){
    
    if(!settings.siteUrl || settings.siteUrl == "https://[tenant].sharepoint.com"){
    
        return inquirer.prompt([{
                type: "text",
                name: "site",
                message: "Deployment site:"
            }])
            .then(function(result){
                    setSiteUrl(result.site);
                });
     }else{
        setSiteUrl(settings.siteUrl);
     }
});

gulp.task("check-user", function(){
    
    if(settings.username == "[username]"){
    
        return inquirer.prompt([{
                type: "text",
                name: "user",
                message: "Deployment user:"
            }])
            .then(function(result){
                    setUsername(result.user);
                });
     }
});

gulp.task("check-password", function(){
    
    if(settings.password == "[password]"){

        return inquirer.prompt([{
                type: "password",
                name: "pass",
                message: "Password:"
            }])
            .then(function(result){
                    setPassword(result.pass);
                });
     }
});

gulp.task("save-password", function(){

    function encrypt(password){
        var cp = new Cpass();
        return cp.encode(password);
    }

    function replacePassword(file, password){
        file.contents = new Buffer(String(file.contents)
            .replace(/pass:\s*['"]\S+['"]/g, 'pass: \"' + encrypt(password) + '\"'));
    }

    return inquirer.prompt([{
                type: "password",
                name: "pass",
                message: "Password:"
            }])
            .then(function(result){

                return gulp.src("./creds.js")
                    .pipe(tap(function(file){return replacePassword(file, result.pass)}))
                    .pipe(gulp.dest("."));
            });
});

gulp.task("clean", function(){
    return del("./dist");
});

gulp.task("build", ["check-site"], function(){
    
    function replaceTokens(file){
        file.contents = new Buffer(String(file.contents)
            .replace(/_BASEURL_/g, settings.basePath));
    }

    var webparts = gulp.src("./src/_catalogs/wp/**/*.*")
        .pipe(tap(replaceTokens))
        .pipe(gulp.dest("./dist/_catalogs/wp"));

    var templates = gulp.src("./src/Style Library/**/*.*")
        .pipe(tap(replaceTokens))
        .pipe(gulp.dest("./dist/Style Library"));

    return merge(webparts, templates);

});

gulp.task("check-all", function(done){

    return runSequence("check-site", "check-user", "check-password", done);
    
})

gulp.task("push", ["check-all"], function(){

    var styles = gulp.src("./dist/Style Library/**/*.*")
        .pipe(spsave(styleSettings));

    var webparts = gulp.src("./dist/_catalogs/wp/**/*.*")
        .pipe(spsave(catalogSettings));

    return merge(styles, webparts);
    
});

gulp.task("deploy", function(done){
    runSequence("clean", "build", "push", done);
});

var onError = function(err){
    gutil.log(err);
    this.emit("end");
}

gulp.task("watch", ["check-all"], function(){

    gulp.watch(["./dist/Style Library/**/*.*"], function(event){

        return gulp.src(event.path, {base: "Style Library"})
            .pipe(plumber({
                errorHandler: onError
            }))
            .pipe(spsave(styleSettings));
    });

    gulp.watch(["./src/Style Library/**/*.*"], function(event){

        function replaceTokens(file){
            file.contents = new Buffer(String(file.contents)
                .replace(/_BASEURL_/g, settings.basePath));
        }

        function buildDest(filepath){
            
           return [".", "dist", ...filepath.split(pathUtil.sep)
                .filter((val, index, arr) => {
                    return index < arr.length - 1 && index > arr.indexOf('src');
                })].join(pathUtil.sep);
        }

        gutil.log(event.type + ": " + event.path);

        return gulp.src(event.path)
            .pipe(plumber({
                errorHandler: onError
            }))
            .pipe(tap(replaceTokens))
            .pipe(gulp.dest(function(){
                return buildDest(event.path);
            }));
    });
});