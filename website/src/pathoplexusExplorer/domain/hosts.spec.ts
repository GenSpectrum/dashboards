import { describe, expect, it } from 'vitest';

import { hostGroupOf } from './hosts.ts';

describe('hostGroupOf', () => {
    it('takes the group from the taxon id the entry records', () => {
        expect(hostGroupOf('Homo sapiens', '9606')).toBe('human');
        expect(hostGroupOf('Culex pipiens', '7175')).toBe('vector');
        expect(hostGroupOf('Hyalomma marginatum', '34627')).toBe('vector');
        expect(hostGroupOf('Corvus brachyrhynchos', '85066')).toBe('animal');
    });

    it('believes the taxon id over the name, which is what makes the group checkable', () => {
        expect(hostGroupOf('Mosquito sp.', '7159')).toBe('vector');
    });

    it('falls back to the genus, so a new species of a host already known is placed', () => {
        expect(hostGroupOf('Aedes koreicus', '499607')).toBe('vector');
        expect(hostGroupOf('Corvus splendens', '236226')).toBe('animal');
    });

    it('counts a host it cannot place on its own rather than guessing at it', () => {
        expect(hostGroupOf('Bombus terrestris', '30195')).toBe('unclassified');
    });

    it('has no host where none is recorded', () => {
        expect(hostGroupOf(null, null)).toBe('unknown');
        expect(hostGroupOf('   ', '9606')).toBe('unknown');
    });
});
