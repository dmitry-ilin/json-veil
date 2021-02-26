import traverse from 'traverse';
import fs from 'fs-extra';
import { random, isInteger, toString, split, toNumber } from 'lodash';
import cryptoRandomString from 'crypto-random-string';

import bfj from 'bfj';

import { logSuccess } from '../utils/logger';


export const command = 'veil';
export const desc = 'Veil JSON file content keeping it\'s structure and size';
export const builder = yargs =>
  yargs
    .option('input', {
      alias: 'i',
      string: true,
      describe: 'Input file path',
      requiresArg: true,
    })
    .option('output', {
      alias: 'o',
      string: true,
      describe: 'output file path',
      requiresArg: true,
      default: 'output.json'
    })
    .demandOption(['input']);

export const handler = argv => {
  run(argv.input, argv.output);
};

const rerollInteger = (value) => {
  const length = toString(value).length;
  const min = (10 ** (length - 1)); // It won't give 0 for range 0-9, but it doesn't matter
  const max = (10 ** length) - 1;

  return random(min, max, false);
};

function transformation(x) {
  switch (typeof x) {
    case 'string':
      this.update(cryptoRandomString({
        length: x.length,
        type: 'alphanumeric',
      }));
      break;
    case 'number':
      if (isInteger(x)) {
        this.update(rerollInteger(x));
      } else {
        const [left, right] = split(toString(x), '.');
        this.update(toNumber(`${rerollInteger(left)}.${rerollInteger(right)}`));
      }
      break;
    case 'boolean':
      this.update(!!random(0, 1, false));
      break;
    default:
      // No action
      break;
  }
}

function run(input, output) {
  return fs.readJSON(input)
    .then((json) => {
      traverse(json).forEach(transformation);

      // Use of fs-extra writeJSON doesn't work with big JSON files
      return bfj.write(output, json, { space: 2, });
    })
    .then(() => logSuccess(`Veiled. Output path: ${output}`));
}
