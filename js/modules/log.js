function log() {
  console.log.apply(console,arguments);
}

log.error = function(){
  console.log("\007");
  console.error.apply(console,arguments); 
};

module.exports = log;