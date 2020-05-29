let express = require('express'),
  multer = require('multer'),
  mongoose = require('mongoose'),
  router = express.Router();


// Multer File upload settings
const DIR = './public/';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    cb(null, fileName)
  }
});


// Multer Mime Type Validation
var upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});


// Product model
let Product = require('../models/Product');


// POST Product
router.post('/create-product', upload.single('avatar'), (req, res, next) => {
  const url = req.protocol + '://' + req.get('host')
  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    avatar: url + '/public/' + req.file.filename,
    newPrice: req.body.newPrice,
    availibilityCount: req.body.availibilityCount,
    description: req.body.description
  });
  product.save().then(result => {
    console.log(result);
    res.status(201).json({
      message: "Product registered successfully!",
      productCreated: {
        _id: result._id,
        name: result.name,
        avatar: result.avatar,
        newPrice: result.newPrice,
        availibilityCount: result.availibilityCount,
        description: result.description
      }
    })
  }).catch(err => {
    console.log(err),
      res.status(500).json({
        error: err
      });
  })
})


// GET All Product
router.get("/", (req, res, next) => {
    Product.find().then(data => {
    res.status(200).json({
      message: "Products retrieved successfully!",
      products: data
    });
  });
});


// Get product by id 
router.route('/read-product/:id').get((req, res) => {
  Product.findById(req.params.id, (error, data) => {
  if (error) {
  return next(error)
  } else {
  res.json(data)
  }
  })
  })





//Delete Product 

router.delete('/deleteProduct/:id', (req, res) => {
  // Check if ID was provided in parameters
  if (!req.params.id) {
    res.json({ success: false, message: 'No id provided' }); // Return error message
  } else {
    // Check if id is found in database
    Product.findOne({ _id: req.params.id }, (err, product) => {
      // Check if error was found
      if (err) {
        res.json({ success: false, message: 'Invalid id' }); // Return error message
      } else {
        // Check if product was found in database
        if (!product) {
          res.json({ success: false, messasge: 'Product was not found' }); // Return error message
        } else {
        

            // Remove the product from database
            product.remove((err) => {
              if (err) {
                res.json({ success: false, message: err }); // Return error message
              } else {
                res.json({ success: true, message: 'Product deleted!' }); // Return success message
              }
            });


        }
      }
    });
  }
});





/* ===============================================================
     UPDATE PRODUCT POST
  =============================================================== */
  router.put('/updateProduct', (req, res) => {
    // Check if id was provided
    if (!req.body._id) {
      res.json({ success: false, message: 'No product id provided' }); // Return error message
    } else {
      // Check if id exists in database
      Product.findOne({ _id: req.body._id }, (err, product) => {
        // Check if id is a valid ID
        if (err) {
          res.json({ success: false, message: 'Not a valid product id' }); // Return error message
        } else {
          // Check if id was found in the database
          if (!product) {
            res.json({ success: false, message: 'Product id was not found.' }); // Return error message
          } else {



            product.name = req.body.name;
            product.avatar = url + '/public/' + req.file.filename;
            product.newPrice = req.body.newPrice;
            product.availibilityCount = req.body.availibilityCount;
            product.description = req.body.description;





            product.save((err) => {
              if (err) {
                if (err.errors) {
                  res.json({ success: false, message: 'Please ensure form is filled out properly' });
                } else {
                  res.json({ success: false, message: err }); // Return error message
                }
              } else {
                res.json({ success: true, message: 'Product Updated!' }); // Return success message
              }
            });



          }
        }
      });
    }
  });






module.exports = router;
