const express = require('express')
const User = require('../Models/User')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const router = express.Router()
const async = require('async')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const Blog = require('../Models/blog')



//Login Page
//router.get('/blog',(req,res) => res.send('Blog'))




    router.post('/newBlog', (req, res) => {

          // Check if blog title was provided
    if (!req.body.title) {
        res.json({ success: false, message: 'Blog title is required.' }); // Return error message
      } else {
        // Check if blog body was provided
        if (!req.body.body) {
          res.json({ success: false, message: 'Blog body is required.' }); // Return error message
        } else {
          // Check if blog's creator was provided
          if (!req.body.createdBy) {
            res.json({ success: false, message: 'Blog creator is required.' }); // Return error
          } else {
            // Create the blog object for insertion into database
            const blog = new Blog({
              title: req.body.title, // Title field
              body: req.body.body, // Body field
              createdBy: req.body.createdBy // CreatedBy field
            });
            // Save blog into database
            blog.save((err) => {
              // Check if error
              if (err) {
                // Check if error is a validation error
                if (err.errors) {
                  // Check if validation error is in the title field
                  if (err.errors.title) {
                    res.json({ success: false, message: err.errors.title.message }); // Return error message
                  } else {
                    // Check if validation error is in the body field
                    if (err.errors.body) {
                      res.json({ success: false, message: err.errors.body.message }); // Return error message
                    } else {
                      res.json({ success: false, message: err }); // Return general error message
                    }
                  }
                } else {
                  res.json({ success: false, message: err }); // Return general error message
                }
              } else {
                res.json({ success: true, message: 'Blog saved!' }); // Return success message
              }
            });
          }
        }
      }

    } );




/* ===============================================================
     GET ALL BLOGS
  =============================================================== */
  router.get('/allBlogs', (req, res) => {
    // Search database for all blog posts
    Blog.find({}, (err, blogs) => {
      // Check if error was found or not
      if (err) {
        res.json({ success: false, message: err }); // Return error message
      } else {
        // Check if blogs were found in database
        if (!blogs) {
          res.json({ success: false, message: 'No blogs found.' }); // Return error of no blogs found
        } else {
          res.json({ success: true, blogs: blogs }); // Return success and blogs array
        }
      }
    }).sort({ '_id': -1 }); // Sort blogs from newest to oldest
  });



 /* ===============================================================
     GET SINGLE BLOG
  =============================================================== 
  router.get('/singleBlog/:id' ,isValidUser , (req, res) => {
   

    Blog.findById(req.params.id, (error, data) => {
      if (error) {
        return next(error)
      } else {
        res.json(data)
      }
    })


  });

 //logged user verification
 function isValidUser(req,res,next){
  if(req.isAuthenticated()) next();
  else return res.status(401).json({message:'Unauthorized Request'});
}


*/






  /* ===============================================================
     DELETE BLOG POST
  =============================================================== */
  router.delete('/deleteBlog/:id', (req, res) => {
    // Check if ID was provided in parameters
    if (!req.params.id) {
      res.json({ success: false, message: 'No id provided' }); // Return error message
    } else {
      // Check if id is found in database
      Blog.findOne({ _id: req.params.id }, (err, blog) => {
        // Check if error was found
        if (err) {
          res.json({ success: false, message: 'Invalid id' }); // Return error message
        } else {
          // Check if blog was found in database
          if (!blog) {
            res.json({ success: false, messasge: 'Blog was not found' }); // Return error message
          } else {
          

              // Remove the blog from database
              blog.remove((err) => {
                if (err) {
                  res.json({ success: false, message: err }); // Return error message
                } else {
                  res.json({ success: true, message: 'Blog deleted!' }); // Return success message
                }
              });


          }
        }
      });
    }
  });





   /* ===============================================================
     LIKE BLOG POST
  =============================================================== */
  router.put('/likeBlog', (req, res) => {
    // Check if id was passed provided in request body
    if (!req.body.id) {
      res.json({ success: false, message: 'No id was provided.' }); // Return error message
    } else {
      // Search the database with id
      Blog.findOne({ _id: req.body.id }, (err, blog) => {
        // Check if error was encountered
        if (err) {
          res.json({ success: false, message: 'Invalid blog id' }); // Return error message
        } else {
          // Check if id matched the id of a blog post in the database
          if (!blog) {
            res.json({ success: false, message: 'That blog was not found.' }); // Return error message
          } else {
            

              blog.likes++; // Incriment likes
              // Save blog post
              blog.save((err) => {
                if (err) {
                  res.json({ success: false, message: 'Something went wrong.' }); // Return error message
                } else {
                  res.json({ success: true, message: 'Blog liked!' }); // Return success message
                }
              });
            
            
          }
        }
      });
    }
  });




   /* ===============================================================
     DISLIKE BLOG POST
  =============================================================== */
  router.put('/dislikeBlog', (req, res) => {
    // Check if id was passed provided in request body
    if (!req.body.id) {
      res.json({ success: false, message: 'No id was provided.' }); // Return error message
    } else {
      // Search the database with id
      Blog.findOne({ _id: req.body.id }, (err, blog) => {
        // Check if error was encountered
        if (err) {
          res.json({ success: false, message: 'Invalid blog id' }); // Return error message
        } else {
          // Check if id matched the id of a blog post in the database
          if (!blog) {
            res.json({ success: false, message: 'That blog was not found.' }); // Return error message
          } else {
            

              blog.dislikes++; // Increase likes by one
            // Save blog post
              blog.save((err) => {
                if (err) {
                  res.json({ success: false, message: 'Something went wrong.' }); // Return error message
                } else {
                  res.json({ success: true, message: 'Blog liked!' }); // Return success message
                }
              });
            
            
          }
        }
      });
    }
  });











 /* ===============================================================
     COMMENT ON BLOG POST
  =============================================================== */
  router.post('/comment', (req, res) => {
    // Check if comment was provided in request body
    if (!req.body.comment) {
      res.json({ success: false, message: 'No comment provided' }); // Return error message
    } else {
      // Check if id was provided in request body
      if (!req.body.id) {
        res.json({ success: false, message: 'No id was provided' }); // Return error message
      } else {
        // Use id to search for blog post in database
        Blog.findOne({ _id: req.body.id }, (err, blog) => {
          // Check if error was found
          if (err) {
            res.json({ success: false, message: 'Invalid blog id' }); // Return error message
          } else {
            // Check if id matched the id of any blog post in the database
            if (!blog) {
              res.json({ success: false, message: 'Blog not found.' }); // Return error message
            } else {



  // Add the new comment to the blog post's array
  blog.comments.push({
    comment: req.body.comment, // Comment field
    commentator: req.body.createdBy // Person who commented
  });
  // Save blog post
  blog.save((err) => {
    // Check if error was found
    if (err) {
      res.json({ success: false, message: 'Something went wrong.' }); // Return error message
    } else {
      res.json({ success: true, message: 'Comment saved' }); // Return success message
    }
  });



            }
          }
        });
      }
    }
  });








  

module.exports = router