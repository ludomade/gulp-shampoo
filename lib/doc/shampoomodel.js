"use strict";


const { buildLookup, getOwn } = require("../langutil");


class Locale {
  constructor(properties) {
    this.id = String(properties.$id);
    this.code = String(properties.code);
    this.name = String(properties.name);
    this.isActive = Boolean(properties.isActive);

    const options = properties.options || { };
    this.isDefault = Boolean(options.isDefault);
  }
}


const DISABLED = { };
class Node {
  constructor(properties) {
    this.id = String(properties.$id);
    this.name = String(properties.name);
    this.val = properties.val || { };
    this.controlType = String(properties.controlType);
    this.basicArrayType = String(properties.basicArrayType);
    this.children = properties.children || [ ];
    this.description = String(properties.description);

    const options = properties.options || { };
    this.isLocalizationExcluded = Boolean(options.isLocalizationExcluded);

    this._disabledLocaleIds = properties.disabledChildrenLocales || [ ];
    this.disabledLocaleCount = this._disabledLocaleIds.length;

    const lookup = this._disabledLocaleLookup = { };
    this._disabledLocaleIds.forEach((id) => {
      lookup[id] = DISABLED;
    });
  }

  isDisabledInLocale(locale) {
    return locale && this._disabledLocaleLookup[locale.id] === DISABLED;
  }

  isEnabledInLocale(locale) {
    return !this.isDisabledInLocale(locale);
  }

  getValueForLocale(locale) {
    return getOwn(this.val, locale.code, null);
  }
}


class LocaleCollection {
  constructor(arrayOfLocales) {
    this.all = arrayOfLocales || [ ];
    this.defaults = this.all.filter((locale) => locale.isDefault);

    this.defaultLocale = this.defaults[0] || this.all[0];

    this._byId = buildLookup(this.all, "id");
    this._byCode = buildLookup(this.all, "code");
    this._byName = buildLookup(this.all, "name");
  }

  getById(id) {
    return getOwn(this._byId, id);
  }

  getByCode(code) {
    return getOwn(this._byCode, code);
  }

  getByName(name) {
    return getOwn(this._byName, name);
  }
}


module.exports = { Locale, Node, LocaleCollection };
