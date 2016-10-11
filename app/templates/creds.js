
/*
WARNING! In order to prevent leaking of credentials, this file has been added to .gitignore to prevent checkin to git source control
Speed up deployment by populating the placeholders below with the necessary credentials
Leaving as the default values will mean you will be prompted for this information when required for build/push tasks
*/
module.exports = {
    site: "<%= site %>",
    user: "<%= user %>",
    pass: "<%= pass %>"
}