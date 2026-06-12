'use client';

import { useState } from 'react';
import { solve1079, solve1070, solve1114, solve1113 } from '@/lib/solvers';

type TestCase = { label: string; input: string; output: string };

const testCases: Record<string, TestCase[]> = {
  '1079': [
    { label: 'Basic example', input: '3\n10 20 30\n40 50 60\n70 80 90', output: '23.0\n53.0\n83.0' },
    { label: 'Zero values', input: '1\n0 0 0', output: '0.0' },
    { label: 'Equal values', input: '1\n5 5 5', output: '5.0' },
    { label: 'Large values', input: '1\n100 200 300', output: '230.0' },
    { label: 'Max weight on last value', input: '1\n0 0 100', output: '50.0' },
    { label: 'Max weight on first value', input: '1\n100 0 0', output: '20.0' },
    { label: 'Negative values', input: '1\n-10 -20 -30', output: '-23.0' },
    { label: 'Mixed positive and negative', input: '1\n-10 20 -30', output: '-11.0' },
    { label: 'N=0 (no test cases)', input: '0', output: '' },
    { label: 'Max single value', input: '1\n1000 1000 1000', output: '1000.0' },
    { label: 'All negative weights', input: '1\n-100 -100 -100', output: '-100.0' },
    { label: 'Whitespace in input', input: '  1  2  3  ', output: '2.3' },
  ],
  '1070': [
    { label: 'Basic example', input: '15', output: '15\n17\n19\n21\n23\n25' },
    { label: 'Even number', input: '16', output: '17\n19\n21\n23\n25\n27' },
    { label: 'Negative odd number', input: '-5', output: '-5\n-3\n-1\n1\n3\n5' },
    { label: 'Negative even number', input: '-4', output: '-3\n-1\n1\n3\n5\n7' },
    { label: 'Zero', input: '0', output: '1\n3\n5\n7\n9\n11' },
    { label: 'Boundary: -1', input: '-1', output: '-1\n1\n3\n5\n7\n9' },
    { label: 'Boundary: -2', input: '-2', output: '-1\n1\n3\n5\n7\n9' },
    { label: 'Boundary: 2', input: '2', output: '3\n5\n7\n9\n11\n13' },
    { label: 'Very large positive', input: '999999', output: '999999\n1000001\n1000003\n1000005\n1000007\n1000009' },
    { label: 'Very large even', input: '1000000', output: '1000001\n1000003\n1000005\n1000007\n1000009\n1000011' },
    { label: 'Very large negative', input: '-999999', output: '-999999\n-999997\n-999995\n-999993\n-999991\n-999989' },
    { label: 'Whitespace in input', input: '  15  ', output: '15\n17\n19\n21\n23\n25' },
  ],
  '1114': [
    { label: 'Basic example', input: '1\n2002\n3', output: 'Senha Invalida\nAcesso Permitido' },
    { label: 'Correct password first', input: '2002', output: 'Acesso Permitido' },
    { label: 'Many wrong then correct', input: '1\n2\n3\n4\n5\n2002', output: 'Senha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nAcesso Permitido' },
    { label: 'Always wrong', input: '1\n2\n3\n4\n5', output: 'Senha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida' },
    { label: '2002 with surrounding zeros', input: '0\n0\n2002\n0', output: 'Senha Invalida\nSenha Invalida\nAcesso Permitido' },
    { label: '2002 at the very end', input: '1\n2\n3\n4\n5\n6\n7\n8\n9\n2002', output: 'Senha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nAcesso Permitido' },
    { label: '2002 at the very start', input: '2002\n1\n2\n3', output: 'Acesso Permitido' },
    { label: 'Close to 2002', input: '2001\n2003\n2002', output: 'Senha Invalida\nSenha Invalida\nAcesso Permitido' },
    { label: '50 wrong passwords', input: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20\n21\n22\n23\n24\n25\n26\n27\n28\n29\n30\n31\n32\n33\n34\n35\n36\n37\n38\n39\n40\n41\n42\n43\n44\n45\n46\n47\n48\n49\n50\n2002', output: 'Senha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nSenha Invalida\nAcesso Permitido' },
    { label: '2002 multiple times', input: '2002\n2002\n2002', output: 'Acesso Permitido' },
    { label: 'Whitespace in input', input: '  2002  ', output: 'Acesso Permitido' },
  ],
  '1113': [
    { label: 'Basic example', input: '3 5\n10 5\n7 7', output: 'Crescente\nDecrescente' },
    { label: 'All increasing', input: '1 2\n5 10\n100 200', output: 'Crescente\nCrescente\nCrescente' },
    { label: 'All decreasing', input: '10 5\n200 100\n99 10', output: 'Decrescente\nDecrescente\nDecrescente' },
    { label: 'Equal at start', input: '5 5', output: '' },
    { label: 'Negative numbers', input: '-5 -3\n-1 -10', output: 'Crescente\nDecrescente' },
    { label: 'Equal zero values', input: '0 0', output: '' },
    { label: '-1 and 0', input: '-1 0', output: 'Crescente' },
    { label: '0 and -1', input: '0 -1', output: 'Decrescente' },
    { label: 'Values differing by 1', input: '5 6\n10 9', output: 'Crescente\nDecrescente' },
    { label: 'Large negative values', input: '-999999 -999998\n-100 -200', output: 'Crescente\nDecrescente' },
    { label: 'Large gap', input: '0 1000000\n1000000 0', output: 'Crescente\nDecrescente' },
    { label: 'Equal in middle of sequence', input: '1 2\n5 5\n10 20', output: 'Crescente' },
    { label: 'Decreasing then equal', input: '10 5\n7 7\n1 2', output: 'Decrescente' },
    { label: 'Whitespace in input', input: '  3  5 \n  10  5 ', output: 'Crescente\nDecrescente' },
  ],
};

const problemInfo: Record<string, { title: string; desc: string }> = {
  '1079': { title: 'Problem 1079 - Weighted Averages', desc: 'Read N test cases, each with 3 values (weights: 2, 3, 5). Calculate weighted average.' },
  '1070': { title: 'Problem 1070 - Six Odd Numbers', desc: 'Read an integer X and print 6 consecutive odd numbers starting from X.' },
  '1114': { title: 'Problem 1114 - Fixed Password', desc: 'Read integers until 2002 is entered. Wrong: "Senha Invalida", Correct: "Acesso Permitido".' },
  '1113': { title: 'Problem 1113 - Fixed Altitude', desc: 'Read pairs of integers. First < Second: "Crescente", First > Second: "Decrescente", First == Second: stop.' },
};

const solvers: Record<string, (input: string) => string> = {
  '1079': solve1079,
  '1070': solve1070,
  '1114': solve1114,
  '1113': solve1113,
};

export default function SolvePage() {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [customOutputs, setCustomOutputs] = useState<Record<string, string>>({});
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});

  const handleCustomSolve = (id: string) => {
    const input = customInputs[id];
    if (!input) {
      setCustomOutputs(prev => ({ ...prev, [id]: '' }));
      setCustomErrors(prev => ({ ...prev, [id]: '' }));
      return;
    }
    try {
      const output = solvers[id](input);
      setCustomOutputs(prev => ({ ...prev, [id]: output }));
      setCustomErrors(prev => ({ ...prev, [id]: '' }));
    } catch (e) {
      setCustomOutputs(prev => ({ ...prev, [id]: '' }));
      setCustomErrors(prev => ({ ...prev, [id]: e instanceof Error ? e.message : 'Unknown error' }));
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>beecrowd Final Test</h1>
      <p style={{ color: '#888', marginBottom: 32, fontSize: 16 }}>
        Solutions with test cases for all 4 problems
      </p>

      <div style={{ display: 'grid', gap: 24 }}>
        {Object.entries(testCases).map(([id, cases]) => {
          const info = problemInfo[id];
          const customOutput = customOutputs[id] || '';
          const customError = customErrors[id] || '';
          const hasCustom = customOutput || customError;

          return (
            <div key={id} style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #222' }}>
                <h2 style={{ fontSize: 18, marginBottom: 4, color: '#fff' }}>{info.title}</h2>
                <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>{info.desc}</p>
              </div>

              {/* Test cases */}
              <div style={{ padding: 16 }}>
                {cases.map((tc, i) => (
                  <div key={i} style={{
                    padding: 14,
                    background: '#0a0a0a',
                    border: '1px solid #222',
                    borderRadius: 8,
                    marginBottom: i < cases.length - 1 ? 10 : 0,
                  }}>
                    <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, marginBottom: 10 }}>
                      {tc.label}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Input</div>
                        <pre style={{ padding: 10, background: '#050505', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, color: '#e2e2e2', whiteSpace: 'pre-wrap', margin: 0 }}>{tc.input}</pre>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Output</div>
                        <pre style={{ padding: 10, background: '#050505', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, color: '#4ade80', whiteSpace: 'pre-wrap', margin: 0 }}>{tc.output || '(empty)'}</pre>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Custom Input */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #222' }}>
                  <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, marginBottom: 10 }}>
                    Custom Input
                  </div>
                  <textarea
                    value={customInputs[id] || ''}
                    onChange={e => setCustomInputs(prev => ({ ...prev, [id]: e.target.value }))}
                    placeholder="Enter your custom input..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: '#050505',
                      border: '1px solid #333',
                      borderRadius: 8,
                      color: '#e2e2e2',
                      fontFamily: 'monospace',
                      fontSize: 13,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      marginBottom: 10,
                    }}
                  />
                  <button
                    onClick={() => handleCustomSolve(id)}
                    style={{
                      padding: '8px 24px',
                      background: '#2563eb',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Run
                  </button>

                  {customError && (
                    <div style={{ marginTop: 10, padding: 10, background: '#3d1f1f', border: '1px solid #6b2121', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
                      {customError}
                    </div>
                  )}

                  {customOutput && !customError && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Custom Output</div>
                      <pre style={{ padding: 10, background: '#050505', border: '1px solid #222', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: '#4ade80', whiteSpace: 'pre-wrap', margin: 0 }}>{customOutput}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
