if(typeof window === "undefined"){
  window = {};
  window._isNodeJS = true;
}

window.reg = {
  borrow: /\s*{\s*borrow:\s*\$?(\d*\.?\d*)}/i,
  user:{
    lend: /{\s*lend:\s*\$?(\d*)\s*}/i,
    confirm: /{\s*confirm:\s*\$?([\d,.]*)\s*id:\s*\d*}/i
  },
  bot:{
    borrowComment: /requested to borrow [$\d,.]* please enter {lend:\s*[$\d,.]*} to lend./i,
    confirmComment: /CONFIRMED/
  }
};
window._q = function(query, parent = document){
  return [].slice.call(parent.querySelectorAll(query), 0);
};

if(window._isNodeJS){
  module.exports = window.reg;
}