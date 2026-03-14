const NodeCache = require('node-cache');
const config = require('../config/config');
const cache = new NodeCache({ stdTTL: 3600 }); // cache 1h
module.exports = cache;

 // cache for 5 seconds


