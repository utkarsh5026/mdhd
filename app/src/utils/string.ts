export const fromSnakeToTitleCase = (str: string) => {
  return str
    .replaceAll('_', ' ')
    .split(' ')
    .map((word: string) => {
      if (word.length === 0) return word;
      const upper = word.toUpperCase();
      if (capitalWords.has(upper)) return upper;
      return word[0].toUpperCase() + word.slice(1);
    })
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
