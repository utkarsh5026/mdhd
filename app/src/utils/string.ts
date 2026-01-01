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
  'AWS',
  'ECS',
  'EC2',
  'EKS',
  'NUMA',
  'AMI',
  'VPC',
  'API',
  'HTML',
  'CSS',
  'JS',
  'JSON',
  'XML',
  'SQL',
  'API',
  'HTML',
  'CSS',
  'PHP',
  'HTTP',
  'HTTPS',
  'UI',
  'UX',
  'URL',
  'URI',
  'FTP',
  'TCP',
  'IP',
  'DNS',
  'GPU',
  'CPU',
  'RAM',
  'SSD',
  'IDE',
  'SDK',
  'REST',
  'NPM',
  'SOLID',
  'OOP',
  'MVC',
  'MVP',
  'MVVM',
  'MVVP',
  'MVVP',
  'DRY',
  'KISS',
  'YAGNI',
  'RDS',
  'OOPS',
  'MRO',
  'ORM',
]);
