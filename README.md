# Socket.IO Ansible playbook

This repository contains an Ansible playbook to set up a basic Socket.IO application.

- [Usage](#usage)
- [Architecture](#architecture)
- [Notes](#notes)
  - [Scaling](#scaling)

## Usage

```
# test the connection to the server (localhost)
$ make I=local ping

# install the Node.js application
$ make I=local install
```

## Architecture

```
/apps/
└── my-app
    ├── package.json
    ├── package-lock.json
    └── src
        └── index.js

# application logs
/var/log/my-app/
└── app.log

# nginx configuration
/etc/nginx/conf.d/my-app.conf

# increase the number of available local ports
/etc/sysctl.d/net.ipv4.ip_local_port_range.conf

# increase the nofile limits for the runner user
/etc/security/limits.d/my-app-limits.conf
```

## Notes

### Scaling

The application uses the Node.js built-in [`cluster`](https://nodejs.org/api/cluster.html) module to create one worker per core.

When using multiple Socket.IO servers, one needs to:

- ensure that all packets of a single session reaches the same node (i.e. sticky sessions)

This is done here with the [`@socket.io/sticky`](https://github.com/socketio/socket.io-sticky) module (the load-balancing is done by the master process).

We could also have used one port per worker, and configure nginx with multiple upstream nodes:

```
upstream nodes {
  hash $remote_addr consistent;

  server localhost:3000;
  server localhost:3001;
  server localhost:3002;
  # ...
}
```

- forward packets between nodes (for broadcasting, for example when calling `io.emit()`)

This is done here with the [`@socket.io/cluster-adapter`](https://github.com/socketio/socket.io-cluster-adapter) module.

If you deploy your application on multiple servers, you will need to use another adapter, like the one based on [Redis](https://socket.io/docs/v4/redis-adapter/) or [Postgres](https://socket.io/docs/v4/postgres-adapter/).

Reference: https://socket.io/docs/v4/using-multiple-nodes/
