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
var chalk = require("chalk");
var spauth = require('node-sp-auth');
var request = require('request-promise');

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

function replaceTokens(file, settings){
    file.contents = new Buffer(String(file.contents)
        .replace(/_BASEURL_/g, _.trimEnd(settings.basePath,'/'))
        .replace(/_VENDOR_/g, settings.vendor)
    );
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
    
    if(!settings.username || settings.username == "[username]"){
    
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
    
    function decrypt(pass){
        var cp = new Cpass();
        return cp.decode(pass);
    }

    if(!settings.password || settings.password == "[password]"){
        gutil.log(chalk.yellow("HINT: Use gulp save-password to save your password in creds.js"));
        return inquirer.prompt([{
                type: "password",
                name: "pass",
                message: "Password:"
            }])
            .then(function(result){
                    setPassword(result.pass);
            });
     }else{
        setPassword(decrypt(settings.password));
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

    function replace(file){
        return replaceTokens(file, settings);
    }

    var webparts = gulp.src("./src/_catalogs/wp/**/*.*")
        .pipe(tap(replace))
        .pipe(gulp.dest("./dist/_catalogs/wp"));

    var templates = gulp.src("./src/Style Library/**/*.*")
        .pipe(tap(replace))
        .pipe(gulp.dest("./dist/Style Library"));

    return merge(webparts, templates);
});

gulp.task("check-all", function(done){
    return runSequence("check-site", "check-user", "check-password", done);    
})

gulp.task("push", ["check-all"], function(){

    var partSettings = _.extend(catalogSettings, { filesMetaData: []});

    function partTap(file, settings){
        var fileName = pathUtil.basename(file.path);

        var files = settings.filesMetaData;
        if(files.filter(f => f.fileName == fileName).length == 0){
            files.push({
                fileName: fileName,
                metadata: {
                    "__metadata": { type: "SP.Data.OData__x005f_catalogs_x002f_wpItem"},
                    Group: settings.vendor
                }
            })
        }
        return file;
    }

    var styles = gulp.src("./dist/Style Library/**/*.*")
        .pipe(spsave(styleSettings));

    var webparts = gulp.src("./dist/_catalogs/wp/**/*.*")
        .pipe(tap((file) => partTap(file, partSettings)))
        .pipe(spsave(partSettings));

    return merge(styles, webparts);
});

gulp.task("deploy", function(done){
    runSequence("clean", "build", "push", "spaxion", done);
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
            .pipe(tap((file) => replaceTokens(file, settings)))
            .pipe(gulp.dest(function(){
                return buildDest(event.path);
            }));
    });
});

gulp.task("spaxion", ["check-all"], function(){

    var url = styleSettings.siteUrl;
    var creds = {
        username: styleSettings.username,
        password: styleSettings.password 
    };

    return spauth.getAuth(url, creds)
    .then((options) => {

        var data = {
            __metadata: {
                type: "SP.UserCustomAction"
            },
            Description: "YAAPS User Custom Action",
            Location: "ScriptLink",
            Name: `${settings.vendor}.ACTION`,
            ScriptSrc: `~siteCollection/Style Library/${settings.vendor}/Shared/yaaps_boot.js`,
            Sequence: 1000,
            Title: "YAAPS Script Custom Action"
        }

        var headers = options.headers;
        headers['Accept'] = 'application/json;odata=verbose';
        headers['Content-Type'] = 'application/json;odata=verbose';

        return request.post({
          url: url + '/_api/contextinfo',
          headers: headers
        })
        .then((response) => {
                var digest = JSON.parse(response).d.GetContextWebInformation.FormDigestValue;

                headers["X-RequestDigest"] = digest;

                return request.get({
                    url: url + '/_api/web/UserCustomActions',
                    headers: headers,
                });
        })
        .then((response) => {
            
            var currentItems = JSON.parse(response).d.results.filter(
                item => item.Name === data.Name
            );

            if(currentItems && currentItems.length){
                console.log(`Found ${currentItems.length} existing items, deleting ${currentItems[0].Id}`);

                var id = currentItems[0].Id;

                return request.delete({
                    url: url + `/_api/Web/UserCustomActions(guid'${id}')`,
                    headers: headers,
                });
            }else{
                console.log(`Found no existing custom actions matching name ${data.Name}`);
                return Promise.resolve(response);
            }
        })
        .then((response) => {
                console.log(`Adding new custom action ${data.Name}`);

                return request.post({
                    url: url + '/_api/web/UserCustomActions',
                    headers: headers,
                    body: data,
                    json: true
                });
         })
         .then((response) => {
             console.log("DONE");
         })
        .catch((error) => {
            console.log("CATCH");
            console.log(error);
        }); 
    });
});