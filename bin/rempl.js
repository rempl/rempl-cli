#!/usr/bin/env node

import { command, isCliError } from '../lib/cli.js';

//
// parse arguments and run command
//

try {
    command.run();
} catch (e) {
    if (isCliError(e)) {
        console.error(e.message || e);
    } else {
        throw e;
    }

    process.exit(2);
}
