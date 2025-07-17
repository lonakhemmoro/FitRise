const express = require("express");
const router = express.Router({ mergeParams: true });
const authenticateToken = require("../middleware/authenticateToken");
const { pool } = require("../dbPool");
const CustomError = require("../utils/customError");

function paramValidate(paramField, fieldName, next) {
  if (!paramField) {
    const err = new CustomError(
      400,
      "No " + fieldName + " parameter in endpoint url",
      ""
    );
    next(err);
    return true;
  }

  if (Number.isNaN(paramField)) {
    const err = new CustomError(
      400,
      "Parameter field " + fieldName + " is not a number"
    );
    next(err);
    return true;
  }

  return false;
}
//#region /

router.get("/", authenticateToken, async (req, res, next) => {
  const { userID } = req.params;
  if (paramValidate(userID, "userID", next)) return;

  await pool
    .query(
      `
      SELECT id, fName, lName, username, birthdate, gender, weight, height 
      FROM users
      WHERE id = ?
      `,
      [userID]
    )
    .then((rows) => res.status(200).send(rows[0][0]))
    .catch((err) => {
      next(new CustomError(500, "", "", err));
    });
});
//#endregion

//#region daily-activities
router.get(
  "/daily-activities/today",
  authenticateToken,
  async (req, res, next) => {
    const { userID } = req.params;
    if (paramValidate(userID, "userID", next)) return;

    await pool
      .query(
        `SELECT da.*, g.value as 'goalValue' FROM daily_activity da
      JOIN goals g ON da.goalID = g.id
      WHERE da.userID = ? AND da.date = CURDATE()`,
        [userID]
      )
      .then((rows) => res.send(rows[0]))
      .catch((err) => {
        next(new CustomError(500, "", "", err));
      });
  }
);

router.get(
  "/daily-activities/:goalTypeID",
  authenticateToken,
  async (req, res, next) => {
    const { userID, goalTypeID } = req.params;
    if (paramValidate(userID, "userID", next)) return;
    if (paramValidate(goalTypeID, "goalTypeID", next)) return;

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
        next(new CustomError(500, "", "", err));
      });
  }
);

router.get(
  "/daily-activities/:goalTypeID/today",
  authenticateToken,
  async (req, res, next) => {
    const { userID, goalTypeID } = req.params;
    if (paramValidate(userID, "userID", next)) return;
    if (paramValidate(goalTypeID, "goalTypeID", next)) return;

    await pool
      .query(
        `
        SELECT da.date, da.value, g.value as goalValue 
        FROM daily_activity da JOIN goals g ON da.goalID = g.id
        WHERE da.userID = ? AND da.date = CURDATE() AND da.goalTypeID = ?`,
        [userID, goalTypeID]
      )
      .then((rows) => res.send(rows[0][0]))
      .catch((err) => {
        next(new CustomError(500, "", "", err));
      });
  }
);

//#endregion

//#region streaks
router.get("/streaks", authenticateToken, async (req, res, next) => {
  const { userID } = req.params;
  if (paramValidate(userID, "userID", next)) return;

  await pool
    .query("SELECT value, lastUpdated FROM streaks WHERE userID = ?", [userID])
    .then((rows) => res.send(rows[0][0]))
    .catch((err) => next(new CustomError(500, "", "", err)));
});

//#endregion

//#region points
router.get("/points", authenticateToken, async (req, res, next) => {
  const { userID } = req.params;
  if (paramValidate(userID, "userID", next)) return;

  await pool
    .query("SELECT points FROM users WHERE id = ?", [userID])
    .then((rows) => res.status(200).send(rows[0][0]))
    .catch((err) => {
      next(new CustomError(500, "", "", err));
    });
});

//#endregion

//#region Friends
router.get("/friends", authenticateToken, async (req, res, next) => {
  const { userID } = req.params;
  if (paramValidate(userID, "userID", next)) return;

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
      next(new CustomError(500, "", "", err));
    });
});

//#endregion

//#region Rewards
router.get("/rewards", authenticateToken, async (req, res, next) => {
  const { userID } = req.params;
  if (paramValidate(userID, "userID", next)) return;

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
      next(new CustomError(500, "", "", err));
    });
});

//#endregion

//#region Goals
router.get("/goals", authenticateToken, async (req, res, next) => {
  const { userID } = req.params;
  if (paramValidate(userID, "userID", next)) return;

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
      next(new CustomError(500, "", "", err));
    });
});

router.get("/goals/:goalTypeID", authenticateToken, async (req, res, next) => {
  const { userID, goalTypeID } = req.params;
  if (paramValidate(userID, "userID", next)) return;
  if (paramValidate(goalTypeID, "goalTypeID", next)) return;

  await pool
    .query(
      `SELECT * FROM goals 
      WHERE userID = ? AND goalTypeID = ? 
      ORDER BY date desc `,
      [userID, goalTypeID]
    )
    .then((rows) => res.send(rows[0]))
    .catch((err) => {
      next(new CustomError(500, "", "", err));
    });
});

router.get(
  "/goals/:goalTypeID/latest",
  authenticateToken,
  async (req, res, next) => {
    const { userID, goalTypeID } = req.params;
    if (paramValidate(userID, "userID", next)) return;
    if (paramValidate(goalTypeID, "goalTypeID", next)) return;

    await pool
      .query(
        `SELECT * FROM goals 
      WHERE userID = ? AND goalTypeID = ? 
      ORDER BY date desc 
      LIMIT 1`,
        [userID, goalTypeID]
      )
      .then((rows) => res.status(200).send(rows[0][0]))
      .catch((err) => {
        next(new CustomError(500, "", "", err));
      });
  }
);

//#endregion

module.exports = router;
