var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
require('source-map-support').install();
var js_yaml = require("./js-yaml.js");
var json_parser = require('./json-parser.js');

var collections = require("./util/Collections");
var error = require('./error');

var Position = (function () {
    function Position(line, column) {
        this.line = line;
        this.column = column;
    }
    return Position;
})();
exports.Position = Position;

var SourceFile = (function () {
    function SourceFile(text) {
        this.text = text;
    }
    SourceFile.prototype.getLineColumn = function (position) {
        return new Position(1, 0);
    };
    return SourceFile;
})();
exports.SourceFile = SourceFile;
var current_text;

var TextLocation = (function () {
    function TextLocation(position) {
        this.position = position;
        if (current_text != null) {
            var lineCol = current_text.getLineColumn(position);
            this.col = lineCol.column;
            this.row = lineCol.line;
        } else {
            console.error("no text document defined, this better running during testing!!!");
        }
    }
    return TextLocation;
})();
exports.TextLocation = TextLocation;

var TextSpan = (function () {
    function TextSpan() {
        this.text = current_text;
    }
    TextSpan.prototype.setStart = function (position) {
        this.start = new TextLocation(position);
    };
    TextSpan.prototype.setEnd = function (position) {
        this.end = new TextLocation(position);
    };

    TextSpan.prototype.source = function () {
        return this.text.text.slice(this.start.position, this.end.position);
    };
    return TextSpan;
})();
exports.TextSpan = TextSpan;

(function (JType) {
    JType[JType["JBoolean"] = 0] = "JBoolean";
    JType[JType["JNumber"] = 1] = "JNumber";
    JType[JType["JString"] = 2] = "JString";
    JType[JType["JNull"] = 3] = "JNull";

    JType[JType["JValue"] = 4] = "JValue";
    JType[JType["JArray"] = 5] = "JArray";
    JType[JType["JObject"] = 6] = "JObject";
})(exports.JType || (exports.JType = {}));
var JType = exports.JType;

var JValue = (function (_super) {
    __extends(JValue, _super);
    function JValue(type) {
        _super.call(this);
        this.type = type;
    }
    JValue.prototype.castError = function (target) {
        return error.message([
            "Type error",
            this.source(),
            "cannot be cast from " + JType[this.type] + " to " + JType[target]
        ].join("\n")).on(new Error());
    };

    JValue.prototype.cast = function (target) {
        if (this.type == target) {
            return this;
        } else {
            throw this.castError(target);
        }
    };

    JValue.prototype.has = function (property_name) {
        return false;
    };

    JValue.prototype.getOrThrow = function (property_name, error_msg) {
        throw error.message(this + " is not an object -- " + error_msg).on(new Error());
    };

    JValue.prototype.asString = function () {
        return this.cast(2 /* JString */);
    };
    JValue.prototype.asObject = function () {
        return this.cast(6 /* JObject */);
    };
    JValue.prototype.asArray = function () {
        return this.cast(5 /* JArray */);
    };
    JValue.prototype.asBoolean = function () {
        return this.cast(0 /* JBoolean */);
    };
    JValue.prototype.asNumber = function () {
        return this.cast(1 /* JNumber */);
    };
    JValue.prototype.coerceString = function () {
        return this.cast(2 /* JString */);
    };

    JValue.prototype.toJSON = function () {
        throw error.message("not implemented").on(new Error());
    };

    JValue.prototype.toString = function () {
        return JSON.stringify(this.toJSON());
    };

    JValue.prototype.lookup = function (data_path) {
        if (data_path[0] == "")
            data_path.shift();
        if (data_path.length == 0)
            return this;
        var child_lookup = data_path.shift();
        if (this.has(child_lookup)) {
            return this.getOrThrow(child_lookup, "").lookup(data_path);
        } else {
            throw error.source(this).message("has no property '" + child_lookup + "'").on(new Error());
        }
    };
    return JValue;
})(TextSpan);
exports.JValue = JValue;

var JLiteral = (function (_super) {
    __extends(JLiteral, _super);
    function JLiteral(type, value, start, end) {
        _super.call(this, type);
        this.type = type;
        this.value = value;
        this.start = new TextLocation(start);
        this.end = new TextLocation(end);
    }
    JLiteral.prototype.toJSON = function () {
        return this.value;
    };
    return JLiteral;
})(JValue);
exports.JLiteral = JLiteral;

var JBoolean = (function (_super) {
    __extends(JBoolean, _super);
    function JBoolean(value, start, end) {
        _super.call(this, 0 /* JBoolean */, value, start, end);
    }
    JBoolean.prototype.coerceString = function () {
        return new JString(this.value + "", this.start.position, this.end.position);
    };
    return JBoolean;
})(JLiteral);
exports.JBoolean = JBoolean;

var JNumber = (function (_super) {
    __extends(JNumber, _super);
    function JNumber(value, start, end) {
        _super.call(this, 1 /* JNumber */, value, start, end);
    }
    return JNumber;
})(JLiteral);
exports.JNumber = JNumber;

var JString = (function (_super) {
    __extends(JString, _super);
    function JString(value, start, end) {
        _super.call(this, 2 /* JString */, value, start, end);
    }
    JString.prototype.getString = function () {
        return this.value;
    };
    return JString;
})(JLiteral);
exports.JString = JString;

var JNull = (function (_super) {
    __extends(JNull, _super);
    function JNull(start, end) {
        _super.call(this, 3 /* JNull */, null, start, end);
    }
    return JNull;
})(JLiteral);
exports.JNull = JNull;

var JArray = (function (_super) {
    __extends(JArray, _super);
    function JArray() {
        _super.call(this, 5 /* JArray */);
        this.elements = new collections.LinkedList();
    }
    JArray.prototype.push = function (val) {
        this.elements.add(val);
    };

    JArray.prototype.forEach = function (callback) {
        this.elements.forEach(function (val) {
            callback(val);
            return true;
        });
    };
    JArray.prototype.forEachIndexed = function (callback) {
        var counter = 0;
        this.elements.forEach(function (val) {
            callback(val, counter++);
            return true;
        });
    };

    JArray.prototype.toJSON = function () {
        var value_array = [];
        this.forEach(function (val) {
            value_array.push(val.toJSON());
        });
        return value_array;
    };
    return JArray;
})(JValue);
exports.JArray = JArray;

function toKey(key) {
    return new JString(key, 0, 0);
}

var JObject = (function (_super) {
    __extends(JObject, _super);
    function JObject() {
        _super.call(this, 6 /* JObject */);
        this.properties = new collections.Dictionary();
    }
    JObject.prototype.put = function (key, val) {
        this.properties.setValue(key, val);
    };

    JObject.prototype.getOrThrow = function (property_name, error_msg) {
        if (this.has(property_name)) {
            return this.properties.getValue(toKey(property_name));
        } else {
            throw error.message(error_msg).on(new Error());
        }
    };

    JObject.prototype.getOrNull = function (property_name) {
        if (this.has(property_name)) {
            return this.properties.getValue(toKey(property_name));
        } else {
            return null;
        }
    };

    JObject.prototype.getOrWarn = function (property_name, warn_msg) {
        if (this.has(property_name)) {
            return this.properties.getValue(toKey(property_name));
        } else {
            console.error("Warning: " + this.source() + " " + warn_msg);
            return null;
        }
    };

    JObject.prototype.has = function (property_name) {
        return this.properties.containsKey(toKey(property_name));
    };

    JObject.prototype.forEach = function (callback) {
        this.properties.forEach(function (key, val) {
            callback(key, val);
        });
    };

    JObject.prototype.toJSON = function () {
        var value_object = {};
        this.properties.forEach(function (key, val) {
            value_object[key.value] = val.toJSON();
        });
        return value_object;
    };
    return JObject;
})(JValue);
exports.JObject = JObject;

function parse(text) {
    current_text = new SourceFile(text);
    return json_parser.parse(text);
}
exports.parse = parse;

function parse_yaml(text) {
    current_text = new SourceFile(text);
    var plain_json = js_yaml.load(text, 'utf8');

    return js_yaml.loader.last_popped;
}
exports.parse_yaml = parse_yaml;

function parse_yaml_collection(text, callback) {
    js_yaml.loadAll(text, function (json) {
        callback(exports.parse(JSON.stringify(json)));
    }, 'utf8');
}
exports.parse_yaml_collection = parse_yaml_collection;
//# sourceMappingURL=source-processor.js.map
