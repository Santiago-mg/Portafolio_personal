import SectionHead from '@/components/sections/SectionHead';
import Flow from './quality/Flow';
import Pipelines from './quality/Pipelines';

export default function Ship() {
  return (
    <section className="sec" id="ship" aria-labelledby="ship-h">
      <div className="wrap">
        <SectionHead
          id="ship-h"
          n="03"
          step={3}
          label="Ship"
          title={['How I', 'ship']}
          intro="What I write reaches production through a pipeline. This is CelularPro's, orchestrated by Jenkins."
        />

        <div className="q-flow-head">
          <span className="label">Jenkins · orchestrator job</span>
          <span className="q-flow-rule" />
          <span className="chk">CelularPro</span>
        </div>
        <Flow />

        <p className="label q-pipes-l">
          Other pipelines I built
        </p>
        <Pipelines />
      </div>
    </section>
  );
}
