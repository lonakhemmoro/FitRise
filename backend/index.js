//#region Setup
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { pool } = require("./dbPool");
const globalErrorHandler = require("./middleware/globalErrorHandler");
//const jwt = require("jsonwebtoken");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_PARSER_KEY));

const PORT = 8080;
app.listen(PORT, () => console.log(`API active on http://localhost:${PORT}`));

//#endregion

app.use("/auth", require("./routes/auth"));
app.use("/users/me", require("./routes/users-me"));
app.use("/users/:userID", require("./routes/users-id"));
app.use("/users", require("./routes/users"));
app.use("/debug", require("./routes/debug"));

app.get("/rewards", async (req, res) => {
  await pool
    .query("SELECT * FROM rewards")
    .then((rows) => res.send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

//Global Error handling middleware
app.use(globalErrorHandler);
