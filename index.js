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



var show = false;
var nightmare = new Nightmare({show});




nightmare
.goto('https://www.facebook.com/groups/1668124723450853')
.evaluate(function(){

  var _q = function(query, parent = document){
    return [].slice.call(parent.querySelectorAll(query), 0);
  };

  var arr = _q('.userContentWrapper');

  arr = arr.filter(function(item, i){
    return /\s?{\s?borrow:?\s\$?(\d*\.?\d*)}/gi.test(item.textContent);
  });

  //-- Find username
  var str = 'Last {borrow} was by: ';
  arr.filter(function(item, i){
    var links = _q('.userContentWrapper a[href*=facebook]', item);

    links.map(function(item, i){
      //-- @todo: write tests to make sure this returns user val
      str += item.textContent.trim();
      if(item.textContent){
        str += ', username is: ';
        str += item.href.match(/.com\/([\w.]*)/)[1];
        str += ', id is: ';
        str += item.dataset.hovercard.match(/\?id=(\d*)/)[1];
      }
    });
  });
  return str;
})
.run(function(err, data){
  console.log(data);
})
.end()

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

let getFbPosts = function(fn, limit = 100){
  graph.get(pageId + '/feed', {limit}, fn);
};

let getFbPostsPromise = function(limit = 100){
  return new Promise(function(resolve, reject){
    graph.get(pageId + '/feed', {limit}, function(err, fbres){
      return err ? resolve(fbres) : reject(err);
    });
  });
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

app.get('/read', function(req, res){
  graph.get(pageId + '/feed', {limit: 100}, function(err, fbres){
    handleFbRes(res, err, fbres);
  });
});


/**
 * Checks last post/comments and responds
 * regex: https://regex101.com/r/xG7hJ8/1
 */
app.get('/respond', function(req, res){
  graph.get(pageId + '/feed', {limit: 10}, function(err, fbres){
    var lastPost = fbres.data[1];
    var message;

    // Borrow post
    // Comment on borrow
    if(/\s?{\s?borrow:?\s\$?(\d*\.?\d*)}/gi.test(lastPost.message)){

      // Get username
      //== This might be tricky/require some scraping
      //== http://stackoverflow.com/questions/23428498/get-username-field-in-facebook-graph-api-2-0
      


      // Get amount
      // Respond
      message = "{borrow} detected " + getMoment();
    }
    else{
      message = "other comment " + getMoment();
    }

    // graph.post(lastPost.id + '/comments', {message}, function(err, fbres){
    //   handleFbRes(res, err, fbres);
    // });
    res.send(lastPost);
  });
});


app.get(['/getcomment','/getcomment/:index'], function(req, res){
  /* Get last post */
  var index = req.params.index || 0;
  graph.get(pageId + '/feed', {limit: 1}, function(err, fbres){
    var lastPost = fbres.data[0];
    var id = lastPost.id;
    graph.get(id + '/comments', function(err, fbres){
      var comment = fbres.data[index];
      handleFbRes(res, err, fbres, comment ? comment.message : "");
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