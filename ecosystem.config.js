module.exports = {
    apps: [{
        name: 'dauntless-bot',
        script: './node_modules/nodemon/bin/nodemon.js',
        args: './src/index.js --watch ./src --delay 1',
        interpreter: 'node',
        restart_delay: 3000, // Delay between restart attempts
        max_restarts: 10,    // Number of consecutive unstable restarts (less than 1 sec interval) before your app is considered errored and stop being restarted
        error_file: './logs/error.log', // Path to error log file
        out_file: './logs/out.log',     // Path to standard output log file
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }]
};