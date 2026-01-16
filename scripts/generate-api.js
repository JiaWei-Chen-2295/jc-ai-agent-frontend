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

const openApiFile = path.join(output, 'core', 'OpenAPI.ts')
const openApiContent = `/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from './ApiRequestOptions';

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;
type Headers = Record<string, string>;

export type OpenAPIConfig = {
  BASE: string;
  VERSION: string;
  WITH_CREDENTIALS: boolean;
  CREDENTIALS: 'include' | 'omit' | 'same-origin';
  TOKEN?: string | Resolver<string> | undefined;
  USERNAME?: string | Resolver<string> | undefined;
  PASSWORD?: string | Resolver<string> | undefined;
  HEADERS?: Headers | Resolver<Headers> | undefined;
  ENCODE_PATH?: ((path: string) => string) | undefined;
};

export const OpenAPI: OpenAPIConfig = {
  BASE: 'http://localhost:8525/api',
  VERSION: '0',
  WITH_CREDENTIALS: true,
  CREDENTIALS: 'include',
  TOKEN: undefined,
  USERNAME: undefined,
  PASSWORD: undefined,
  HEADERS: undefined,
  ENCODE_PATH: undefined,
};
`

await fs.mkdir(path.dirname(openApiFile), { recursive: true })
await fs.writeFile(openApiFile, openApiContent, 'utf-8')
