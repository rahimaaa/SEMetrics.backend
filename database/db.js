const mongoose = require('mongoose');
const uri = "mongodb+srv://alehs:COjGjxhfnWxykdto@cluster0.pkhb7j9.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB using Mongoose');
});

module.exports = db;
