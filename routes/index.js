const express = require('express')
const router = express.Router()

router.get('/',(req,res) => res.send('Welcome'))

router.get('/dashborad',(req,res) => res.send('Dashboad'))

module.exports = router