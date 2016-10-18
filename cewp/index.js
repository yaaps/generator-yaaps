var generators = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var _ = require('lodash');

module.exports = generators.Base.extend({

    settings: {},

    constructor: function () {
        generators.Base.apply(this, arguments);
    },

    prompting: function () {

        this.log(yosay(
            "Welcome to the " + chalk.green("CEWP (Content Editor Web Part)") + " generator!"
        ));

        return this.prompt([{
                type: 'input',
                name: 'partname',
                message: 'Name of web part:'
            },
            {
                type: 'input',
                name: 'partdescription',
                message: 'Description of web part:'
            }
            ])
            .then(function(answers){

                if(!answers.partname){
                    this.env.error("Name of web part is required");
                }

                var folder = _.startCase(answers.partname);
                folder = _.replace(folder, /[^a-zA-Z0-9]/g, '');

                var packageName = _.kebabCase(folder);
                var baseUrl = "_BASEURL_";

                this.settings = {
                    title: answers.partname,
                    description: answers.partdescription,
                    folder: folder,
                    baseurl: baseUrl
                }

                this.settings.vendor = this.config.get("vendor");
                
            }.bind(this));
    },

    writing: function () {
        this._createCEWP(this.settings);
    },

    install: function () {
        
    },

    _createCEWP: function(settings){

        var assets = "Style Library";
        var folder = settings.folder;
        var vendor = settings.vendor;

        this._copyTpl('index.html', `src/${assets}/${vendor}/${folder}/index.html`);
        this._copyTpl('MSContentEditor.dwp', `src/_catalogs/wp/${folder}.dwp`);
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