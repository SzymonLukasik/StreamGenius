import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parse as parseYaml } from 'yaml'
import type { FunctionDeclaration } from '@google/genai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ToolsConfig {
  system_prompt: string
  tools: FunctionDeclaration[]
}

function loadToolsConfig(): ToolsConfig {
  const yamlPath = join(__dirname, 'tools.yaml')
  const yamlContent = readFileSync(yamlPath, 'utf-8')
  return parseYaml(yamlContent) as ToolsConfig
}

const config = loadToolsConfig()

export const systemPrompt = config.system_prompt
export const toolDefinitions = config.tools
