const express = require('express');
const bodyParser = require('body-parser')
const userRoute = require('./routes/userRoutes')

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/user', userRoute)

app.all('*', (req, res, next) => {
  next(new Error('Not found'), 404)
})

app.listen(3000, () => {
  console.log('App is running on port 3000;');
})