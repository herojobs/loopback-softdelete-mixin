'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends6 = require('babel-runtime/helpers/extends');

var _extends7 = _interopRequireDefault(_extends6);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _debug2 = require('./debug');

var _debug3 = _interopRequireDefault(_debug2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)();

exports.default = function (Model, _ref) {
  var _ref$deletedAt = _ref.deletedAt,
      deletedAt = _ref$deletedAt === undefined ? 'deletedAt' : _ref$deletedAt,
      _ref$_isDeleted = _ref._isDeleted,
      _isDeleted = _ref$_isDeleted === undefined ? '_isDeleted' : _ref$_isDeleted,
      _ref$scrub = _ref.scrub,
      scrub = _ref$scrub === undefined ? false : _ref$scrub;

  debug('SoftDelete mixin for Model %s', Model.modelName);

  debug('options', { deletedAt: deletedAt, _isDeleted: _isDeleted, scrub: scrub });

  var properties = Model.definition.properties;

  var scrubbed = {};
  if (scrub !== false) {
    var propertiesToScrub = scrub;
    if (!Array.isArray(propertiesToScrub)) {
      propertiesToScrub = (0, _keys2.default)(properties).filter(function (prop) {
        return !properties[prop].id && prop !== _isDeleted;
      });
    }
    scrubbed = propertiesToScrub.reduce(function (obj, prop) {
      return (0, _extends7.default)({}, obj, (0, _defineProperty3.default)({}, prop, null));
    }, {});
  }

  Model.defineProperty(deletedAt, { type: Date, required: false });
  Model.defineProperty(_isDeleted, { type: Boolean, required: true, default: false });

  Model.destroyAll = function softDestroyAll(where, cb) {
    var _extends3;

    return Model.updateAll(where, (0, _extends7.default)({}, scrubbed, (_extends3 = {}, (0, _defineProperty3.default)(_extends3, deletedAt, new Date()), (0, _defineProperty3.default)(_extends3, _isDeleted, true), _extends3))).then(function (result) {
      return typeof cb === 'function' ? cb(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? cb(error) : _promise2.default.reject(error);
    });
  };

  Model.remove = Model.destroyAll;
  Model.deleteAll = Model.destroyAll;

  Model.destroyById = function softDestroyById(id, cb) {
    var _extends4;

    return Model.updateAll({ id: id }, (0, _extends7.default)({}, scrubbed, (_extends4 = {}, (0, _defineProperty3.default)(_extends4, deletedAt, new Date()), (0, _defineProperty3.default)(_extends4, _isDeleted, true), _extends4))).then(function (result) {
      return typeof cb === 'function' ? cb(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? cb(error) : _promise2.default.reject(error);
    });
  };

  Model.removeById = Model.destroyById;
  Model.deleteById = Model.destroyById;

  Model.prototype.destroy = function softDestroy(options, cb) {
    var _extends5;

    var callback = cb === undefined && typeof options === 'function' ? options : cb;

    return this.updateAttributes((0, _extends7.default)({}, scrubbed, (_extends5 = {}, (0, _defineProperty3.default)(_extends5, deletedAt, new Date()), (0, _defineProperty3.default)(_extends5, _isDeleted, true), _extends5))).then(function (result) {
      return typeof cb === 'function' ? callback(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? callback(error) : _promise2.default.reject(error);
    });
  };

  Model.prototype.remove = Model.prototype.destroy;
  Model.prototype.delete = Model.prototype.destroy;

  // Emulate default scope but with more flexibility.
  var queryNonDeleted = {
    or: [{ _isDeleted: { neq: true } }]
  };

  var _findOrCreate = Model.findOrCreate;
  Model.findOrCreate = function findOrCreateDeleted() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!query.deleted) {
      if (!query.where) {
        query.where = queryNonDeleted;
      } else {
        query.where = { and: [query.where, queryNonDeleted] };
      }
    }

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return _findOrCreate.call.apply(_findOrCreate, [Model, query].concat(rest));
  };

  var _find = Model.find;
  Model.find = function findDeleted() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!query.deleted) {
      if (!query.where) {
        query.where = queryNonDeleted;
      } else {
        query.where = { and: [query.where, queryNonDeleted] };
      }
    }

    for (var _len2 = arguments.length, rest = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      rest[_key2 - 1] = arguments[_key2];
    }

    return _find.call.apply(_find, [Model, query].concat(rest));
  };

  var _count = Model.count;
  Model.count = function countDeleted() {
    var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Because count only receives a 'where', there's nowhere to ask for the deleted entities.
    var whereNotDeleted = { and: [where, queryNonDeleted] };

    for (var _len3 = arguments.length, rest = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      rest[_key3 - 1] = arguments[_key3];
    }

    return _count.call.apply(_count, [Model, whereNotDeleted].concat(rest));
  };

  var _update = Model.update;
  Model.update = Model.updateAll = function updateDeleted() {
    var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Because update/updateAll only receives a 'where', there's nowhere to ask for the deleted entities.
    var whereNotDeleted = { and: [where, queryNonDeleted] };

    for (var _len4 = arguments.length, rest = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      rest[_key4 - 1] = arguments[_key4];
    }

    return _update.call.apply(_update, [Model, whereNotDeleted].concat(rest));
  };
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvZnQtZGVsZXRlLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwiTW9kZWwiLCJkZWxldGVkQXQiLCJfaXNEZWxldGVkIiwic2NydWIiLCJtb2RlbE5hbWUiLCJwcm9wZXJ0aWVzIiwiZGVmaW5pdGlvbiIsInNjcnViYmVkIiwicHJvcGVydGllc1RvU2NydWIiLCJBcnJheSIsImlzQXJyYXkiLCJmaWx0ZXIiLCJwcm9wIiwiaWQiLCJyZWR1Y2UiLCJvYmoiLCJkZWZpbmVQcm9wZXJ0eSIsInR5cGUiLCJEYXRlIiwicmVxdWlyZWQiLCJCb29sZWFuIiwiZGVmYXVsdCIsImRlc3Ryb3lBbGwiLCJzb2Z0RGVzdHJveUFsbCIsIndoZXJlIiwiY2IiLCJ1cGRhdGVBbGwiLCJ0aGVuIiwicmVzdWx0IiwiY2F0Y2giLCJlcnJvciIsInJlamVjdCIsInJlbW92ZSIsImRlbGV0ZUFsbCIsImRlc3Ryb3lCeUlkIiwic29mdERlc3Ryb3lCeUlkIiwicmVtb3ZlQnlJZCIsImRlbGV0ZUJ5SWQiLCJwcm90b3R5cGUiLCJkZXN0cm95Iiwic29mdERlc3Ryb3kiLCJvcHRpb25zIiwiY2FsbGJhY2siLCJ1bmRlZmluZWQiLCJ1cGRhdGVBdHRyaWJ1dGVzIiwiZGVsZXRlIiwicXVlcnlOb25EZWxldGVkIiwib3IiLCJuZXEiLCJfZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlRGVsZXRlZCIsInF1ZXJ5IiwiZGVsZXRlZCIsImFuZCIsInJlc3QiLCJjYWxsIiwiX2ZpbmQiLCJmaW5kIiwiZmluZERlbGV0ZWQiLCJfY291bnQiLCJjb3VudCIsImNvdW50RGVsZXRlZCIsIndoZXJlTm90RGVsZXRlZCIsIl91cGRhdGUiLCJ1cGRhdGUiLCJ1cGRhdGVEZWxldGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7OztBQUNBLElBQU1BLFFBQVEsc0JBQWQ7O2tCQUVlLFVBQUNDLEtBQUQsUUFBa0Y7QUFBQSw0QkFBeEVDLFNBQXdF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LEtBQUYsRUFBU3NCLGVBQVQsQ0FBUCxFQUF4Qjs7QUFGdUQsdUNBQU5TLElBQU07QUFBTkEsVUFBTTtBQUFBOztBQUd2RCxXQUFPSyxPQUFPSixJQUFQLGdCQUFZeEQsS0FBWixFQUFtQitELGVBQW5CLFNBQXVDUixJQUF2QyxFQUFQO0FBQ0QsR0FKRDs7QUFNQSxNQUFNUyxVQUFVaEUsTUFBTWlFLE1BQXRCO0FBQ0FqRSxRQUFNaUUsTUFBTixHQUFlakUsTUFBTTBCLFNBQU4sR0FBa0IsU0FBU3dDLGFBQVQsR0FBNEM7QUFBQSxRQUFyQjFDLEtBQXFCLHVFQUFiLEVBQWE7O0FBQzNFO0FBQ0EsUUFBTXVDLGtCQUFrQixFQUFFVCxLQUFLLENBQUU5QixLQUFGLEVBQVNzQixlQUFULENBQVAsRUFBeEI7O0FBRjJFLHVDQUFOUyxJQUFNO0FBQU5BLFVBQU07QUFBQTs7QUFHM0UsV0FBT1MsUUFBUVIsSUFBUixpQkFBYXhELEtBQWIsRUFBb0IrRCxlQUFwQixTQUF3Q1IsSUFBeEMsRUFBUDtBQUNELEdBSkQ7QUFLRCxDIiwiZmlsZSI6InNvZnQtZGVsZXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF9kZWJ1ZyBmcm9tICcuL2RlYnVnJztcbmNvbnN0IGRlYnVnID0gX2RlYnVnKCk7XG5cbmV4cG9ydCBkZWZhdWx0IChNb2RlbCwgeyBkZWxldGVkQXQgPSAnZGVsZXRlZEF0JywgX2lzRGVsZXRlZCA9ICdfaXNEZWxldGVkJywgc2NydWIgPSBmYWxzZSB9KSA9PiB7XG4gIGRlYnVnKCdTb2Z0RGVsZXRlIG1peGluIGZvciBNb2RlbCAlcycsIE1vZGVsLm1vZGVsTmFtZSk7XG5cbiAgZGVidWcoJ29wdGlvbnMnLCB7IGRlbGV0ZWRBdCwgX2lzRGVsZXRlZCwgc2NydWIgfSk7XG5cbiAgY29uc3QgcHJvcGVydGllcyA9IE1vZGVsLmRlZmluaXRpb24ucHJvcGVydGllcztcblxuICBsZXQgc2NydWJiZWQgPSB7fTtcbiAgaWYgKHNjcnViICE9PSBmYWxzZSkge1xuICAgIGxldCBwcm9wZXJ0aWVzVG9TY3J1YiA9IHNjcnViO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9wZXJ0aWVzVG9TY3J1YikpIHtcbiAgICAgIHByb3BlcnRpZXNUb1NjcnViID0gT2JqZWN0LmtleXMocHJvcGVydGllcylcbiAgICAgICAgLmZpbHRlcihwcm9wID0+ICFwcm9wZXJ0aWVzW3Byb3BdLmlkICYmIHByb3AgIT09IF9pc0RlbGV0ZWQpO1xuICAgIH1cbiAgICBzY3J1YmJlZCA9IHByb3BlcnRpZXNUb1NjcnViLnJlZHVjZSgob2JqLCBwcm9wKSA9PiAoeyAuLi5vYmosIFtwcm9wXTogbnVsbCB9KSwge30pO1xuICB9XG5cbiAgTW9kZWwuZGVmaW5lUHJvcGVydHkoZGVsZXRlZEF0LCB7dHlwZTogRGF0ZSwgcmVxdWlyZWQ6IGZhbHNlfSk7XG4gIE1vZGVsLmRlZmluZVByb3BlcnR5KF9pc0RlbGV0ZWQsIHt0eXBlOiBCb29sZWFuLCByZXF1aXJlZDogdHJ1ZSwgZGVmYXVsdDogZmFsc2V9KTtcblxuICBNb2RlbC5kZXN0cm95QWxsID0gZnVuY3Rpb24gc29mdERlc3Ryb3lBbGwod2hlcmUsIGNiKSB7XG4gICAgcmV0dXJuIE1vZGVsLnVwZGF0ZUFsbCh3aGVyZSwgeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucmVtb3ZlID0gTW9kZWwuZGVzdHJveUFsbDtcbiAgTW9kZWwuZGVsZXRlQWxsID0gTW9kZWwuZGVzdHJveUFsbDtcblxuICBNb2RlbC5kZXN0cm95QnlJZCA9IGZ1bmN0aW9uIHNvZnREZXN0cm95QnlJZChpZCwgY2IpIHtcbiAgICByZXR1cm4gTW9kZWwudXBkYXRlQWxsKHsgaWQ6IGlkIH0sIHsgLi4uc2NydWJiZWQsIFtkZWxldGVkQXRdOiBuZXcgRGF0ZSgpLCBbX2lzRGVsZXRlZF06IHRydWUgfSlcbiAgICAgIC50aGVuKHJlc3VsdCA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKG51bGwsIHJlc3VsdCkgOiByZXN1bHQpXG4gICAgICAuY2F0Y2goZXJyb3IgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYihlcnJvcikgOiBQcm9taXNlLnJlamVjdChlcnJvcikpO1xuICB9O1xuXG4gIE1vZGVsLnJlbW92ZUJ5SWQgPSBNb2RlbC5kZXN0cm95QnlJZDtcbiAgTW9kZWwuZGVsZXRlQnlJZCA9IE1vZGVsLmRlc3Ryb3lCeUlkO1xuXG4gIE1vZGVsLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gc29mdERlc3Ryb3kob3B0aW9ucywgY2IpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9IChjYiA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSA/IG9wdGlvbnMgOiBjYjtcblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZUF0dHJpYnV0ZXMoeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2FsbGJhY2sobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNhbGxiYWNrKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucHJvdG90eXBlLnJlbW92ZSA9IE1vZGVsLnByb3RvdHlwZS5kZXN0cm95O1xuICBNb2RlbC5wcm90b3R5cGUuZGVsZXRlID0gTW9kZWwucHJvdG90eXBlLmRlc3Ryb3k7XG5cbiAgLy8gRW11bGF0ZSBkZWZhdWx0IHNjb3BlIGJ1dCB3aXRoIG1vcmUgZmxleGliaWxpdHkuXG4gIGNvbnN0IHF1ZXJ5Tm9uRGVsZXRlZCA9IHtcbiAgICBvcjogW1xuICAgICAgeyBfaXNEZWxldGVkOiB7IG5lcTogdHJ1ZSB9IH0sXG4gICAgXSxcbiAgfTtcblxuICBjb25zdCBfZmluZE9yQ3JlYXRlID0gTW9kZWwuZmluZE9yQ3JlYXRlO1xuICBNb2RlbC5maW5kT3JDcmVhdGUgPSBmdW5jdGlvbiBmaW5kT3JDcmVhdGVEZWxldGVkKHF1ZXJ5ID0ge30sIC4uLnJlc3QpIHtcbiAgICBpZiAoIXF1ZXJ5LmRlbGV0ZWQpIHtcbiAgICAgIGlmICghcXVlcnkud2hlcmUpIHtcbiAgICAgICAgcXVlcnkud2hlcmUgPSBxdWVyeU5vbkRlbGV0ZWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxdWVyeS53aGVyZSA9IHsgYW5kOiBbIHF1ZXJ5LndoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBfZmluZE9yQ3JlYXRlLmNhbGwoTW9kZWwsIHF1ZXJ5LCAuLi5yZXN0KTtcbiAgfTtcblxuICBjb25zdCBfZmluZCA9IE1vZGVsLmZpbmQ7XG4gIE1vZGVsLmZpbmQgPSBmdW5jdGlvbiBmaW5kRGVsZXRlZChxdWVyeSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgaWYgKCFxdWVyeS5kZWxldGVkKSB7XG4gICAgICBpZiAoIXF1ZXJ5LndoZXJlKSB7XG4gICAgICAgIHF1ZXJ5LndoZXJlID0gcXVlcnlOb25EZWxldGVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlcnkud2hlcmUgPSB7IGFuZDogWyBxdWVyeS53aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gX2ZpbmQuY2FsbChNb2RlbCwgcXVlcnksIC4uLnJlc3QpO1xuICB9O1xuXG4gIGNvbnN0IF9jb3VudCA9IE1vZGVsLmNvdW50O1xuICBNb2RlbC5jb3VudCA9IGZ1bmN0aW9uIGNvdW50RGVsZXRlZCh3aGVyZSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgLy8gQmVjYXVzZSBjb3VudCBvbmx5IHJlY2VpdmVzIGEgJ3doZXJlJywgdGhlcmUncyBub3doZXJlIHRvIGFzayBmb3IgdGhlIGRlbGV0ZWQgZW50aXRpZXMuXG4gICAgY29uc3Qgd2hlcmVOb3REZWxldGVkID0geyBhbmQ6IFsgd2hlcmUsIHF1ZXJ5Tm9uRGVsZXRlZCBdIH07XG4gICAgcmV0dXJuIF9jb3VudC5jYWxsKE1vZGVsLCB3aGVyZU5vdERlbGV0ZWQsIC4uLnJlc3QpO1xuICB9O1xuXG4gIGNvbnN0IF91cGRhdGUgPSBNb2RlbC51cGRhdGU7XG4gIE1vZGVsLnVwZGF0ZSA9IE1vZGVsLnVwZGF0ZUFsbCA9IGZ1bmN0aW9uIHVwZGF0ZURlbGV0ZWQod2hlcmUgPSB7fSwgLi4ucmVzdCkge1xuICAgIC8vIEJlY2F1c2UgdXBkYXRlL3VwZGF0ZUFsbCBvbmx5IHJlY2VpdmVzIGEgJ3doZXJlJywgdGhlcmUncyBub3doZXJlIHRvIGFzayBmb3IgdGhlIGRlbGV0ZWQgZW50aXRpZXMuXG4gICAgY29uc3Qgd2hlcmVOb3REZWxldGVkID0geyBhbmQ6IFsgd2hlcmUsIHF1ZXJ5Tm9uRGVsZXRlZCBdIH07XG4gICAgcmV0dXJuIF91cGRhdGUuY2FsbChNb2RlbCwgd2hlcmVOb3REZWxldGVkLCAuLi5yZXN0KTtcbiAgfTtcbn07XG4iXX0=
