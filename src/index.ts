import dotenv from "dotenv";
import server from "./app";

dotenv.config();

const PORT = process.env.PORT!;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
