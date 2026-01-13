#!/usr/bin/env node
import { execSync } from 'node:child_process'
import path from 'node:path'

const inputArg = process.argv[2]
const fallback = 'http://localhost:8525/api/v3/api-docs/default'
const input = inputArg || process.env.VITE_SWAGGER_URL || fallback
const output = path.resolve('src/api')

const cmd = [
  'npx',
  'openapi',
  '--input',
  input,
  '--output',
  output,
  '--client',
  'axios',
  '--useUnionTypes',
  '--useOptions',
  '--indent',
  '2',
].join(' ')

console.log(`Generating SDK from ${input} -> ${output}`)
execSync(cmd, { stdio: 'inherit' })
