const users = {};

function addUser(username, ws) {
  users[username] = ws;
}

function removeUser(ws) {
  for (const name in users) {
    if (users[name] === ws) {
      delete users[name];
      break;
    }
  }
}

function getUser(username) {
  return users[username];
}

module.exports = { addUser, removeUser, getUser };
