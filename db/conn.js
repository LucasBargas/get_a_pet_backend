const mongoose = require('mongoose');

const conn = async () => {
  try {
    const dbConn = await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected the Mongodb with Mongoose');
    return dbConn;
  } catch (error) {
    console.log('Error', error);
  }
};

conn().catch((err) => console.log(`Error: ${err}`));

module.exports = mongoose;
