const db = require("../config/database");
const bcrypt = require("bcryptjs");

console.log("");
console.log("==================================");
console.log(" SEED USERS");
console.log("==================================");
console.log("");

const users = [
    {
        username: "staffpgi",
        password: "12345",
        role: "GA",
        company: "PGI",
        display_name: "Staff GA PGI"
    },
    {
        username: "staffpei",
        password: "12345",
        role: "GA",
        company: "PEI",
        display_name: "Staff GA PEI"
    },
    {
        username: "staffits",
        password: "12345678",
        role: "IT",
        company: "ALL",
        display_name: "Staff IT Support"
    }
];

const insertUser = db.prepare(`
    INSERT INTO users (
        username,
        password_hash,
        role,
        company,
        display_name,
        status
    )
    VALUES (
        @username,
        @password_hash,
        @role,
        @company,
        @display_name,
        'ACTIVE'
    )
`);

const updateUser = db.prepare(`
    UPDATE users
    SET
        password_hash = @password_hash,
        role = @role,
        company = @company,
        display_name = @display_name,
        status = 'ACTIVE',
        updated_at = CURRENT_TIMESTAMP
    WHERE username = @username
`);

const seedUsers = db.transaction(() => {

    for (const user of users) {

        const passwordHash =
            bcrypt.hashSync(
                user.password,
                12
            );

        const existing =
            db.prepare(`
                SELECT id
                FROM users
                WHERE username = ?
            `).get(user.username);

        if (existing) {

            updateUser.run({
                username: user.username,
                password_hash: passwordHash,
                role: user.role,
                company: user.company,
                display_name: user.display_name
            });

            console.log(
                `🔄 User diperbarui: ${user.username}`
            );

        } else {

            insertUser.run({
                username: user.username,
                password_hash: passwordHash,
                role: user.role,
                company: user.company,
                display_name: user.display_name
            });

            console.log(
                `✅ User dibuat: ${user.username}`
            );

        }
    }

});

seedUsers();

console.log("");
console.log("==================================");
console.log(" SEED USERS SELESAI");
console.log("==================================");
console.log("");