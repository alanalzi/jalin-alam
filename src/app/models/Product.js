import mongoose, { Schema, models, model } from 'mongoose';

const ProductSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  startDate: { type: Date },
  deadline: { type: Date },
});

const Product = models.Product || model('Product', ProductSchema);

export default Product;