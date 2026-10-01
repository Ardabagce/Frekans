/**
 * "Dağ Evi" hikayesinin montajı. İçerik günlere bölünmüş dosyalarda:
 * gun1.ts … gun7.ts ve sonlar.ts. Kurallar ve karakterler: HIKAYE.md
 */
import { defineStory } from '@/engine/kit';

import { gun1 } from './gun1';
import { gun2 } from './gun2';
import { gun3 } from './gun3';
import { gun4 } from './gun4';
import { gun5 } from './gun5';
import { gun6 } from './gun6';
import { gun7 } from './gun7';
import { kit } from './kit';
import { ENDINGS, sonlar } from './sonlar';

export const dagEvi = defineStory({
  id: 'dag-evi',
  version: '0.1.0',
  title: 'Dağ Evi',
  character: { name: 'Deniz', avatar: { initials: 'D', color: '#3F7F8C' } },
  start: 'g1_ilk_temas',
  defs: kit.defs,
  endings: ENDINGS,
  nudges: ['orada mısın?', 'lütfen cevap ver...'],
  nudgeAfter: ['3m', '20m'],
  quietHours: { from: '23:00', to: '08:00' },
  nodes: [...gun1, ...gun2, ...gun3, ...gun4, ...gun5, ...gun6, ...gun7, ...sonlar],
});
