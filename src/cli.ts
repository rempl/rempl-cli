import fs from 'fs';
import path from 'path';
import { command as createCommand, Error as CliError } from 'clap';
import { createServer } from './server/index.js';
import { version } from './version.js';

function resolveCwd(value: string) {
    return path.resolve(process.env.PWD || process.cwd(), value);
}

function tryReadFile(filepath: string | undefined, name: string) {
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

export const command = createCommand('rempl')
    .description('Launch rempl server')
    .version(version)

    .option(
        '-p, --port <n>',
        'Listening port (default 8177)',
        (value: any) => (isNaN(value) ? 0 : Number(value)),
        8177
    )
    .option('--ssl', 'Enable https')
    .option('--ssl-cert <path>', 'Path to SSL .cert file', resolveCwd)
    .option('--ssl-key <path>', 'Path to SSL .key file', resolveCwd)
    .option('--dev', 'Developer mode (use dev version of everything when possible)')
    .option('--no-color', 'Suppress color output')

    // FIXME: any
    .action(function ({ options }: { options: any }) {
        createServer({
            ...options,
            sslKey: tryReadFile(options.sslKey, 'sslKey'),
            sslCert: tryReadFile(options.sslCert, 'sslCert')
        });
    });

export function isCliError(err: Error) {
    return err instanceof CliError;
}
