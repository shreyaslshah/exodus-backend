const mongoose = require("mongoose");
const dotenv = require("dotenv");


dotenv.config();

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect("mongodb+srv://shreyaslshah:shreyasshah@cluster0.bakje.mongodb.net/exodus?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB !!");
  } catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = InitiateMongoServer;