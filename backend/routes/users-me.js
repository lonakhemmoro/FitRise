const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { pool } = require("../dbPool");
const CustomError = require("../utils/customError");
const onPoolFailed = require("../funcs/onPoolFailed");

function isParamNaN(paramField, fieldName, next) {
  if (Number.isNaN(paramField)) {
    const err = new CustomError(
      400,
      "Parameter field " + fieldName + " is not a number"
    );
    next(err);
    return true;
  } else false;
}
//#region /

router.get("/", authenticateToken, async (req, res, next) => {
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
    .then((rows) => res.status(200).send(rows[0][0]))
    .catch((err) => {
      next(new CustomError(500, "", "", err));
    });
});

//TODO: PATCH users/me. I simply don't feel like it rn
router.patch("/", authenticateToken, async (req, res, next) => {
  res.sendStatus(201);
});
//#endregion

//#region daily-activities
router.get(
  "/daily-activities/today",
  authenticateToken,
  async (req, res, next) => {
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
        next(new CustomError(500, "", "", err));
      });
  }
);

router.get(
  "/daily-activities/:goalTypeID",
  authenticateToken,
  async (req, res, next) => {
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;
    if (isParamNaN(goalTypeID, "goalTypeID", next)) return;

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
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;
    if (isParamNaN(goalTypeID, "goalTypeID", next)) return;

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

router.post(
  "/daily-activities/:goalTypeID",
  authenticateToken,
  async (req, res, next) => {
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;
    if (isParamNaN(goalTypeID, "goalTypeID", next)) return;

    if (!req.body || !req.body.value) {
      next(new CustomError(400, "Missing body fields", ""));
      return;
    }
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
        next(new CustomError(500, "", "", err));
      });
  }
);

router.patch(
  "/daily-activities/:goalTypeID",
  authenticateToken,
  async (req, res, next) => {
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;
    if (isParamNaN(goalTypeID, "goalTypeID", next)) return;

    if (!req.body || !req.body.value) {
      next(new CustomError(400, "Missing body fields", ""));
      return;
    }
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
        next(new CustomError(500, "", "", err));
      });
  }
);
//#endregion

//#region streaks
router.get("/streaks", authenticateToken, async (req, res, next) => {
  const { id: userID } = req.user;

  await pool
    .query("SELECT value, lastUpdated FROM streaks WHERE userID = ?", [userID])
    .then((rows) => res.send(rows[0][0]))
    .catch((err) => next(new CustomError(500, "", "", err)));
});

router.patch("/streaks", authenticateToken, async (req, res, next) => {
  //Automatically determines and updates the user's streak
  const { id: userID } = req.user;

  try {
    const streakCheck = await pool
      .query(`SELECT * FROM streaks WHERE userID = ?`, [userID])
      .then((rows) => rows[0])
      .catch((err) => {
        throw new CustomError(500, "", "", err);
      });

    //If no streak entry exists, make one
    if (streakCheck.length === 0) {
      await pool
        .query(`INSERT INTO streaks VALUES (?, 0, CURDATE())`, [userID])
        .catch((err) => {
          throw new CustomError(500, "", "", err);
        });
      return res.sendStatus(200);
    }

    //else update the user's row
    await pool
      .query(
        `
      UPDATE streaks
      SET value = 
      CASE
        WHEN lastUpdated = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN value + 1
        WHEN lastUpdated = CURDATE() THEN value
        ELSE 0
        END,
      lastUpdated = CURDATE()
      WHERE userID = ?`,
        [userID]
      )
      .then(() => res.sendStatus(200))
      .catch((err) => {
        throw new CustomError(500, "", "", err);
      });
  } catch (err) {
    next(err);
  }
});

//#endregion

//#region points
router.get("/points", authenticateToken, async (req, res, next) => {
  const { id: userID } = req.user;

  await pool
    .query("SELECT points FROM users WHERE id = ?", [userID])
    .then((rows) => res.status(200).send(rows[0][0]))
    .catch((err) => {
      next(new CustomError(500, "", "", err));
    });
});

router.patch("/points", authenticateToken, async (req, res, next) => {
  const { id: userID } = req.user;

  if (!req.body || !req.body.points) {
    next(new CustomError(400, "No body or no 'points' field", ""));
    return;
  }
  const { points } = req.body;

  try {
    //Get the users points
    const { points: oldPoints } = await pool
      .query("SELECT points FROM users WHERE id = ?", [userID])
      .then((rows) => rows[0][0])
      .catch((err) => {
        throw new CustomError(500, "", "", err);
      });

    //TODO: Remove this when we make points in the db NON-NULL
    if (!oldPoints)
      throw new CustomError(500, "points is NULL or undefined", "");

    //Give the user their new points
    await pool
      .query("UPDATE users SET points = points + ? WHERE id = ?", [
        points,
        userID,
      ])
      .catch((err) => {
        throw new CustomError(500, "", "", err);
      });

    //Give the user any rewards the point increase may have given them
    await pool
      .query(
        `
      INSERT INTO user_rewards
      SELECT ?, id, curdate() FROM rewards WHERE points > ? AND points <= ?
      `,
        [userID, oldPoints, oldPoints + points]
      )
      .then(() => res.sendStatus(200))
      .catch((err) => {
        throw new CustomError(500, "", "", err);
      });
  } catch (err) {
    next(err);
  }
});
//#endregion

//#region Friends
router.get("/friends", authenticateToken, async (req, res, next) => {
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
      next(new CustomError(500, "", "", err));
    });
});

router.post("/friends", authenticateToken, async (req, res, next) => {
  const { id: userID } = req.user;

  if (!req.body || !req.body.friendID) return res.sendStatus(400);
  const { friendID } = req.body;

  try {
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
        throw new CustomError(500, "", "", err);
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
        throw new CustomError(500, "", "", err);
      });
  } catch (err) {
    next(err);
  }
});

router.delete("/friends", authenticateToken, async (req, res, next) => {
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
      next(new CustomError(500, "", "", err));
    });
});
//#endregion

//#region FriendRequests
router.get("/friend-requests", authenticateToken, async (req, res, next) => {
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
      next(new CustomError(500, "", "", err));
    });
});

router.post("/friend-requests", authenticateToken, async (req, res, next) => {
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
      next(new CustomError(500, "", "", err));
    });
});

router.delete("/friend-requests", authenticateToken, async (req, res, next) => {
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
      next(new CustomError(500, "", "", err));
    });
});

//#endregion

//#region Rewards
router.get("/rewards", authenticateToken, async (req, res, next) => {
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
      next(new CustomError(500, "", "", err));
    });
});

//#endregion

//#region Goals
router.get("/goals", authenticateToken, async (req, res, next) => {
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
      next(new CustomError(500, "", "", err));
    });
});

router.get("/goals/:goalTypeID", authenticateToken, async (req, res, next) => {
  const { id: userID } = req.user;
  const { goalTypeID } = req.params;
  if (isParamNaN(goalTypeID, "goalTypeID", next)) return;

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
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;
    if (isParamNaN(goalTypeID, "goalTypeID", next)) return;

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

router.post("/goals/:goalTypeID", authenticateToken, async (req, res, next) => {
  const { id: userID } = req.user;
  const { goalTypeID } = req.params;
  if (isParamNaN(goalTypeID, "goalTypeID", next)) return;

  if (!req.body || !req.body.value || !req.body.adjustedBy) {
    next(new CustomError(400, "Missing body fields", ""));
    return;
  }
  const { value, adjustedBy } = req.body;

  /*TODO: Change it from setting the date to today. 
  I don't know what to change it to; I must ponder on it*/
  await pool
    .query(
      `INSERT INTO goals 
      VALUES (DEFAULT, ?, ?, CURDATE(), ?, 'Active', ?)`,
      [userID, goalTypeID, value, adjustedBy]
    )
    .then(() => res.sendStatus(201))
    .catch((err) => new CustomError(500, "", "", err));
  if (onPoolFailed(pool, next)) return;
});

router.patch(
  "/goals/:goalTypeID",
  authenticateToken,
  async (req, res, next) => {
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;
    if (isParamNaN(goalTypeID, "goalTypeID", next)) return;

    try {
      //Get the results of the previous goal
      const previousGoal = await pool
        .query(
          `
        SELECT SUM(da.value) as 'sum', g.value as 'goalValue', da.goalID, g.status 
        FROM daily_activity da JOIN goals g ON da.goalID = g.id
        WHERE goalID = 
        (SELECT goalID FROM daily_activity WHERE userID = ? AND goalTypeID = ? ORDER BY date DESC LIMIT 1) 
        GROUP BY(goalID)`,
          [userID, goalTypeID]
        )
        .then((rows) => rows[0])
        .catch((err) => {
          throw new CustomError(500, "", "", err);
        });

      if (previousGoal.length === 0) {
        //Only occurs if the user doesn't have ANY previous goals for this goalType
        //console.log("we are here");
        return res.sendStatus(200);
      }

      const {
        sum,
        goalValue,
        goalID,
        status: previousGoalStatus,
      } = previousGoal[0];

      if (previousGoalStatus !== "Active") {
        return res.sendStatus(200);
      }

      //Update it
      const updatedStatus = sum >= goalValue * 4 ? "Complete" : "Fail";
      await pool
        .query("UPDATE goals SET status = ? WHERE id = ?", [
          updatedStatus,
          goalID,
        ])
        .then(() => res.sendStatus(200))
        .catch((err) => {
          throw new CustomError(500, "", "", err);
        });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/goals/:goalTypeID/recommended-value",
  authenticateToken,
  async (req, res, next) => {
    const { id: userID } = req.user;
    const { goalTypeID } = req.params;
    if (isParamNaN(goalTypeID, "goalTypeID", next)) return;

    /*It's okay to get the last created goal 
      because the newest goal won't be created yet at the time of requesting this*/

    //TODO: Should also return the adjustedBy amount so it can be used
    //        by POST /users/me/goals/:goalTypeID
    return res.send({ msg: "this is just a placeholder" });
  }
);
//#endregion

module.exports = router;
