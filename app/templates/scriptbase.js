(function () {
    var assetsRoot = '_BASEURL_/style%20library/<%= vendor %>/';

    function RegisterScripts() {

        RegisterSod('jquery.js', assetsRoot + 'jquery.js');
        RegisterSod('knockout.js', assetsRoot + 'knockout.js');
        RegisterSod('yaaps1.js', assetsRoot + 'yaaps1.js');
        RegisterSodDep('yaaps1.js', 'jquery.js');
        
    }

    ExecuteOrDelayUntilScriptLoaded(function(){
        RegisterModuleInit(SPClientTemplates.Utility.ReplaceUrlTokens('~siteCollection/style%20library/<%= vendor %>/yaaps_boot.js'), RegisterScripts);
    }, "clienttemplates.js");

    RegisterScripts();
})();

console.log("yaaps_boot loaded");
NotifyScriptLoadedAndExecuteWaitingJobs("yaaps_boot");