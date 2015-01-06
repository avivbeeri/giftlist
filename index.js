var http = require("http");
var fs = require("fs");
var url = require('url');
var router = require("restroute");
var port = process.env.PORT || 8080;
var redis = require("redis");
var mime = require('mime');
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

router.get("/:name", serveStatic);
router.get("/", serveStatic);
        
function serveStatic(req,res) {
  var nameParam = req.params.name;
  var name;
  if (nameParam && nameParam !== "favicon.ico") {
      name = require("url").parse(nameParam, true).pathname;
  } else if (nameParam !== "favicon.ico") {
      name = "index.html";
  } else {
      res.writeHead(204);
      res.end();
      return;
  }

  
  var path = "./" + name;
  fs.exists(path, function(exists) {
      if (exists) {
          var type = mime.lookup(path);
          res.writeHead(200, { 'Content-Type' : type });
          var file = fs.createReadStream(path);
          file.pipe(res);
      } else {
          res.writeHead(404);
          res.end();
      }
  });
};

router.get("/api/gifts", function (req,res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
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

router.get("/api/purchased", function (req,res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    client.keys("purchased:*", function (err, replies) {
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


router.post("/api/gifts/new", function (req, res) {
    var body = "";
    req.on('data', function (chunk) {
        body += chunk;
    });
    req.on('end', function () {
        var qs = require("querystring");
        var data = qs.parse(body);
        getNewUUID(function (e, uuid) {
            client.hmset("gift:" + uuid, 
                         "id", uuid,
                         "name", data.name,
                         "quantity", data.quantity,
                         "description", data.description,
                         "image", data.image,
                         "link", data.link);
        });
        res.writeHead(201);
        res.end();
    });
});

router.get("/api/gifts/:id/delete", function (req, res) {
    res.writeHead(200, {'Context-Type' : "application/json"});
    client.hincrby("gift:" + req.params.id, "quantity", "-1", function (err, reply) {
        if (reply <= 0) {
            client.rename("gift:" + req.params.id, "purchased:" + req.params.id, function (err, reply) {
                res.end();   
            });

        } else {
            res.end(JSON.stringify(reply));   
        }
    });
});


router.onError(function (req,res) {
  console.log("Error!" + "Stuff?");
  res.writeHead(404);
  res.end("Error happened");
});

http.createServer(router.go).listen(port);

function getNewUUID(callback) {
    client.incr("UUID", callback);
}
