const blacklist = [];

const addToBlacklist = (token) => {
    blacklist.push(token);
};

const isBlacklisted = (token) => {
    return blacklist.includes(token);
};

module.exports = { addToBlacklist, isBlacklisted };
