import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, match: /^[a-z0-9][a-z0-9-]*$/ },
  isSample: { type: Boolean, default: false },
  name: { type: String, required: true, trim: true },
  shortDescription: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String },
  categories: [{ type: String }],
  status: { type: String, enum: ['Completed', 'In Progress'] },
  image: { type: String },
  imageAlt: { type: String },
  technologies: [{ type: String }],
  features: [{ type: String }],
  screenshots: [{ _id: false, src: String, alt: String }],
  links: [{ _id: false, label: String, url: String }]
}, { timestamps: true, versionKey: false });

export default mongoose.model('Project', projectSchema);
