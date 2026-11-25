import RevealText from '@/components/fx/RevealText';
import ProjectPoster from '@/components/ProjectPoster';
import { FEATURED, MORE, type Project } from '@/content/projects';

const SPANS = ['s7 t12', 's5 t12', 's6 t6', 's6 t6', 's4 t6', 's4 t6'];
const SHOTS = ['shot-l', 'shot-l', 'shot-m', 'shot-m', 'shot-s', 'shot-s'];
const DARK = new Set([2, 5]);

const NEW_TAB = ' (opens in a new tab)';

function Card({ p, i }: { p: Project; i: number }) {
  const first = p.links[0];
  return (
    <article className={`card ${SPANS[i]}${first ? '' : ' card-static'}`}>
      <div className={`shot ${SHOTS[i]}`}>
        <ProjectPoster project={p} index={i + 1} tone={DARK.has(i + 1) ? 'dark' : 'light'} />
      </div>
      <div className="card-body">
        <p className="label">{p.year} · {p.kind}</p>
        <h3 className="disp-s t-h3">
          {first ? (
            <a className="card-link" href={first.href} target="_blank" rel="noopener">
              {p.name}
              <span className="sr"> — {first.label.toLowerCase()} on GitHub{NEW_TAB}</span>
            </a>
          ) : (
            p.name
          )}
        </h3>
        <p className="card-val">{p.value}</p>
        <ul className="row-list" aria-label="Checks passed">
          {p.checks.map((c) => <li key={c} className="chk">{c}</li>)}
        </ul>
        <ul className="row-list" aria-label="Stack">
          {p.stack.map((s) => <li key={s} className="chip">{s}</li>)}
          {p.more ? <li className="chip">+{p.more}</li> : null}
        </ul>
        <div className="card-foot">
          {p.links.map((l) => (
            <a key={l.href} className="tag above" href={l.href} target="_blank" rel="noopener">
              <span className="ul">{l.label}</span> <span aria-hidden="true">↗</span>
              <span className="sr"> — {p.name}{NEW_TAB}</span>
            </a>
          ))}
          {p.private ? (
            <span className="tag tag-muted">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
              Private repo
            </span>
          ) : null}
          <span className="tag tag-muted end">Case study soon</span>
        </div>
      </div>
    </article>
  );
}

export default function Work() {
  return (
    <section className="sec" id="work" aria-labelledby="work-h" style={{ borderTop: 0 }}>
      <div className="wrap">
        <div className="g12 sec-head">
          <p className="label s12">01 — Build</p>
          <RevealText as="h2" id="work-h" className="disp-s t-h2 s7 t12">Selected work</RevealText>
          <p className="t-small s5 t12">Six projects, each with the checks it passed. Team work is labelled as team work, and private repositories show no code link.</p>
        </div>

        <div className="g12" style={{ rowGap: 24 }}>
          {FEATURED.map((p, i) => <Card key={p.id} p={p} i={i} />)}

          <div className="s4 t12 more-wrap">
            <p className="label ink-top">More projects</p>
            <ul className="more-list" style={{ marginTop: 6 }}>
              {MORE.map((p) => {
                const first = p.links[0];
                const body = (
                  <>
                    <span className="more-n">{p.name}</span>
                    <span className="tag tag-muted more-tag">{p.year}{first ? <> <span aria-hidden="true">↗</span></> : null}</span>
                    <span className="more-d">{p.value}</span>
                  </>
                );
                return (
                  <li key={p.id}>
                    {first ? (
                      <a className="more-row" href={first.href} target="_blank" rel="noopener">
                        {body}
                        <span className="sr">{NEW_TAB}</span>
                      </a>
                    ) : (
                      <div className="more-row">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
