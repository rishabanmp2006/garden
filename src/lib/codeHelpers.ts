import type {
  CodeFile,
  FileTreeNode,
  CodeLanguage,
} from '../types/code';
import {
  SUPPORTED_EXTENSIONS,
  DISALLOWED_FILES,
  DISALLOWED_EXTENSIONS,
} from '../types/code';

/**
 * Checks whether a filename represents a secret or credential file that must never be loaded.
 */
export function isSecretFile(filename: string): boolean {
  const lower = filename.toLowerCase().trim();
  const base = lower.split('/').pop() || lower;

  if (DISALLOWED_FILES.includes(base)) return true;
  for (const ext of DISALLOWED_EXTENSIONS) {
    if (base.endsWith(ext)) return true;
  }
  if (base.startsWith('.env.') && !base.endsWith('.example')) return true;
  if (base.includes('id_rsa') || base.includes('id_ed25519') || base.includes('id_ecdsa') || base.includes('id_dsa')) return true;
  return false;
}

/**
 * Detects the programming language based on file extension.
 */
export function detectLanguage(filename: string): CodeLanguage {
  const lower = filename.toLowerCase().trim();
  const ext = '.' + (lower.split('.').pop() || '');

  if (SUPPORTED_EXTENSIONS[ext]) {
    return SUPPORTED_EXTENSIONS[ext];
  }

  if (lower.endsWith('.env.example')) return 'plaintext';
  return 'plaintext';
}

/**
 * Validates whether a file qualifies as a supported code/text research file.
 */
export function isSupportedCodeFile(filename: string): boolean {
  if (isSecretFile(filename)) return false;
  const lower = filename.toLowerCase().trim();
  if (lower.endsWith('.env.example')) return true;

  const ext = '.' + (lower.split('.').pop() || '');
  return Boolean(SUPPORTED_EXTENSIONS[ext]);
}

/**
 * Computes deterministic SHA-256 hex hash using browser SubtleCrypto.
 */
export async function computeContentSha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constructs a hierarchical tree from a flat list of CodeFiles based on storage_path or name.
 */
export function buildFileTree(files: CodeFile[]): FileTreeNode[] {
  const rootNodes: Record<string, any> = {};

  for (const file of files) {
    const rawPath = file.storage_path
      ? file.storage_path.replace(/^\/storage\/(public|confidential)\//, '').replace(/^\/+/, '')
      : file.name;
    const parts = rawPath.split('/').filter(Boolean);

    let currentLevel = rootNodes;
    let accumulatedPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (isFile) {
        currentLevel[part] = {
          id: file.id,
          name: part,
          path: accumulatedPath,
          isFolder: false,
          file,
          children: {},
        };
      } else {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            id: `folder-${accumulatedPath}`,
            name: part,
            path: accumulatedPath,
            isFolder: true,
            children: {},
          };
        }
        currentLevel = currentLevel[part].children;
      }
    }
  }

  function convertToNodes(obj: Record<string, any>): FileTreeNode[] {
    const nodes: FileTreeNode[] = Object.values(obj).map((item) => ({
      id: item.id,
      name: item.name,
      path: item.path,
      isFolder: item.isFolder,
      file: item.file,
      children: convertToNodes(item.children),
    }));

    // Folders first, then alphabetically
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return convertToNodes(rootNodes);
}

/**
 * Generates appropriate research code boilerplate for new files.
 */
export function getDefaultBoilerplate(filename: string, language: CodeLanguage): string {
  const baseName = filename.split('/').pop() || filename;

  switch (language) {
    case 'python':
      return `"""
ResearchMesh Governed Research Module: ${baseName}
Provenance: Governed by project charter & SHA-256 Ledger
"""

import os
import sys

def main():
    print("Executing research pipeline module: ${baseName}")

if __name__ == "__main__":
    main()
`;
    case 'typescript':
    case 'javascript':
      return `/**
 * ResearchMesh: ${baseName}
 */

export function runModule() {
  console.log("Research module loaded: ${baseName}");
}
`;
    case 'json':
      return `{\n  "module": "${baseName}",\n  "version": "1.0.0",\n  "parameters": {}\n}\n`;
    case 'markdown':
      return `# ${baseName}\n\nResearch documentation and problem boundaries.\n`;
    case 'yaml':
      return `name: ${baseName}\nversion: 1.0\npipeline:\n  steps: []\n`;
    case 'sql':
      return `-- ResearchMesh Query: ${baseName}\nSELECT 1;\n`;
    case 'shell':
      return `#!/usr/bin/env bash\n# ResearchMesh script: ${baseName}\nset -e\n`;
    default:
      return `# ${baseName}\n`;
  }
}
