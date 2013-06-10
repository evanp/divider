// fixup.js
//
// fixes some problems with StatusNet backups
//
// Copyright 2013 E14N https://e14n.com/
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var fs = require("fs"),
    os = require("os"),
    path = require("path"),
    crypto = require("crypto"),
    _ = require("underscore"),
    mkdirp = require('mkdirp'),
    async = require("async"),
    argv = require("optimist")
        .usage("Usage: $0 -i <filename>")
        .demand(["i"])
        .alias("i", "input")
        .describe("i", "Input file in Activity Streams JSON format")
        .argv,
    input = argv.i,
    output = argv.o;

var tmpnameOf = function(input) {
    return path.join(os.tmpdir(), path.basename(input));
};

var thePublic = {
    id: "http://activityschema.org/collection/public",
    objectType: "collection"
};

var fixupAddress = function(activity) {
    if (activity.verb == "post") {
        if (activity.to) {
            var colls = _.find(activity.to, function(addr) { return addr.objectType == "collection"; });
            if (!colls || colls.length === 0) {
                activity.to.push(thePublic);
            }
        } else {
            activity.to = [thePublic];
        }
    }
};

var fixupWidthAndHeight = function(obj) {
    if (_.isArray(obj)) {
        _.each(obj, function(item) {
            fixupWidthAndHeight(item);
        });
    } else if (_.isObject(obj)) {
        _.each(obj, function(value, name) {
            if ((name == "width" || name == "height") && _.isString(value)) {
                obj[name] = parseInt(value, 10);
            } else {
                fixupWidthAndHeight(value);
            }
        });
    }
};

var fixupActivity = function(activity) {
    fixupAddress(activity);
    fixupWidthAndHeight(activity);
};

var safeMove = function(oldName, newName, callback) {

    fs.rename(oldName, newName, function(err) {
        if (err) {
            if (err.code == "EXDEV") {
                slowMove(oldName, newName, callback);
            } else {
                callback(err);
            }
        } else {
            callback(null);
        }
    });
};

var slowMove = function(oldName, newName, callback) {

    var rs,
        ws,
        onClose = function() {
            clear();
            fs.unlink(oldName, callback);
        },
        onError = function(err) {
            clear();
            callback(err);
        },
        clear = function() {
            rs.removeListener("error", onError);
            ws.removeListener("error", onError);
            ws.removeListener("close", onClose);
        };

    try {
        rs = fs.createReadStream(oldName);
        ws = fs.createWriteStream(newName);
    } catch (err) {
        callback(err);
        return;
    }

    ws.on("close", onClose);
    rs.on("error", onError);
    ws.on("error", onError);

    rs.pipe(ws);
};

async.waterfall(
    [
        function(callback) {
            fs.readFile(input, {encoding: "utf8"}, callback);
        },
        function(data, callback) {
            var collection;
            try {
                collection = JSON.parse(data);
                callback(null, collection);
            } catch (err) {
                callback(err, null);
            }
        },
        function(collection, callback) {
            _.each(collection.items, function(activity) {
                fixupActivity(activity);
            });
            callback(null, collection);
        },
        function(collection, callback) {
            fs.writeFile(tmpnameOf(input), JSON.stringify(collection), {encoding: "utf8"}, callback);
        },
        function(callback) {
            Move(tmpnameOf(input), input, callback);
        }
    ],
    function(err) {
        if (err) {
            console.error(err);
        } else {
            console.log("OK");
        }
    }
);
