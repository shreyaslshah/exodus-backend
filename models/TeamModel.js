const mongoose = require("mongoose");
const { isEmail } = require('validator');
const Schema = mongoose.Schema;

const teamSchema = new Schema({

  teamID: {
    type: String,
    unique: true
  },
  teamName: {
    type: String,
    unique: true,
    required: [true, 'Please enter a Team Name'],
    minlength: [2, 'Minimum Team Name length must be 2 characters']
  },

  teamMembers: [{
    type:Schema.Types.ObjectId,
    ref:'User'
  }],

  pocEmail: {
    type: String,
    required: [true, 'Please enter your Email ID'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please enter a valid Email ID']
  },
  repoLink:{
    type:String,
    default:"",
  },
  websiteLink: {
    type: String,
    required: false,
    default: ""
  },
  details:{
    type:String,
    default:""
  },
  topic:{
    type:String,
    default:""
  }

});

module.exports = mongoose.model("Team", teamSchema);