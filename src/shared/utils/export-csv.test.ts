import { describe, it, expect } from 'vitest';
import { exportToCsvString } from './export-csv';

describe('exportToCsvString', () => {
  it('generates basic CSV', () => {
    const data = [{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }];
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Product Name', key: 'name' }
    ];
    
    const result = exportToCsvString(columns, data);
    expect(result).toBe('ID,"Product Name"\n1,Apple\n2,Banana');
  });

  it('escapes fields with commas', () => {
    const data = [{ desc: 'Apple, fresh' }];
    const columns = [{ header: 'Desc', key: 'desc' }];
    
    const result = exportToCsvString(columns, data);
    expect(result).toBe('Desc\n"Apple, fresh"');
  });

  it('escapes fields with double quotes', () => {
    const data = [{ desc: 'Apple "fresh"' }];
    const columns = [{ header: 'Desc', key: 'desc' }];
    
    const result = exportToCsvString(columns, data);
    expect(result).toBe('Desc\n"Apple ""fresh"""');
  });

  it('escapes fields with newlines', () => {
    const data = [{ desc: 'Apple\nfresh' }];
    const columns = [{ header: 'Desc', key: 'desc' }];
    
    const result = exportToCsvString(columns, data);
    expect(result).toBe('Desc\n"Apple\nfresh"');
  });

  it('handles null/undefined gracefully', () => {
    const data = [{ desc: null }, { desc: undefined }, { desc: 0 }, { desc: false }];
    const columns = [{ header: 'Desc', key: 'desc' }];
    
    const result = exportToCsvString(columns, data);
    expect(result).toBe('Desc\n\n\n0\nfalse');
  });
});
