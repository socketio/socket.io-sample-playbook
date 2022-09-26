import cluster from "cluster";
import { createServer } from "http";
import { Server } from "socket.io";
import { cpus } from "os";
import { setupMaster, setupWorker } from "@socket.io/sticky";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";

function info(...data) {
  console.log(new Date().toISOString(), ...data);
}

function debug(...data) {
  // console.log(new Date().toISOString(), ...data);
}

if (cluster.isMaster) {
  info(`Master ${process.pid} is running`);

  const httpServer = createServer();

  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });

  setupPrimary();

  httpServer.listen(3000);

  const cpuCount = cpus().length;

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    info(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  info(`Worker ${process.pid} started`);

  const httpServer = createServer();
  const io = new Server(httpServer, {
    adapter: createAdapter(),
  });

  setupWorker(io);

  io.on("connection", async (socket) => {
    debug(`connect ${socket.id}`);

    socket.on("disconnect", (reason) => {
      debug(`disconnect ${socket.id} due to ${reason}`);
    });

    // echo
    socket.onAny((...args) => {
      const lastArg = args[args.length - 1];
      if (typeof lastArg === "function") {
        // remove ack function from the array
        args.pop();
        lastArg.call(null, ...args);
      } else {
        socket.emit.apply(socket, args);
      }
    });
  });

  setInterval(() => {
    info(
      `Worker ${process.pid}: ${io.engine.clientsCount} connected client(s)`
    );
  }, 5000);
}
