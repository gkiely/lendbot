"use strict";



/*===================================
=            NPM Modules            =
===================================*/
var express = require('express');
var bodyParser = require('body-parser');
var graph = require('fbgraph');
var moment = require('moment');
var Nightmare = require('nightmare');
/*=====  End of NPM Modules  ======*/



/*=============================
=            Setup            =
=============================*/
var appId = '1705209346385237';
var appSecret = '63c7c866f46b015b2ba87c1a95496eab';
var userId = '110707496012991';
var pageId = '1668124723450853';
var pageURL = 'https://www.facebook.com/groups/1668124723450853';
var accessToken = 'EAAYO4P1b5VUBAH763rbsqZAkm3bZAmdtG8b1fN0HHiwpoZC54uusZBsmQAUmUe5zrYpCix4IRRZCvFLnB3uHsyT7tffhjZA8i86up7Cffi8RcXIP213Fy7ti5GGkGPYPTjRQgqf3rV6NgiJVonEoHeD02pBjbVX9g6QAUTHLPi8AZDZD';

var app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
var port = 8000;
graph.setVersion('2.6');
graph.setAccessToken(accessToken);
var nightmare = new Nightmare({show: false});
/*=====  End of Setup  ======*/



/*=====================================
=            App Variables            =
=====================================*/
var log = require('./js/modules/log');
var reg = require('./js/nightmare/inject');
/*=====  End of App Variables  ======*/






/*===============================
=            Helpers            =
===============================*/
let handleFbRes = function(res, err, fbres, str){
  return err ? res.send(err) : res.send(str ? str :fbres);
};

let getMoment = function(){
  return moment().format('DD/MM/YYYY h:mm:ss a');
};

let getFbPosts = function(fn, limit = 100){
  graph.get(pageId + '/feed', {limit}, fn);
};

let graphPromise = {
  _reqTypes: ['get', 'post'],
  request: function(url, type, {limit, message}, resolve, reject){
    graph[type](url, {limit, message}, function(err, fbres){
      return err ? reject(err): resolve(fbres);
    });
  },
  get: function(url, {limit} = {limit: 100}){
    return new Promise((resolve, reject) => {
      this.request(url, 'get', {limit}, resolve, reject)
    });
  },
  post: function(url, {message, limit} = {limit: 100}){
    return new Promise((resolve, reject) => {
      this.request(url, 'post', {message, limit}, resolve, reject)
    });
  }
};

/**
 * Array methods
 * Testing: http://jsbin.com/rojewu/edit?js,console
 */
let updateArray = function(obj, arr){
  let i = arr.map(item => item.id).indexOf(obj.id);
  if(i === -1){
    arr.push(obj);
  }
  else{
    arr[i] = obj;
  }
};

let findById = function(obj, arr){
  return arr.find(item => item.id === typeof obj === "object" ? obj.id : obj);
};

/*=====  End of Helpers  ======*/



/*=================================
=            Nightmare            =
=================================*/
let getUserDetails = function(){
  return nightmare
  .goto(pageURL)
  .inject('js', './js/nightmare/inject.js')
  .evaluate(function(){
    let arr = _q('.userContentWrapper');

    arr = arr.filter(function(item, i){
      return reg.borrow.test(item.textContent);
    });

    //-- Find username
    let users = arr.map(function(item, i){
      let links = _q('h5 a[href*=facebook]', item);

      let user = {};
      links.map(function(item, i){
        user.name = item.textContent.trim();
        if(item.textContent){
          user.username = item.href.match(/.com\/([\w.]*)/)[1];
          user.id = item.dataset.hovercard.match(/\?id=(\d*)/)[1];
        }
      });
      return user;
    });
    return users;
  })
  .then(data => data)
  .catch(err => err)
};


/*=====  End of Nightmare  ======*/







/*===========================
=            API            =
===========================*/
app.get('/', function(req, res){
  res.send('hi');
});

/**
 * Extend token
 */
app.get('/extend', function(req, res){
  graph.extendAccessToken({
    "client_id": appId,
    "client_secret": appSecret
  }, function(err, _res){
    console.log(_res);
    res.send('success');
  });
});


/**
 * Post
 */
app.get('/user', function(req, res){
  graph.get('1668124723450853', function(err, fbres){
    handleFbRes(res, err, fbres);
  });
});

app.get('/post', function(req, res){
  var wallPost = {
    message: "{borrow} " + getMoment()
  };

  graph.post(pageId  + '/feed', wallPost, function(err, fbres){
    handleFbRes(res, err, fbres, wallPost.message);
  });
});

app.get('/posts', function(req, res){
  graph.get(pageId + '/feed', function(err, fbres){
    handleFbRes(res, err, fbres);
  });
});

app.get('/userposts', function(req, res){
  getUserPosts()
  .then(data => res.send(data));
});

app.get('/userdetails', function(req, res){
  let userDetails = getUserDetails()
  .then(function(data){
    res.send(data);
  });
});


let getUserPosts = function(){
  return graphPromise.get(pageId + '/feed')
  .then(function(fbres){
    return fbres.data.filter(function(el, i){
      if(!el.story && reg.borrow.test(el.message)){
        return el;
      }
    });
  });
};


let lenderData = [];

let handleRespond = function(user, post){
  let amount = post.message.match(reg.borrow)[1];
  let message;

  // Grant Kiely has asked to borrow $10.00, please enter {lend: 10} to lend
  // Check if already commented


  // Check comments, if no previous borrow post, enter it
  return graphPromise.get(post.id + '/comments')
  .then(fbres => {
    var botComments = fbres.data.filter(item => item.from.name === 'Lend Bot');
    var userComments = fbres.data.filter(item => item.from.name !== 'Lend Bot');
    var lender = {};

    let botBorrowComment = botComments.some(item => {
       return reg.bot.borrowComment.test(item.message);
    });

    let botConfirmComment = botComments.some(item => {
      return reg.bot.confirmComment.test(item.message);
    })

    let lendComments = userComments.filter(item => {
      return reg.user.lend.test(item.message);
    });

    let userConfirmComment;
    let confirmAmount;
    userComments.some(item => {
      if(reg.user.confirm.test(item.message)){
        userConfirmComment = item;
        confirmAmount = item.message.match(reg.user.confirm)[1];
        return true;
      }
    });

    if(lendComments.length){
      lender.id = lendComments[0].from.id;
      lender.name = lendComments[0].from.name;
      lender.amount = lendComments[0].message.match(reg.user.lend)[1];
    }

    if(botConfirmComment){
      return "This post has already been confirmed";
    }
    else{
      if(userConfirmComment){
        message = `CONFIRMED loan for $${confirmAmount} between lender ${lender.name} and borrower ${user.name}.`;
      }
      else if(!botBorrowComment){
        message = `${user.name} has requested to borrow $${amount}, please enter {lend: $${amount}} to lend.`;
      }
      else if(lendComments){
        message = `${lender.name} has lent $${lender.amount} to ${user.name}.
        This does not mean LendBot Tester has received the payment.

        ${user.name} to confirm by entering {confirm: $${amount}, id: ${lender.id}}`;
      }
      return graphPromise.post(post.id + '/comments', {message});
    }
  });
};


/**
 * Get the last {borrow} post and respond to it accordingly
 * reg: https://reg101.com/r/xG7hJ8/1
 */
app.get('/respond', function(req, res){

  // Nightmare and fbgraph to get user details & posts
  Promise.all([getUserDetails(), getUserPosts()])
  .then(function(data){
    var users = data[0];
    var posts = data[1];

    if(users.length !== posts.length){
      // @todo: send error to logging sys/sms
      log.error('Error: users.length !== posts.length');
      return res.send('Lendbot is not working');
    }

    users.map(function(user, i){
      handleRespond(user, posts[i]);
    });
    return res.send('success');
  })
  .catch(err => {
    log('catch', err);
    res.send(err);
  });
});


app.get(['/getcomment','/getcomment/:index'], function(req, res){
  /* Get last post */
  var index = req.params.index || 0;
  graph.get(pageId + '/feed', {limit: 1}, function(err, fbres){
    var lastPost = fbres.data[0];
    var id = lastPost.id;

    graph.get(id + '/comments', function(err, fbres){
      handleFbRes(res, err, fbres);
    });

  });
});

app.get('/deleteall', function(req, res){
  getFbPosts(function(err, fbres){

    var ids = fbres.data.map((item, i) =>{
      return {
        method: 'DELETE', 
        relative_url: item.id
      }
    });
    graph.batch(ids, function(err, fbres){
      handleFbRes(res, err, fbres, 'success');
    });

  });
});



/*=====  End of API  ======*/






/*===============================
=            LendBot            =
===============================*/



/*=====  End of LendBot  ======*/




/**
 * Login to facebook
 */




/**
 * Express init
 */
app.listen(port);
console.log('Server started, listening on localhost:' + port);