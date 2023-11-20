var fs = require('fs');
var path = require('path');
var clap = require('clap');
var server = require('basisjs-tools-server');
var rempl = require('./old');
var remplPath = path.dirname(require.resolve('rempl'));

function resolveCwd(value){
  return path.resolve(process.env.PWD || process.cwd(), value);
}

module.exports = clap.create('rempl')
    .description('Launch rempl server')
    .version(require('../package.json').version)

    .option('-p, --port <n>', 'Listening port (default 8177)', function(value){
        return isNaN(value) ? 0 : Number(value);
    }, 8177)
    .option('--ssl', 'Enable https')
    .option('--ssl-cert <path>', 'Path to SSL .cert file', resolveCwd)
    .option('--ssl-key <path>', 'Path to SSL .key file', resolveCwd)
    .option('--dev', 'Developer mode (use dev version of everything when possible)')
    .option('--no-color', 'Suppress color output')

    .action(function(){
        var options = this.values;
        var devBase = path.resolve(remplPath, '../server/client');

        if (options.dev && fs.existsSync(devBase)) {
            options.base = devBase;
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
