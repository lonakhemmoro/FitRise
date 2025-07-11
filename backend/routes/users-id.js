const express = require("express");
const router = express.Router({ mergeParams: true });
const authenticateToken = require("../middleware/authenticateToken");
const { pool } = require("../dbPool");

//#region /

router.get("/", authenticateToken, async (req, res) => {
  const { userID } = req.params;

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
//#endregion

//#region daily-activities
router.get("/daily-activities/today", authenticateToken, async (req, res) => {
  const { userID } = req.params;

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
    const { userID, goalTypeID } = req.params;

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
    const { userID, goalTypeID } = req.params;

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

//#endregion

//#region streaks
router.get("/streaks", authenticateToken, async (req, res) => {
  const { userID } = req.params;

  await pool
    .query("SELECT goalTypeID, value FROM streaks WHERE userID = ?", [userID])
    .then((rows) => res.send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.get("/streaks/:goalTypeID", authenticateToken, async (req, res) => {
  const { userID, goalTypeID } = req.params;

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

//#endregion

//#region points
router.get("/points", authenticateToken, async (req, res) => {
  const { userID } = req.params;

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

//#endregion

//#region Friends
router.get("/friends", authenticateToken, async (req, res) => {
  const { userID } = req.params;

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

//#endregion

//#region Rewards
router.get("/rewards", authenticateToken, async (req, res) => {
  const { userID } = req.params;

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

//#endregion

//#region Goals
router.get("/goals", authenticateToken, async (req, res) => {
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
    .then((rows) => res.send(rows[0]))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.get("/goals/:goalTypeID", authenticateToken, async (req, res) => {
  const { userID, goalTypeID } = req.params;

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

//#endregion

module.exports = router;
