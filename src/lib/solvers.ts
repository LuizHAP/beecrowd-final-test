// Problem 1079 - Weighted Averages
// Read N test cases, each with 3 values (weights: 2, 3, 5)
export function solve1079(input: string): string {
  const lines = input.trim().split('\n');
  const n = parseInt(lines[0]);
  const results: string[] = [];

  for (let i = 1; i <= n; i++) {
    const values = lines[i].trim().split(/\s+/).filter(Boolean).map(Number);
    const [a, b, c] = values;
    const average = (a * 2 + b * 3 + c * 5) / 10;
    results.push(average.toFixed(1));
  }

  return results.join('\n');
}

// Problem 1070 - Six Odd Numbers
// Read an integer X and print 6 consecutive odd numbers starting from X
export function solve1070(input: string): string {
  const x = parseInt(input.trim());
  const results: number[] = [];
  let current = x;

  while (results.length < 6) {
    if (current % 2 !== 0) {
      results.push(current);
    }
    current++;
  }

  return results.join('\n');
}

// Problem 1114 - Fixed Password
// Read integers until 2002 is entered
// Wrong password: "Senha Invalida"
// Correct password (2002): "Acesso Permitido"
export function solve1114(input: string): string {
  const lines = input.trim().split('\n').map(Number);
  const results: string[] = [];

  for (const num of lines) {
    if (num === 2002) {
      results.push('Acesso Permitido');
      break;
    }
    results.push('Senha Invalida');
  }

  return results.join('\n');
}

// Problem 1113 - Fixed Altitude
// Read pairs of integers
// First < Second: "Crescente"
// First > Second: "Decrescente"
// First == Second: stop
export function solve1113(input: string): string {
  const lines = input.trim().split('\n').map(line =>
    line.trim().split(/\s+/).filter(Boolean).map(Number)
  );
  const results: string[] = [];

  for (const [a, b] of lines) {
    if (a === b) break;
    if (a < b) {
      results.push('Crescente');
    } else {
      results.push('Decrescente');
    }
  }

  return results.join('\n');
}
