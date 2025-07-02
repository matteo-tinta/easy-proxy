import "./environment";
import { server } from "./server";

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // maybe cleanup here
  // do NOT call process.exit(1); if you want to keep running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // handle the rejection here
});

server()
