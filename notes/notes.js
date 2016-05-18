// var Horseman = require('node-horseman');
// var horseman = new Horseman();

// var Browser = require('zombie');
// Browser.localhost('example.com', 3000);


// var Nightmare = require('nightmare');
// var nightmare = Nightmare({show: true})







// nightmare
// .goto('http://yahoo.com')
// // .type('form[action*="/search"] [name=p]', 'github nightmare')
// // .click('form[action*="/search"] [type=submit]')
// // .wait('#main')
// // .evaluate(function () {
// //   return document.querySelector('#main .searchCenterMiddle li a').href
// // })
// // .end()
// .then(function (result) {
//   console.log(result)
// })
// .catch(function (error) {
//   console.error('Search failed:', error);
// });


// nightmare
// .goto('https://www.facebook.com/groups/1668124723450853/')
// .mousedown('.comment_link._5yxe')
// // .insert('._5rpb ._5rpu ._1mf', 'test')
// .then(function(result){
//   console.log(document.activeElement);
//   console.log(result);
// })




// var browser = new Browser();
// browser.debug();


// browser.visit("https://www.facebook.com/groups/1668124723450853/", function() {
//     // console.log(status);
//     browser
//         .fill('#email', 'lendbot@gmail.com')
//         .fill('#pass', '4hjbbst9')
//         .pressButton('Log In', function() {
//             // console.log(err.stack);
//             console.log('>> logged into group')
//             browser.fill('[contenteditable]', 'hi');
//         })
// });

// console.log('loading');
// var url = 'https://www.facebook.com/groups/1668124723450853/';

// horseman
// .userAgent('Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36')
// .open(url)
// .url()
// .then(e => {
//   //== Sign in
//   if(e === url){
//     console.log('Already logged in')
//     return e;
//   }
//   else{
//     console.log('Logging in')
//     return horseman
//     .type('[name="email"]', 'lendbot@gmail.com')
//     .type('[type="password"]', '4hjbbst9')
//   }
// })
// // .type('[contenteditable]:contains(Write something)', 'hi there')
// // .width('[contenteditable]')
// // .click('button:contains(Post)')
// .url()
// .then(e => console.log(e))
// .text('.clearfix')


// // .type('input[name="q"]', 'github')
// // .click('[name="btnK"]')
// // .waitForSelector('div.g')
// // .count('div.g')
// .log() // prints out the number of results
// .close();
