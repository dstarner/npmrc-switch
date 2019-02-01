#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const program = require('commander');
const homedir = require('os').homedir();
const packageInfo = require('./package.json');

const LOCK_FILE = 'switch-lock';
const AUTO_COMMENT = '# npmrc-switch generated';


const ASCII_ART = "\
 _   __________  ___  _____ _    _ _____ _____ _____ _   _    \n\
| \\ | | ___ \\  \\/  | /  ___| |  | |_   _|_   _/  __ \\ | | |  \n\
|  \\| | |_/ / .  . | \\ `--.| |  | | | |   | | | /  \\/ |_| |  \n\
| . ` |  __/| |\\/| |  `--. \\ |/\\| | | |   | | | |   |  _  |  \n\
| |\\  | |   | |  | | /\\__/ |  /\\  /_| |_  | | | \\__/\\ | | |  \n\
\\_| \\_|_|   \\_|  |_/ \\____/ \\/  \\/ \\___/  \\_/  \\____|_| |_/  \n\
                                                             \n\
"

const USAGE = `
An utility to make it easier switching between different npm configs.

Usage: $ npm-switch <action> <value>

--- Available Commands ---

  save <name>                Save the current configuration to a reference <name>

  load <name>                Load a saved configuration by its reference <name>
  
  delete <name>              Delete a saved configuration by its reference <name>
  
  view [<name>|all|current]  View a specific save configuration, or all saved 
                             configurations, specified by 'all'

  clear                      Clear the current contents of your npm configuration 
                             (NOT REVERSIBLE)

--- Available Flags ---

  -d, --directory <str>  The directory where we will save configuration files 
                         (default $HOME/.npmrc-switch)
  -n, --npmrc <str>      The absolute path to your .npmrc file (default $HOME/.npmrc)
  -h, --help             Show this usage message

`

function startsWith(toCheck, searchString, position) {
    position = position || 0;
    return toCheck.indexOf(searchString, position) === position;
};

/**
 * Show just the usage guide, no art :(
 */
function showHelp() {
    return USAGE;
}

/**
 * Show the help text and ascii art
 */
function showFullHelp() {
    return `${ASCII_ART}\n${showHelp()}`;
}

/**
 * Ensure a value actually has some content to it
 * @param {string} value  
 */
function ensureValueExists(value) {
    return value.toString().length > 0;
}

function ensureConfigurationExists(path, quitOnFalse) {
    quitOnFalse = quitOnFalse || false;
    if (!fs.existsSync(path)) {
        if (quitOnFalse) {
            console.error('Could not find the configuration');
            process.exit(1);
        }
        return false;
    }
    if (!startsWith(fs.readFileSync(path), AUTO_COMMENT)) {
        if (quitOnFalse) {
            console.log(`This is not a valid configuration`)
            process.exit(1);
        }
        return false;
    }
    return true;
} 

/**
 * Make sure the loading/saving directory exists and is safe to use
 */
function ensureSafeDirectoryExists(directory) {
    if (!fs.existsSync(directory)){
        fs.mkdirSync(directory);
    }
    lockPath = path.join(directory, LOCK_FILE);
    if (!fs.existsSync(lockPath)) {
        fs.closeSync(fs.openSync(lockPath, 'w'));
    }
}

/**
 * Try to acquire the lockfile in the directory to ensure atomic updates
 * @param {string} directory 
 */
function acquireLock(directory) {
    let attempts = 0;
    lockPath = path.join(directory, LOCK_FILE);
    return new Promise(function(resolve, reject) {
        if (!fs.existsSync(lockPath)) {
            fs.writeFileSync(lockPath, process.pid);
        }
        const fID = setInterval(function() {
            lockContents = fs.readFileSync(lockPath, 'utf8');
            const value = parseInt(lockContents) || 0;
            // Try to acquire it
            if (value === 0) {
                fs.writeFileSync(lockPath, process.pid);
                clearInterval(fID);
                resolve();
            }
            // Let the user know if its taking awhile
            if (attempts > 20) {
                console.log(`Could not get lockfile. Check "${lockPath}" and empty if nothing else is running`);
                reject();
            } else if (attempts === 10) {
                console.log('Still waiting to acquire lockfile...')
            }
            ++attempts;
        }, 200);
    });
}

/**
 * Release the lockfile in the directory
 * @param {string} directory 
 */
function releaseLock(directory) {
    lockPath = path.join(directory, LOCK_FILE);
    lockContents = fs.readFileSync(lockPath, 'utf8');
    const value = parseInt(lockContents) || 0;
    if (value === process.pid) {
        fs.writeFileSync(lockPath, '');
    }
}

// Core program
program.version(packageInfo.version);
program.option('-n, --npmrc <npmrc>', 'The absolute path to your .npmrc file (default $HOME/.npmrc)', path.join(homedir, '.npmrc'));
program.option('-d, --directory <directory>', 'The directory where we will save configuration files (default $HOME/.npmrc-switch)', path.join(homedir, '.npmrc-switch'));

/**
 * On Save commands
 */
program
    .command('save <name>')
    .action(function (name, cmd) {
        if (!ensureValueExists(name)) {
            console.error('name must be valid!');
            process.exit(1);
        }
        if (name === 'all') {
            console.error('`all` is a reserved word for configurations. Could not save');
            process.exit(1);
        }
        const directory = program.directory;
        ensureSafeDirectoryExists(directory);
        acquireLock(directory)
            .then(() => {
                npmrcContents = fs.readFileSync(program.npmrc, 'utf8');
                if (npmrcContents.length > 0) {
                    fs.writeFileSync(path.join(directory, name), `${AUTO_COMMENT}\n${npmrcContents}`);
                } else {
                    console.error(`Can't write an empty configuration, use 'clear' instead`)
                }
                releaseLock(directory);
            }).catch(() => process.exit(1));
    });

/**
 * On Load commands
 */
program
    .command('load <name>')
    .action(function (name, cmd) {
        if (!ensureValueExists(name)) {
            console.error('name must be valid!');
            process.exit(1);
        }
        if (name === 'all') {
            console.error('`all` is a reserved word for configurations. Could not load');
            process.exit(1);
        }
        const directory = program.directory;
        const configPath = path.join(directory, name);
        ensureSafeDirectoryExists(directory);
        ensureConfigurationExists(configPath, true);
        acquireLock(directory)
            .then(() => {
                npmrcContents = fs.readFileSync(path.join(directory, name), 'utf8');
                fs.writeFileSync(program.npmrc, npmrcContents.replace(AUTO_COMMENT + '\n', ''));
                releaseLock(directory);
            }).catch(() => process.exit(1));
    });

/**
 * On Delete commands
 */
program
    .command('delete <name>')
    .action(function (name) {
        if (!ensureValueExists(name)) {
            console.error('name must be valid!');
            process.exit(1);
        }
        const directory = program.directory;
        ensureSafeDirectoryExists(directory);

        // Try to pull all valid configs
        let pathsToRemove = [];
        if (name === 'all') {
            fs.readdirSync(directory).forEach(file => {
                const configPath = path.join(directory, file);
                if (ensureConfigurationExists(configPath)) {
                    pathsToRemove.push(configPath)
                }
            })
        } else {
            pathsToRemove = [path.join(directory, name)];
            ensureConfigurationExists(pathsToRemove[0], true);
        }
        acquireLock(directory)
            .then(() => {
                pathsToRemove.forEach(function(configPath) {
                    fs.unlinkSync(configPath);
                    console.log(`Removed the ${name} configuration`)
                })
                releaseLock(directory);
            }).catch(() => process.exit(1));
    });

/**
 * On Clear commands
 */
program
.command('clear')
.action(function () {
    const directory = program.directory;
    ensureSafeDirectoryExists(directory);
    acquireLock(directory)
        .then(() => {
            fs.writeFileSync(program.npmrc, '');
            releaseLock(directory);
        }).catch(() => process.exit(1));
});


/**
 * On Clear commands
 */
program
.command('view <name>')
.action(function (name) {
    if (!ensureValueExists(name)) {
        console.error('name must be valid!');
        process.exit(1);
    }
    const directory = program.directory;
    ensureSafeDirectoryExists(directory);

    // Try to pull all valid configs
    let pathsToView = [];
    if (name === 'all') {
        fs.readdirSync(directory).forEach(file => {
            const configPath = path.join(directory, file);
            if (ensureConfigurationExists(configPath)) {
                pathsToView.push(configPath)
            }
        })
    } else if (name === 'current') {
        pathsToView = [program.npmrc];
        if (!fs.existsSync(program.npmrc)) {
            console.error('Could not locate the current .npmrc file');
            process.exit(1);
        }
    } else {
        pathsToView = [path.join(directory, name)];
        ensureConfigurationExists(pathsToView[0], true);
    }
    acquireLock(directory)
        .then(() => {
            pathsToView.forEach(function(configPath) {
                const contents = fs.readFileSync(configPath, "utf8");
                console.log(`\n===== ${path.basename(configPath)} =====`);
                console.log(contents.replace(AUTO_COMMENT + '\n', ''));
            })
            releaseLock(directory);
        }).catch(() => process.exit(1));
});

/**
 * On bad command
 */
program.on('command:*', function () {
    console.error('Invalid command provided!\n\nPlease use `npm-switch --help` for usage.');
    process.exit(1);
});

// Fallback to showing the help text
if (!process.argv.slice(2).length || process.argv.includes('-h') || process.argv.includes('--help')) {
    program.help(showFullHelp);
}

program.parse(process.argv);