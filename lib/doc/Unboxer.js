"use strict";


const hasOwn = Object.prototype.hasOwnProperty;


function unboxMapping(_this, box) {
  const result = {
    $id: box.id
  };

  for (const key of Object.keys(box.value)) {
    result[key] = _this.unbox(box.value[key]);
  }

  if (hasOwn.call(_this._typeFunctions, box.type)) {
    const func = _this._typeFunctions[box.type];
    return func(result);
  }

  if (box.type !== "Map") {
    // warn: no registered type of box.type
  }

  return result;
}


class Unboxer {
  constructor() {
    this._typeFunctions = { };
  }

  registerType(typeName, func) {
    if (hasOwn.call(this._typeFunctions, typeName)) {
      throw new Error("Type already registered: '" + typeName + "'");
    }
    this._typeFunctions[typeName] = func;
    return this;
  }

  registerTypes(nameToFuncMapping) {
    for (const typeName of Object.keys(nameToFuncMapping)) {
      this.registerType(typeName, nameToFuncMapping[typeName]);
    }
    return this;
  }

  unboxDocument(document) {
    return this.unbox(document.data);
  }

  unbox(box) {
    const keys = Object.keys(box);

    if (keys.length === 1 && keys[0] === "json") {
      return box.json;
    }

    if (
      keys.length >= 3 &&
      hasOwn.call(box, "id") && typeof box.id === "string" &&
      hasOwn.call(box, "type") && typeof box.type === "string" &&
      hasOwn.call(box, "value")
    ) {
      switch (box.type) {
      case "List":
        {
          const array = box.value.map(this.unbox, this);
          array.$id = box.id;
          return array;
        }

      case "EditableString":
        // we lose the id in this case but who cares
        return box.value;

      default:
        return unboxMapping(this, box);
      }
    }

    return box;
  }
}


module.exports = Unboxer;
