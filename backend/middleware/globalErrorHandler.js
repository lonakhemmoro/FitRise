module.exports = (err, req, res, next) => {
  console.log(err);
  if (!err.status) {
    console.log("Not custom Error object!!!!");
    res.sendStatus(500);
    return;
  }

  res.status(err.status).send(err.returnErrors());
};
