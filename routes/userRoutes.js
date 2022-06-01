const express = require('express');
const fs = require('fs');
const uuid = require('uuid');

const { validate } = require('../schema/userSchema');

const router = express.Router();

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/users.json`, 'utf-8') || "{}"
);

router.get('/read', (req, res) => {
  const userId = req.query.id;
  const user = users[userId];
  // check if user not exist
  if(!user) return res.status(404).json({
    success: false, 
    data: null, 
    error: 'User not found' 
  });
  
  user.coordinate = `${user.coordinate[0]}:${user.coordinate[1]}`
  res.status(200).json({
    success: true,
    data: user,
    error: null
  })
})

// search by name and then sort by firstname 
router.get('/search', (req, res) => {
  const name = req.query.name.toLowerCase();
  const searchedResults = Object.keys(users)
                             .filter(key => users[key]["firstname"].toLowerCase().startsWith(name) || users[key]["lastname"].toLowerCase().startsWith(name))
                             .map(el => users[el])
                             .sort((a, b) => ('' + a.firstname).localeCompare(b.firstname))                           
  res.status(200).json({
      success: true,
      data: searchedResults,
      error: null
  })
})

router.post('/add', (req, res) => {
  const errors = validate(req.body)
  if (errors.length !== 0) return res.status(400).json({ 
    success: false, 
    data:null,
    error: errors.map(err => err.message).join('\n')
  })

  const newUser = req.body
  newUser.coordinate = newUser.coordinate.split(':')
  newUser.coordinate = [parseInt(newUser.coordinate[0]), parseInt(newUser.coordinate[1])]
  const userId = uuid.v4();
  // insert user to json object  
  users[userId] = newUser;

  fs.writeFile(
    `${__dirname}/../data/users.json`,
    JSON.stringify(users),
    err => {
      res.status(201).json({
        success: true,
        data: newUser,
        error: null 
      });
    }
  );
})

router.put('/edit/:id', (req, res) => {
  const userId = req.params.id;
  const user = users[userId];
  // check if user not exist
  if(!user) return res.status(201).json({
      success: true, 
      data: req.body, 
      error: null 
    });
  
  const updatedUser = {}
  // insert properties to updatedUser
  Object.keys(user).filter(key => !!req.body[key])
                   .forEach(key =>  updatedUser[key] = req.body[key])
  
  // update user 
  user[userId] = updatedUser

  fs.writeFile(
    `${__dirname}/../data/users.json`,
    JSON.stringify(users),
    err => {
      res.status(201).json({
        success: true,
        data: updatedUser,
        error: null 
      });
    }
  );
})

router.delete('/edit/:id', (req, res) => {
  const userId = req.params.id;
  const user = users[userId];
  // check if user not exist
  if(!user) return res.status(404).json({
      success: false, 
      data: null, 
      error: 'User not found' 
    });

  delete users.userId 

  fs.writeFile(
    `${__dirname}/../data/users.json`,
    JSON.stringify(users),
    err => {
        res.status(204).json({
        success: true,
        data: null,
        error: null
      })
    }
  );
})

// find n users nearby given userId 
router.get('/locate', (req, res) => {
  const { n = 1, userId } = req.query;
  if (!users[userId]) return res.status(404).json({ 
    success: false,
    data: null,
    error: "User not found!"
  })
  
  const [x, y] = users[userId].coordinate;

  const data = Object.keys(users)
    // filter all users excepts given userId 
    .filter(id => id !== userId)
    .map(id => {
      // idea based on Cartesian coordinate
      const distance = (users[id]["coordinate"][0] - x)**2 + (users[id]["coordinate"][1] - y)**2
      return {
        id,
        distance: Math.sqrt(distance)
      }
    })
    .sort((a, b) => a.distance - b.distance)
    // get sorted users
    .map(el => users[el.id])
    .slice(0, n)

  res.status(200).json({
    success: true,
    data,
    error: null
  })
})

module.exports = router