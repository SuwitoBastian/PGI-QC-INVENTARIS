let socket = null;

function setSocket(sock) {
    socket = sock;
}

function getSocket() {
    return socket;
}

module.exports = {
    setSocket,
    getSocket
};