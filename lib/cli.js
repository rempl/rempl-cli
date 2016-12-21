var path = require('path');
var clap = require('clap');
var server = require('basisjs-tools-server');
var rempl = require('rempl/server');

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
        process.chdir(path.resolve(path.dirname(require.resolve('rempl/server')), 'client/dist'));

        this.values.rempl = rempl;
        this.values.remplStandalone = true;        

        server.launch(this.values);
    });

module.exports.isCliError = function(err){
    return err instanceof clap.Error;
};
