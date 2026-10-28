import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, match: /^[a-z0-9][a-z0-9-]*$/ },
  isSample: { type: Boolean, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  avatar: { type: String, default: '' },
  shortBio: { type: String, required: true, trim: true },
  bio: { type: String, required: true, trim: true },
  skills: [{ type: String }],
  profilePhoto: { type: String, default: null },
  linkedin: { type: String, default: '' },
  email: { type: String, default: '' }
}, { timestamps: true, versionKey: false });

export default mongoose.model('TeamMember', teamMemberSchema);
