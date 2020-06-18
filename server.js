const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const basicAuth = require('express-basic-auth');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const startTime = new Date();

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());
app.use(morgan('dev'));
app.use(basicAuth({
    users: { 'admin': 'admin' }
}))

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true})
    .then()
    .catch(err => console.log('Error:' + err));
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB connection established successfully');
})

const usersRouter = require('./routes/user');

app.use('/user',usersRouter);

app.route('/').get((req,res) => {
    res.json("Server started successfully on " + startTime);
})

app.listen(port, () => {
    console.log('Server is running on port:', port);
})