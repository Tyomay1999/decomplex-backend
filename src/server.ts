import app from "./app";
import { env } from "./config/env";

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`decomplex-backend running on port ${PORT} in ${env.nodeEnv} mode`);
});
