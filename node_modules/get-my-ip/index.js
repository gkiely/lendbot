var os = require('os')

module.exports = function(){
  var interfaces = os.networkInterfaces()
  for (var name in interfaces){
    var ips = interfaces[name]
    var ip = ips.filter(function(ip){
      return ip.family === 'IPv4'
    })[0]
    if (ip){
      if (ip.internal) continue
      return ip.address
    }
  }
}