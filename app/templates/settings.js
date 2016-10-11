var creds = require("./creds");

module.exports = {

    siteUrl: creds.site,
    username: creds.user,
    password: creds.pass,
    vendor: "<%= vendor %>",
    notification: false,
    checkin: true,
    checkinType: 1,
    flatten: false
}