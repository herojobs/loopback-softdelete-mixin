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
  var queryNonDeleted = { _isDeleted: false };

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvZnQtZGVsZXRlLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwiTW9kZWwiLCJkZWxldGVkQXQiLCJfaXNEZWxldGVkIiwic2NydWIiLCJtb2RlbE5hbWUiLCJwcm9wZXJ0aWVzIiwiZGVmaW5pdGlvbiIsInNjcnViYmVkIiwicHJvcGVydGllc1RvU2NydWIiLCJBcnJheSIsImlzQXJyYXkiLCJmaWx0ZXIiLCJwcm9wIiwiaWQiLCJyZWR1Y2UiLCJvYmoiLCJkZWZpbmVQcm9wZXJ0eSIsInR5cGUiLCJEYXRlIiwicmVxdWlyZWQiLCJCb29sZWFuIiwiZGVmYXVsdCIsImRlc3Ryb3lBbGwiLCJzb2Z0RGVzdHJveUFsbCIsIndoZXJlIiwiY2IiLCJ1cGRhdGVBbGwiLCJ0aGVuIiwicmVzdWx0IiwiY2F0Y2giLCJlcnJvciIsInJlamVjdCIsInJlbW92ZSIsImRlbGV0ZUFsbCIsImRlc3Ryb3lCeUlkIiwic29mdERlc3Ryb3lCeUlkIiwicmVtb3ZlQnlJZCIsImRlbGV0ZUJ5SWQiLCJwcm90b3R5cGUiLCJkZXN0cm95Iiwic29mdERlc3Ryb3kiLCJvcHRpb25zIiwiY2FsbGJhY2siLCJ1bmRlZmluZWQiLCJ1cGRhdGVBdHRyaWJ1dGVzIiwiZGVsZXRlIiwicXVlcnlOb25EZWxldGVkIiwiX2ZpbmRPckNyZWF0ZSIsImZpbmRPckNyZWF0ZSIsImZpbmRPckNyZWF0ZURlbGV0ZWQiLCJxdWVyeSIsImRlbGV0ZWQiLCJhbmQiLCJyZXN0IiwiY2FsbCIsIl9maW5kIiwiZmluZCIsImZpbmREZWxldGVkIiwiX2NvdW50IiwiY291bnQiLCJjb3VudERlbGV0ZWQiLCJ3aGVyZU5vdERlbGV0ZWQiLCJfdXBkYXRlIiwidXBkYXRlIiwidXBkYXRlRGVsZXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7QUFDQSxJQUFNQSxRQUFRLHNCQUFkOztrQkFFZSxVQUFDQyxLQUFELFFBQWtGO0FBQUEsNEJBQXhFQyxTQUF3RTtBQUFBLE1BQXhF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QUFNO0FBQUE7O0FBR3ZELFdBQU9LLE9BQU9KLElBQVAsZ0JBQVl0RCxLQUFaLEVBQW1CNkQsZUFBbkIsU0FBdUNSLElBQXZDLEVBQVA7QUFDRCxHQUpEOztBQU1BLE1BQU1TLFVBQVU5RCxNQUFNK0QsTUFBdEI7QUFDQS9ELFFBQU0rRCxNQUFOLEdBQWUvRCxNQUFNMEIsU0FBTixHQUFrQixTQUFTc0MsYUFBVCxHQUE0QztBQUFBLFFBQXJCeEMsS0FBcUIsdUVBQWIsRUFBYTs7QUFDM0U7QUFDQSxRQUFNcUMsa0JBQWtCLEVBQUVULEtBQUssQ0FBRTVCLEtBQUYsRUFBU3NCLGVBQVQsQ0FBUCxFQUF4Qjs7QUFGMkUsdUNBQU5PLElBQU07QUFBTkEsVUFBTTtBQUFBOztBQUczRSxXQUFPUyxRQUFRUixJQUFSLGlCQUFhdEQsS0FBYixFQUFvQjZELGVBQXBCLFNBQXdDUixJQUF4QyxFQUFQO0FBQ0QsR0FKRDtBQUtELEMiLCJmaWxlIjoic29mdC1kZWxldGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgX2RlYnVnIGZyb20gJy4vZGVidWcnO1xuY29uc3QgZGVidWcgPSBfZGVidWcoKTtcblxuZXhwb3J0IGRlZmF1bHQgKE1vZGVsLCB7IGRlbGV0ZWRBdCA9ICdkZWxldGVkQXQnLCBfaXNEZWxldGVkID0gJ19pc0RlbGV0ZWQnLCBzY3J1YiA9IGZhbHNlIH0pID0+IHtcbiAgZGVidWcoJ1NvZnREZWxldGUgbWl4aW4gZm9yIE1vZGVsICVzJywgTW9kZWwubW9kZWxOYW1lKTtcblxuICBkZWJ1Zygnb3B0aW9ucycsIHsgZGVsZXRlZEF0LCBfaXNEZWxldGVkLCBzY3J1YiB9KTtcblxuICBjb25zdCBwcm9wZXJ0aWVzID0gTW9kZWwuZGVmaW5pdGlvbi5wcm9wZXJ0aWVzO1xuXG4gIGxldCBzY3J1YmJlZCA9IHt9O1xuICBpZiAoc2NydWIgIT09IGZhbHNlKSB7XG4gICAgbGV0IHByb3BlcnRpZXNUb1NjcnViID0gc2NydWI7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHByb3BlcnRpZXNUb1NjcnViKSkge1xuICAgICAgcHJvcGVydGllc1RvU2NydWIgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKVxuICAgICAgICAuZmlsdGVyKHByb3AgPT4gIXByb3BlcnRpZXNbcHJvcF0uaWQgJiYgcHJvcCAhPT0gX2lzRGVsZXRlZCk7XG4gICAgfVxuICAgIHNjcnViYmVkID0gcHJvcGVydGllc1RvU2NydWIucmVkdWNlKChvYmosIHByb3ApID0+ICh7IC4uLm9iaiwgW3Byb3BdOiBudWxsIH0pLCB7fSk7XG4gIH1cblxuICBNb2RlbC5kZWZpbmVQcm9wZXJ0eShkZWxldGVkQXQsIHt0eXBlOiBEYXRlLCByZXF1aXJlZDogZmFsc2V9KTtcbiAgTW9kZWwuZGVmaW5lUHJvcGVydHkoX2lzRGVsZXRlZCwge3R5cGU6IEJvb2xlYW4sIHJlcXVpcmVkOiB0cnVlLCBkZWZhdWx0OiBmYWxzZX0pO1xuXG4gIE1vZGVsLmRlc3Ryb3lBbGwgPSBmdW5jdGlvbiBzb2Z0RGVzdHJveUFsbCh3aGVyZSwgY2IpIHtcbiAgICByZXR1cm4gTW9kZWwudXBkYXRlQWxsKHdoZXJlLCB7IC4uLnNjcnViYmVkLCBbZGVsZXRlZEF0XTogbmV3IERhdGUoKSwgW19pc0RlbGV0ZWRdOiB0cnVlIH0pXG4gICAgICAudGhlbihyZXN1bHQgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYihudWxsLCByZXN1bHQpIDogcmVzdWx0KVxuICAgICAgLmNhdGNoKGVycm9yID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IoZXJyb3IpIDogUHJvbWlzZS5yZWplY3QoZXJyb3IpKTtcbiAgfTtcblxuICBNb2RlbC5yZW1vdmUgPSBNb2RlbC5kZXN0cm95QWxsO1xuICBNb2RlbC5kZWxldGVBbGwgPSBNb2RlbC5kZXN0cm95QWxsO1xuXG4gIE1vZGVsLmRlc3Ryb3lCeUlkID0gZnVuY3Rpb24gc29mdERlc3Ryb3lCeUlkKGlkLCBjYikge1xuICAgIHJldHVybiBNb2RlbC51cGRhdGVBbGwoeyBpZDogaWQgfSwgeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucmVtb3ZlQnlJZCA9IE1vZGVsLmRlc3Ryb3lCeUlkO1xuICBNb2RlbC5kZWxldGVCeUlkID0gTW9kZWwuZGVzdHJveUJ5SWQ7XG5cbiAgTW9kZWwucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiBzb2Z0RGVzdHJveShvcHRpb25zLCBjYikge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gKGNiID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpID8gb3B0aW9ucyA6IGNiO1xuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlQXR0cmlidXRlcyh7IC4uLnNjcnViYmVkLCBbZGVsZXRlZEF0XTogbmV3IERhdGUoKSwgW19pc0RlbGV0ZWRdOiB0cnVlIH0pXG4gICAgICAudGhlbihyZXN1bHQgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYWxsYmFjayhudWxsLCByZXN1bHQpIDogcmVzdWx0KVxuICAgICAgLmNhdGNoKGVycm9yID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2FsbGJhY2soZXJyb3IpIDogUHJvbWlzZS5yZWplY3QoZXJyb3IpKTtcbiAgfTtcblxuICBNb2RlbC5wcm90b3R5cGUucmVtb3ZlID0gTW9kZWwucHJvdG90eXBlLmRlc3Ryb3k7XG4gIE1vZGVsLnByb3RvdHlwZS5kZWxldGUgPSBNb2RlbC5wcm90b3R5cGUuZGVzdHJveTtcblxuICAvLyBFbXVsYXRlIGRlZmF1bHQgc2NvcGUgYnV0IHdpdGggbW9yZSBmbGV4aWJpbGl0eS5cbiAgY29uc3QgcXVlcnlOb25EZWxldGVkID0ge19pc0RlbGV0ZWQ6IGZhbHNlfTtcblxuICBjb25zdCBfZmluZE9yQ3JlYXRlID0gTW9kZWwuZmluZE9yQ3JlYXRlO1xuICBNb2RlbC5maW5kT3JDcmVhdGUgPSBmdW5jdGlvbiBmaW5kT3JDcmVhdGVEZWxldGVkKHF1ZXJ5ID0ge30sIC4uLnJlc3QpIHtcbiAgICBpZiAoIXF1ZXJ5LmRlbGV0ZWQpIHtcbiAgICAgIGlmICghcXVlcnkud2hlcmUpIHtcbiAgICAgICAgcXVlcnkud2hlcmUgPSBxdWVyeU5vbkRlbGV0ZWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxdWVyeS53aGVyZSA9IHsgYW5kOiBbIHF1ZXJ5LndoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBfZmluZE9yQ3JlYXRlLmNhbGwoTW9kZWwsIHF1ZXJ5LCAuLi5yZXN0KTtcbiAgfTtcblxuICBjb25zdCBfZmluZCA9IE1vZGVsLmZpbmQ7XG4gIE1vZGVsLmZpbmQgPSBmdW5jdGlvbiBmaW5kRGVsZXRlZChxdWVyeSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgaWYgKCFxdWVyeS5kZWxldGVkKSB7XG4gICAgICBpZiAoIXF1ZXJ5LndoZXJlKSB7XG4gICAgICAgIHF1ZXJ5LndoZXJlID0gcXVlcnlOb25EZWxldGVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlcnkud2hlcmUgPSB7IGFuZDogWyBxdWVyeS53aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gX2ZpbmQuY2FsbChNb2RlbCwgcXVlcnksIC4uLnJlc3QpO1xuICB9O1xuXG4gIGNvbnN0IF9jb3VudCA9IE1vZGVsLmNvdW50O1xuICBNb2RlbC5jb3VudCA9IGZ1bmN0aW9uIGNvdW50RGVsZXRlZCh3aGVyZSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgLy8gQmVjYXVzZSBjb3VudCBvbmx5IHJlY2VpdmVzIGEgJ3doZXJlJywgdGhlcmUncyBub3doZXJlIHRvIGFzayBmb3IgdGhlIGRlbGV0ZWQgZW50aXRpZXMuXG4gICAgY29uc3Qgd2hlcmVOb3REZWxldGVkID0geyBhbmQ6IFsgd2hlcmUsIHF1ZXJ5Tm9uRGVsZXRlZCBdIH07XG4gICAgcmV0dXJuIF9jb3VudC5jYWxsKE1vZGVsLCB3aGVyZU5vdERlbGV0ZWQsIC4uLnJlc3QpO1xuICB9O1xuXG4gIGNvbnN0IF91cGRhdGUgPSBNb2RlbC51cGRhdGU7XG4gIE1vZGVsLnVwZGF0ZSA9IE1vZGVsLnVwZGF0ZUFsbCA9IGZ1bmN0aW9uIHVwZGF0ZURlbGV0ZWQod2hlcmUgPSB7fSwgLi4ucmVzdCkge1xuICAgIC8vIEJlY2F1c2UgdXBkYXRlL3VwZGF0ZUFsbCBvbmx5IHJlY2VpdmVzIGEgJ3doZXJlJywgdGhlcmUncyBub3doZXJlIHRvIGFzayBmb3IgdGhlIGRlbGV0ZWQgZW50aXRpZXMuXG4gICAgY29uc3Qgd2hlcmVOb3REZWxldGVkID0geyBhbmQ6IFsgd2hlcmUsIHF1ZXJ5Tm9uRGVsZXRlZCBdIH07XG4gICAgcmV0dXJuIF91cGRhdGUuY2FsbChNb2RlbCwgd2hlcmVOb3REZWxldGVkLCAuLi5yZXN0KTtcbiAgfTtcbn07XG4iXX0=
