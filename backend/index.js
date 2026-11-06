require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
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

const crendentials = mongoose.model("credentials", {}, "bulkmail");

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
  try {
    const data = await crendentials.find();

    if (data.length === 0) {
      return res
        .status(500)
        .json({ success: false, error: "Mail credentials not found." });
    }

    const user = data[0].toJSON().user;
    const pass = data[0].toJSON().pass;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: user, pass: pass },
    });

    for (var i = 0; i < emailList.length; i++) {
      await transporter.sendMail({
        from: user,
        to: emailList[i],
        subject: subject.trim(),
        text: message.trim(),
      });
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
