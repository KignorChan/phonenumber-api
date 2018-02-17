var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var utils = require('./utils');                 // import lib
var multer  = require('multer');                // handle multipart
var textract = require('textract');
var mime = require('mime');
var pdfUtil = require('pdf-to-text');
var pdfText = require('pdf-text');

//var upload = multer({ dest: 'uploads/' });

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

//var storage = multer.memoryStorage();

var upload = multer({ storage: storage});

var upload = multer({ storage: storage })

router.use(bodyParser.urlencoded({ extended: true }));    // application/x-www-form-urlencoded

// function that handles the strings, and returns array of phone numbers
function processRequest(strArr){
  var phones = [];
  for(var i=0; i<strArr.length; i++){
    //console.log(utils.parse(strArr[i], 'CA'));

    //console.log("Number Type: " + utils.getPhoneCode("6477862674"));
    try {
      // isValidNumber() throws TypeError
      if(utils.isValidNumber(utils.parse(strArr[i], 'CA'))){
        phones.push(utils.format(strArr[i], 'CA', 'National'));
      }else{
        flag++;
      }
    } catch (e) {
      //console.error('catch:', e);
    } finally {
    }
  }

  // use Set to remove duplicates entries
  var mySet = new Set(phones);
  phones = [...mySet];

  return phones;
}

// test
router.get('/', (req, res) => { res.status(200).send('works'); });

// GET, allows comma-seperated strings
// e.g. http://localhost:5000/api/phonenumbers/parse/text/Seneca%20Phone%20Number%3A%20416-491-5050%2C6478603041%2Csometexts%2C6478603041
router.get('/api/phonenumbers/parse/text/:str?', function(req, res){
  var str = req.params.str;
  var phones = [];

  if(str != undefined){
    var strArr = str.split(',');
    var phones = [];
    phones = processRequest(strArr);

    res.setHeader('Content-Type', 'application/json');
    if(!phones.length){
      res.status(400).send(phones);
    }else{
      res.status(200).send(phones);
    }
  }else{
    res.status(400).send(phones);       // if param str is not provided
  }
});


// POST, reads binary base64 encoded txt as multipart from request body
router.post('/api/phonenumbers/parse/file', upload.single('file'), function(req, res){
  console.log(req.file.originalname);
  var decoded = "";
  var fileType = mime.getType(req.file.originalname);
  var fileExtension = mime.getExtension(fileType);

  console.log(fileExtension);

  if(fileExtension == "pdf"){
    pdfText('uploads/'+req.file.originalname, function(err, chunks) {
      if(err) throw (err);

      var text="";
      for(var i=0; i<chunks.length; i++){
        text += chunks[i];
      }
      //console.log(text);
      var decoded = new Buffer(text, 'base64').toString('ascii');    // decoded str
      //console.log(decoded);  

      var strArr = decoded.split('\n');
      var phones = [];
      phones = processRequest(strArr);

      res.setHeader('Content-Type', 'application/json');
      if(!phones.length){
        res.status(400).send(phones);
      }else{
        res.status(200).send(phones);
      }
    })
  }else{
    textract.fromFileWithPath('uploads/'+req.file.originalname, function( error, text ) {
        if(error) throw (error);
  
        var decoded = new Buffer(text, 'base64').toString('ascii');    // decoded str
        console.log(decoded);
        var strArr = decoded.split('\n');
        var phones = [];
        phones = processRequest(strArr);
      
        res.setHeader('Content-Type', 'application/json');
        if(!phones.length){
          res.status(400).send(phones);
        }else{
          res.status(200).send(phones);
        }

    })    
  }  

});

module.exports = router;
