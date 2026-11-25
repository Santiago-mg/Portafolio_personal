'use client';

import { useRef } from 'react';
import useStagger from './useStagger';

const CARDS = [
  { name: 'OpenCart', chips: ['Jenkins', '6 stages'], text: 'Environment → test store in Docker → PHPUnit with coverage → tests against the store → SonarQube → dependencies. The SonarQube token lives in Jenkins credentials, never in the repo.' },
  { name: 'Dream Vacation', chips: ['GitHub Actions', 'matrix'], text: 'Builds and publishes backend and frontend images to Docker Hub, tagged with the short commit SHA.' },
  { name: 'Spring PetClinic', chips: ['Jenkins', 'Docker'], text: 'Pipeline that builds and publishes the Docker image.' },
  { name: 'Knote', chips: ['Docker Hub', 'Kubernetes'], text: 'Refactored to stateless, image on Docker Hub and Kubernetes manifests.' },
  { name: 'EstadiaPro', chips: ['Compose', 'Kubernetes'], text: 'Docker Compose with 3 services and Kubernetes manifests per layer.' },
];

const DELAYS = [0, 50, 100, 160, 210];

export default function Pipelines() {
  const ref = useRef<HTMLUListElement>(null);
  useStagger(ref);
  return (
    <ul className="plain q-cards stg" ref={ref}>
      {CARDS.map((c, i) => (
        <li key={c.name} className="q-card stg-i" style={{ '--d': `${DELAYS[i]}ms` } as React.CSSProperties}>
          <span className="disp-s q-card-n">{c.name}</span>
          <span className="row-list">
            {c.chips.map((x) => (
              <span key={x} className="chip">{x}</span>
            ))}
          </span>
          <span className="t-small q-card-x">{c.text}</span>
        </li>
      ))}
    </ul>
  );
}
