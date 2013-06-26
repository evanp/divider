// checkactivity.js
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
    assert = require("assert"),
    async = require("async"),
    argv = require("optimist")
        .usage("Usage: $0 <file>")
        .check(function(argv) { return _.isArray(argv._) && argv._.length == 1; })
        .argv;

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

assert.isObject = function(obj, msg) {
    assert.ok(_.isObject(obj), msg);
};

assert.isFalse = function(obj, msg) {
    assert.ok(!!!obj, msg);
};

assert.include = function(obj, prop, msg) {
    assert.ok(_.has(obj, prop), msg);
};

assert.isString = function(obj, msg) {
    assert.ok(_.isString(obj), msg);
};

assert.isNumber = function(obj, msg) {
    assert.ok(_.isNumber(obj), msg);
};

assert.isArray = function(obj, msg) {
    assert.ok(_.isArray(obj), msg);
};

var validDate = function(dt, name) {
    assert.isString(dt, name + " must be a string");
};

var validURI = function(uri, name) {
    assert.isString(uri, name + " must be a string");
};

var validActivity = function(act) {

    assert.isObject(act, "Activity is not an object");

    validActivityObject(act.actor, "actor");

    if (_.has(act, "content")) {
        assert.isString(act.content, "Content must be a string");
    }

    if (_.has(act, "generator")) {
        validActivityObject(act.generator, "generator");
    }

    if (_.has(act, "icon")) {
        validMediaLink(act.icon, "icon");
    }

    if (_.has(act, "id")) {
        validURI(act.id);
    } else {
        assert.isString(act.url, "Must have ID or url");
    }

    // XXX: spec says SHOULD have an object; I think it's a must

    validActivityObject(act.object, "object");

    validDate(act.published);

    if (_.has(act, "provider")) {
        validActivityObject(act.provider, "provider");
    }

    if (_.has(act, "target")) {
        validActivityObject(act.target, "target");
    }

    if (_.has(act, "title")) {
        assert.isString(act.title, "Title must be a string.");
    }

    if (_.has(act, "updated")) {
        validDate(act.updated, "updated");
    }

    if (_.has(act, "url")) {
        validURI(act.url, "url");
    }

    if (_.has(act, "verb")) {
        assert.isString(act.verb, "Verb must be a string.");
    }
};

var validActivityObject = function(obj, name) {

    assert.isObject(obj, name + " must be an object");

    if (_.has(obj, "attachments")) {
        assert.isArray(obj.attachments, "Attachments must be an array.");
        _.each(obj.attachments, function(attachment, i) {
            validActivityObject(attachment, name + ".attachments["+i+"]");
        });
    }

    if (_.has(obj, "author")) {
        validActivityObject(obj.author, name + ".author");
    }

    if (_.has(obj, "content")) {
        assert.isString(obj.content, name + ".content must be a string.");
    }

    if (_.has(obj, "displayName")) {
        assert.isString(obj.displayName, name + ".displayName must be a string");
    } else {
        assert.ok(_.has(obj, "objectType"), name + " has no displayName and no objectType");
    }

    if (_.has(obj, "downstreamDuplicates")) {
        assert.isArray(obj.downstreamDuplicates, name + ".downstreamDuplicates must be an array");
        _.each(obj.downstreamDuplicates, function(dupe, i) {
            validURI(dupe, name + ".downstreamDuplicates["+i+"]");
        });
    }

    if (_.has(obj, "id")) {
        validURI(obj.id, name + ".id");
    } else {
        assert.include(obj, "url", name + " has no ID or URL.");
    }

    if (_.has(obj, "image")) {
        validMediaLink(obj.image, name + ".image");
    }

    assert.isString(obj.objectType, name + " must have a type");

    if (_.has(obj, "published")) {
        validDate(obj.published, name + ".published");
    }

    if (_.has(obj, "summary")) {
        assert.isString(obj.summary, name + ".summary is not a string");
    }

    if (_.has(obj, "updated")) {
        validDate(obj.updated, name + ".updated");
    }

    if (_.has(obj, "upstreamDuplicates")) {
        assert.isArray(obj.upstreamDuplicates, name + ".upstreamDuplicates must be an array");
        _.each(obj.upstreamDuplicates, function(dupe, i) {
            validURI(dupe, name + ".upstreamDuplicates["+i+"]");
        });
    }

    if (_.has(obj, "url")) {
        validURI(obj.url, name + ".url");
    }
};

var validMediaLink = function(ml, name) {
    assert.isObject(ml, name + " must be an object");
    assert.include(ml, "url", name + " must have an URL.");
    assert.isString(ml.url, name + ".url must be a string");
    if (_.has(ml, "width")) {
        assert.isNumber(ml.width, name + ".width must be a number");
    }
    if (_.has(ml, "height")) {
        assert.isNumber(ml.height, name + ".height must be a number");
    }
    if (_.has(ml, "duration")) {
        assert.isNumber(ml.duration, name + ".duration must be a number");
    }
};

var main = function(argv) {
    walk(argv._[0],
         function(fname, callback) {
             async.waterfall([
                 function(callback) {
                     fs.readFile(fname, {encoding: "utf8"}, callback);
                 },
                 function(buf, callback) {
                     var obj;
                     try {
                         obj = JSON.parse(buf);
                         validActivity(obj);
                     } catch (err) {
                         console.error(new Error(fname + ": " + err.message));
                     }
                     callback(null);
                 }
             ], callback);
         },
         function(err) {
             if (err) {
                 console.trace(err);
                 process.exit(-1);
             } else {
                 process.exit(0);
             }
         }
        );
};

main(argv);
