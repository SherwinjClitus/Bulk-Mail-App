require("dotenv").config();
const express = require("express");
const cors = require("cors");
// const nodemailer = require("nodemailer");
const app = express();
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(function () {
    console.log("Connected to DB");
  })
  .catch(function (error) {
    console.log("Failed to connect to DB", error.message);
  });

// const crendentials = mongoose.model("credentials", {}, "bulkmail");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_NAME = "Bulk Mail App";

// Create a transporter using SMTP
const mailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many requests. Try again later." },
});
app.post("/sendmail", mailLimiter, async function (req, res) {
  var subject = req.body.subject;
  var message = req.body.message;
  var emailList = req.body.emailList;

  // check 0: subject must have text
  if (typeof subject !== "string" || subject.trim() === "") {
    return res
      .status(400)
      .json({ success: false, error: "Subject is required." });
  }
  if (subject.length > 150) {
    return res
      .status(400)
      .json({ success: false, error: "Subject is too long." });
  }

  // check 1: message must have text
  if (!message || message.trim() === "") {
    return res
      .status(400)
      .json({ success: false, error: "Message is required." });
  }

  // check 2: email list must have at least one item
  if (!emailList || emailList.length === 0) {
    return res
      .status(400)
      .json({ success: false, error: "Email list is required." });
  }

  // console.log(message);
  // crendentials
  //   .find()
  //   .then(function (data) {
  //     console.log(data[0].toJSON().user);
  //     const transporter = nodemailer.createTransport({
  //       service: "gmail",
  //       auth: {
  //         user: data[0].toJSON().user,
  //         pass: data[0].toJSON().pass,
  //       },
  //     });
  //     new Promise(async function (resolve, reject) {
  //       try {
  //         for (var i = 0; i < emailList.length; i++) {
  //           await transporter.sendMail({
  //             from: "sherwinjclitus@gmail.com",
  //             to: emailList[i],
  //             subject: "Bulk Mail App Test Msg",
  //             text: message,
  //           });
  //           console.log("Email sent to :" + emailList[i]);
  //         }
  //         resolve("Success");
  //       } catch (error) {
  //         reject("Failed");
  //         console.log(error);
  //       }
  //     })
  //       .then(function () {
  //         res.send(true);
  //       })
  //       .catch(function () {
  //         res.send(false);
  //       });
  //   })
  //   .catch(function (error) {
  //     console.log(error);
  //   });
  if (!BREVO_API_KEY || !SENDER_EMAIL) {
    return res
      .status(500)
      .json({ success: false, error: "Mail service is not configured." });
  }

  try {
    for (var i = 0; i < emailList.length; i++) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: SENDER_EMAIL },
          to: [{ email: emailList[i] }],
          subject: subject.trim(),
          textContent: message.trim(),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(function () {
          return {};
        });
        throw new Error(
          "Brevo " + response.status + ": " + (errorBody.message || "failed"),
        );
      }

      console.log("Email sent to :" + emailList[i]);
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Failed to send emails." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
  console.log("Server Started on port " + PORT + " !!!");
});
