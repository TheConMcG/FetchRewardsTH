const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/pointsController');

// get point balance for User -> integer
router.get('/balance/:id', pointsController.getUserPoints, (req, res) => {
  return res.status(200).json(res.locals.userBalance)
});

// get point balance per payer for User -> obj with "payers": their current balance
router.get('/balancebypayer/:id', pointsController.getUserPointsByPayer, (req, res) => {
  return res.status(200).json(res.locals.payersBalances)
});

// get transaction log for User -> arr of transaction objects
router.get('/transactions/:id', pointsController.getTransactions, (req, res) => {
  return res.status(200).json(res.locals.transactions);
});

// post transaction -> "transaction successful" or error
router.post('/earn/:id', pointsController.postEarnPoints, (req, res) => {
  return res.status(200).send(res.locals.message);
});

// post spend -> arr of objects with "payers": points deducted
router.post('/spend/:id', pointsController.postSpendPoints, (req, res) => {
  return res.status(200).json(res.locals.message);
});

module.exports = router;