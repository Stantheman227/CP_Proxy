const express = require("express");
const app = express();
const port = 3001;
const http = require("http");

const ipTracker = new Map(); // {key: clientIP, {address, timestamp, requestCounts[]}}

// Object Constructor for incoming IP requests
function requestingIP(address, timestamp) {
  this.address = address;
  this.timestamp = timestamp;
  this.requestCounts = [];
}

app.get("/", (req, res) => {
  const RPS_LIMIT = 5;
  const clientIP = req.ip;
  const timestamp = Date.now();
  let clientData = ipTracker.get(clientIP);

  const options = {
    host: "localhost",
    port: 3000,
    path: "/",
    methos: "GET",
  };

  if (!clientData) {
    // check if IP has already been logged
    clientData = new requestingIP(clientIP, timestamp);
    ipTracker.set(clientIP, clientData); // setting up new entry if IP is not known
  }

  // If IP is already known push the current timestamp in the requestCounts Array
  clientData.requestCounts.push(timestamp);

  console.log(
    `Request from IP: ${clientIP}, total requests: ${clientData.requestCounts.length}`
  );

  // Checking amount for current IP's requests in the last second
  if (
    clientData.requestCounts.filter((time) => timestamp - time <= 1000).length >
    RPS_LIMIT
  ) {
    console.log(`Too many requests, please solve the captcha to proceed`);
  } else {
    try {
      const requestToWeb = http.request(options, (response) => {
        // Request from Proxy to Web to get data instead of redir
        let data = "";
        response.on("data", (chunk) => {
          data = data + chunk.toString();
        });
        response.on("end", () => {
          const body = JSON.parse(data);
          console.log(`Logging body at the end of the GET request: ${body}`);
        });
      });

      requestToWeb.on("error", (error) => {
        console.log("An error", error);
      });
      requestToWeb.end();
    } catch (error) {
      console.error(error);
    }
  }
});

app.listen(port, () => {
  console.log(`Proxy is running on port ${port}`);
});
