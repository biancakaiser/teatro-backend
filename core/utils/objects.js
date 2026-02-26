function fromEntries(entries) {
  const object = {};
  entries.forEach(([key, value]) => (object[key] = value));
  return object;
}

/** filtra as propriedades de um objeto, retornando um novo objeto **/
function filterProperties(object, properties) {
  return fromEntries(
    Object.entries(object) //
      .filter(([key, _]) => properties.includes(key)),
  );
}

function flattenEntities(object) {
  const outObject = {};
  Object.entries(object).forEach(([key, value]) => {
    const fields = key.split("_");
    let ref = outObject;
    if (fields.length > 1) {
      for (let index = 0; index < fields.length; index++) {
        const field = fields[index];
        if (index + 1 === fields.length) {
          ref[field] = value;
        } else if (!(field in ref)) {
          ref[field] = {};
        }
        ref = ref[field];
      }
    } else {
      ref[key] = value;
    }
  })

  return outObject;
}

module.exports = {
  filterProperties,
  flattenEntities,
  fromEntries,
};
