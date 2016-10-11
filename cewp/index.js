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
                message: 'Name of web part:',
                default: this.appname
            },
            {
                type: 'input',
                name: 'partdescription',
                message: 'Description of web part:',
                default: this.appname
            }
            ])
            .then(function(answers){

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
                
            }.bind(this));
    },

    writing: function () {
        this.log("writing");

        this._copyTpl('index.html', 'src/Style Library/' + this.settings.folder + '/index.html');
        this._copyTpl('MSContentEditor.dwp', 'src/_catalogs/wp/' + this.settings.folder + '.dwp');

    },

    install: function () {
        
    },

    _copyTpl: function(tmpl, dest){

        dest = dest || tmpl;
        this.log(tmpl + ", " + dest);

        this.fs.copyTpl(
            this.templatePath(tmpl),
            this.destinationPath(dest),
            this.settings
        );
    },
});