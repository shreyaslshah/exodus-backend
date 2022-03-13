require("dotenv").config();
const express = require("express");

const cors = require("cors");
const InitiateMongoServer = require("./config/db");
const whole = require("./routes/whole.js");
const team = require("./routes/team.js");
const user = require('./routes/authRoute');

InitiateMongoServer();

const app = express();

app.use(
  cors({
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.json("helllo");
});

app.use("/api", whole);
app.use("/api/team",team);
app.use("/api/auth",user);

app.listen(PORT, (req, res) => {
  console.log(`Server Started at PORT ${PORT}`);
});
