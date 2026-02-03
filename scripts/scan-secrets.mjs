import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const fullScan = args.includes('--full')

const patterns = [
  {
    name: 'OpenAI API Key',
    regex: /sk-(?:proj-)?[A-Za-z0-9]{20,}/g,
  },
  {
    name: 'Supabase Access Token',
    regex: /sbp_[A-Za-z0-9]{20,}/g,
  },
  {
    name: 'Stripe Secret Key',
    regex: /sk_(?:live|test)_[A-Za-z0-9]{16,}/g,
  },
  {
    name: 'Anthropic API Key',
    regex: /sk-ant-[A-Za-z0-9]{10,}/g,
  },
  {
    name: 'AWS Access Key',
    regex: /AKIA[0-9A-Z]{16}/g,
  },
  {
    name: 'Private Key',
    regex: /-----BEGIN (?:RSA|EC|OPENSSH|PGP) PRIVATE KEY-----/g,
  },
]

const ignorePaths = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
])

function getRepoRoot() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
}

function listFiles() {
  if (fullScan) {
    const output = execSync('git ls-files', { encoding: 'utf8' })
    return output.split('\n').filter(Boolean)
  }

  const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf8',
  })
  return output.split('\n').filter(Boolean)
}

function readFileContent(filePath) {
  if (fullScan) {
    return fs.readFileSync(filePath, 'utf8')
  }
  return execSync(`git show :${filePath}`, { encoding: 'utf8' })
}

function isBinary(content) {
  return content.includes('\u0000')
}

function scanFile(filePath, content) {
  const findings = []
  for (const pattern of patterns) {
    const matches = content.match(pattern.regex)
    if (matches) {
      findings.push({
        name: pattern.name,
        matches: [...new Set(matches)],
      })
    }
  }
  return findings
}

function main() {
  const repoRoot = getRepoRoot()
  const files = listFiles()

  const results = []

  for (const file of files) {
    if (!file || ignorePaths.has(file)) continue
    const absolute = path.join(repoRoot, file)
    if (!fs.existsSync(absolute)) continue
    const stat = fs.statSync(absolute)
    if (stat.isDirectory() || stat.size > 2 * 1024 * 1024) continue

    let content = ''
    try {
      content = readFileContent(file)
    } catch {
      continue
    }

    if (!content || isBinary(content)) continue

    const findings = scanFile(file, content)
    if (findings.length > 0) {
      results.push({ file, findings })
    }
  }

  if (results.length === 0) {
    console.log('Secret scan passed.')
    return
  }

  console.error('Potential secrets detected:')
  for (const result of results) {
    console.error(`- ${result.file}`)
    for (const finding of result.findings) {
      console.error(`  - ${finding.name}: ${finding.matches.join(', ')}`)
    }
  }

  process.exit(1)
}

main()
