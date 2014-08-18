# json-validation

Track the textual position of json/yaml elements within a text, and validate a json against a JSON schema, with column and row error reporting

## Getting Started
### On the server
Install the module with: `npm install source-processor`

```javascript
var json-validation = require('source-processor');
source-processor.awesome(); // "awesome"
```

### In the browser
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/firebase/json-validation/master/dist/json-validation.min.js
[max]: https://raw.github.com/firebase/json-validation/master/dist/json-validation.js

In your web page:

```html
<script src="dist/json-validation.min.js"></script>
<script>
awesome(); // "awesome"
</script>
```

In your code, you can attach json-validation's methods to any object.

```html
<script>
var exports = Yeoman.utils;
</script>
<script src="dist/json-validation.min.js"></script>
<script>
Yeoman.utils.awesome(); // "awesome"
</script>
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" subdirectory as they are generated via Grunt. You'll find source code in the "lib" subdirectory!_

## Release History
_(Nothing yet)_

## License
 
 Copyright (c) 2014 Firebase. Licensed under the MIT license.
