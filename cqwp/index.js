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
            "Welcome to the " + chalk.green("CQWP (Content Query Web Part)") + " generator!"
        ));

        return this.prompt([{
                type: 'input',
                name: 'partname',
                message: 'Name of web part:'
            },
            {
                type: 'input',
                name: 'partdescription',
                message: 'Description of web part:',
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
                    package: packageName,
                    baseurl: baseUrl
                }

                this.settings.vendor = this.config.get("vendor");
                
            }.bind(this));
    },

    writing: function () {

        var assets = "Style Library";
        var vendor = this.settings.vendor;
        var folder = this.settings.folder;

        this._copyTpl('ContentQueryMain.xsl', `src/${assets}/${vendor}/${folder}/ContentQueryMain.xsl`);
        this._copyTpl('Header.xsl', `src/${assets}/${vendor}/${folder}/Header.xsl`);
        this._copyTpl('ItemStyle.xsl', `src/${assets}/${vendor}/${folder}/ItemStyle.xsl`);
        this._copyTpl('ContentQuery.webpart', `src/_catalogs/wp/${folder}.webpart`);
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