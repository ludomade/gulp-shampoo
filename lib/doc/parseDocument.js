"use strict";


const Unboxer = require("./Unboxer");
const { Locale, Node, LocaleCollection } = require("./shampoomodel");
const { formatLocaleArray } = require("../messaging");


function parseGenericCollection(
  createFunction,
  assignFunction,
  node,
  forcedLocale,
  defaultLocale,
  targets
) {
  let nextTargets;

  if (forcedLocale) {
    // if we're in a forced locale, make every target share the same instance
    // of the collection object we're creating for this level
    const sharedCollection = createFunction();
    targets.forEach((target) => {
      assignFunction(target, node.name, sharedCollection);
    });

    // then, given that there's a single instance, reduce the target set to the
    // single (forced) locale
    nextTargets = [ {
      locale: forcedLocale,
      ref: sharedCollection
    } ];

  } else {
    // otherwise, assign a new collection to each locale
    nextTargets = targets.map((target) => {
      const newCollection = createFunction();
      assignFunction(target, node.name, newCollection);

      return {
        locale: target.locale,
        ref: newCollection
      };
    });
  }

  node.children.forEach((child) => {
    parseNode(child, forcedLocale, defaultLocale, nextTargets);
  });
}


const createArray = () => [ ];
const createObject = () => ({ });

function mapSet(target, name, value) {
  target.ref[name] = value;
}

function arrayPush(target, _, value) {
  target.ref.push(value);
}


function parseArrayObjects(node, forcedLocale, defaultLocale, targets) {
  parseGenericCollection(createArray, mapSet, node, forcedLocale, defaultLocale, targets);
}


function parseArrayObjectsGroup(node, forcedLocale, defaultLocale, targets) {
  parseGenericCollection(createObject, arrayPush, node, forcedLocale, defaultLocale, targets);
}


function parseMapping(node, forcedLocale, defaultLocale, targets) {
  parseGenericCollection(createObject, mapSet, node, forcedLocale, defaultLocale, targets);
}


function parsePrimitive(node, forcedLocale, targets) {
  if (forcedLocale) {
    const invariantValue = node.getValueForLocale(forcedLocale);
    targets.forEach((target) => {
      target.ref[node.name] = invariantValue;
    });
  } else {
    targets.forEach((target) => {
      target.ref[node.name] = node.getValueForLocale(target.locale);
    });
  }
}


function filterEnabledTargets(node, targets) {
  if (node.disabledLocaleCount === 0) {
    return targets;
  }
  return targets.filter((target) => node.isEnabledInLocale(target.locale));
}

function parseNode(node, forcedLocale, defaultLocale, targets) {
  // 'forcedLocale' is set to the default locale if we have descended through a
  // node that has 'Disable localization' checked. If it's not set, see if it's
  // checked on this node.
  //
  if (!forcedLocale && node.isLocalizationExcluded) {
    forcedLocale = defaultLocale;
  }

  // If there is no forcedLocale, check instead to see if any locales at this
  // level have been individually disabled, and remove them from the target
  // set. In practice this is only set on nodes with a `controlType` of
  // 'array_objects_group', but having all the locale candidacy logic in one
  // spot for all nodes makes this all easier to reason about.
  //
  // Effectively, forcedLocale overrides per-locale disabling.
  //
  if (!forcedLocale) {
    targets = filterEnabledTargets(node, targets);
  }

  if (targets.length === 0) {
    return;
  }

  if (node.controlType === "array_objects") {
    parseArrayObjects(node, forcedLocale, defaultLocale, targets);
  } else if (node.controlType === "array_objects_group") {
    parseArrayObjectsGroup(node, forcedLocale, defaultLocale, targets);
  } else if (node.children.length > 0) {
    parseMapping(node, forcedLocale, defaultLocale, targets);
  } else {
    parsePrimitive(node, forcedLocale, targets);
  }
}


function parseDocument(realtimeDoc) {
  const messages = [ ];

  const unboxer = new Unboxer().registerTypes({
    locale: (m) => new Locale(m),
    node: (m) => new Node(m)
  });

  const graph = unboxer.unboxDocument(realtimeDoc);
  const locales = new LocaleCollection(graph.locales);

  if (locales.all.length === 0) {
    throw new Error("No locales in document");
  }

  if (locales.defaults.length === 0) {
    messages.push(
      "There is no default locale set. The first one" +
      ` ('${locales.defaultLocale.code}') will be used as the default. Select` +
      " a default locale in the editor to resolve this warning."
    );
  } else if (locales.defaults.length > 1) {
    messages.push(
      "There are multiple default locales: " +
      formatLocaleArray(locales.defaults) +
      `. The first one ('${locales.defaultLocale.code}') will be used as the` +
      " default."
    );
  }

  const localeTargets = locales.all.map((locale) => ({ locale, ref: { } }));

  graph.nodes.forEach((topLevelNode) => {
    parseNode(topLevelNode, null, locales.defaultLocale, localeTargets);
  });

  return {
    messages,
    documents: localeTargets.map((target) => ({
      locale: target.locale,
      values: target.ref
    }))
  };
}


module.exports = parseDocument;
