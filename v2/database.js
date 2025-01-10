
const mongoose = require('mongoose');

// Replace with your actual connection string
const MONGO_URI = 'mongodb+srv://UnixMachine:PAFWGjwnAzCOvZqi@daomex.2z8bx.mongodb.net/?retryWrites=true&w=majority&appName=Daomex';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((error) => {
    console.error('Error connecting to MongoDB Atlas:', error.message);
    process.exit(1); // Exit the application if the connection fails
  });


  //PAFWGjwnAzCOvZqi
  //UnixMachine