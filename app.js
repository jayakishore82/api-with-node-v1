const express = require('express');
const Twit = require('twit');
const bodyParser = require('body-parser');
const config = require("./config.js");
const moment = require('moment');
const app = express();
const T = new Twit(config);
let twitter = {};

app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static('public'));
app.set('view engine', 'pug');

/* Get the screen name of user.
*/
app.get('/', (req,res,next) => {
    twitter = {};
    T.get('account/settings', (err, data, response) => {
    if (err) {
      next(err);
    }
    twitter.screen_name  = data.screen_name;
    next();
  });

});

/* Get the 5 most recent tweets of the user.
*/
app.get('/',(req,res,next) => {

  T.get('statuses/user_timeline', {count:5 }, (err, data, response) => {
      if (err) {
        next(err);
      }
      twitter.tweets = [];
      let tweetdata = {};
      let text = '';
      let time = '';
      let likes = 0;
      let retweet = 0;
      let imageurl = "";

      twitter.name = data[0].user.name;
      twitter.imageurl = data[0].user.profile_image_url;

      for(let i = 0; i<5; i++) {
         text = data[i].text;
         time = moment.utc(data[i].created_at, 'dd MMM DD HH:mm:ss ZZ YYYY').fromNow();
         retweet = data[i].retweet_count;

         if (data[i].retweeted_status) {
           likes = data[i].retweeted_status.favorite_count;
         }
         else{
           likes = data[i].favorite_count;
         }

         tweetdata = { text,time,likes,retweet } ;
         twitter.tweets.push(tweetdata);

      }
        next();
    });

});

/* Get the the details of 5 friends of the user.
*/
app.get('/',(req,res,next) => {

  T.get('friends/list', {count:5 }, (err, data, response) => {
      if (err) {
        next(err);
      }

      twitter.friends = [];
      let frienddata = {};
      for(let i=0; i<5; i++) {
        frienddata = {name :data.users[i].name, screen_name: data.users[i].screen_name,
        image_url: data.users[i].profile_image_url  }
        twitter.friends.push(frienddata);
      }

      next();
    });

});

/* Get the the details of 5 recent direct messages sent by the user.
*/
app.get('/', (req,res,next) => {
  T.get('direct_messages/sent', {count:5}, (err, data, response) => {
    if (err) {
      next(err);
    }
    twitter.messages = [];
    let msgdata = {};
    let time = '';
    twitter.background_image = data[0].sender.profile_banner_url;

    for(let i=0; i<5; i++) {
      time = moment.utc(data[i].created_at, 'dd MMM DD HH:mm:ss ZZ YYYY').fromNow();
      msgdata = {msgtext: data[i].text, time: time}
      twitter.messages.push(msgdata);
    }

/******Rendering the page************/
    res.render('index', twitter);
  });

});

/* Posting a tweet and redirecting to the root route
*/
app.post('/tweet', (req,res,next) => {
  T.post('statuses/update', {status:req.body.tweettext}, (err, data, response) => {
    if (err) {
      next(err);
    }
    res.redirect('/');
  });

});

/* Handling page not found error
*/
app.use((req, res, next) => {
  const err = new Error();
  err.message = 'Not Found';
  err.statusCode = 404;
  next(err);
});

/*Rendering the error page
*/
app.use((err,req,res,next) =>{
    res.render('error',err);
});

app.listen(3000, () =>{
    console.log("The application is running on port 3000");
});
