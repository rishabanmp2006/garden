export interface CodeFile {
  id: string;
  project_id: string;
  name: string;
  storage_path: string;
  file_size?: string;
  is_confidential: boolean;
  sensitivity_level?: string;
  export_policy?: string;
  uploaded_by?: string;
  created_at?: string;
  content?: string;
  isDirty?: boolean;
  language?: string;
}

export interface OpenTab {
  fileId: string;
  filePath: string;
  fileName: string;
  language: string;
  isDirty: boolean;
  content: string;
  originalContent: string;
  isConfidential: boolean;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  file?: CodeFile;
  children: FileTreeNode[];
}

export type CodeLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'sql'
  | 'html'
  | 'css'
  | 'scss'
  | 'shell'
  | 'xml'
  | 'plaintext';

export const SUPPORTED_EXTENSIONS: Record<string, CodeLanguage> = {
  '.py': 'python',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.sql': 'sql',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sh': 'shell',
  '.bash': 'shell',
  '.xml': 'xml',
  '.txt': 'plaintext',
  '.csv': 'plaintext',
  '.example': 'plaintext',
};

export const DISALLOWED_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.staging',
  '.env.test',
  'id_rsa',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
];

export const DISALLOWED_EXTENSIONS = ['.pem', '.key', '.pkcs12', '.pfx', '.crt', '.cert'];
