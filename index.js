var http = require("http");
var fs = require("fs");
var url = require("url");
var router = require("restroute");
var port = process.env.PORT || 8080;
var redis = require("redis");
var client;

if (process.env.REDISCLOUD_URL) {
    var redisURL = url.parse(process.env.REDISCLOUD_URL);
    client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
    client.auth(redisURL.auth.split(":")[1]);
} else {
    client = redis.createClient();
}

client.on("error", function (err) {
    console.log("Error " + err);
});

router.get("/", function (req,res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var file = fs.createReadStream("./index.html");
  file.pipe(res);
});

router.get("/api/gifts", function (req,res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    client.keys("gift:*", function (err, replies) {
        var query = client.multi();
        replies.forEach(function (giftName) {
            query.hgetall(giftName);
        });
        query.exec(function (err, gifts) {
            res.write(JSON.stringify(gifts));
            res.end();
        });
        
    });
});

router.onError(function (req,res) {
  console.log("Error!");
  res.writeHead(404);
  res.end("Error happened");
});

http.createServer(router.go).listen(port);


