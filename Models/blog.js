const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let blogSchema = new Schema({



  title: 
  { 
      type: String, required: true 
    },
  body: 
  { 
      type: String, required: true  
    },
  createdBy: 
  { 
      type: String 
    },
  createdAt: 
  { 
      type: Date, default: Date.now() 
    },
  likes: 
  { 
      type: Number, default: 0 
    },
  likedBy: 
  { 
      type: Array 
    },
  dislikes: 
  { 
      type: Number, default: 0 
    },
  dislikedBy: 
  { 
      type: Array 
    },
  comments: 
  [{
    comment: { type: String },
    commentator: { type: String }
  }]
  




}, {
    collection: 'blogs'
  })

module.exports = mongoose.model('Blog', blogSchema)
  