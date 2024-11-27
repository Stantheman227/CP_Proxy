const express = require("express");
const app = express();
const port = 3001;
const http = require("http");

app.get("/", (req, res) => {
  const options = {
    host: "localhost",
    port: 3000,
    path: "/",
    methos: "GET",
  };

  const requestToWeb = http.request(options, (response) => {
    // Request from Proxy to Web to get data instead of redir
    let data = "";
    response.on("data", (chunk) => {
      data = data + chunk.toString();
    });
    response.on("end", () => {
      const body = JSON.parse(data);
      console.log(`Logging body at the end of the GET request ${body}`);
    });
  });

  console.dir(`Incoming Request from IP : ${req.ip}`);

  requestToWeb.on("error", (error) => {
    console.log("An error", error);
  });
  requestToWeb.end();
});

app.listen(port, () => {
  console.log(`Proxy is running on port ${port}`);
});
