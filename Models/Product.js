const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let productSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String
  },
  avatar: {
    type: String
  },
  newPrice: {
    type: Number
  },
  availibilityCount: {
    type: Number
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date , default : Date.now()
  },
  likes: {
    type: Number , default : 0
  },
  dislikes: {
    type: Number , default : 0
  },
  cartCount: {
    type: Number , default : 0
  },
}, {
    collection: 'products'
  })

module.exports = mongoose.model('Product', productSchema)
  