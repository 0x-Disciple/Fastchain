const figlet = require('figlet');
const chalk = require('chalk').default;

function displayBanner() {
    const banner = figlet.textSync('Crypto Kidzs', {
        font: 'Slant',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: false
    })
    console.log(chalk.green(banner));
    console.log(chalk.yellow('========================================='));
    console.log(chalk.magenta('Github   : https://github.com/0x-Disciple'));
    console.log(chalk.magenta('Telegram : https://t.me/CryptoKidzz'));
    console.log(chalk.yellow('========================================='));
}
displayBanner()