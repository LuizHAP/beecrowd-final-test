import { NextResponse } from 'next/server';
import { solve1079, solve1070, solve1114, solve1113 } from '@/lib/solvers';

const solvers: Record<string, (input: string) => string> = {
  '1079': solve1079,
  '1070': solve1070,
  '1114': solve1114,
  '1113': solve1113,
};

export async function POST(request: Request) {
  try {
    const { problemId, input } = await request.json();

    if (!problemId || !input) {
      return NextResponse.json(
        { error: 'Missing problemId or input' },
        { status: 400 }
      );
    }

    const solver = solvers[problemId];
    if (!solver) {
      return NextResponse.json(
        { error: `Unknown problem: ${problemId}` },
        { status: 404 }
      );
    }

    const output = solver(input);

    return NextResponse.json({ problemId, output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
