import { NextResponse } from "next/server";

function transformVariant(text: string, opts: { changeCase: boolean; shuffleLetters: boolean; replaceLetters: boolean }) {
  let s = text;
  if (opts.changeCase) {
    s = [...s].map((ch) => (/[a-z]/i.test(ch) ? (Math.random() < 0.5 ? ch.toLowerCase() : ch.toUpperCase()) : ch)).join("");
  }
  if (opts.shuffleLetters) {
    const arr = [...s];
    for (let i = 0; i < arr.length; i += 3) {
      const slice = arr.slice(i, i + 3);
      for (let j = slice.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [slice[j], slice[k]] = [slice[k], slice[j]];
      }
      for (let j = 0; j < slice.length; j++) arr[i + j] = slice[j];
    }
    s = arr.join("");
  }
  if (opts.replaceLetters) {
    const map: Record<string, string> = { o: "0", O: "0", i: "1", I: "1", s: "$", S: "$", a: "@", e: "3", E: "3", g: "9", G: "9" };
    s = [...s].map((ch) => map[ch] ?? ch).join("");
  }
  return s;
}

function scoreVariant(original: string, variant: string) {
  const alpha = (variant.match(/[a-z]/gi)?.length ?? 0) / Math.max(variant.length, 1);
  const symbols = (variant.match(/[^a-z0-9\s]/gi)?.length ?? 0) / Math.max(variant.length, 1);
  const diff = levenshtein(original, variant) / Math.max(original.length, 1);
  return 0.6 * diff + 0.3 * alpha - 0.2 * symbols;
}

function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt: userPrompt, n = 10, transforms = { changeCase: true, shuffleLetters: true, replaceLetters: true } } = body ?? {};
    if (typeof userPrompt !== "string" || !userPrompt.trim()) return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });

    // Generate N transformed variants locally
    const variants: string[] = [];
    for (let i = 0; i < Math.min(n, 50); i++) {
      variants.push(transformVariant(userPrompt, transforms));
    }

    const all = [...variants];
    if (all.length === 0) return NextResponse.json({ error: "No variants generated" }, { status: 500 });

    let best = all[0], bestScore = scoreVariant(userPrompt, best);
    for (const v of all.slice(1)) {
      const s = scoreVariant(userPrompt, v);
      if (s > bestScore) { best = v; bestScore = s; }
    }

    return NextResponse.json({ best, variants: all });
  } catch (error) {
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}