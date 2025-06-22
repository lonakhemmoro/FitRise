//#region Setup
const express = require("express");
const cors = require("cors");
const PORT = 8080;

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.listen(PORT, () => console.log(`API active on http://localhost:${PORT}`));

const mysql = require("mysql2");
const pool = mysql
  .createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "fitrise_v1",
  })
  .promise();
//#endregion

//#region Debug
app.post("/debug/dailyactivity/", async (req, res) => {
  const { goalArr, dailyArr, userID, goalTypeID } = req.body;

  console.log(userID);
  if (userID === undefined || userID === "") {
    res.sendStatus(400);
    return;
  }

  let goalQueryString = "";
  goalArr.forEach((element) => {
    goalQueryString += `(DEFAULT, ${userID}, ${goalTypeID}, '${element.date}', ${element.value}, '${element.status}'), `;
  });
  goalQueryString = goalQueryString.substring(
    0,
    goalQueryString.lastIndexOf(",")
  );

  //console.log(goalQueryString);

  let dailyQueryString = "";
  dailyArr.forEach((element) => {
    dailyQueryString += `(${userID}, ${goalTypeID}, '${element.date}', ${element.value}), `;
  });
  dailyQueryString = dailyQueryString.substring(
    0,
    dailyQueryString.lastIndexOf(",")
  );

  /*
  await pool
    .query(`INSERT INTO goals VALUES ` + goalQueryString)
    .then(() => res.sendStatus(201))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
    */
  try {
    await pool.query(`INSERT INTO goals VALUES ` + goalQueryString);
    await pool.query(`INSERT INTO daily_activity VALUES ` + dailyQueryString);

    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.get("/debug/users/:userID", async (req, res) => {
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

app.patch("/debug/users/:userID", async (req, res) => {
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
  stringQuery = stringQuery.substring(0, stringQuery.lastIndexOf(","));
  stringQuery += ` WHERE id = ?`;
  arr2.push(userID);
  console.log("Test");
  await pool
    .query(stringQuery, arr2)
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.post("/debug/users", async (req, res) => {
  const {
    email,
    password,
    username,
    birthdate,
    gender,
    weight,
    height,
    points,
  } = req.body;

  //TODO: Validate all these fields

  /*Because we're still in the debug phase, 
  I don't care if any of these fields are null*/
  const arr = [
    email,
    password,
    username,
    birthdate,
    gender,
    weight,
    height,
    points,
  ];

  console.log(arr);

  await pool
    .query(
      `INSERT INTO users 
      VALUES (DEFAULT, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      arr
    )
    .then(() => res.sendStatus(201))
    .catch((err) => {
      console.log(err);
      res.status(500).send({ error: err });
    });

  //TODO: Return the userID as a cookie
});

app.post("/debug/streaks/", async (req, res) => {
  const { userID, goalTypeID, value } = req.body;

  await pool
    .query(
      `
    INSERT INTO streaks 
    VALUES (?, ?, ?)`,
      [userID, goalTypeID, value]
    )
    .then(() => {
      res.sendStatus(201);
    })
    .catch((err) => {
      res.sendStatus(500);
    });
});

app.patch("/debug/streaks/", async (req, res) => {
  const { userID, goalTypeID, value } = req.body;

  await pool
    .query(
      `
    UPDATE streaks 
    SET value = ?
    WHERE userID = ? AND goalTypeID = ?`,
      [value, userID, goalTypeID]
    )
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.post("/debug/login", async (req, res) => {
  //Placeholder
  //Doesn't validate anything

  const { username } = req.body;

  let dbRow = "";
  await pool
    .query("SELECT id, username FROM users WHERE username = ?", [username])
    .then((rows) => {
      dbRow = rows[0];
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });

  if (dbRow.length === 0) {
    res.sendStatus(404);
    return;
  }

  if (username === dbRow[0].username) {
    res.status(200).send({ userID: dbRow[0].id });
  }
});

//#endregion

//#region Login
app.post("/login", async (req, res) => {
  //FIXME: Doesn't validate anything

  const { email, password } = req.body;

  let dbRow = "";
  await pool
    .query("SELECT id, username, password FROM users WHERE email = ?", [email])
    .then((rows) => {
      dbRow = rows[0];
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });

  if (dbRow.length === 0) {
    res.sendStatus(404);
    return;
  }

  //TODO: hash the password
  if (password === dbRow[0].password) {
    res.status(200).send({ userID: dbRow[0].id });
  } else {
    res.sendStatus(404);
  }
});

//#endregion

//#region Users
app.get("/users/:userID", async (req, res) => {
  const { userID } = req.params;

  await pool
    .query(
      `
      SELECT id, username, birthdate, gender, weight, height, activityLevelID, points 
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

app.post("/users", async (req, res) => {
  const {
    email,
    password,
    username,
    birthdate,
    gender,
    weight,
    height,
    activityLevel,
  } = req.body;

  //TODO: Validate all these fields

  /*Because we're still in the debug phase, 
  I don't care if any of these fields are null*/
  const arr = [
    email,
    password,
    username,
    birthdate,
    gender,
    weight,
    height,
    activityLevel,
  ];

  await pool
    .query(
      `INSERT INTO users 
      VALUES (DEFAULT, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      arr
    )
    .then(() => res.sendStatus(201))
    .catch((err) => {
      res.status(500).send({ error: err });
    });

  //TODO: Return the userID as a cookie
});

app.patch("/users/:userID", async (req, res) => {
  const { userID } = req.params;
  const { username, birthdate, gender, weight, height, activityLevel } =
    req.body;

  const arr2 = [];
  let stringQuery = "UPDATE users SET ";
  stringQuery += updateAdder(username, "username", arr2);
  stringQuery += updateAdder(birthdate, "birthdate", arr2);
  stringQuery += updateAdder(gender, "gender", arr2);
  stringQuery += updateAdder(weight, "weight", arr2);
  stringQuery += updateAdder(height, "height", arr2);
  stringQuery += updateAdder(activityLevel, "activityLevelID", arr2);
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

app.patch("/users/:id/password", async (req, res) => {
  //Password should be a different endpoint
  //TODO: password
});

app.patch("/users/:id/email", async (req, res) => {
  //Email should be a different endpoint
  //TODO: email
});

app.get("/users/:userID/points", async (req, res) => {
  const { userID } = req.params;

  await pool
    .query("SELECT points FROM users WHERE id = ?", [userID])
    .then((rows) => {
      console.log(rows);
      res.status(200).send(rows[0]);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.patch("/users/:userID/points", async (req, res) => {
  const { id: userID } = req.params;
  const { points } = req.body;
  //How many points are you adding to the user's points value?

  await pool
    .query("UPDATE users SET points = points + ? WHERE id = ?", [
      points,
      userID,
    ])
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});
//#endregion

//#region DailyActivities
app.get("/users/:userID/daily-activities/:goalTypeID", async (req, res) => {
  const { userID, goalTypeID } = req.params;

  await pool
    .query(
      `SELECT * FROM daily_activity
      WHERE userID = ? AND goalTypeID = ?
      ORDER BY date DESC`,
      [userID, goalTypeID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.get(
  "/users/:userID/daily-activities/:goalTypeID/latest",
  async (req, res) => {
    const { userID, goalTypeID } = req.params;

    await pool
      .query(
        `SELECT * FROM daily_activity
      WHERE userID = ? AND goalTypeID = ?
      ORDER BY date DESC
      LIMIT 1`,
        [userID, goalTypeID]
      )
      .then((rows) => res.status(200).send(rows[0]))
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

app.post("/users/:userID/daily-activities/:goalTypeID", async (req, res) => {
  const { userID, goalTypeID } = req.params;
  const { value } = req.body;

  await pool
    .query(
      `INSERT INTO daily_activity
      VALUES (?, ?, CURDATE(), ?)`,
      [userID, goalTypeID, value]
    )
    .then(() => res.sendStatus(201))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.patch("/users/:userID/daily-activities/:goalTypeID", async (req, res) => {
  const { userID, goalTypeID } = req.params;
  const { value } = req.body;

  await pool
    .query(
      `UPDATE daily_activity
      SET value = value + ?
      WHERE userID = ? AND goalTypeID = ? AND date = CURDATE()`,
      [value, userID, goalTypeID]
    )
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});
//#endregion

//#region Streaks
app.get("/users/:userID/streaks", async (req, res) => {
  const { userID } = req.params;

  await pool
    .query("SELECT goalTypeID, value FROM streaks WHERE userID = ?", [userID])
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.get("/users/:userID/streaks/:goalTypeID", async (req, res) => {
  const { userID, goalTypeID } = req.params;

  await pool
    .query(
      "SELECT goalTypeID, value FROM streaks WHERE userID = ? AND goalTypeID = ?",
      [userID, goalTypeID]
    )
    .then((rows) => {
      console.log(rows);
      res.status(200).send(rows[0]);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.post("/users/:userID/streaks/:goalTypeID", async (req, res) => {
  const { userID, goalTypeID } = req.params;

  await pool
    .query("INSERT INTO streaks VALUES (?, ?, 0)", [userID, goalTypeID])
    .then(() => res.sendStatus(201))
    .catch((err) => res.status(500).send(err));
});

app.patch("/users/:userID/streaks/:goalTypeID", async (req, res) => {
  //Increases a user's streak by 1

  const { userID, goalTypeID } = req.params;

  await pool
    .query(
      "UPDATE streaks SET value = value + 1 WHERE userID = ? AND goalTypeID = ?",
      [userID, goalTypeID]
    )
    .then(() => res.sendStatus(200))
    .catch((err) => res.status(500).send(err));
});
//#endregion

//#region Goals
app.get("/users/:userID/goals", async (req, res) => {
  const { userID } = req.params;

  await pool
    .query(
      `
      SELECT g.*, gt.name as "goalTypeName" 
      FROM goals g
        JOIN goal_type gt ON g.goalTypeID = gt.id 
      WHERE userID = ? 
      ORDER BY date desc `,
      [userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.get("/users/:userID/goals/:goalTypeID", async (req, res) => {
  const { userID, goalTypeID } = req.params;

  await pool
    .query(
      `SELECT * FROM goals 
      WHERE userID = ? AND goalTypeID = ? 
      ORDER BY date desc `,
      [userID, goalTypeID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.get("/users/:userID/goals/:goalTypeID/latest", async (req, res) => {
  const { userID, goalTypeID } = req.params;

  await pool
    .query(
      `SELECT * FROM goals 
      WHERE userID = ? AND goalTypeID = ? 
      ORDER BY date desc 
      LIMIT 1`,
      [userID, goalTypeID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.post("/users/:userID/goals/:goalTypeID", async (req, res) => {
  const { userID, goalTypeID } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    res.sendStatus(400);
    return;
  }

  //TODO: goal status converter
  await pool
    .query(
      `INSERT INTO goals 
      VALUES (DEFAULT, ?, ?, CURDATE(), ?, NULL)`,
      [userID, goalTypeID, value]
    )
    .then(() => res.sendStatus(201))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.patch("/users/:userID/goals/:goalTypeID", async (req, res) => {
  const { userID, goalTypeID } = req.params;
  const { status: goalStatus } = req.body;

  if (goalStatus === undefined) {
    res.sendStatus(400);
    return;
  }

  //TODO: goal status converter
  await pool
    .query(
      `UPDATE goals
      SET status = ?
      WHERE userID = ? AND goalTypeID = ? 
      ORDER BY date DESC
      LIMIT 1`,
      [goalStatus, userID, goalTypeID]
    )
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});
//#endregion

//#region Friends
app.get("/users/:userID/friends", async (req, res) => {
  const { userID } = req.params;

  await pool
    .query(
      `SELECT friendID, u.username 
      FROM friends
        JOIN users u
          ON friendID = u.id
      WHERE userID = ?`,
      [userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.post("/users/:userID/friends", async (req, res) => {
  const { userID } = req.params;
  const { initiatorID } = req.body;

  //In this situation, the userID is that of the receiver

  //Post into the friends table
  await pool
    .query(
      `
    INSERT INTO fitrise_v1.friends
    VALUES (?,?), (?, ?)`,
      [userID, initiatorID, initiatorID, userID]
    )
    .then(() => {
      res.sendStatus(201);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
      return;
    });

  //Delete from friends request table
  await pool
    .query(
      `
      DELETE FROM friend_requests
      WHERE userID = ? AND receiverID = ?`,
      [initiatorID, userID]
    )
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.delete("/users/:userID/friends", async (req, res) => {
  const { userID } = req.params;
  const { friendID } = req.body;

  await pool
    .query(
      `DELETE FROM friends
      WHERE (userID = ? AND friendID = ?) OR (userID = ? AND friendID = ?);`,
      [userID, friendID, friendID, userID]
    )
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});
//#endregion

//#region Friend Requests
app.get("/users/:userID/friend-requests/inbound", async (req, res) => {
  const { userID } = req.params;

  await pool
    .query(
      `SELECT userID, u.username 
      FROM friend_requests
        JOIN users u
          ON userID = u.id
      WHERE receiverID = ?`,
      [userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.get("/users/:userID/friend-requests/outbound", async (req, res) => {
  const { userID } = req.params;

  await pool
    .query(
      `SELECT receiverID, u.username 
      FROM friend_requests
        JOIN users u
          ON receiverID = u.id
      WHERE userID = ?`,
      [userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.post("/users/:userID/friend-requests", async (req, res) => {
  const { userID } = req.params;
  const { receiverID } = req.body;

  //TODO: Make it check if the receiver already sent a friend request to the initiator, MAYBE
  await pool
    .query(
      `
      INSERT INTO friend_requests
      VALUES (?, ?)
      `,
      [userID, receiverID]
    )
    .then(() => res.sendStatus(201))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.delete("/users/:userID/friend-requests", async (req, res) => {
  const { userID } = req.params;
  const { receiverID } = req.body;

  await pool
    .query(
      `
      DELETE FROM friend_requests
      WHERE userID = ? AND receiverID = ?
      `,
      [userID, receiverID]
    )
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

//#endregion
