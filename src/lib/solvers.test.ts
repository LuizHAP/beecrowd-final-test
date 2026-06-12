import { describe, it, expect } from 'vitest';
import { solve1079, solve1070, solve1114, solve1113 } from './solvers';

describe('solve1079 - Weighted Averages', () => {
  it('calculates weighted average correctly (weights 2, 3, 5)', () => {
    const input = '3\n10 20 30\n40 50 60\n70 80 90';
    const result = solve1079(input);
    expect(result).toBe('23.0\n53.0\n83.0');
  });

  it('calculates for a single case', () => {
    const input = '1\n5 10 15';
    const result = solve1079(input);
    expect(result).toBe('11.5');
  });

  it('handles zero values', () => {
    const input = '1\n0 0 0';
    const result = solve1079(input);
    expect(result).toBe('0.0');
  });

  it('handles equal values', () => {
    const input = '1\n5 5 5';
    const result = solve1079(input);
    expect(result).toBe('5.0');
  });

  it('handles large values', () => {
    const input = '1\n100 200 300';
    const result = solve1079(input);
    expect(result).toBe('230.0');
  });

  it('handles max weight on last value', () => {
    const input = '1\n0 0 100';
    const result = solve1079(input);
    expect(result).toBe('50.0');
  });

  it('handles max weight on first value', () => {
    const input = '1\n100 0 0';
    const result = solve1079(input);
    expect(result).toBe('20.0');
  });

  it('handles negative values', () => {
    const input = '1\n-10 -20 -30';
    const result = solve1079(input);
    expect(result).toBe('-23.0');
  });

  it('handles multiple cases', () => {
    const input = '2\n1 2 3\n4 5 6';
    const result = solve1079(input);
    expect(result).toBe('2.3\n5.3');
  });

  // Edge cases
  it('handles N=0 (no test cases)', () => {
    const input = '0';
    const result = solve1079(input);
    expect(result).toBe('');
  });

  it('handles N=1 with single case', () => {
    const input = '1\n1 2 3';
    const result = solve1079(input);
    // (1*2 + 2*3 + 3*5) / 10 = (2 + 6 + 15) / 10 = 2.3
    expect(result).toBe('2.3');
  });

  it('handles decimal rounding to 1 decimal place', () => {
    const input = '1\n1 1 2';
    const result = solve1079(input);
    // (1*2 + 1*3 + 2*5) / 10 = (2 + 3 + 10) / 10 = 1.5
    expect(result).toBe('1.5');
  });

  it('handles decimal rounding that produces .0', () => {
    const input = '1\n10 10 10';
    const result = solve1079(input);
    // (10*2 + 10*3 + 10*5) / 10 = (20 + 30 + 50) / 10 = 10.0
    expect(result).toBe('10.0');
  });

  it('handles mixed positive and negative values', () => {
    const input = '1\n-10 20 -30';
    const result = solve1079(input);
    // (-10*2 + 20*3 + -30*5) / 10 = (-20 + 60 - 150) / 10 = -11.0
    expect(result).toBe('-11.0');
  });

  it('handles very large N', () => {
    const lines = ['100'];
    for (let i = 0; i < 100; i++) {
      lines.push(`${i} ${i + 1} ${i + 2}`);
    }
    const input = lines.join('\n');
    const result = solve1079(input);
    const outputs = result.split('\n');
    expect(outputs.length).toBe(100);
    // (0*2 + 1*3 + 2*5) / 10 = (0 + 3 + 10) / 10 = 1.3
    expect(outputs[0]).toBe('1.3');
  });

  it('handles whitespace-only lines between values', () => {
    const input = '1\n  10   20    30  ';
    const result = solve1079(input);
    expect(result).toBe('23.0');
  });

  it('handles trailing newline in input', () => {
    const input = '1\n10 20 30\n';
    const result = solve1079(input);
    expect(result).toBe('23.0');
  });

  it('handles leading newline in input', () => {
    const input = '\n1\n10 20 30';
    const result = solve1079(input);
    expect(result).toBe('23.0');
  });

  it('handles maximum single value (1000)', () => {
    const input = '1\n1000 1000 1000';
    const result = solve1079(input);
    // (1000*2 + 1000*3 + 1000*5) / 10 = 10000/10 = 1000.0
    expect(result).toBe('1000.0');
  });

  it('handles all negative weights result', () => {
    const input = '1\n-100 -100 -100';
    const result = solve1079(input);
    // (-100*2 + -100*3 + -100*5) / 10 = -1000/10 = -100.0
    expect(result).toBe('-100.0');
  });
});

describe('solve1070 - Six Odd Numbers', () => {
  it('prints 6 consecutive odd numbers from odd input', () => {
    const input = '15';
    const result = solve1070(input);
    expect(result).toBe('15\n17\n19\n21\n23\n25');
  });

  it('skips even number and starts from next odd', () => {
    const input = '16';
    const result = solve1070(input);
    expect(result).toBe('17\n19\n21\n23\n25\n27');
  });

  it('handles negative odd number', () => {
    const input = '-5';
    const result = solve1070(input);
    expect(result).toBe('-5\n-3\n-1\n1\n3\n5');
  });

  it('handles negative even number', () => {
    const input = '-4';
    const result = solve1070(input);
    expect(result).toBe('-3\n-1\n1\n3\n5\n7');
  });

  it('handles zero', () => {
    const input = '0';
    const result = solve1070(input);
    expect(result).toBe('1\n3\n5\n7\n9\n11');
  });

  it('handles small positive odd number', () => {
    const input = '1';
    const result = solve1070(input);
    expect(result).toBe('1\n3\n5\n7\n9\n11');
  });

  it('handles large numbers', () => {
    const input = '1000';
    const result = solve1070(input);
    expect(result).toBe('1001\n1003\n1005\n1007\n1009\n1011');
  });

  it('handles large even numbers', () => {
    const input = '1002';
    const result = solve1070(input);
    expect(result).toBe('1003\n1005\n1007\n1009\n1011\n1013');
  });

  // Edge cases
  it('handles -1 (smallest odd boundary)', () => {
    const input = '-1';
    const result = solve1070(input);
    expect(result).toBe('-1\n1\n3\n5\n7\n9');
  });

  it('handles -2 (even before -1)', () => {
    const input = '-2';
    const result = solve1070(input);
    expect(result).toBe('-1\n1\n3\n5\n7\n9');
  });

  it('handles -3', () => {
    const input = '-3';
    const result = solve1070(input);
    expect(result).toBe('-3\n-1\n1\n3\n5\n7');
  });

  it('handles 2 (smallest positive even)', () => {
    const input = '2';
    const result = solve1070(input);
    expect(result).toBe('3\n5\n7\n9\n11\n13');
  });

  it('handles 3 (smallest positive odd > 1)', () => {
    const input = '3';
    const result = solve1070(input);
    expect(result).toBe('3\n5\n7\n9\n11\n13');
  });

  it('handles very large positive number', () => {
    const input = '999999';
    const result = solve1070(input);
    expect(result).toBe('999999\n1000001\n1000003\n1000005\n1000007\n1000009');
  });

  it('handles very large even number', () => {
    const input = '1000000';
    const result = solve1070(input);
    expect(result).toBe('1000001\n1000003\n1000005\n1000007\n1000009\n1000011');
  });

  it('handles very large negative number', () => {
    const input = '-999999';
    const result = solve1070(input);
    expect(result).toBe('-999999\n-999997\n-999995\n-999993\n-999991\n-999989');
  });

  it('handles whitespace around input', () => {
    const input = '  15  ';
    const result = solve1070(input);
    expect(result).toBe('15\n17\n19\n21\n23\n25');
  });

  it('handles input with trailing newline', () => {
    const input = '15\n';
    const result = solve1070(input);
    expect(result).toBe('15\n17\n19\n21\n23\n25');
  });

  it('verifies all outputs are odd numbers', () => {
    const input = '10';
    const result = solve1070(input);
    const numbers = result.split('\n').map(Number);
    expect(numbers.length).toBe(6);
    numbers.forEach(n => expect(n % 2).not.toBe(0));
  });

  it('verifies outputs are consecutive odd numbers', () => {
    const input = '50';
    const result = solve1070(input);
    const numbers = result.split('\n').map(Number);
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i] - numbers[i - 1]).toBe(2);
    }
  });

  it('handles input 4 (even, skips to 5)', () => {
    const input = '4';
    const result = solve1070(input);
    expect(result).toBe('5\n7\n9\n11\n13\n15');
  });
});

describe('solve1114 - Fixed Password', () => {
  it('rejects wrong passwords and accepts 2002', () => {
    const input = '1\n2002\n3';
    const result = solve1114(input);
    expect(result).toBe('Senha Invalida\nAcesso Permitido');
  });

  it('accepts correct password on first try', () => {
    const input = '2002';
    const result = solve1114(input);
    expect(result).toBe('Acesso Permitido');
  });

  it('rejects all passwords if 2002 never appears', () => {
    const input = '1\n2\n3\n4\n5';
    const result = solve1114(input);
    expect(result).toBe(
      'Senha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida'
    );
  });

  it('stops at first correct password', () => {
    const input = '1\n2002\n2002\n2002';
    const result = solve1114(input);
    expect(result).toBe('Senha Invalida\nAcesso Permitido');
  });

  it('handles a single wrong password', () => {
    const input = '999';
    const result = solve1114(input);
    expect(result).toBe('Senha Invalida');
  });

  it('handles a single correct password', () => {
    const input = '2002';
    const result = solve1114(input);
    expect(result).toBe('Acesso Permitido');
  });

  it('handles many wrong passwords before correct one', () => {
    const input = '1\n2\n3\n4\n5\n2002';
    const result = solve1114(input);
    expect(result).toBe(
      'Senha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nAcesso Permitido'
    );
  });

  // Edge cases
  it('handles password 2002 with surrounding zeros', () => {
    const input = '0\n0\n2002\n0';
    const result = solve1114(input);
    expect(result).toBe('Senha Invalida\nSenha Invalida\nAcesso Permitido');
  });

  it('handles password 2002 as part of larger sequence', () => {
    const input = '2001\n2002\n2003';
    const result = solve1114(input);
    expect(result).toBe('Senha Invalida\nAcesso Permitido');
  });

  it('handles only wrong passwords, no correct one', () => {
    const input = '2001\n2003';
    const result = solve1114(input);
    expect(result).toBe('Senha Invalida\nSenha Invalida');
  });

  it('handles 2002 appearing at the very end', () => {
    const input = '1\n2\n3\n4\n5\n6\n7\n8\n9\n2002';
    const result = solve1114(input);
    const lines = result.split('\n');
    expect(lines.length).toBe(10);
    expect(lines[0]).toBe('Senha Invalida');
    expect(lines[8]).toBe('Senha Invalida');
    expect(lines[9]).toBe('Acesso Permitido');
  });

  it('handles 2002 appearing at the very start', () => {
    const input = '2002\n1\n2\n3';
    const result = solve1114(input);
    expect(result).toBe('Acesso Permitido');
  });

  it('handles single digit wrong password', () => {
    const input = '1';
    const result = solve1114(input);
    expect(result).toBe('Senha Invalida');
  });

  it('handles three-digit wrong password', () => {
    const input = '999';
    const result = solve1114(input);
    expect(result).toBe('Senha Invalida');
  });

  it('handles four-digit wrong password close to 2002', () => {
    const input = '2001\n2003\n2002';
    const result = solve1114(input);
    expect(result).toBe('Senha Invalida\nSenha Invalida\nAcesso Permitido');
  });

  it('handles whitespace around input', () => {
    const input = '  2002  ';
    const result = solve1114(input);
    expect(result).toBe('Acesso Permitido');
  });

  it('handles input with trailing newline', () => {
    const input = '2002\n';
    const result = solve1114(input);
    expect(result).toBe('Acesso Permitido');
  });

  it('handles many consecutive wrong passwords', () => {
    const lines = [];
    for (let i = 1; i <= 50; i++) {
      lines.push(String(i));
    }
    lines.push('2002');
    const input = lines.join('\n');
    const result = solve1114(input);
    const lines_out = result.split('\n');
    expect(lines_out.length).toBe(51);
    expect(lines_out[50]).toBe('Acesso Permitido');
    for (let i = 0; i < 50; i++) {
      expect(lines_out[i]).toBe('Senha Invalida');
    }
  });

  it('handles 2002 appearing multiple times', () => {
    const input = '2002\n2002\n2002';
    const result = solve1114(input);
    expect(result).toBe('Acesso Permitido');
  });
});

describe('solve1113 - Fixed Altitude', () => {
  it('detects increasing and decreasing sequence', () => {
    const input = '3 5\n10 5\n7 7';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente');
  });

  it('stops when values are equal', () => {
    const input = '1 2\n3 3\n4 5';
    const result = solve1113(input);
    expect(result).toBe('Crescente');
  });

  it('handles all increasing', () => {
    const input = '1 2\n5 10\n100 200';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nCrescente\nCrescente');
  });

  it('handles all decreasing', () => {
    const input = '10 5\n200 100\n99 10';
    const result = solve1113(input);
    expect(result).toBe('Decrescente\nDecrescente\nDecrescente');
  });

  it('handles equal at start', () => {
    const input = '5 5';
    const result = solve1113(input);
    expect(result).toBe('');
  });

  it('handles negative numbers', () => {
    const input = '-5 -3\n-1 -10';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente');
  });

  it('handles negative equal', () => {
    const input = '-5 -5';
    const result = solve1113(input);
    expect(result).toBe('');
  });

  it('handles mixed positive and negative', () => {
    const input = '-1 1\n1 -1';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente');
  });

  it('handles large values', () => {
    const input = '1 999999\n999999 1';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente');
  });

  // Edge cases
  it('handles equal zero values', () => {
    const input = '0 0';
    const result = solve1113(input);
    expect(result).toBe('');
  });

  it('handles -1 and 0', () => {
    const input = '-1 0';
    const result = solve1113(input);
    expect(result).toBe('Crescente');
  });

  it('handles 0 and -1', () => {
    const input = '0 -1';
    const result = solve1113(input);
    expect(result).toBe('Decrescente');
  });

  it('handles -1 and 1', () => {
    const input = '-1 1';
    const result = solve1113(input);
    expect(result).toBe('Crescente');
  });

  it('handles 1 and -1', () => {
    const input = '1 -1';
    const result = solve1113(input);
    expect(result).toBe('Decrescente');
  });

  it('handles single pair that is equal', () => {
    const input = '42 42';
    const result = solve1113(input);
    expect(result).toBe('');
  });

  it('handles single pair that is increasing', () => {
    const input = '42 43';
    const result = solve1113(input);
    expect(result).toBe('Crescente');
  });

  it('handles single pair that is decreasing', () => {
    const input = '43 42';
    const result = solve1113(input);
    expect(result).toBe('Decrescente');
  });

  it('handles alternating increasing and decreasing', () => {
    const input = '1 2\n3 2\n2 5\n7 6';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente\nCrescente\nDecrescente');
  });

  it('handles alternating then equal', () => {
    const input = '1 2\n3 2\n2 5\n10 10';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente\nCrescente');
  });

  it('handles values differing by 1', () => {
    const input = '5 6\n10 9';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente');
  });

  it('handles large negative values', () => {
    const input = '-999999 -999998\n-100 -200';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente');
  });

  it('handles whitespace around input', () => {
    const input = '  3  5 \n  10  5 ';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente');
  });

  it('handles input with trailing newline', () => {
    const input = '3 5\n10 5\n';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente');
  });

  it('handles equal values in the middle of sequence', () => {
    const input = '1 2\n5 5\n10 20';
    const result = solve1113(input);
    expect(result).toBe('Crescente');
  });

  it('handles decreasing then equal then increasing (stops at equal)', () => {
    const input = '10 5\n7 7\n1 2';
    const result = solve1113(input);
    expect(result).toBe('Decrescente');
  });

  it('handles values with large gap', () => {
    const input = '0 1000000\n1000000 0';
    const result = solve1113(input);
    expect(result).toBe('Crescente\nDecrescente');
  });
});
