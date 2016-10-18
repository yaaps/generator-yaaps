var generators = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var _ = require('lodash');

module.exports = generators.Base.extend({

    settings: {},

    defaultSiteUrl: "https://[tenant].sharepoint.com",

    constructor: function () {
        generators.Base.apply(this, arguments);
    },

    prompting: function () {

        this.log(yosay(
            "Welcome to the " + chalk.green("YAAPS") + " generator!"
        ));

        return this.prompt([{
                type: 'input',
                name: 'projectname',
                message: 'Name of project:',
                default: this.appname
            },
            {
                type: 'input',
                name: 'projectdescription',
                message: 'Description of project:'
            },
            {
                type: 'input',
                name: 'author',
                message: 'Author'
            },
            {
                type: 'input',
                name: 'vendor',
                message: 'Vendor',
                default: "YAAPS"
            },
            {
                type: 'input',
                name: 'siteurl',
                message: 'Deploy to SharePoint Online site url:',
                default: this.defaultSiteUrl
            },
            {
                type: 'input',
                name: 'user',
                message: 'Deploy as user:',
                default: "[username]"
            },
            {
                type: 'confirm',
                name: 'createpart',
                message: 'Create a basic content editor web part now?:',
                default: true
            },
            {
                when: function(answers){
                    return answers.createpart;
                },
                type: 'input',
                name: 'partname',
                message: 'Web part name:',
                required: true
            },
            {
                when: function(answers){
                    return answers.createpart;
                },
                type: 'input',
                name: 'partdescription',
                message: 'Web part description:',
                required: false
            },
            {
                type: 'confirm',
                name: 'runinstall',
                message: 'Run npm install?',
                default: true
            },
            ])
            .then(function(answers){

                function strip(s){
                    return _.replace(s, /[^a-zA-Z0-9]/g, '');
                }

                if(answers.createpart && !answers.partname){
                    this.log(chalk.yellow("Webpart name not supplied so it will default to CEWP"));
                    answers.partname = "CEWP";
                }

                var packageName = _.kebabCase(strip(_.startCase(answers.projectname)));
                var partfolder = strip(_.startCase(answers.partname));
                var baseUrl = "_BASEURL_";

                this.log(packageName);

                this.settings = {
                    title: answers.projectname,
                    description: answers.projectdescription,
                    site: answers.siteurl,
                    author: answers.author,
                    vendor: answers.vendor,
                    user: answers.user,
                    createpart: answers.createpart,
                    partname: answers.partname,
                    partdescription: answers.partdescription,
                    runinstall: answers.runinstall,
                    pass: "[password]",
                    folder: partfolder,
                    package: packageName,
                    baseurl: baseUrl
                }
                
                this.config.set("vendor", this.settings.vendor);

            }.bind(this));
    },

    writing: function () {

        var vendor = this.settings.vendor;
        
        this._copyTpl('package.json');
        this._copyTpl('gulpfile.js');
        this._copyTpl('creds.js');
        this._copyTpl('settings.js');
        this._copyTpl('gitignore', '.gitignore');
        this._copyTpl('yaaps_boot.js', `src/Style Library/${vendor}/Shared/yaaps_boot.js`);
        
        if(this.settings.createpart){
            this._createCEWP(this.settings);
        }
    },

    install: function () {
        
        if(this.settings.runinstall){
            this.log(chalk.green("Beginning npm install"));
            this.npmInstall();  
        }else{
            this.log(chalk.yellow("Skipping npm install"));
        }
    },

    _createCEWP: function(settings){
        this._copyTpl('index.html', `src/Style Library/${settings.vendor}/${settings.folder}/index.html`);
        this._copyTpl('MSContentEditor.dwp', `src/_catalogs/wp/${settings.folder}.dwp`);
    },

    _copyTpl: function(tmpl, dest){

        dest = dest || tmpl;

        this.fs.copyTpl(
            this.templatePath(tmpl),
            this.destinationPath(dest),
            this.settings
        );
    },
});