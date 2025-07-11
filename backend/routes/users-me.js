const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { pool } = require("../dbPool");

//#region /

router.get("/", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  await pool
    .query(
      `
      SELECT id, fName, lName, username, birthdate, gender, weight, height 
      FROM users
      WHERE id = ?
      `,
      [userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

//TODO: PATCH users/me. I simply don't feel like it rn
router.patch("/", authenticateToken, async (req, res, next) => {
  res.sendStatus(201);
});
//#endregion

//#region daily-activities
router.get("/daily-activities/today", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  await pool
    .query(
      `SELECT da.*, g.value as 'goalValue' FROM daily_activity da
      JOIN goals g ON da.goalID = g.id
      WHERE da.userID = ? AND da.date = CURDATE()`,
      [userID]
    )
    .then((rows) => res.send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

router.get(
  "/daily-activities/:goalTypeID",
  authenticateToken,
  async (req, res) => {
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;

    await pool
      .query(
        `
        SELECT da.*, g.value as goalValue 
        FROM daily_activity da JOIN goals g ON da.goalID = g.id
        WHERE da.userID = ? AND da.goalTypeID = ?
        ORDER BY date DESC`,
        [userID, goalTypeID]
      )
      .then((rows) => res.send(rows[0]))
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

router.get(
  "/daily-activities/:goalTypeID/today",
  authenticateToken,
  async (req, res) => {
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;

    await pool
      .query(
        `
        SELECT da.date, da.value, g.value as goalValue 
        FROM daily_activity da JOIN goals g ON da.goalID = g.id
        WHERE da.userID = ? AND da.date = CURDATE() AND da.goalTypeID = ?`,
        [userID, goalTypeID]
      )
      .then((rows) => res.send(rows[0]))
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

router.post(
  "/daily-activities/:goalTypeID",
  authenticateToken,
  async (req, res) => {
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;
    if (!req.body || !req.body.value) return res.sendStatus(400);
    const { value } = req.body;

    await pool
      .query(
        `
        INSERT INTO daily_activity
        VALUES (?, ?, (SELECT id FROM goals WHERE userID = ? AND goalTypeID = ? ORDER BY date DESC LIMIT 1), CURDATE(), ?)
        `,
        [userID, goalTypeID, userID, goalTypeID, value]
      )
      .then(() => res.sendStatus(201))
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

router.patch(
  "/daily-activities/:goalTypeID",
  authenticateToken,
  async (req, res) => {
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;
    if (!req.body || !req.body.value) return res.sendStatus(400);
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
  }
);
//#endregion

//#region streaks
router.get("/streaks", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  await pool
    .query("SELECT goalTypeID, value FROM streaks WHERE userID = ?", [userID])
    .then((rows) => res.send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.get("/streaks/:goalTypeID", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;
  const { goalTypeID } = req.params;

  await pool
    .query(
      "SELECT goalTypeID, value FROM streaks WHERE userID = ? AND goalTypeID = ?",
      [userID, goalTypeID]
    )
    .then((rows) => {
      res.send(rows[0]);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.post("/streaks/:goalTypeID", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;
  const { goalTypeID } = req.params;

  await pool
    .query("INSERT INTO streaks VALUES (?, ?, 0)", [userID, goalTypeID])
    .then(() => res.sendStatus(201))
    .catch((err) => res.status(500).send(err));
});

router.patch("/streaks/:goalTypeID", authenticateToken, async (req, res) => {
  //Increases a user's streak by 1
  const { id: userID } = req.user;
  const { goalTypeID } = req.params;

  await pool
    .query(
      "UPDATE streaks SET value = value + 1 WHERE userID = ? AND goalTypeID = ?",
      [userID, goalTypeID]
    )
    .then(() => res.sendStatus(200))
    .catch((err) => res.status(500).send(err));
});
//#endregion

//#region points
router.get("/points", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  await pool
    .query(
      `
      SELECT SUM(r.points) + u.extraPoints as totalPoints, COUNT(ur.userID) as rewardCount
        FROM user_rewards ur
        JOIN rewards r ON ur.rewardID = r.id
        JOIN users u ON ur.userID = u.id
        WHERE ur.userID = ?
      `,
      [userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

//Gives the user extra points separate from any rewards they've gained
router.patch("/points", authenticateToken, async (req, res, next) => {
  const { id: userID } = req.user;

  if (!req.body || !req.body.points) return res.sendStatus(400);
  const { points } = req.body;

  await pool
    .query(
      `
      UPDATE users
      SET extraPoints = extraPoints + ?
      WHERE id = ?
      
      `,
      [points, userID]
    )
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});
//#endregion

//#region Friends
router.get("/friends", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  await pool
    .query(
      `
      SELECT IF(userID = ?, friendID, userID) as friendID, u.username 
      FROM friends 
        JOIN users u ON IF(userID = ?, friendID, userID) = u.id
      WHERE userID = ? OR friendID = ?;
      `,
      [userID, userID, userID, userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

router.post("/friends", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  if (!req.body || !req.body.friendID) return res.sendStatus(400);
  const { friendID } = req.body;

  await pool
    .query(
      `
    INSERT INTO friends
    VALUES (?,?)`,
      [friendID, userID]
    )
    .then(() => {
      res.sendStatus(201);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });

  //Delete from friends request table
  await pool
    .query(
      `
      DELETE FROM friend_requests
      WHERE userID = ? AND receiverID = ?`,
      [friendID, userID]
    )
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

router.delete("/friends", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  if (!req.body || !req.body.friendID) return res.sendStatus(400);
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

//#region FriendRequests
router.get("/friend-requests", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  //TODO: Make it return both inbound and outbound
  await pool
    .query(
      `
      SELECT receiverID as 'userID', u.username, 'outbound' as 'which'
      FROM friend_requests JOIN users u ON receiverID = u.id
      WHERE userID = ?
      UNION
      SELECT userID, u.username, 'incoming' as 'which'
      FROM friend_requests JOIN users u ON userID = u.id
      WHERE receiverID = ?;
      `,
      [userID, userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

router.post("/friend-requests", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  if (!req.body || !req.body.receiverID) return res.sendStatus(400);
  const { receiverID } = req.body;

  /*
  Does not check if a friend request was ever sent, and just automatically makes them friends
  TODO: Fix maybe
   */
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

router.delete("/friend-requests", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  if (!req.body || !req.body.receiverID) return res.sendStatus(400);
  const { receiverID } = req.body;

  await pool
    .query(
      `
      DELETE FROM friend_requests
      WHERE userID = ? AND receiverID = ? OR userID = ? AND receiverID = ?
      `,
      [userID, receiverID, receiverID, userID]
    )
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

//#endregion

//#region Rewards
router.get("/rewards", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  await pool
    .query(
      `
      SELECT r.name, r.points FROM user_rewards ur
      JOIN rewards r ON ur.rewardID = r.id
      WHERE userID = ?
      ORDER BY r.id
      `,
      [userID]
    )
    .then((rows) => res.status(200).send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

router.post("/rewards", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

  if (!req.body) return res.sendStatus(400);

  //Determine whether to use the rewardID or rewardName
  //If both are availalble, uses the rewardID
  let queryString = ``;
  let value;
  if (!req.body.rewardID) {
    if (!req.body.rewardName) {
      return res.sendStatus(400);
    } else {
      queryString = `
      INSERT INTO user_rewards
      VALUES (?, (SELECT id FROM rewards WHERE name = ? LIMIT 1), CURDATE());
      `;
      value = req.body.rewardName;
    }
  } else {
    queryString = `
    INSERT INTO user_rewards
    VALUES (?, ?, CURDATE())
    `;
    value = req.body.rewardID;
  }

  await pool
    .query(queryString, [userID, value])
    .then(() => res.sendStatus(201))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});
//#endregion

//#region Goals
router.get("/goals", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;

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
    .then((rows) => res.send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.get("/goals/:goalTypeID", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;
  const { goalTypeID } = req.params;
  //TODO: try to break the params

  await pool
    .query(
      `SELECT * FROM goals 
      WHERE userID = ? AND goalTypeID = ? 
      ORDER BY date desc `,
      [userID, goalTypeID]
    )
    .then((rows) => res.send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.get("/goals/:goalTypeID/latest", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;
  const { goalTypeID } = req.params;

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

router.post("/goals/:goalTypeID", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;
  const { goalTypeID } = req.params;

  if (!req.body || !req.body.value) {
    return res.sendStatus(400);
  }
  const { value } = req.body;

  /*TODO: Change it from setting the date to today. 
  I don't know what to change it to; I must ponder on it*/
  await pool
    .query(
      `INSERT INTO goals 
      VALUES (DEFAULT, ?, ?, CURDATE(), ?, 'Active')`,
      [userID, goalTypeID, value]
    )
    .then(() => res.sendStatus(201))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

router.patch("/goals/:goalTypeID", authenticateToken, async (req, res) => {
  const { id: userID } = req.user;
  const { goalTypeID } = req.params;

  if (!req.body || !req.body.status) return res.sendStatus(400);
  const { status: goalStatus } = req.body;

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
      res.sendStatus(500);
    });
});
//#endregion

module.exports = router;
