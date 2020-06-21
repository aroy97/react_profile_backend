const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    profilepic: { type: String, required: true },
    sessionToken: { type: String, required: true },
    lastLoggedIn: {type: Date },
    resetToken: { type: String},
    mobile: { type: Number, required: true },
    status: { type: String, required: true},
    profilepicversion: {type: String, required: true}
},
{
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;