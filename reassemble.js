// reassemble.js
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
    async = require("async"),
    argv = require("optimist")
        .usage("Usage: $0 -i <root input directory> -o <output file>")
        .demand(["i", "o"])
        .alias("o", "output")
        .alias("i", "input")
        .describe("i", "Input directory created by divide.js")
        .describe("o", "Output file")
        .argv,
    input = argv.i,
    output = argv.o;

var walk = function(fname, onFile, callback) {
    
    async.waterfall([
        function(callback) {
            fs.stat(fname, callback);
        },
        function(stats, callback) {
            if (stats.isDirectory()) {
                async.waterfall([
                    function(callback) {
                        fs.readdir(fname, callback);
                    },
                    function(files, callback) {
                        files = files.sort();
                        async.eachSeries(files,
                                         function(rel, callback) {
                                             walk(path.join(fname, rel), onFile, callback);
                                         },
                                         callback);
                    }
                ], callback);
            } else {
                onFile(fname, callback);
            }
        }
    ], callback);
};

var fd;

async.waterfall([
    function(callback) {
        fs.open(output, 'w', callback);
    },
    function(results, callback) {
        var start = new Buffer('{"items":[');
        fd = results;
        fs.write(fd, start, 0, start.length, null, callback);
    },
    function(written, buffer, callback) {
        var first = true,
            comma = new Buffer(",");

        walk(input,
             function(fname, callback) {
                 async.waterfall([
                     function(callback) {
                         if (first) {
                             first = false;
                             callback(null, null, null);
                         } else {
                             fs.write(fd, comma, 0, comma.length, null, callback);
                         }
                     },
                     function(written, buffer, callback) {
                         fs.readFile(fname, {encoding: null}, callback);
                     },
                     function(buf, callback) {
                         fs.write(fd, buf, 0, buf.length, null, callback);
                     },
                     function(written, buffer, callback) {
                         callback(null);
                     }
                 ], callback);
             },
             callback);
    },
    function(callback) {
        var end = new Buffer(']}');
        fs.write(fd, end, 0, end.length, null, callback);
    },
    function(written, buffer, callback) {
        fs.close(fd, callback);
    }
], function(err) {
    console.log("DONE");
});
