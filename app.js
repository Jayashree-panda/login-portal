var createError = require('http-errors');
var express = require('express');
var path = require('path');

var logger = require('morgan');
var session = require('express-session')//allows to create and manage server side cookies.
//cookies can store data in user's browser


var publicRouter=require('./routes/public.js')
var dashboardRouter=require('./routes/dashboard.js')
var usersRouter=require('./routes/users.js')


var okta = require("@okta/okta-sdk-nodejs");
var ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;
var app = express();


var oktaClient = new okta.Client({
  orgUrl: '{https://dev-377701.oktapreview.com}',
  token: '{00AtZLKt3nMaCjWXl__0S2nc5CoEah7eJHbWqC4BNY}'
});

const oidc = new ExpressOIDC({
  issuer: '{https://dev-377701.oktapreview.com}/oauth2/default',
  client_id: '{0oagjm27iokbVVL1n0h7}',
  client_secret: '{qefW8PuEbNT56Up-zxDG32IvjG5D0mCAjg9KVJvf}',
  redirect_uri: 'http://localhost:3000/users/callback',
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login"
    },
    callback: {
      path: "/users/callback",
      defaultRedirect: "/dashboard"
    }
  }
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
	secret:'jrfhgjfhgfysuerihjrfghfjgkrb',
	resave:true,
	saveUninitialized:false
}));


app.use(oidc.router);

app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }

  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
});
function loginRequired(req,res,next){
  if(!req.user)
  {
    return res.status(401).render('unauthenticated')
  }
  next()
}



app.use('/', publicRouter);
app.use('/dashboard',loginRequired, dashboardRouter);
app.use('/users',usersRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get('/test', (req, res) => {
  res.json({ profile: req.user ? req.user.profile : null });
});

module.exports = app;
