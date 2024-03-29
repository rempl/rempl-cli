import fs from 'fs';
import path from 'path';
import { command as command$1, Error } from 'clap';
import { createServer } from './server/index.js';
import { version } from './version.js';

function resolveCwd(value) {
    return path.resolve(process.env.PWD || process.cwd(), value);
}

function tryReadFile(filepath, name) {
    if (!filepath) {
        return undefined;
    }

    try {
        const abspath = path.resolve(filepath);
        return fs.readFileSync(abspath);
    } catch (e) {
        console.error(`Error on read ${name} file`, e);
    }
}

const command = command$1('rempl')
    .description('Launch rempl server')
    .version(version)

    .option(
        '-p, --port <n>',
        'Listening port (default 8177)',
        (value) => (isNaN(value) ? 0 : Number(value)),
        8177
    )
    .option('--ssl', 'Enable https')
    .option('--ssl-cert <path>', 'Path to SSL .cert file', resolveCwd)
    .option('--ssl-key <path>', 'Path to SSL .key file', resolveCwd)
    .option('--dev', 'Developer mode (use dev version of everything when possible)')
    .option('--no-color', 'Suppress color output')

    // FIXME: any
    .action(function ({ options }) {
        createServer({
            ...options,
            sslKey: tryReadFile(options.sslKey, 'sslKey'),
            sslCert: tryReadFile(options.sslCert, 'sslCert')
        });
    });

function isCliError(err) {
    return err instanceof Error;
}

export { command, isCliError };
//# sourceMappingURL=cli.js.map
