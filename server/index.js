var https = require("https");
var fs = require("fs");
var url = require("url");
var path = require("path");

var key = fs.readFileSync("./myprivkey.pem");
var cert = fs.readFileSync("./certificate.pem");

var contentType = {
  html: "text/html",
  png: "image/png",
  css: "text/css",
  js: "application/javascript"
};
var options = {
  // hostname: "localhost",
  // port: 8885,
  // path: "/",
  // method: "GET",
  key,
  cert,
};

https
  .createServer(options, (request, res) => {
    var uri = url.parse(request.url).pathname;
    var filename =
      uri === "/"
        ? path.join("../dist/", "index.html")
        : path.join("../dist/", uri); ;

    var index = fs.readFileSync(filename);
    var header = {};
    var ext = path.extname(filename).replace('.', '');
    console.log("filename", filename, ext);

    if (contentType[ext]) {
      header["Content-type"] = contentType[ext];
    }
    // res.writeHead(200, { "Content-Type": "text/plain" });
    res.writeHead(200, header);
    res.end(index);
  })
  .listen(8885);
// options.agent = new https.Agent(options);


// var req = https.request(options, function(res) {
//   console.log("statusCode: ", res.statusCode);
//   console.log("headers: ", res.headers);

//   res.on("data", function(d) {
//     process.stdout.write(d);
//   });
// });
// req.end();

// req.on("error", function(e) {
//   console.error('error', e);
// });

// process.on("uncaughtException", function(err) {
//   console.log(err);
// }); 

// var https = require("https");

// var options = {
//   hostname: "encrypted.google.com",
//   port: 443,
//   path: "/",
//   method: "GET"
// };

// var req = https.request(options, function(res) {
//   console.log("statusCode: ", res.statusCode);
//   console.log("headers: ", res.headers);

//   res.on("data", function(d) {
//     process.stdout.write(d);
//   });
// });
// req.end();

// req.on("error", function(e) {
//   console.error(e);
// });
// console.log('end');
