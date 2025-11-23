import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String },
  email: { type: String, unique: true },
  image: { type: String },
  role: { type: String, default: 'user' }, // e.g., 'user', 'admin', 'direktur'
});

const User = models.User || model('User', UserSchema);

export default User;