var PartX;
(function(PartX){

    PartX.run = function(){
        console.log("Running PartX");
    }

})(PartX || (PartX = {}));
console.log("PartX loaded");
NotifyScriptLoadedAndExecuteWaitingJobs("PartX");