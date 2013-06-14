// divider.js
//
// divides one or more activitystrea.ms collections into one-activity files in sub-directories
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
    path = require("path"),
    crypto = require("crypto"),
    _ = require("underscore"),
    mkdirp = require('mkdirp'),
    async = require("async"),
    dateFormat = require("dateformat"),
    argv = require("optimist")
        .usage("Usage: $0 -o <root output dir> <filename1> <filename2> ...")
        .demand(["o"])
        .alias("o", "output")
        .describe("o", "Output directory")
        .check(function(argv) { return argv._ && argv._.length > 0; })
        .argv,
    output = argv.o;

var toDir = function(dt) {
    return path.join(output, dateFormat(dt, "yyyy/mm/dd/hh/MM/ss"));
};

var hash = function(idstr) {

    var h = crypto.createHash('md5'),
        str, data;

    data = idstr;

    h.update(data);
    str = h.digest('base64');

    // Make it a little more FS-safe

    str = str.replace(/\+/g, '-');
    str = str.replace(/\//g, '_');
    str = str.replace(/=/g, '');

    return str;
};

var writeActivity = function(activity, callback) {

    var adate = Date.parse(activity.published || activity.updated),
        dir = toDir(adate);

    async.waterfall(
        [
            function(callback) {
                mkdirp(dir, callback);
            },
            function(made, callback) {
                var contents = JSON.stringify(activity),
                    fname = path.join(dir, hash(contents) + ".json");
                fs.writeFile(fname, contents, callback);
            }
        ], callback);
};

var divideCollection = function(input, callback) {
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
                async.eachLimit(collection.items, 64, writeActivity, callback);
            }
        ],
        callback);
};

async.eachLimit(argv._, 8, divideCollection, function(err) {
    if (err) {
        console.error(err);
        process.exit(-1);
    } else {
        console.log("OK");
        process.exit(0);
    }
});
