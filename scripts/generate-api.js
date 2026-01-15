#!/usr/bin/env node
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const inputArg = process.argv[2]
const fallback = 'http://localhost:8525/api/v3/api-docs'
const input = inputArg || process.env.VITE_SWAGGER_URL || fallback
let resolvedInput = input
const output = path.resolve('src/api')

if (input.startsWith('http')) {
  const response = await fetch(input)
  if (!response.ok) {
    throw new Error(`Failed to download OpenAPI schema: ${response.status} ${response.statusText}`)
  }
  const schemaText = await response.text()
  const localPath = path.resolve('openapi.json')
  await fs.writeFile(localPath, schemaText, 'utf-8')
  resolvedInput = localPath
  console.log(`Downloaded OpenAPI schema to ${localPath}`)
}

const cmd = [
  'npx',
  'openapi',
  '--input',
  resolvedInput,
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
