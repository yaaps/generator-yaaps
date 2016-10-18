(function () {
    var assetsRoot = '_BASEURL_/style%20library/_VENDOR_/';

    function RegisterScripts() {

        RegisterSod('jquery.js', assetsRoot + 'shared/jquery.js');
        RegisterSod('knockout.js', assetsRoot + 'shared/knockout.js');
        //RegisterSod('yaaps1.js', assetsRoot + 'yaaps1.js');
        //RegisterSodDep('yaaps1.js', 'jquery.js');
    }

    ExecuteOrDelayUntilScriptLoaded(function(){
        RegisterModuleInit(SPClientTemplates.Utility.ReplaceUrlTokens('~siteCollection/style%20library/_VENDOR_/Shared/yaaps_boot.js'), RegisterScripts);
    }, "clienttemplates.js");

    RegisterScripts();
})();

console.log("yaaps_boot loaded");
NotifyScriptLoadedAndExecuteWaitingJobs("yaaps_boot");