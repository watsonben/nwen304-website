var express = require('express');
var fs = require('fs');
var app = express();
var port = process.env.PORT || 8080;
var bp = require('body-parser');
var user = require('./middleware/User.js');

var products = require('./database/access_products.js');
var users = require('./database/access_users.js');
var passport = require('passport');
//var cors = require('cors');
//var pg = require('pg').native;
var codes = require('./middleware/code.js');
//var users = require('../database/access_users.js');
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);

// this is for authentication

//var loggedOn = require('connect-ensure-login');
var geoip = require('geoip-lite');

var bp = require('body-parser');
var jobsFilename = './jobs.json';

// these are used in the authentication
//app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

//use for accesing local files
app.use(express.static('/public'));
app.use('/public', express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));

app.use(bp.urlencoded({extended:true}));
// Add headers
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE, XHR');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Pass to next layer of middleware
  next();
});



app.set('public', __dirname + '/public');
app.set('view engine', 'ejs');
app.use(bp.json());

// this is the passprt authentication methods
require('./middleware/Config.js')(passport);
var auth = require('./middleware/authentication.js');


// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

//=====================================
//GET METHODS
//=====================================
// app.get('*',function(req,res,next){
//   if(req.headers['x-forwarded-proto']!='https')//&&process.env.NODE_ENV === 'production')
//     res.redirect('https://'+req.hostname+req.url)
//   else
//     next() 
// });


app.get('/', function(req,res){
	res.render('index');
});

app.get('/search*', products.search);
app.get('/men*', products.get_me_something);
app.get('/women*', products.get_me_something);
app.get('/kids*', products.get_me_something);

app.get('/pages', function(req, res){
	res.send('q: ' + req.query.q);
});

app.get('/login', function(req, res){
    res.render('login')
});

app.get('/register', function (req, res) {
    res.render('register')
});

app.get('/aboutus', function (req, res) {
    res.render('aboutus')
});

app.get('/getRecommendations',function (req, res) {
  var ipAddr = req.headers["x-forwarded-for"];
  if (ipAddr){
    var list = ipAddr.split(",");
    ipAddr = list[list.length-1];
  } else {
    ipAddr = req.connection.remoteAddress;
  }
 


  //var ip = req.ip;
  var geo = geoip.lookup(ipAddr);
  console.log(geo);
  res.send({'geo':geo,'ip':ipAddr});
});

//=====================================
//PUT METHODS
//=====================================

app.put('/', function(req,res){

});

app.put('/login', users.put);

//=====================================
//POST METHODS
//=====================================

app.post('/', function(req,res){
	if(req.body.item==undefined){
		res.statusCode = 400;
	} else{
		postData(req.body.item, true);
		res.statusCode = 200;
	}
	res.end();
});

//=====================================
//DELETE METHODS
//=====================================

app.delete('/', function(req,res){

});

//=====================================
//AUTHENTICATION METHODS
//=====================================


//check to see if loggedon with fb and then locally
app.all('/auth/*',auth.authenticate);

app.post('/auth/testAuth',auth.testAuth);

app.post('/newUser',auth.newUser);

// TODO check to see if a person is already logged onto facebook
app.post('/login', login);

function login(req,res,next){
   console.log("GETS INTO LOGIN");
    if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')){
    res.statusCode = 400;
    return res.send('please post syntax')
    }

   //get the hashed password from the database using the username
   var userName = req.body.username;
   var password = req.body.password;

  //console.log("gets into login");
  console.log(req.body.password);
  var hash = bcrypt.hashSync(password, salt);

    passport.authenticate('local', function(err, username, info) {
      if (err) {
        console.log("error in loacl login");
          return next(err);
      }
      if(password){
        console.log("password exsits");
      }    
      if (!username) {
        console.log("notUsername");
        // print out error .message at the other end
        req.session.messages = "Error";//info.message;
        return res.render('/');
      }
    // If everything's OK
      req.logIn(username, function(err) {
        if (err) {
          req.session.messages = "Error";
          console.log('loginPost Error');
          return next(err);
        }
        // Set the message
        req.session.messages = "successful login";

        // Set the displayName 
        var data = { userName : username };
        console.log(req.user.passport);
        //console.log(req.user.passport.user);
        req.session.passport.user = data;
        //return res.render('/index');
        return res.render('index', {data:data});
    });    
  })(req, res, next);


}


// TODO have a database of vaild tokens
app.post('/auth/logout',auth.logout);

app.get('/login/facebook',
  passport.authenticate('facebook'));

app.get('/login/facebook/return',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    console.log(req.user);
    var data = {'user':req.user};
    //res.render('index', {data:data});
    res.render('index', {'user':req.user});
    //console.log(req.user.accessToken);
  });

app.get('/profile',
//  loggedOn.ensureLoggedIn(),
  function(req, res){
  res.render('profile', { user: req.user });
});



app.get( '/auth/facebook/logout',function( request, response ) {
      request.logout();
      response.send( 'Logged out!' );
      //res.redirect('/');
  });

function checkAuth(req, res, next) {
  if (req.isAuthenticated()){
    return next();
  }
  else{
    //return next();  

    res.status(401).send("Failed to authenticate: please login")
  }
}


app.listen(port, function(){
	console.log('Listening:' + port);
});
// uncommment this for a secure server with a self sign cert
// https://docs.nodejitsu.com/articles/HTTP/servers/how-to-create-a-HTTPS-server/

/*
var https = require('https');
var privateKey  = fs.readFileSync('key.pem', 'utf8');
var certificate = fs.readFileSync('cert.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(port);
*/

app.get('*', function(req, res){
    res.status(400).send("Sorry, that page doesn't exist.");
});
