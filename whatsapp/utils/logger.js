function line() {
    console.log("==================================================");
}

function info(title, value = "") {
    console.log(`📌 ${title} ${value}`);
}

function success(title, value = "") {
    console.log(`✅ ${title} ${value}`);
}

function warning(title, value = "") {
    console.log(`⚠️ ${title} ${value}`);
}

function error(title, value = "") {
    console.log(`❌ ${title} ${value}`);
}

function section(title) {
    console.log("");
    line();
    console.log(`🚀 ${title}`);
    line();
}

module.exports = {
    line,
    info,
    success,
    warning,
    error,
    section
};