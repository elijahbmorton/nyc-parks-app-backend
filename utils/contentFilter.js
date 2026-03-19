const filter = require('leo-profanity');

function containsObjectionableContent(text) {
    if (!text || text.trim() === '') return false;
    return filter.check(text);
}

module.exports = { containsObjectionableContent };
