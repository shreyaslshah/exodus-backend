const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please enter Name']
  },

  email: {
    type: String,
    required: [true, 'Please enter your Email ID'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please enter a valid Email ID']
  },

  password: {
    type: String,
    required: [true, 'Please enter a Password'],
    minlength: [4, 'Minimum Password length must be 4 characters']
  },
  college:{
      type:String,
      required:[true,'Please enter your college name']
  },
  phoneno:{
      type:Number,
      required:[true,'Please enter your mobile number']
  },
  discordid:{
      type:String
  },
  public: {
    type: Boolean,
    required: true,
    default: false,
  },

  isVerified: Boolean,
});

userSchema.add({requestSentPending:[{
    type:Schema.Types.ObjectId,
    ref : 'User'
  }]});
  userSchema.add({requestReceivedPending:[{
    type:Schema.Types.ObjectId,
    ref : 'User'
  }]});
  userSchema.add({friends:[{
    type:Schema.Types.ObjectId,
    ref : 'User'
  }]});

userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email: email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    else {
      throw Error('incorrect password');
    }
  }
  else {
    throw Error('incorrect email');
  }

}


const User = mongoose.model('User', userSchema);

module.exports = User;