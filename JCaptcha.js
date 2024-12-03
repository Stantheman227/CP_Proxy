import jCaptcha from "jCaptcha";

let myCaptcha = new jCaptcha({
  el: ".jCaptcha",
  canvasClass: "jCaptchaCanvas",
  canvasStyle: {
    // required properties for captcha stylings:
    width: 100,
    height: 15,
    textBaseline: "top",
    font: "15px Arial",
    textAlign: "left",
    fillStyle: "#ddd",
  },
  // set callback function for success and error messages:
  callback: (response, $captchaInputElement, numberOfTries) => {
    if (response == "success") {
      // success handle, e.g. continue with form submit
    }
    if (response == "error") {
      // error handle, e.g. add error class to captcha input

      if (numberOfTries === 3) {
        // maximum attempts handle, e.g. disable form
      }
    }
  },
});

// Trigger validation on form submit
document.querySelector("#captcha-form").addEventListener("submit", (event) => {
  event.preventDefault(); // Prevent form submission
  myCaptcha.validate(); // Validate the CAPTCHA input
});
