# Fetch Rewards Take-Home
---
This server was built out using Node.js and Express. Directions for setting up the proper environment on your system can be found at
[Node.js](https://nodejs.org/en/download/). You can check if you already have them available, and what versions, with the following commands:
```
node -v
npm -v
```

I'd recommend using an API testing platform such as [Postman](https://www.postman.com/downloads/) to test the routes, but if you want to cli the whole thing...I can't stop you.

---
## Instructions to test with Postman:

Start by cloning this repo and then navigate to it in your terminal, running the following commands will open up a local production server on port 3000 :

```
npm install
npm start
```

Inside postman you can test the following routes:

---

### GET:

User's current balance (There is currently only one user at :id of 0):

```
http://localhost:3000/points/balance/0
```
---

User's balance by Payer:

```
http://localhost:3000/points/balancebypayer/0
```
---

### Post:

A transaction to earn the user points:

```
http://localhost:3000/points/earn/0
```
Must include a body with the following data:
```
{
"payer": "PAYERNAME",
"points": integer,
"timestamp": "date as ISOString"
}
```

---
A transaction to spend the user's points:
```
http://localhost:3000/points/spend/0
```
Must include a body with the following data:
```
{
"points": integer
}
```

## Instructions to test with CLI (using [cURL](https://help.ubidots.com/en/articles/2165289-learn-how-to-install-run-curl-on-windows-macosx-linux)):
Start by cloning this repo and then navigate to it in your terminal, running the following commands will open up a local production server on port 3000:
```
npm install
npm start
```
Once your server is opened - you'll need to open another tab in your terminal and run the following commands:

---

### GET:

User's current balance (There is currently only one user at :id of 0):

```
curl "http://localhost:3000/points/balance/0"
```
---

User's balance by Payer:

```
curl "http://localhost:3000/points/balancebypayer/0"
```
---

### Post:

A transaction to earn the user points:

```
curl -X POST "http://localhost:3000/points/earn/0" -d '{"payer": "BOB", "points": 100, "timestamp": "ISOString"}' -H "content-type: application/json"
```
You can replace the data following the -d tag with your desired input in the following format:
```
'{
"payer": "PAYERNAME",
"points": integer,
"timestamp": "date as ISOString"
}'
```

---
A transaction to spend the user's points:
```
curl -X POST "http://localhost:3000/points/spend/0" -d '{ "points": 100 }' -H "content-type:application/json"
```
You can replace the data following the -d tag with your desired input in the following format:
```
'{
"points": integer
}'
```
---
#### If you've enjoyed this simple (but well commented) server - feel free to connect with the creator or even hire him:
#### Connor McGuire -  [LinkedIn](https://www.linkedin.com/in/connormmcguire/) | [Github](https://github.com/TheConMcG)
