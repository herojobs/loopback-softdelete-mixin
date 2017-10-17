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
    or: [(0, _defineProperty3.default)({}, _isDeleted, { exists: false }), (0, _defineProperty3.default)({}, _isDeleted, false)]
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvZnQtZGVsZXRlLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwiTW9kZWwiLCJkZWxldGVkQXQiLCJfaXNEZWxldGVkIiwic2NydWIiLCJtb2RlbE5hbWUiLCJwcm9wZXJ0aWVzIiwiZGVmaW5pdGlvbiIsInNjcnViYmVkIiwicHJvcGVydGllc1RvU2NydWIiLCJBcnJheSIsImlzQXJyYXkiLCJmaWx0ZXIiLCJwcm9wIiwiaWQiLCJyZWR1Y2UiLCJvYmoiLCJkZWZpbmVQcm9wZXJ0eSIsInR5cGUiLCJEYXRlIiwicmVxdWlyZWQiLCJCb29sZWFuIiwiZGVmYXVsdCIsImRlc3Ryb3lBbGwiLCJzb2Z0RGVzdHJveUFsbCIsIndoZXJlIiwiY2IiLCJ1cGRhdGVBbGwiLCJ0aGVuIiwicmVzdWx0IiwiY2F0Y2giLCJlcnJvciIsInJlamVjdCIsInJlbW92ZSIsImRlbGV0ZUFsbCIsImRlc3Ryb3lCeUlkIiwic29mdERlc3Ryb3lCeUlkIiwicmVtb3ZlQnlJZCIsImRlbGV0ZUJ5SWQiLCJwcm90b3R5cGUiLCJkZXN0cm95Iiwic29mdERlc3Ryb3kiLCJvcHRpb25zIiwiY2FsbGJhY2siLCJ1bmRlZmluZWQiLCJ1cGRhdGVBdHRyaWJ1dGVzIiwiZGVsZXRlIiwicXVlcnlOb25EZWxldGVkIiwib3IiLCJleGlzdHMiLCJfZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlRGVsZXRlZCIsInF1ZXJ5IiwiZGVsZXRlZCIsImFuZCIsInJlc3QiLCJjYWxsIiwiX2ZpbmQiLCJmaW5kIiwiZmluZERlbGV0ZWQiLCJfY291bnQiLCJjb3VudCIsImNvdW50RGVsZXRlZCIsIndoZXJlTm90RGVsZXRlZCIsIl91cGRhdGUiLCJ1cGRhdGUiLCJ1cGRhdGVEZWxldGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7OztBQUNBLElBQU1BLFFBQVEsc0JBQWQ7O2tCQUVlLFVBQUNDLEtBQUQsUUFBa0Y7QUFBQSw0QkFBeEVDLFNB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QkFBa0IsRUFBRVQsS0FBSyxDQUFFOUIsS0FBRixFQUFTc0IsZUFBVCxDQUFQLEVBQXhCOztBQUZ1RCx1Q0FBTlMsSUFBTTtBQUFOQSxVQUFNO0FBQUE7O0FBR3ZELFdBQU9LLE9BQU9KLElBQVAsZ0JBQVl4RCxLQUFaLEVBQW1CK0QsZUFBbkIsU0FBdUNSLElBQXZDLEVBQVA7QUFDRCxHQUpEOztBQU1BLE1BQU1TLFVBQVVoRSxNQUFNaUUsTUFBdEI7QUFDQWpFLFFBQU1pRSxNQUFOLEdBQWVqRSxNQUFNMEIsU0FBTixHQUFrQixTQUFTd0MsYUFBVCxHQUE0QztBQUFBLFFBQXJCMUMsS0FBcUIsdUVBQWIsRUFBYTs7QUFDM0U7QUFDQSxRQUFNdUMsa0JBQWtCLEVBQUVULEtBQUssQ0FBRTlCLEtBQUYsRUFBU3NCLGVBQVQsQ0FBUCxFQUF4Qjs7QUFGMkUsdUNBQU5TLElBQU07QUFBTkEsVUFBTTtBQUFBOztBQUczRSxXQUFPUyxRQUFRUixJQUFSLGlCQUFheEQsS0FBYixFQUFvQitELGVBQXBCLFNBQXdDUixJQUF4QyxFQUFQO0FBQ0QsR0FKRDtBQUtELEMiLCJmaWxlIjoic29mdC1kZWxldGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgX2RlYnVnIGZyb20gJy4vZGVidWcnO1xuY29uc3QgZGVidWcgPSBfZGVidWcoKTtcblxuZXhwb3J0IGRlZmF1bHQgKE1vZGVsLCB7IGRlbGV0ZWRBdCA9ICdkZWxldGVkQXQnLCBfaXNEZWxldGVkID0gJ19pc0RlbGV0ZWQnLCBzY3J1YiA9IGZhbHNlIH0pID0+IHtcbiAgZGVidWcoJ1NvZnREZWxldGUgbWl4aW4gZm9yIE1vZGVsICVzJywgTW9kZWwubW9kZWxOYW1lKTtcblxuICBkZWJ1Zygnb3B0aW9ucycsIHsgZGVsZXRlZEF0LCBfaXNEZWxldGVkLCBzY3J1YiB9KTtcblxuICBjb25zdCBwcm9wZXJ0aWVzID0gTW9kZWwuZGVmaW5pdGlvbi5wcm9wZXJ0aWVzO1xuXG4gIGxldCBzY3J1YmJlZCA9IHt9O1xuICBpZiAoc2NydWIgIT09IGZhbHNlKSB7XG4gICAgbGV0IHByb3BlcnRpZXNUb1NjcnViID0gc2NydWI7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHByb3BlcnRpZXNUb1NjcnViKSkge1xuICAgICAgcHJvcGVydGllc1RvU2NydWIgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKVxuICAgICAgICAuZmlsdGVyKHByb3AgPT4gIXByb3BlcnRpZXNbcHJvcF0uaWQgJiYgcHJvcCAhPT0gX2lzRGVsZXRlZCk7XG4gICAgfVxuICAgIHNjcnViYmVkID0gcHJvcGVydGllc1RvU2NydWIucmVkdWNlKChvYmosIHByb3ApID0+ICh7IC4uLm9iaiwgW3Byb3BdOiBudWxsIH0pLCB7fSk7XG4gIH1cblxuICBNb2RlbC5kZWZpbmVQcm9wZXJ0eShkZWxldGVkQXQsIHt0eXBlOiBEYXRlLCByZXF1aXJlZDogZmFsc2V9KTtcbiAgTW9kZWwuZGVmaW5lUHJvcGVydHkoX2lzRGVsZXRlZCwge3R5cGU6IEJvb2xlYW4sIHJlcXVpcmVkOiB0cnVlLCBkZWZhdWx0OiBmYWxzZX0pO1xuXG4gIE1vZGVsLmRlc3Ryb3lBbGwgPSBmdW5jdGlvbiBzb2Z0RGVzdHJveUFsbCh3aGVyZSwgY2IpIHtcbiAgICByZXR1cm4gTW9kZWwudXBkYXRlQWxsKHdoZXJlLCB7IC4uLnNjcnViYmVkLCBbZGVsZXRlZEF0XTogbmV3IERhdGUoKSwgW19pc0RlbGV0ZWRdOiB0cnVlIH0pXG4gICAgICAudGhlbihyZXN1bHQgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYihudWxsLCByZXN1bHQpIDogcmVzdWx0KVxuICAgICAgLmNhdGNoKGVycm9yID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IoZXJyb3IpIDogUHJvbWlzZS5yZWplY3QoZXJyb3IpKTtcbiAgfTtcblxuICBNb2RlbC5yZW1vdmUgPSBNb2RlbC5kZXN0cm95QWxsO1xuICBNb2RlbC5kZWxldGVBbGwgPSBNb2RlbC5kZXN0cm95QWxsO1xuXG4gIE1vZGVsLmRlc3Ryb3lCeUlkID0gZnVuY3Rpb24gc29mdERlc3Ryb3lCeUlkKGlkLCBjYikge1xuICAgIHJldHVybiBNb2RlbC51cGRhdGVBbGwoeyBpZDogaWQgfSwgeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucmVtb3ZlQnlJZCA9IE1vZGVsLmRlc3Ryb3lCeUlkO1xuICBNb2RlbC5kZWxldGVCeUlkID0gTW9kZWwuZGVzdHJveUJ5SWQ7XG5cbiAgTW9kZWwucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiBzb2Z0RGVzdHJveShvcHRpb25zLCBjYikge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gKGNiID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpID8gb3B0aW9ucyA6IGNiO1xuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlQXR0cmlidXRlcyh7IC4uLnNjcnViYmVkLCBbZGVsZXRlZEF0XTogbmV3IERhdGUoKSwgW19pc0RlbGV0ZWRdOiB0cnVlIH0pXG4gICAgICAudGhlbihyZXN1bHQgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYWxsYmFjayhudWxsLCByZXN1bHQpIDogcmVzdWx0KVxuICAgICAgLmNhdGNoKGVycm9yID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2FsbGJhY2soZXJyb3IpIDogUHJvbWlzZS5yZWplY3QoZXJyb3IpKTtcbiAgfTtcblxuICBNb2RlbC5wcm90b3R5cGUucmVtb3ZlID0gTW9kZWwucHJvdG90eXBlLmRlc3Ryb3k7XG4gIE1vZGVsLnByb3RvdHlwZS5kZWxldGUgPSBNb2RlbC5wcm90b3R5cGUuZGVzdHJveTtcblxuICAvLyBFbXVsYXRlIGRlZmF1bHQgc2NvcGUgYnV0IHdpdGggbW9yZSBmbGV4aWJpbGl0eS5cbiAgY29uc3QgcXVlcnlOb25EZWxldGVkID0ge1xuICAgIG9yOiBbXG4gICAgICB7IFtfaXNEZWxldGVkXTogeyBleGlzdHM6IGZhbHNlIH0gfSxcbiAgICAgIHsgW19pc0RlbGV0ZWRdOiBmYWxzZSB9LFxuICAgIF0sXG4gIH07XG5cbiAgY29uc3QgX2ZpbmRPckNyZWF0ZSA9IE1vZGVsLmZpbmRPckNyZWF0ZTtcbiAgTW9kZWwuZmluZE9yQ3JlYXRlID0gZnVuY3Rpb24gZmluZE9yQ3JlYXRlRGVsZXRlZChxdWVyeSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgaWYgKCFxdWVyeS5kZWxldGVkKSB7XG4gICAgICBpZiAoIXF1ZXJ5LndoZXJlKSB7XG4gICAgICAgIHF1ZXJ5LndoZXJlID0gcXVlcnlOb25EZWxldGVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlcnkud2hlcmUgPSB7IGFuZDogWyBxdWVyeS53aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gX2ZpbmRPckNyZWF0ZS5jYWxsKE1vZGVsLCBxdWVyeSwgLi4ucmVzdCk7XG4gIH07XG5cbiAgY29uc3QgX2ZpbmQgPSBNb2RlbC5maW5kO1xuICBNb2RlbC5maW5kID0gZnVuY3Rpb24gZmluZERlbGV0ZWQocXVlcnkgPSB7fSwgLi4ucmVzdCkge1xuICAgIGlmICghcXVlcnkuZGVsZXRlZCkge1xuICAgICAgaWYgKCFxdWVyeS53aGVyZSkge1xuICAgICAgICBxdWVyeS53aGVyZSA9IHF1ZXJ5Tm9uRGVsZXRlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXJ5LndoZXJlID0geyBhbmQ6IFsgcXVlcnkud2hlcmUsIHF1ZXJ5Tm9uRGVsZXRlZCBdIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIF9maW5kLmNhbGwoTW9kZWwsIHF1ZXJ5LCAuLi5yZXN0KTtcbiAgfTtcblxuICBjb25zdCBfY291bnQgPSBNb2RlbC5jb3VudDtcbiAgTW9kZWwuY291bnQgPSBmdW5jdGlvbiBjb3VudERlbGV0ZWQod2hlcmUgPSB7fSwgLi4ucmVzdCkge1xuICAgIC8vIEJlY2F1c2UgY291bnQgb25seSByZWNlaXZlcyBhICd3aGVyZScsIHRoZXJlJ3Mgbm93aGVyZSB0byBhc2sgZm9yIHRoZSBkZWxldGVkIGVudGl0aWVzLlxuICAgIGNvbnN0IHdoZXJlTm90RGVsZXRlZCA9IHsgYW5kOiBbIHdoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgIHJldHVybiBfY291bnQuY2FsbChNb2RlbCwgd2hlcmVOb3REZWxldGVkLCAuLi5yZXN0KTtcbiAgfTtcblxuICBjb25zdCBfdXBkYXRlID0gTW9kZWwudXBkYXRlO1xuICBNb2RlbC51cGRhdGUgPSBNb2RlbC51cGRhdGVBbGwgPSBmdW5jdGlvbiB1cGRhdGVEZWxldGVkKHdoZXJlID0ge30sIC4uLnJlc3QpIHtcbiAgICAvLyBCZWNhdXNlIHVwZGF0ZS91cGRhdGVBbGwgb25seSByZWNlaXZlcyBhICd3aGVyZScsIHRoZXJlJ3Mgbm93aGVyZSB0byBhc2sgZm9yIHRoZSBkZWxldGVkIGVudGl0aWVzLlxuICAgIGNvbnN0IHdoZXJlTm90RGVsZXRlZCA9IHsgYW5kOiBbIHdoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgIHJldHVybiBfdXBkYXRlLmNhbGwoTW9kZWwsIHdoZXJlTm90RGVsZXRlZCwgLi4ucmVzdCk7XG4gIH07XG59O1xuIl19
