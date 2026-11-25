import RevealText from '@/components/fx/RevealText';
import Flow from './quality/Flow';
import Pipelines from './quality/Pipelines';

export default function Ship() {
  return (
    <section className="sec" id="ship" aria-labelledby="ship-h">
      <div className="wrap">
        <div className="g12 sec-head">
          <p className="label s12">03 — Ship</p>
          <RevealText as="h2" id="ship-h" className="disp-s t-h2 s7 t12">
            How I ship
          </RevealText>
          <p className="t-small s5 t12">What I write reaches production through a pipeline. This is CelularPro&apos;s, orchestrated by Jenkins.</p>
        </div>

        <div className="q-flow-head">
          <span className="label">Jenkins · orchestrator job</span>
          <span className="q-flow-rule" />
          <span className="chk">CelularPro</span>
        </div>
        <Flow />

        <p className="label" style={{ margin: '64px 0 16px' }}>
          Other pipelines I built
        </p>
        <Pipelines />
      </div>
    </section>
  );
}
