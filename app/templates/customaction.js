module.exports = {
  __metadata: {
    type: "SP.UserCustomAction"
  },
  Description: "<%= vendor %> User Custom Action",
  Location: "ScriptLink",
  Name: "<%= vendor %>.ACTION",
  ScriptSrc: "~siteCollection/Style Library/<%= vendor %>/yaaps_boot.js",
  Sequence: 1000,
  Title: "<%= vendor %> Action"
}