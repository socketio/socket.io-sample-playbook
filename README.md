# Socket.IO Ansible playbook

This repository contains an Ansible playbook to set up a basic Socket.IO application.

- [Usage](#usage)
- [How to deploy on AWS](#how-to-deploy-on-aws)
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

## How to deploy on AWS

- clone this repository

```
$ git clone git@github.com:socketio/socket.io-sample-playbook.git
```

- create an EC2 instance with the [AWS console](https://aws.amazon.com/console/)

- create a `dev` inventory file with the following content:

```
app01 ansible_host=<public IP address of your instance> ansible_user=ubuntu ansible_ssh_private_key_file=<private key file>

[app]
app01
```

Reference: https://docs.ansible.com/ansible/latest/user_guide/intro_inventory.html

- and then run

```
$ make I=dev install
```

You can then check the status of your application on the instance:

```
$ ssh ubuntu@<public IP address of your instance>

$ service my-app status
● my-app.service - A sample Socket.IO application
     Loaded: loaded (/etc/systemd/system/my-app.service; enabled; vendor preset: enabled)
     Active: active (running)
   Main PID: 437 (node)
      Tasks: 22 (limit: 1143)
     Memory: 68.9M
        CPU: 414ms
     CGroup: /system.slice/my-app.service
             ├─437 /usr/bin/node /apps/my-app/src/index.js
             └─712 /usr/bin/node /apps/my-app/src/index.js

$ sudo tail /var/log/my-app/app.log

2022-09-26T09:06:42.422Z Worker 712: 0 connected client(s)
2022-09-26T09:06:47.427Z Worker 712: 0 connected client(s)
2022-09-26T09:06:52.433Z Worker 712: 0 connected client(s)
2022-09-26T09:06:57.432Z Worker 712: 0 connected client(s)
2022-09-26T09:07:02.438Z Worker 712: 0 connected client(s)
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
