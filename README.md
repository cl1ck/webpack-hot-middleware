# Webpack Hot Socket Server

Webpack hot reloading using only [webpack-dev-middleware](http://webpack.github.io/docs/webpack-dev-middleware.html).
This allows you to add a socket.io hot reloading channel to an existing server.

This module is **only** concerned with the mechanisms to connect a browser client to a webpack server & receive updates. It will subscribe to changes from the server and execute those changes using [webpack's HMR api](http://webpack.github.io/docs/hot-module-replacement-with-webpack.html). Actually making your application capable of using hot reloading to make seamless changes is out of scope, and usually handled by another library.


## Installation & Usage

See [example/](./example/) for an example of usage.

First, install the module:

```sh
npm install --save-dev https://github.com/cl1ck/webpack-hot-socket-server.git
```

Next, enable hot reloading in your webpack config:

 1. Add the following three plugins to the `plugins` array:
    ```js
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ]
    ```

    Occurence ensures consistent build hashes, hot module replacement is
    somewhat self-explanatory, no errors is used to handle errors more cleanly.

 3. Add `'webpack-hot-middleware/client?host=localhost&port=3000'` into the `entry` array.

    This connects to the server to receive notifications when the bundle
    rebuilds and then updates your client bundle accordingly.

Now attach it to your server:

 1. Add `webpack-dev-middleware`
    ```js
    var app = require('express')();
    var server = require('http').Server(app);

    var webpack = require('webpack');
    var webpackConfig = require('./webpack.config');
    var compiler = webpack(webpackConfig);

    app.use(require("webpack-dev-middleware")(compiler, {
        noInfo: true, publicPath: webpackConfig.output.publicPath
    }));
    ```

 2. Add `webpack-hot-socket-server` attached to the same compiler instance
    ```js
    require("webpack-hot-socket-server")(compiler, {
        log: console.log,
        port: 3000
    });
    ```

And you're all set!

### Config

Configuration options can be passed to the client by adding querystring parameters to the path in the webpack config.

```js
'webpack-hot-middleware/client?port=3000&host=localhost&overlay=false'
```

* **port** - The port which the socket.io server is listening to
* **host** - The host which the socket.io server is listening to (if not provided it'll use origin)
* **overlay** - Set to `false` to disable the DOM-based client-side overlay.
* **reload** - Set to `true` to auto-reload the page when webpack gets stuck.
* **noInfo** - Set to `true` to disable informational console logging.
* **quiet** - Set to `true` to disable all console logging.

## How it Works

The middleware installs itself as a webpack plugin, and listens for compiler events.
The server will then publish notifications to connected clients on compiler events.

When the client receives a message, it will check to see if the local code is up to date. If it isn't up to date, it will trigger webpack hot module reloading.

## Troubleshooting

### Use with auto-restarting servers

This module expects to remain running while you make changes to your webpack bundle, if you use a process manager like nodemon then you will likely see very slow changes on the client side. If you want to reload the server component, either use a separate process, or find a way to reload your server routes without restarting the whole process. See https://github.com/glenjamin/ultimate-hot-reloading-example for an example of one way to do this.

### Use with multiple entry points in webpack

If you want to use [multiple entry points in your webpack config](https://webpack.github.io/docs/multiple-entry-points.html) you need to include the hot middleware client in each entry point. This ensures that each entry point file knows how to handle hot updates. See the [examples folder README](example/README.md) for an example.

```js
entry: {
    vendor: ['jquery', 'webpack-hot-middleware/client?port=3000&'],
    index: ['./src/index', 'webpack-hot-middleware/client?port=3000&']
}
```

## License

Based on [webpack-hot-middleware](https://github.com/glenjamin/webpack-hot-middleware) Copyright 2015 Glen Mailer

All Changes since including Oct. 18 2016 Copyright 2016 Michel Hofmann

MIT Licensed.
