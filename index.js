"use strict";



/*===================================
=            NPM Modules            =
===================================*/
var express = require('express');
var bodyParser = require('body-parser');
var graph = require('fbgraph');
var moment = require('moment');


/*=====  End of NPM Modules  ======*/



/*=============================
=            Setup            =
=============================*/
var app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
var port = 8000;
graph.setVersion('2.6');
var appId = '1705209346385237';
var appSecret = '63c7c866f46b015b2ba87c1a95496eab';
var accessToken = 'EAAYO4P1b5VUBAH763rbsqZAkm3bZAmdtG8b1fN0HHiwpoZC54uusZBsmQAUmUe5zrYpCix4IRRZCvFLnB3uHsyT7tffhjZA8i86up7Cffi8RcXIP213Fy7ti5GGkGPYPTjRQgqf3rV6NgiJVonEoHeD02pBjbVX9g6QAUTHLPi8AZDZD';
var userId = '110707496012991';
var pageId = '1668124723450853';
graph.setAccessToken(accessToken);
/*=====  End of Setup  ======*/


/*===============================
=            Helpers            =
===============================*/
let handleFbRes = function(res, err, fbres, str){
  return err ? res.send(err) : res.send(str ? str :fbres);
};

let getMoment = function(){
  return moment().format('DD/MM/YYYY h:mm:ss a');
};

/*=====  End of Helpers  ======*/





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
app.get('/post', function(req, res){
  var wallPost = {
    message: "{borrow} " + getMoment()
  };

  graph.post(pageId  + '/feed', wallPost, function(err, fbres){
    handleFbRes(res, err, fbres, wallPost.message);
  });
});

app.get('/read', function(req, res){
  graph.get(pageId + '/feed', {limit: 100}, function(err, fbres){
    handleFbRes(res, err, fbres);
  });
});


/**
 * Comment on post
 */
app.get('/postcomment', function(req, res){
  graph.get(pageId + '/feed', {limit: 100}, function(err, fbres){
    var lastPost = fbres.data[0];

    // Borrow post
    // Comment on borrow
    if(lastPost.message.includes('{borrow}')){
      // Check existing comments
      graph.post(lastPost.id + '/comments', {message: '{borrow} detected'}, function(err, fbres){
        handleFbRes(res, err, fbres);
      });
    }
    else{
      // Other post
    }
  });
});


app.get('/getcomment', function(req, res){
  /* Get last post */
  graph.get(pageId + '/feed', {limit: 1}, function(err, fbres){
    var lastPost = fbres.data[0];
    var id = lastPost.id;

    graph.post(id, 'asdf')
    .post
    res.send(lastPost);

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