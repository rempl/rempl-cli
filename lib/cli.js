var path = require('path');
var clap = require('clap');
var server = require('basisjs-tools-server');
var rempl = require('rempl/server');
var remplPath = path.dirname(require.resolve('rempl'));

module.exports = clap.create('rempl')
    .description('Launch rempl server')
    .version(require('../package.json').version)

    .option('-p, --port <n>', 'Listening port (default 8177)', function(value){
        return isNaN(value) ? 0 : Number(value);
    }, 8177)
    .option('--verbose', 'verbose log message output')
    .option('--dev', 'Developer mode (use non build version of client)')
    .option('--no-color', 'Suppress color output')

    .action(function(){
        var options = this.values;

        if (options.dev) {
            options.base = path.resolve(remplPath, '../server/client');
            options.plugins = [
                path.resolve(remplPath, '../server/client/symlink.js')
            ];
        } else {
            options.base = path.resolve(remplPath, '../dist/server-client');
        }

        options.rempl = rempl;
        options.remplStandalone = true;

        server.launch(options);
    });

module.exports.isCliError = function(err){
    return err instanceof clap.Error;
};
