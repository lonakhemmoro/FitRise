const express = require("express");
const router = express.Router();
const { pool } = require("../dbPool");

//#region Daily Activities
router.post("/dailyactivity", async (req, res) => {
  const { goalArr, userID, goalTypeID } = req.body;
  if (!userID) return res.sendStatus(400);

  let errOccured = false;

  for (let i = 0; i < goalArr.length; i++) {
    const element = goalArr[i];

    const goalQuery = `(DEFAULT, ${userID}, ${goalTypeID}, '${element.goal.date}', ${element.goal.value}, '${element.goal.status}', 0)`;

    let dailyQuery = "";
    const subquery = `SELECT id FROM goals WHERE userID = ${userID} AND goalTypeID = ${goalTypeID} ORDER BY id DESC LIMIT 1`;
    element.daily.forEach((element) => {
      dailyQuery += `(${userID}, ${goalTypeID}, (${subquery}), '${element.date}', ${element.value}), `;
    });
    dailyQuery = dailyQuery.substring(0, dailyQuery.lastIndexOf(","));
    //console.log(dailyQuery);

    await pool.query(`INSERT INTO goals VALUES ` + goalQuery).catch((err) => {
      console.log(err);
      errOccured = true;
    });
    await pool
      .query(`INSERT INTO daily_activity VALUE ` + dailyQuery)
      .catch((err) => {
        console.log(err);
        errOccured = true;
      });
  }

  if (errOccured) return res.sendStatus(500);
  else return res.sendStatus(201);
});
//#endregion

//#region Users
router.get("/users/:userID", async (req, res) => {
  const { userID } = req.params;

  await pool
    .query(
      `
      SELECT * 
      FROM users
      WHERE id = ?
      `,
      [userID]
    )
    .then((rows) => res.status(200).send({ user: rows[0][0] }))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

router.patch("/users/:userID", async (req, res) => {
  const { userID } = req.params;
  const {
    email,
    password,
    username,
    birthdate,
    gender,
    weight,
    height,
    points,
    fname,
    lname,
  } = req.body;

  const arr2 = [];
  let stringQuery = "UPDATE users SET ";
  stringQuery += updateAdder(email, "email", arr2);
  stringQuery += updateAdder(password, "password", arr2);
  stringQuery += updateAdder(username, "username", arr2);
  stringQuery += updateAdder(birthdate, "birthdate", arr2);
  stringQuery += updateAdder(gender, "gender", arr2);
  stringQuery += updateAdder(weight, "weight", arr2);
  stringQuery += updateAdder(height, "height", arr2);
  stringQuery += updateAdder(points, "points", arr2);
  stringQuery += updateAdder(fname, "fname", arr2);
  stringQuery += updateAdder(lname, "lname", arr2);
  stringQuery = stringQuery.substring(0, stringQuery.lastIndexOf(","));
  stringQuery += ` WHERE id = ?`;
  arr2.push(userID);
  await pool
    .query(stringQuery, arr2)
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

function updateAdder(variable, varName, varArr) {
  let str = "";
  if (variable !== undefined) {
    varArr.push(variable);
    str = varName + " = ?, ";
  }
  return str;
}

router.post("/users", async (req, res) => {
  const {
    email,
    password,
    username,
    birthdate,
    gender,
    weight,
    height,
    points,
    fname,
    lname,
  } = req.body;

  /*Because we're still in the debug phase, 
  I don't care if any of these fields are null*/

  const arr = [
    email,
    password,
    username,
    fname,
    lname,
    birthdate,
    gender,
    weight,
    height,
    points,
  ];

  await pool
    .query(
      `INSERT INTO users 
      VALUES (DEFAULT, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      arr
    )
    .then(() => res.sendStatus(201))
    .catch((err) => {
      console.log(err);
      res.status(500).send({ error: err });
    });
});
//#endregion

//#region Streaks
router.get("/streaks/:userID", async (req, res) => {
  const { userID } = req.params;

  await pool
    .query(
      `
      SELECT * FROM streaks
      WHERE userID = ? 
      `,
      [userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

router.post("/streaks", async (req, res) => {
  const { userID, goalTypeID, value } = req.body;

  await pool
    .query(
      `
    INSERT INTO streaks 
    VALUES (?, ?, CURDATE())`,
      [userID, value]
    )
    .then(() => {
      res.sendStatus(201);
    })
    .catch((err) => {
      res.sendStatus(500);
    });
});

router.patch("/streaks", async (req, res) => {
  const { userID, goalTypeID, value } = req.body;

  await pool
    .query(
      `
    UPDATE streaks 
    SET value = ?, lastUpdated = CURDATE()
    WHERE userID = ?`,
      [value, userID]
    )
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});
//#endregion

module.exports = router;
