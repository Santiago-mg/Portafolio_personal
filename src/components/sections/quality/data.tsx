import type { ReactNode } from 'react';

export type Level = {
  key: string;
  width: number;
  button: string;
  meta: string;
  title: string;
  chk: string;
  tools: string[];
  bullets: string[];
  cap: string;
  code: string;
};

export const LEVELS: Level[] = [
  {
    key: 'unit',
    width: 100,
    button: 'Unit',
    meta: '602 tests',
    title: 'Unit',
    chk: '602 passing',
    tools: ['Vitest', 'Jest', 'PHPUnit + Hamcrest', 'Testing Library'],
    bullets: [
      '415 Vitest tests · CelularPro web (team)',
      '110 PHPUnit by me + 77 by my teammate · OpenCart',
      'Jest on the booking service, tokens and errors · EstadiaPro',
    ],
    cap: 'Representative snippet · PHPUnit, AAA + Hamcrest',
    code: `⟦k:public function⟧ testFindsCouponByCode(): ⟦k:void⟧
{
    ⟦c:// Arrange⟧
    $model = ⟦k:new⟧ CouponModel($this->fakeDb([
        [⟦s:'code'⟧ => ⟦s:'QA10'⟧, ⟦s:'discount'⟧ => 10],
    ]));

    ⟦c:// Act⟧
    $cupon = $model->getCoupon(⟦s:'QA10'⟧);

    ⟦c:// Assert⟧
    assertThat($cupon, hasKeyValuePair(⟦s:'code'⟧, ⟦s:'QA10'⟧));
}`,
  },
  {
    key: 'int',
    width: 90,
    button: 'Integration / API',
    meta: '347 + 12',
    title: 'Integration / API',
    chk: '359 passing',
    tools: ['Vitest vs. API', 'Cypress cy.request', 'Serenity/JS CallAnApi'],
    bullets: [
      '347 Vitest tests for regression, API, performance and security · OpenCart',
      '12 API scenarios · CelularPro',
    ],
    cap: 'Representative snippet · Vitest regression',
    code: `⟦c:// Regression · DEF-06-03⟧
it(⟦s:'treats % as a literal, not a wildcard'⟧, ⟦k:async⟧ () => {
  ⟦k:const⟧ res = ⟦k:await⟧ api.get(⟦s:'/product/search'⟧, { search: ⟦s:'%'⟧ });

  expect(res.status).toBe(200);
  expect(res.products).toHaveLength(0);
});`,
  },
  {
    key: 'e2e',
    width: 80,
    button: 'E2E / BDD',
    meta: '32 · 29 · 66',
    title: 'E2E / BDD',
    chk: 'all scenarios green',
    tools: ['Serenity/JS', 'Playwright', 'Cucumber', 'Screenplay', 'Cypress', 'Katalon Studio'],
    bullets: [
      '32 scenarios · CelularPro (20 UI + 12 API) in Serenity/JS, and the same 32 in Cypress',
      '29 E2E cases · OpenCart',
      '66 Playwright E2E checks · LandingForge',
    ],
    cap: 'Representative snippet · Gherkin, Screenplay actors',
    code: `⟦k:Feature:⟧ Ban users

  ⟦k:Scenario:⟧ The admin bans a customer with a reason
    ⟦k:Given⟧ Ana is the store administrator
    ⟦k:When⟧ she bans Carlos with a reason
    ⟦k:Then⟧ Carlos can no longer sign in

  ⟦k:Scenario:⟧ Admins cannot ban themselves
    ⟦k:Given⟧ Ana is the store administrator
    ⟦k:When⟧ she tries to ban herself
    ⟦k:Then⟧ she is told the action is not allowed`,
  },
  {
    key: 'sec',
    width: 70,
    button: 'Security',
    meta: '104 dynamic',
    title: 'Security',
    chk: '104 passing',
    tools: ['SonarQube', 'Semgrep', 'OWASP ZAP', 'Vitest (dynamic)', 'composer audit', 'npm audit'],
    bullets: [
      '104 dynamic tests — SQL injection, XSS, session, headers, logic abuse — organised by the OWASP Top 10 · OpenCart',
      'Static analysis and dependency audits in the pipeline',
    ],
    cap: 'Representative snippet · OWASP A05',
    code: `⟦c:// Security misconfiguration · DEF-SEG-01⟧
it(⟦s:'session cookie is HttpOnly'⟧, ⟦k:async⟧ () => {
  ⟦k:const⟧ res = ⟦k:await⟧ store.get(⟦s:'/index.php?route=common/home'⟧);
  ⟦k:const⟧ cookie = res.cookies.find((c) => c.name === ⟦s:'OCSESSID'⟧);

  expect(cookie.httpOnly).toBe(⟦k:true⟧);
});`,
  },
  {
    key: 'a11y',
    width: 60,
    button: 'A11y & visual',
    meta: '32 shots',
    title: 'Accessibility & visual',
    chk: '32 snapshots',
    tools: ['axe-core', 'Argos', 'WCAG contrast audit'],
    bullets: [
      'Argos: 32 snapshots — 9 screens × 3 themes + 5 on mobile · CelularPro',
      'Automated contrast, reflow and focus checker · LandingForge',
    ],
    cap: 'Representative snippet · axe with Testing Library',
    code: `it(⟦s:'product page has no axe violations'⟧, ⟦k:async⟧ () => {
  ⟦k:const⟧ { container } = render(<ProductPage product={phone} />);

  expect(⟦k:await⟧ axe(container)).toHaveNoViolations();
});`,
  },
  {
    key: 'perf',
    width: 50,
    button: 'Performance',
    meta: 'load',
    title: 'Performance',
    chk: 'within budget',
    tools: ['Vitest load config'],
    bullets: ['Load suite on the CelularPro API', "Performance suite inside OpenCart's 347 Vitest tests"],
    cap: 'Representative snippet · load suite',
    code: `it(⟦s:'catalog stays within budget under load'⟧, ⟦k:async⟧ () => {
  ⟦k:const⟧ runs = ⟦k:await⟧ burst(CONCURRENCY, () => api.get(⟦s:'/products'⟧));

  expect(p95(runs)).toBeLessThan(BUDGET_MS);
});`,
  },
];

export const TECHNIQUES = [
  'AAA pattern',
  'FIRST principles',
  'Test doubles: fakes · stubs · spies · mocks',
  'White box · independent paths',
  'Black box · equivalence + boundaries',
  'TDD red → green',
  'BDD with Gherkin',
  'Screenplay pattern',
  'Coverage with PCOV',
  'Random-order runs',
  'OWASP Top 10',
  'Visual regression',
  'WCAG 2.2',
];

export type Defect = {
  key: string;
  id: string;
  sym: ReactNode;
  fix: ReactNode;
  first: string;
  mid: string;
  last: string;
};

export const DEFECTS: Defect[] = [
  {
    key: 'd1',
    id: 'DEF-06-03',
    sym: (
      <>
        Searching <code className="mono">%</code> or <code className="mono">_</code> returned the <b>whole catalog</b>
      </>
    ),
    fix: (
      <>
        Escape LIKE wildcards (<code className="mono">addcslashes</code>) in the product model
      </>
    ),
    first: 'regression test written first',
    mid: 'fix in the product model',
    last: 'passes · now part of the 347',
  },
  {
    key: 'd2',
    id: 'DEF-08-02',
    sym: (
      <>
        A coupon <b>expired one day early</b>
      </>
    ),
    fix: 'Correct the date comparison in the coupon model',
    first: 'boundary test on the end date',
    mid: 'fix in the coupon model',
    last: 'passes',
  },
  {
    key: 'd3',
    id: 'DEF-08-03',
    sym: (
      <>
        The admin accepted <b>negative or over-100% discounts</b>
      </>
    ),
    fix: 'Validate the range in the admin coupon controller',
    first: 'equivalence partitions + boundary values',
    mid: 'range check in the controller',
    last: 'passes',
  },
  {
    key: 'd4',
    id: 'DEF-09-02',
    sym: (
      <>
        One token allowed <b>unlimited review posts</b>
      </>
    ),
    fix: 'Make the token single-use',
    first: 'logic-abuse test reuses the token',
    mid: 'single-use token',
    last: 'passes',
  },
  {
    key: 'd5',
    id: 'DEF-11-06',
    sym: (
      <>
        Returns were accepted for <b>orders that don&apos;t exist</b>
      </>
    ),
    fix: (
      <>
        Check the order exists (<code className="mono">hasOrder</code>)
      </>
    ),
    first: 'return for a made-up order id',
    mid: 'hasOrder guard',
    last: 'passes',
  },
  {
    key: 'd6',
    id: 'DEF-SEG-01',
    sym: (
      <>
        The session cookie <b>lacked HttpOnly</b>
      </>
    ),
    fix: 'Enable HttpOnly in the framework and at session start',
    first: 'dynamic security test reads the cookie flags',
    mid: 'HttpOnly on',
    last: 'passes',
  },
];
