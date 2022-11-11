const express = require('express');
const path = require('path');
const PORT = 3000;
const app = express();
const pointsRouter = require('./routes/pointsRouter');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/points', pointsRouter);

app.get('/', (req, res) => {
  res.status(200).send('Welcome to the server');
});

app.use((err, req, res, next) => {
  const defaultErr = {
    log: "Express error handler caught unknown middleware error",
    status: 400,
    message: { err: "An error occurred" },
  };
  const errorObj = Object.assign(defaultErr, err);
  console.log("ERROR: ", errorObj.log);
  return res.status(errorObj.status).send(errorObj.message);
});

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});