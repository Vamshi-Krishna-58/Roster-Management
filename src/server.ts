import { getConfig } from "./config/env";
import { createApp } from "./index";

const config = getConfig();
const port = config.port;
const app = createApp();

app.listen(port, () => {
  console.log(`${config.appName} listening on port ${port}`);
});
