const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0"; // never "localhost" inside a container

app.get("/", (_req, res) => res.send("Hello from Express on Foundathyon"));

app.listen(port, host, () => console.log(`listening on http://${host}:${port}`));
