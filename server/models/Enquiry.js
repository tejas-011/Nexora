import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  company: { type: String, trim: true, maxlength: 160, default: '' },
  interest: {
    type: String,
    enum: ['general', 'managed-it', 'cloud', 'security', 'recovery', 'infrastructure', 'strategy', 'careers'],
    default: 'general'
  },
  message: { type: String, required: true, trim: true, maxlength: 5000 }
}, { timestamps: true, versionKey: false });

export default mongoose.model('Enquiry', enquirySchema);
