// json_pp.js
//
// pretty-prints stdin to stdout
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

async.waterfall([
    function(callback) {
        var data = "";
        process.stdin.setEncoding('utf8');

        process.stdin.on('data', function(chunk) {
            data = data + chunk;
        });

        process.stdin.on('end', function() {
            callback(null, data);
        });

        process.stdin.on('error', function(err) {
            callback(err, null);
        });

        process.stdin.resume();
    },
    function(data, callback) {
        try {
            callback(null, JSON.parse(data));
        } catch (err) {
            callback(err, null);
        }
    },
    function(value, callback) {
        process.stdout.setEncoding('utf8');
        process.stdout.write(JSON.stringify(value, null, 2));
    }
], function(err) {
    if (err) {
        console.error(err);
    }
});
