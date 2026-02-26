/** Define a função flatMap para versões antigas do node **/
function flatMap(array, callback) {
  return [].concat(...array.map(callback));
}

module.exports = {
  flatMap,
};
