import path from 'path';
import fs from 'fs';
import { command, Error as CliError } from 'clap';
import { createServer } from './server/index.js';
import { fileURLToPath } from 'url';

function resolveCwd(value) {
    return path.resolve(process.env.PWD || process.cwd(), value);
}

export default command('rempl')
    .description('Launch rempl server')
    .version(
        JSON.parse(
            fs.readFileSync(
                path.join(path.dirname(fileURLToPath(import.meta.url)), '../package.json')
            )
        ).version
    )

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

    .action(function ({ options }) {
        createServer(options);
    });

export function isCliError(err) {
    return err instanceof CliError;
}