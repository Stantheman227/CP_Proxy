const express = require("express");
const app = express();
const path = require("path");
const port = 3001;
require("dotenv").config();
const http = require("http");

app.use(express.urlencoded({ extended: false }));

const recaptchaKey = process.env.recaptchaKey;

const ipTracker = new Map(); // {key: clientIP, {address, timestamp, requestCounts[]}}

// Object Constructor for incoming IP requests
function requestingIP(address, timestamp) {
  this.address = address;
  this.timestamp = timestamp;
  this.requestCounts = [];
}

app.post("/verify", (req, res) => {
  const params = new URLSearchParams({
    secret: recaptchaKey,
    response: req.body["g-recaptcha-response"],
  });

  fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    body: params,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        console.log(
          `Successful captcha, message: ${res.body} You will be redirected to the desired origin page.`
        );

        const options = {
          host: "localhost",
          port: 3000,
          path: "/",
          method: "GET",
        };
        try {
          //Request to Webserver if the captcha has been successfully solved
          const requestToWeb = http.request(options, (response) => {
            let data = "";
            response.on("data", (chunk) => {
              data = data + chunk.toString();
            });
            response.on("end", () => {
              res.send(data);
              console.log(data);
            });
          });

          requestToWeb.on("error", (error) => {
            console.log("An error", error);
          });
          requestToWeb.end();
        } catch (error) {
          console.error(error);
        }
      } else {
        res.json({ captchaSuccess: false });
      }
    });
});

app.get("/captcha", (req, res) => {
  res.sendFile(path.join(__dirname, `captcha.html`));
});

app.get("/", (req, res) => {
  console.log(recaptchaKey);
  const RPS_LIMIT = 1;
  const clientIP = req.ip;
  const timestamp = Date.now();
  let clientData = ipTracker.get(clientIP);

  const options = {
    host: "localhost",
    port: 3000,
    path: "/",
    method: "GET",
  };

  // check if IP has already been logged
  if (!clientData) {
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
    res.redirect("/captcha");
  } else {
    // If no RPS restrictions are harmed the users might proceed to the origin page
    try {
      const requestToWeb = http.request(options, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data = data + chunk.toString();
        });
        response.on("end", () => {
          res.send(data);
          console.log(data);
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
