// jsoncheck.js
//
// check that a file parses correctly
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
    _ = require("underscore"),
    async = require("async");

if (process.argv.length < 3) {
    console.error(new Error("No filename"));
    process.exit(-2);
}

async.waterfall([
    function(callback) {
        var fname = process.argv[2];
        fs.readFile(fname, {encoding: "utf8"}, callback);
    },
    function(data, callback) {
        var obj;
        try {
            obj = JSON.parse(data);
            callback(null);
        } catch (err) {
            callback(err);
        }
    }
], function(err) {
    if (err) {
        console.error(err);
        process.exit(-1);
    } else {
        process.exit(0);
    }
});
