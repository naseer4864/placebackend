const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const placeRoute = require("./routes/Places-routes");
const UserRoutes = require("./routes/Users-routes");
const mongoose = require("mongoose");
const HttpError = require("./models/htttp-error");

const app = express();
app.use(cors());

app.use(bodyParser.json());


app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://myplaces.vercel.app");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-with, Content-Type, Accept, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
    next();
  });
  
});

app.use("/api/users", UserRoutes);
app.use("/api/places", placeRoute);

app.use((req, res, next) => {
  const error = new HttpError("Could not find a place", 501);
  return next(error);
});
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  } else {
    res.status(error.code || 500);
    res.json({
      message: error.message || "An unknown error occurred!",
    });
  }
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ntngyam.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(4000);
    console.log("connected to Database");
  })
  .catch((error) => {
    console.log("faild to connect to Database", error);
  });
