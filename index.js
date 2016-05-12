"use strict";

/**
 * Modules
 */
// var path       = require('path');
var dateTime   = new require('date-time');
var cors       = require('cors');
var bodyParser = require('body-parser');
var express    = require('express');
// var moment     = require('moment');
var pgp        = require('pg-promise')();
var publicIp   = require('public-ip');
var uuid       = require('uuid');
var UAParser   = require('ua-parser-js');


/**
 * Settings
 */
var port      = 8002;

//== Postgres settings
var cn = {
  host: 'localhost',
  port: 5432,
  database: 'sample_db',
  user: 'grantkiely',
  password: null
};


/**
 * Instances
 */
var app         = express();
var router      = express.Router();
var parser      = new UAParser();
var db          = pgp(cn);




/*===============================
=            Methods            =
===============================*/
let getUserData = function(req){
  var ua = req.headers['user-agent'];
  var uaResult = parser.setUA(ua).getResult();

  return{
    browser: {
      name: uaResult.browser.name,
      version: uaResult.browser.major
    },
    os: {
      name: uaResult.os.name,
      version: uaResult.os.version
    },
    date: dateTime(),
    origin: req.headers.origin
  }
};

let publicIpPromise = function(){
  return new Promise(function(resolve, reject){
    publicIp(function(err, ip){
      return ip ? resolve(ip) : reject(err);
    });
  });
};

let handleExistingUser = function(data, res){
    res.send({id: data.id});
};

let handleNewUser = function(req,res){
  let user = getUserData(req);
  
  return publicIpPromise()
  .then(function(data){
    user.ip = data;
    user.id = uuid.v4();
    return db.query('INSERT INTO users (id, ip, browser, screenSizeX, screenSizeY) VALUES ($1, $2, $3, $4, $5)', [
      user.id, user.ip, user.browser.name, 300, 700
    ])
  })
  .then(function(){
    res.send({id: user.id});
  })
  .catch(function(err){
    if(err.code === "ECONNREFUSED"){
      err.errorDetails = 'Postgres has not been turned on';
    }
    if(err.message){
      res.status(500).send(err);
    }
    console.error(err);
    //@todo: >> log server error
  })
};

let findExistingUser = function(id){
  return db.one('SELECT * FROM users where id=$1', id);
};

let handleQuery = function(res, query, count){
  return query
  .then(function(data){
    if(count){
      res.send(data[0].count);
    }
    else{
      res.send(data);
    }
  })
  .catch(e => {
    fireError(res, e.message);
  });
};

let fireError = function(res, msg, code = 500){
  res.status(code)
  .send({message: msg})
};

// ==== End of Methods ====




/*=====================================
=            Server Config            =
=====================================*/
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));




/*==================================
=            Routes/api            =
==================================*/
router.use(function(req, res, next){
  console.log('node.js request received.');
  next();
});

app.get('/', function(req, res){
  res.json({msg: 'huzzaa'});
});

/**
 * User verfiy
 */
router.post('/user', function(req, res, next){
  let reqb = req.body;
  var query;
  if(reqb.id){
    // do a search for user id 
    query = findExistingUser(reqb.id);
  }
  else{
    query = Promise.resolve();
  }


  query.then(function(data){
    if(data){
      handleExistingUser(data, res);
    }
    else{
      handleNewUser(req, res);
    }
  })
  .catch(function(err){
    next(err);
  })
});

/**
 * Create log
 */
router.post('/logs', function(req, res){
  var guid = uuid.v4()
  var reqb = req.body;
  var query = findExistingUser(reqb.id);


  query.then(function(data){
    if(data){
      //== User found 
      //== Add log
      return db.query('INSERT INTO logs (id, msg, type, url, stacktrace, userid) VALUES ($1,$2, $3, $4, $5, $6)', [
        guid, reqb.msg, reqb.type, reqb.url, reqb.stacktrace, data.id
      ]);
    }
    else{
      //@todo: handle user not found when posted log
      //== User not found
      //== Create new and add log
    }
  })
  .then(function(data){
    res.send({success: true, msg: reqb.msg});
  })
  .catch(function(err){
    //@todo: Log error to server

    res.send(err);
  })
});


/**
 * Read logs
 */
router.get('/logs', function(req, res){
  let query = db.query("select * from logs limit 100");
  handleQuery(res, query);
});


router.post('/logs/date', function(req, res){
  let reqb = req.body;
  let query;

  //-- Get logs by date range
  if(reqb.startDate && reqb.endDate){
    query = db.query("select * from logs where logdate >=$1 AND logdate <=$2", reqb.startDate, reqb.endDate);
  }
  else if(reqb.startDate){
    query = db.query("select * from logs where logdate >=$1", reqb.startDate);
  }
  else if(reqb.endDate){
    query = db.query("select * from logs where logdate <=$1", reqb.endDate);
  }

  if(query){
    handleQuery(res, query);
  }
  else{
    fireError(res, 'No startDate or endDate passed to logs/date');
  }
});

router.post('/logs/perPage', function(req, res){
  let reqb = req.body;
  let query;

  
  if(reqb.startDate && reqb.endDate){
    query = db.query("select url from logs where logdate >=$1 AND logdate <=$2 GROUP BY url", reqb.startDate, reqb.endDate);
  }
  else if(reqb.startDate){
    query = db.query("select url from logs where logdate >=$1 GROUP BY url", reqb.startDate);
  }
  else if(reqb.endDate){
    query = db.query("select url from logs where logdate <=$1 GROUP BY url", reqb.endDate);
  }

  if(query){
    handleQuery(res, query);
  }
  else{
    fireError(res, 'No startDate or endDate passed to logs/date')
  }
});

router.post('/logs/newErrors', function(req, res){
  let reqb = req.body;
  let query;

  
  if(reqb.startDate && reqb.endDate){
    query = db.query("select  from logs where logdate >=$1 AND logdate <=$2 GROUP BY url", reqb.startDate, reqb.endDate);
  }
  else if(reqb.startDate){
    query = db.query(`
      select distinct msg from logs where logdate > $1 AND msg NOT IN (
        SELECT distinct msg from logs where logdate < $1
      )
    `, reqb.startDate);
  }
  else if(reqb.endDate){
    query = db.query("select url from logs where logdate <=$1 GROUP BY url", reqb.endDate);
  }
  if(query){
    handleQuery(res, query);
  }
  else{
    fireError(res, 'No startDate or endDate passed to logs/date')
  }
});


/**
 * Read logs by id
 */
router.get('/logs/:id', function(req, res){
  var query = db.query('select * from logs where id=$1', req.params.id)
  handleQuery(res, query);
});

/**
 * Update log
 */
router.put('/logs/:id', function(req, res){
  // let query = db.query('update logs set type="warn" where id=', req.params.id)
  // handleQuery(res, query)
});



/*=====================================
=            Admin Section            =
=====================================*/
/**
 * Delete log
 */
router.delete('/logs/:id', function(req, res){
  let query = db.query('delete from logs where id=$1', req.params.id)
  handleQuery(query);
});

router.delete('/logs', function(req, res){
  let query = db.query('delete from logs')
  handleQuery(query);
});


/**
 * Get pageviews
 * @return {array}
 */
router.get('/pageviews', function(req, res){
  let reqb = req.query;
  let query;

  if(reqb.startDate && reqb.endDate){
    query = db.query(`select ${reqb.count ? 'count(url)' : 'url'} from pageviews where _date >=$1 AND _date <=$2`, reqb.startDate, reqb.endDate);
  }
  else if(reqb.startDate){
    query = db.query(`select ${reqb.count ? 'count(url)' : 'url'} from pageviews where _date >=$1`, reqb.startDate);
  }
  else if(reqb.endDate){
    query = db.query(`select ${reqb.count ? 'count(url)' : 'url'} from pageviews where _date <=$1`, reqb.endDate);
  }
  handleQuery(res, query, reqb.count);
});

/**
 * Save Pageviews
 */
router.post('/pageviews', function(req, res){
  var reqb = req.body;
  var query = db.query('INSERT INTO pageviews (url) VALUES ($1)', [reqb.url])
  handleQuery(res, query);
});


/*=====  End of Admin  ======*/




/*==============================
=            Server            =
==============================*/

//== Bind router
app.use('/api', router);

//== Error handler
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send(err);
})

//== Launch Server
app.listen(port);
console.log('Server started, listening on localhost:' + port);





