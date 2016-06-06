# lipstick

> Sticky sessions for Node.js clustering done responsibly

# what is it?

This module provides sticky sessions for Node.js at the cluster level, routing requests to the underlying workers by producing hashes very quickly.

This module is an alternative to [sticky-session][4], usually most useful when running [Socket.IO >= `1.0.0`][5]. Remember to also set up the [socket.io-redis][6] adapter!

# inspiration

This module is inspired on the suggestions outlined by [elad][1] in their [`node-cluster-socket.io`][2] repository. All credit goes to them.

I built upon the idea by adding support for IPv6, and attempted to streamline the implementation as much as possible for the `lipstick` consumers so that only minimal changes to your application are needed.

# requirements

- Node.js >= `0.12.x` for `pauseOnConnect`

# install

```shell
npm install lipstick --save
```

# usage

To use `lipstick`, your master has to communicate with their workers effectively.

### master

Here's a ready to use production-grade `cluster.js` file. It will listen on port `PORT` as defined in your environment variables. It will use `app.js` as your worker process and spawn [`os.cpus().length`][3] workers, or `2` of them, whichever is bigger. It will also route messages to the workers based on a hash of their IP address, applying the stickiness.

```js
require('lipstick')();
```

### master api

The API for your `cluster.js` module is detailed below.

# `lipstick(appfile?, options?, done?)`

The `appfile` defaults to `./app.js` and will be used as the worker process. Options are detailed below.

Option    | Description
----------|---------------------------------------------------------------------------------
`port`    | The port your application listens on
`workers` | The amount of workers your cluster should spawn

### workers

You'll have to make a slight modification in your `app.js` workers. Just change the following line:

```js
app.listen(port, cb);
```

To the `lipstick` equivalent shown below:

```js
require('lipstick').listen(app, port, cb);
```

This will allow `lipstick` to patch your worker processes. `node app` will work as usual.

# license

MIT

[1]: https://github.com/elad
[2]: https://github.com/elad/node-cluster-socket.io
[3]: https://nodejs.org/api/os.html#os_os_cpus
[4]: https://github.com/indutny/sticky-session
[5]: https://github.com/Automattic/socket.io
[6]: https://github.com/Automattic/socket.io-redis
