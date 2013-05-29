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
    _ = require("underscore"),
    mkdirp = require('mkdirp'),
    async = require("async"),
    argv = require("optimist")
        .usage("Usage: $0 -i <filename> -o <root output dir>")
        .demand(["i", "o"])
        .alias("o", "output")
        .alias("i", "input")
        .describe("i", "Input file in Activity Streams JSON format")
        .describe("o", "Output directory")
        .argv,
    input = argv.i,
    output = argv.o;

var writeActivity = function(activity, callback) {

    var published = Date.parse(activity.published || activity.updated);

    async.waterfall(
        [
            function(callback) {
            }
        ],
        callback);
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
            var done = false,
                wq = async.queue(writeActivity, 512);
            wq.drain = function() {
                if (done) {
                    callback(null);
                }
            };
            _.each(collection.items, function(activity) {
            });
            done = true;
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
                