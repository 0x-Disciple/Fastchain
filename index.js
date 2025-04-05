const chalk = require('chalk').default;
const axios = require('axios');
const fs = require('fs');
const banner = require(./config/banner.js')
    
const BASE_URL = 'https://api.fastchain.org/v2/check-in';
const INFO_URL = 'https://api.fastchain.org/v2/myinfo';

function getBearerTokens() {
    try {
        const tokens = fs.readFileSync('data.txt', 'utf8')
            .split('\n')         // Pisahkan per baris
            .map(t => t.trim())  // Hapus spasi ekstra di awal/akhir
            .filter(Boolean);    // Hapus baris kosong
        
        if (tokens.length > 0) {
            console.log(chalk.green(`Found ${tokens.length} tokens`));
            return tokens;
        } else {
            console.log(chalk.red('No tokens found in data.txt'));
        }
    } catch (error) {
        console.log(chalk.red('Error reading data.txt'), error.message);
    }
    return [];
}


async function getUserInfo(headers) {
    try {
        const response = await axios.get(INFO_URL, { headers });
        return response.data.data;
    } catch (error) {
        console.log(chalk.red('Error getting user info'), error.message);
        return null;
    }
}

async function checkIn(headers) {
    try {
        await axios.post(BASE_URL, null, { headers });
        console.log(chalk.green('Check-in successful!'));
        return true;
    } catch (error) {
        console.log(chalk.red('Error checking in'), error.message);
        return false;
    }
}

function convertToWIB(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Jakarta'
        }).format(date);
    } catch (error) {
        return 'Invalid Date';
    }
}

function getWaitTime(lastCheckIn) {
    if (!lastCheckIn) return 0; // Jika tidak ada lastCheckIn, langsung check-in

    const lastCheckDate = new Date(lastCheckIn);
    const nextCheckDate = new Date(lastCheckDate.getTime() + (24 * 60 * 60 * 1000)); // Tambah 24 jam
    const now = new Date(); // Waktu saat ini

    const waitTime = nextCheckDate - now;
    return waitTime > 0 ? waitTime : 0; // Jika waktunya negatif, set ke 0
}


async function processAccount(token) {
    console.log(chalk.yellow(`Processing account with token: ${token.slice(0, 10)}...`));

    const headers = { Authorization: `Bearer ${token}` };
    const userInfo = await getUserInfo(headers);

    if (!userInfo) {
        console.log(chalk.red('Failed to get account information'));
        return null;
    }

    let lastCheckInWIB = 'N/A';
    let waitTime = 0;

    if (!userInfo.lastCheckIn) {
        console.log(chalk.yellow('No last check-in found. Checking in now...'));
        await checkIn(headers);
        return 0;
    } else {
        lastCheckInWIB = convertToWIB(userInfo.lastCheckIn);
        waitTime = getWaitTime(userInfo.lastCheckIn);
    }

    console.log(chalk.blue(`Last check-in: ${lastCheckInWIB}`));

    if (waitTime === 0) {
        console.log(chalk.green('Time to check-in!'));
        await checkIn(headers);
        return 0;
    }

    return waitTime;
}

async function autoCheckIn() {
    while (true) {
        console.log(chalk.cyan('Starting check-in process...'));
        const tokens = getBearerTokens();

        if (tokens.length === 0) {
            console.log(chalk.red('No tokens available. Exiting...'));
            return;
        }

        let minWaitTime = 24 * 60 * 60 * 1000;

        for (const token of tokens) {
            const waitTime = await processAccount(token);
            minWaitTime = Math.min(minWaitTime, waitTime);
            console.log(chalk.grey('-----------------------'));
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log(chalk.green('All accounts have been processed.'));
        console.log(chalk.magenta(`Waiting ${Math.round(minWaitTime / 1000 / 60)} minutes for the next check-in...`));
        await new Promise(resolve => setTimeout(resolve, minWaitTime));
    }
}

autoCheckIn();
