import { createServer } from "http";
import startAppAsync from "./app";
import { ENVIRONMENT } from "./environment";

export const server = async () => {
  var app = await startAppAsync();

  const server = createServer(app);

  server.listen(4000, () => {
    console.log(`PROXYING FROM 4000 -> ${ENVIRONMENT.TARGET_SERVER}${ENVIRONMENT.TARGET_BASE_PATH}`)
    console.log(`Ready.`);
  });
};
