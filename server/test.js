var path = require("path");
var uri = "/styles/index.css";
var filename = path.join("../dist", uri) || "index.html";
console.log("uri", filename);