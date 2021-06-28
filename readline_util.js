const { resolve } = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function input(msg) {
    return new Promise((resolve) => {
        return rl.question(msg, (answer) => {
            if (answer == null) {
                input(msg).then((e) => resolve(e));
                return;
            }
            resolve(answer);
        });
    })
} 

module.exports = { input };