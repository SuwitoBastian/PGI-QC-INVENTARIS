const DEBUG = false;

exports.info = (...args) => {
    console.log(...args);
};

exports.debug = (...args) => {

    if (!DEBUG)
        return;

    console.log(...args);

};

exports.error = (...args) => {
    console.error(...args);
};