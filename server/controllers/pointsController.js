const fs = require('fs/promises');
const path = require('path');
const pointsController = {};

// Middleware for getting transactions record
pointsController.getTransactions = async (req, res, next) => {
  try {
    const data = await fs.readFile(path.resolve(__dirname, '../usersPointData.json'), 'UTF-8');
    const parsedData = JSON.parse(data);
    const currentUser = req.params.id;
    res.locals.transactions = parsedData.users[currentUser].transactions;
    return next();
  } catch (err) {
    next({
      log: 'Error in pointsController getTransactions method',
      message: { err: 'Unable to read transactions.'}
    })
  }
}

// Middleware for getting points for User
pointsController.getUserPoints = async (req, res, next) => {
  try {
    const data = await fs.readFile(path.resolve(__dirname, '../usersPointData.json'), 'UTF-8');
    const parsedData = JSON.parse(data);
    const currentUser = req.params.id;
    res.locals.userBalance = parsedData.users[currentUser].points;
    return next();
  } catch (err) {
    next({
      log: 'Error in pointsController getUserPoints method',
      message: { err: 'Unable to read user\'s points.'}
    })
  }
}

// Middleware for getting points per Payer
pointsController.getUserPointsByPayer = async (req, res, next) => {
  try {
    const data = await fs.readFile(path.resolve(__dirname, '../usersPointData.json'), 'UTF-8');
    const parsedData = JSON.parse(data);
    const currentUser = req.params.id;
    res.locals.payersBalances = parsedData.users[currentUser].balances;
    return next();
  } catch (err) {
    next({
      log: 'Error in pointsController getUserPointsByPayer method',
      message: { err: 'Unable to read users points balance per payer.'}
    })
  }


  const data = await fs.readFile(path.resolve(__dirname, '../usersPointData.json'), 'UTF-8');
  const parsedData = JSON.parse(data);
  const currentUser = req.params.id;
  return next();
}

// Middleware for posting earn transactions:
pointsController.postEarnPoints = async (req, res, next) => {
  try {
    const { payer, points, timestamp } = req.body;
    if (payer && points && timestamp) {
      const data = await fs.readFile(path.resolve(__dirname, '../usersPointData.json'), 'UTF-8');
      const parsedData = JSON.parse(data);
      const currentUser = req.params.id;
      const balances = parsedData.users[currentUser].balances;
      const newTransaction = {
        "payer": payer,
        "points": points,
        "timestamp": timestamp
      };
      
      // if new transaction has negative points -> subtract them from prev transactions
      if (newTransaction.points < 0) {
        if (balances[payer] + points < 0) {
          // checks to see if payer balance has enough for negative transaction
          res.locals.message = 'Transaction invalid: user does not have enough points from this Payer.';
          return next();
        }

        if (balances[payer] + points >= 0) {
          // processes the negative points against previous points from the payer
          let processingPoints = points;
          let i = 0;
          while (processingPoints < 0) {
            let currentPayer = parsedData.users[currentUser].transactions[i].payer;
            let currentPoints = parsedData.users[currentUser].transactions[i].points;
            if (currentPayer !== newTransaction.payer) {
              i++;
              continue;
            }
            if (currentPoints + processingPoints > 0) {
              parsedData.users[currentUser].transactions[i].points = currentPoints + processingPoints;
              parsedData.users[currentUser].points = parsedData.users[currentUser].points + processingPoints;
              parsedData.users[currentUser].balances[payer] = parsedData.users[currentUser].balances[payer] + processingPoints;
              processingPoints = 0;
              continue;
            }
            if (currentPoints + processingPoints <= 0) {
              parsedData.users[currentUser].points = parsedData.users[currentUser].points - currentPoints;
              parsedData.users[currentUser].balances[payer] = parsedData.users[currentUser].balances[payer] - currentPoints;
              // remove transaction from active queue once points are spent
              parsedData.users[currentUser].transactions.splice(i, 1);
              processingPoints = processingPoints + currentPoints;
              i++; 
              continue;
            };
          }
          await fs.writeFile(path.resolve(__dirname, '../usersPointData.json'), JSON.stringify(parsedData), 'UTF-8');
          res.locals.message = 'Transaction completed successfully.';
          return next();
        }
      }

      if (balances[payer]) {
        // update payers' balances per the user
        if (balances[payer] + points > 0) {
          parsedData.users[currentUser].balances[payer] += points;
        } else {
          res.locals.message = 'Transaction invalid: user does not have enough points from this Payer.';
          return next();
        }
      } else if (!(balances[payer])) {
        parsedData.users[currentUser].balances[payer] = points;
      }
      
      // update user's transaction log & sort by timestamp
      parsedData.users[currentUser].transactions.push(newTransaction);
      parsedData.users[currentUser].transactions.sort((a, b) => {
        return Date.parse(a.timestamp) - Date.parse(b.timestamp);
      });
      
      // update user's overall points in state:
      parsedData.users[currentUser].points += points;
    
      // overwrite the file in memory with new state:
      await fs.writeFile(path.resolve(__dirname, '../usersPointData.json'), JSON.stringify(parsedData), 'UTF-8');
      res.locals.message = 'Transaction completed successfully.';
      return next();

    } else {
      res.locals.message = 'Invalid Transaction: format must be { "payer": "PAYERNAME", "points": integer, "timestamp": "Date as ISOString"}'
      return next();
    }
  } catch (err) {
    // in event of error - return log & message to global error handler
    return next({
      log: 'Error in pointsController postEarnPoints method',
      message: { err: 'Unable to post transaction.'}
    });
  }

}

// Middleware for deducting spend transactions
pointsController.postSpendPoints = async (req, res, next) => {
  try {
    const { points } = req.body;
    if (points && points > 0) {
      const data = await fs.readFile(path.resolve(__dirname, '../usersPointData.json'), 'UTF-8');
      const parsedData = JSON.parse(data);
      const currentUser = req.params.id;
      const spendLog = [];
      let deductions = {};
      let processingPoints = points;

      // iterate over transactions & deduct spent points by Payer until done
      while (processingPoints > 0) {
        let currentPoints = parsedData.users[currentUser].transactions[0].points;
        let currentPayer = parsedData.users[currentUser].transactions[0].payer;

        // establish each new Payer in deduction object
        if (!(deductions[currentPayer])) deductions[currentPayer] = 0;

        if (processingPoints >= currentPoints) {
          // calculate deduction per-Payer for current transaction
          deductions[currentPayer] = deductions[currentPayer] + (0 - currentPoints);
          // adjust user's overall point balance
          parsedData.users[currentUser].points = parsedData.users[currentUser].points + (0 - currentPoints);
          // deduct points from payer balances
          parsedData.users[currentUser].balances[currentPayer] = parsedData.users[currentUser].balances[currentPayer] - currentPoints;
          // remove transaction from active queue once points are spent
          parsedData.users[currentUser].transactions.shift();
          // deduct points toward ending loop
          processingPoints = processingPoints - currentPoints;
          continue;
        } else if (processingPoints < currentPoints) {
          // same as above -> however point calculation/deduction differs
          deductions[currentPayer] = deductions[currentPayer] - processingPoints;
          parsedData.users[currentUser].balances[currentPayer] = parsedData.users[currentUser].balances[currentPayer] - processingPoints;
          // deduct the remaining processing points from the current transactions points
          parsedData.users[currentUser].transactions[0].points = currentPoints - processingPoints
          parsedData.users[currentUser].points = parsedData.users[currentUser].points - processingPoints;
          processingPoints = 0;
          continue;
        }
      }

      // iterate over deductions and reformat for desired output
      for (const payer in deductions) {
        const spendLogEntry = {
          "payer": payer,
          "points": deductions[payer]
        }
        spendLog.push(spendLogEntry);
      }
      res.locals.message = spendLog;

      // overwrite the existing data file with new state
      await fs.writeFile(path.resolve(__dirname, '../usersPointData.json'), JSON.stringify(parsedData), 'UTF-8');

      return next();

    } else {
      // if req.body does not contain "points" -> inform user of expected input
      res.locals.message = 'Incorrect request format: must include { "points": integer } and integer must be positive';
      return next();
    }

  } catch (err) {
    next({
      log: 'Error in pointsController postSpendPoints method',
      message: { err: 'Unable to post transaction.'}
    })
  }
}

module.exports = pointsController;