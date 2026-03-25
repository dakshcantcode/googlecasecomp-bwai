/**
 * Mock concept data powering all 6 format views.
 * Keyed by conceptId — same IDs used in MOCK_QUESTIONS in api.ts.
 */

export interface WorkedExampleStep {
  description: string;
  math: string;
  annotation: string;
}

export interface WorkedExampleData {
  problem: string;
  steps: WorkedExampleStep[];
  final_answer: string;
}

export interface SimVariable {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
}

export interface SimConfig {
  variables: SimVariable[];
  output_formula: string;
  output_label: string;
  visual_type: "bar" | "graph" | "rotation" | "vector";
}

export interface YouTubeClipData {
  video_id: string;
  channel_name: string;
  start_seconds: number;
  end_seconds: number;
  comprehension_question: string;
  comprehension_answer: string;
}

export interface ConceptData {
  id: string;
  label: string;
  simplified_text: string;
  detailed_text: string;
  formulas: string[];
  common_mistakes: string[];
  worked_examples: WorkedExampleData[];
  simulation_config: SimConfig;
  youtube_clip: YouTubeClipData;
}

const CHAIN_RULE: ConceptData = {
  id: "chain-rule",
  label: "Chain Rule",
  simplified_text:
    "The chain rule lets you differentiate a function inside another function. Think of it as peeling an onion — you differentiate the outer layer first, then multiply by the derivative of the inner layer.\n\nIf you have $f(g(x))$, its derivative is $f'(g(x)) \\cdot g'(x)$. The outer function is differentiated (keeping the inner intact), then multiplied by the derivative of the inner function.",
  detailed_text:
    "**Formal statement:** If $f$ and $g$ are differentiable and $h(x) = f(g(x))$, then:\n$$h'(x) = f'(g(x)) \\cdot g'(x)$$\n\n**Proof via Leibniz notation:**\nLet $u = g(x)$, so $h = f(u)$. Then:\n$$\\frac{dh}{dx} = \\frac{dh}{du} \\cdot \\frac{du}{dx}$$\n\nThis is the Leibniz form of the chain rule. It holds whenever $g$ is differentiable at $x$ and $f$ is differentiable at $g(x)$.\n\n**Composition depth:** For a triple composition $f(g(h(x)))$:\n$$\\frac{d}{dx}[f(g(h(x)))] = f'(g(h(x))) \\cdot g'(h(x)) \\cdot h'(x)$$",
  formulas: [
    "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)",
    "\\frac{dh}{dx} = \\frac{dh}{du} \\cdot \\frac{du}{dx}",
  ],
  common_mistakes: [
    "Forgetting to multiply by the inner derivative — e.g., writing $(\\sin x^2)' = \\cos x^2$ instead of $2x\\cos x^2$.",
    "Confusing $f'(g(x))$ with $f'(g'(x))$ — the outer derivative is evaluated at the inner function, not at its derivative.",
  ],
  worked_examples: [
    {
      problem: "Differentiate $y = \\sin(3x^2 + 1)$.",
      steps: [
        {
          description: "Identify the outer and inner functions",
          math: "\\text{outer: } f(u) = \\sin(u), \\quad \\text{inner: } g(x) = 3x^2 + 1",
          annotation: "Always name your layers before computing.",
        },
        {
          description: "Differentiate the outer function (keeping inner intact)",
          math: "f'(u) = \\cos(u) \\Rightarrow f'(g(x)) = \\cos(3x^2 + 1)",
          annotation: "Evaluate $f'$ at $u = g(x)$, not at $x$.",
        },
        {
          description: "Differentiate the inner function",
          math: "g'(x) = 6x",
          annotation: "Standard power rule on $3x^2 + 1$.",
        },
        {
          description: "Multiply: chain rule result",
          math: "y' = \\cos(3x^2 + 1) \\cdot 6x",
          annotation: "Outer derivative × inner derivative.",
        },
      ],
      final_answer: "y' = 6x\\cos(3x^2 + 1)",
    },
  ],
  simulation_config: {
    variables: [
      { name: "a", label: "Coefficient a", min: 1, max: 5, default: 3, step: 0.5 },
      { name: "n", label: "Power n", min: 1, max: 4, default: 2, step: 1 },
    ],
    output_formula: "a \\cdot n \\cdot x^{n-1}",
    output_label: "Derivative magnitude at x=1",
    visual_type: "bar",
  },
  youtube_clip: {
    video_id: "YG15m2VwSjA",
    channel_name: "3Blue1Brown",
    start_seconds: 0,
    end_seconds: 300,
    comprehension_question: "In the chain rule, what does $f'(g(x))$ mean geometrically?",
    comprehension_answer: "the stretch factor of the outer function evaluated at the inner function's output",
  },
};

const INTEGRATION: ConceptData = {
  id: "integration",
  label: "Integration",
  simplified_text:
    "Integration is the reverse of differentiation. Where a derivative tells you the rate of change, an integral accumulates that change over an interval.\n\nThe Fundamental Theorem of Calculus connects the two: $\\int_a^b f'(x)\\,dx = f(b) - f(a)$. You evaluate the antiderivative at the endpoints and subtract.",
  detailed_text:
    "**Fundamental Theorem of Calculus (Part 2):**\nIf $F$ is an antiderivative of $f$ on $[a, b]$, then:\n$$\\int_a^b f(x)\\,dx = F(b) - F(a)$$\n\n**Part 1:** If $g(x) = \\int_a^x f(t)\\,dt$, then $g'(x) = f(x)$.\n\nThis means differentiation and integration are inverse operations (up to a constant).\n\n**Riemann sum foundation:**\n$$\\int_a^b f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^n f(x_i^*) \\Delta x$$\nwhere $\\Delta x = (b-a)/n$.",
  formulas: [
    "\\int_a^b f'(x)\\,dx = f(b) - f(a)",
    "\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)",
  ],
  common_mistakes: [
    "Forgetting the $+C$ constant in indefinite integrals.",
    "Mixing up limits of integration — always evaluate $F(b) - F(a)$, not $F(a) - F(b)$.",
  ],
  worked_examples: [
    {
      problem: "Evaluate $\\int_0^2 (3x^2 - 2x)\\,dx$.",
      steps: [
        {
          description: "Find the antiderivative term by term",
          math: "F(x) = x^3 - x^2",
          annotation: "Apply the power rule in reverse: $\\int x^n = x^{n+1}/(n+1)$.",
        },
        {
          description: "Evaluate at the upper limit",
          math: "F(2) = 8 - 4 = 4",
          annotation: "Substitute $x = 2$.",
        },
        {
          description: "Evaluate at the lower limit",
          math: "F(0) = 0 - 0 = 0",
          annotation: "Substitute $x = 0$.",
        },
        {
          description: "Apply the Fundamental Theorem",
          math: "F(2) - F(0) = 4 - 0 = 4",
          annotation: "Definite integral = upper minus lower.",
        },
      ],
      final_answer: "\\int_0^2 (3x^2 - 2x)\\,dx = 4",
    },
  ],
  simulation_config: {
    variables: [
      { name: "a", label: "Lower bound a", min: 0, max: 3, default: 0, step: 0.5 },
      { name: "b", label: "Upper bound b", min: 1, max: 5, default: 2, step: 0.5 },
    ],
    output_formula: "b^3 - b^2 - (a^3 - a^2)",
    output_label: "∫(3x²−2x)dx from a to b",
    visual_type: "bar",
  },
  youtube_clip: {
    video_id: "rfG8ce4nNh0",
    channel_name: "3Blue1Brown",
    start_seconds: 0,
    end_seconds: 360,
    comprehension_question: "Why does the Fundamental Theorem connect area under a curve to antiderivatives?",
    comprehension_answer: "because the rate of change of the accumulated area equals the function value at each point",
  },
};

const LIMITS: ConceptData = {
  id: "limits",
  label: "Limits",
  simplified_text:
    "A limit describes the value a function approaches as its input gets arbitrarily close to some point — even if it never actually reaches it.\n\nWritten $\\lim_{x \\to a} f(x) = L$, it means: for any tolerance you choose, you can find inputs close enough to $a$ so that $f(x)$ stays within that tolerance of $L$.",
  detailed_text:
    "**Epsilon-delta definition:**\n$\\lim_{x \\to a} f(x) = L$ if and only if:\n$$\\forall \\varepsilon > 0,\\ \\exists \\delta > 0 : 0 < |x - a| < \\delta \\Rightarrow |f(x) - L| < \\varepsilon$$\n\n**Squeeze theorem:** If $g(x) \\le f(x) \\le h(x)$ near $a$ and $\\lim_{x\\to a} g(x) = \\lim_{x\\to a} h(x) = L$, then $\\lim_{x\\to a} f(x) = L$.\n\n**Standard result:** $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$ (proven geometrically via the squeeze theorem).",
  formulas: [
    "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1",
    "\\lim_{x \\to 0} \\frac{1 - \\cos x}{x} = 0",
  ],
  common_mistakes: [
    "Substituting $x = a$ directly before checking if the function is defined there — always simplify first.",
    "Assuming a limit equals the function value when the function has a removable discontinuity.",
  ],
  worked_examples: [
    {
      problem: "Evaluate $\\lim_{x \\to 0} \\frac{\\sin(3x)}{x}$.",
      steps: [
        {
          description: "Recognise the standard limit form",
          math: "\\lim_{x \\to 0} \\frac{\\sin(u)}{u} = 1",
          annotation: "The standard result — but our argument is $3x$, not $x$.",
        },
        {
          description: "Rewrite to match the standard form",
          math: "\\frac{\\sin(3x)}{x} = 3 \\cdot \\frac{\\sin(3x)}{3x}",
          annotation: "Multiply and divide by 3 so the argument matches the denominator.",
        },
        {
          description: "Apply the limit",
          math: "3 \\cdot \\lim_{x \\to 0} \\frac{\\sin(3x)}{3x} = 3 \\cdot 1 = 3",
          annotation: "Let $u = 3x \\to 0$ as $x \\to 0$.",
        },
      ],
      final_answer: "\\lim_{x \\to 0} \\frac{\\sin(3x)}{x} = 3",
    },
  ],
  simulation_config: {
    variables: [
      { name: "k", label: "Coefficient k", min: 1, max: 6, default: 3, step: 1 },
    ],
    output_formula: "k",
    output_label: "lim sin(kx)/x as x→0",
    visual_type: "bar",
  },
  youtube_clip: {
    video_id: "kfF40MiS7zA",
    channel_name: "Khan Academy",
    start_seconds: 0,
    end_seconds: 300,
    comprehension_question: "What does it mean for a limit to exist at a point where the function is undefined?",
    comprehension_answer: "the function approaches a single finite value from both sides even though it is not defined at that point",
  },
};

const DERIVATIVES: ConceptData = {
  id: "derivatives",
  label: "Derivatives",
  simplified_text:
    "A derivative measures the instantaneous rate of change of a function — the slope of the tangent line at any given point.\n\nFor $y = x^n$, the power rule gives $dy/dx = nx^{n-1}$. This single rule handles most polynomial differentiation.",
  detailed_text:
    "**Definition:** The derivative of $f$ at $x$ is:\n$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n\n**Power rule:** $\\frac{d}{dx}[x^n] = nx^{n-1}$\n\n**Linearity:** $\\frac{d}{dx}[af + bg] = af' + bg'$\n\n**Product rule:** $(uv)' = u'v + uv'$\n\n**Quotient rule:** $\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$",
  formulas: [
    "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
    "\\frac{d}{dx}[x^n] = nx^{n-1}",
  ],
  common_mistakes: [
    "Dropping the exponent by 1 but forgetting to bring it down as a coefficient.",
    "Applying the power rule to $e^x$ — the derivative of $e^x$ is $e^x$, not $xe^{x-1}$.",
  ],
  worked_examples: [
    {
      problem: "Differentiate $y = (3x^2 + 1)^4$.",
      steps: [
        {
          description: "Identify: this is a chain rule problem",
          math: "\\text{outer: } u^4, \\quad \\text{inner: } u = 3x^2 + 1",
          annotation: "A polynomial raised to a power always needs the chain rule.",
        },
        {
          description: "Differentiate the outer function",
          math: "\\frac{d}{du}[u^4] = 4u^3 = 4(3x^2+1)^3",
          annotation: "Power rule on the outer layer.",
        },
        {
          description: "Differentiate the inner function",
          math: "\\frac{d}{dx}[3x^2 + 1] = 6x",
          annotation: "Simple power rule.",
        },
        {
          description: "Multiply the results",
          math: "y' = 4(3x^2+1)^3 \\cdot 6x = 24x(3x^2+1)^3",
          annotation: "Chain rule: outer × inner derivative.",
        },
      ],
      final_answer: "y' = 24x(3x^2+1)^3",
    },
  ],
  simulation_config: {
    variables: [
      { name: "n", label: "Power n", min: 1, max: 5, default: 2, step: 1 },
      { name: "x", label: "Point x", min: 0, max: 3, default: 1, step: 0.5 },
    ],
    output_formula: "n \\cdot x^{n-1}",
    output_label: "Slope of xⁿ at x",
    visual_type: "bar",
  },
  youtube_clip: {
    video_id: "S0_qX4VJhMQ",
    channel_name: "3Blue1Brown",
    start_seconds: 0,
    end_seconds: 300,
    comprehension_question: "What does the derivative represent geometrically on a curve?",
    comprehension_answer: "the slope of the tangent line at that point",
  },
};

const PRODUCT_RULE: ConceptData = {
  id: "product-rule",
  label: "Product Rule",
  simplified_text:
    "When you multiply two functions together and differentiate, you can't just multiply their derivatives. The product rule tells you what to do instead: differentiate one, keep the other, then swap.\n\n$(uv)' = u'v + uv'$\n\nA helpful memory device: 'derivative of first times second, plus first times derivative of second.'",
  detailed_text:
    "**Formal statement:** If $u$ and $v$ are differentiable, then:\n$$(uv)' = u'v + uv'$$\n\n**Proof from first principles:**\n$$\\lim_{h\\to 0} \\frac{u(x+h)v(x+h) - u(x)v(x)}{h}$$\nAdd and subtract $u(x+h)v(x)$:\n$$= \\lim_{h\\to 0}\\left[u(x+h)\\frac{v(x+h)-v(x)}{h} + v(x)\\frac{u(x+h)-u(x)}{h}\\right]$$\n$$= u(x)v'(x) + v(x)u'(x)$$\n\n**Generalised product rule** for $n$ functions:\n$$(f_1 f_2 \\cdots f_n)' = \\sum_{i=1}^n f_i' \\prod_{j \\neq i} f_j$$",
  formulas: [
    "\\frac{d}{dx}[u(x)v(x)] = u'(x)v(x) + u(x)v'(x)",
  ],
  common_mistakes: [
    "Writing $(uv)' = u'v'$ — this is wrong. You must use the product rule.",
    "Forgetting one of the two terms in the sum.",
  ],
  worked_examples: [
    {
      problem: "Differentiate $y = x^2 \\sin x$.",
      steps: [
        {
          description: "Label the two factors",
          math: "u = x^2, \\quad v = \\sin x",
          annotation: "Clearly naming $u$ and $v$ avoids confusion.",
        },
        {
          description: "Find each derivative",
          math: "u' = 2x, \\quad v' = \\cos x",
          annotation: "Standard power rule and trig derivative.",
        },
        {
          description: "Apply the product rule",
          math: "y' = u'v + uv' = 2x \\sin x + x^2 \\cos x",
          annotation: "First term: $u'v$. Second term: $uv'$.",
        },
      ],
      final_answer: "y' = 2x\\sin x + x^2 \\cos x",
    },
  ],
  simulation_config: {
    variables: [
      { name: "x", label: "Point x", min: 0.5, max: 4, default: 1, step: 0.5 },
    ],
    output_formula: "2x \\sin x + x^2 \\cos x",
    output_label: "d/dx [x² sin x] at x",
    visual_type: "bar",
  },
  youtube_clip: {
    video_id: "YG15m2VwSjA",
    channel_name: "Khan Academy",
    start_seconds: 30,
    end_seconds: 270,
    comprehension_question: "Why can't you just multiply the two derivatives when differentiating a product?",
    comprehension_answer: "because differentiation measures how the whole product changes, which includes both factors changing simultaneously",
  },
};

export const MOCK_CONCEPTS: Record<string, ConceptData> = {
  "chain-rule":   CHAIN_RULE,
  "integration":  INTEGRATION,
  "limits":       LIMITS,
  "derivatives":  DERIVATIVES,
  "product-rule": PRODUCT_RULE,
};

export function getConcept(conceptId: string): ConceptData {
  return MOCK_CONCEPTS[conceptId] ?? CHAIN_RULE;
}
