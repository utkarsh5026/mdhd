export const fromSnakeToTitleCase = (str: string) => {
  const result = str.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  return result
    .split(' ')
    .map((word) => (capitalWords.has(word.toUpperCase()) ? word.toUpperCase() : word))
    .join(' ');
};

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}

const capitalWords = new Set([
  // Cloud / infrastructure
  'AWS',
  'ECS',
  'EC2',
  'EKS',
  'NUMA',
  'AMI',
  'VPC',
  'RDS',
  // Web / markup
  'HTML',
  'CSS',
  'JS',
  'PHP',
  'XML',
  // Data formats / protocols
  'JSON',
  'SQL',
  'HTTP',
  'HTTPS',
  'FTP',
  'TCP',
  'IP',
  'DNS',
  'REST',
  // APIs / tooling
  'API',
  'NPM',
  'SDK',
  'IDE',
  'URI',
  'URL',
  // Hardware
  'GPU',
  'CPU',
  'RAM',
  'SSD',
  // Design / UX
  'UI',
  'UX',
  // Patterns / principles
  'OOP',
  'ORM',
  'MVC',
  'MVP',
  'MVVM',
  'SOLID',
  'DRY',
  'KISS',
  'YAGNI',
  'MRO',
  'OOPS',
]);
