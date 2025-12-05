import { describe, it, expect, vi } from 'vitest';
import { analyzeAttribute, fetchAttributesByCategoryLevels } from '../attributeUtils';
import * as attributeService from '@/services/attributes';
import type { AttributeOption } from '../attributeUtils';

vi.mock('@/services/attributes');

describe('Attribute Utils', () => {
  describe('analyzeAttribute', () => {
    it('should analyze attribute with options', () => {
      const attr = {
        attribute_options: [
          { id: 'opt-1', value: 'Red', is_active: true },
          { id: 'opt-2', value: 'Blue', is_active: true },
        ] as AttributeOption[],
      };

      const analysis = analyzeAttribute(attr, 'Red');

      expect(analysis.hasOptions).toBe(true);
      expect(analysis.options).toHaveLength(2);
      expect(analysis.isCustomValue).toBe(false);
    });

    it('should detect custom value when not in options', () => {
      const attr = {
        attribute_options: [
          { id: 'opt-1', value: 'Red', is_active: true },
        ] as AttributeOption[],
      };

      const analysis = analyzeAttribute(attr, 'Custom Color');

      expect(analysis.isCustomValue).toBe(true);
    });

    it('should handle attribute without options', () => {
      const attr = {};

      const analysis = analyzeAttribute(attr, 'Some value');

      expect(analysis.hasOptions).toBe(false);
      expect(analysis.options).toEqual([]);
      expect(analysis.isCustomValue).toBe(false);
    });

    it('should ignore inactive options when checking custom value', () => {
      const attr = {
        attribute_options: [
          { id: 'opt-1', value: 'Red', is_active: false },
        ] as AttributeOption[],
      };

      const analysis = analyzeAttribute(attr, 'Red');

      expect(analysis.isCustomValue).toBe(true);
    });
  });

  describe('fetchAttributesByCategoryLevels', () => {
    it('should fetch and merge attributes from subcategories', async () => {
      vi.mocked(attributeService.fetchAttributesByCategoryLevels).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'attr-1',
            name: 'Color',
            data_type: 'text',
            display_order: 1,
          },
        ],
      });

      const attributes = await fetchAttributesByCategoryLevels(['subcat-1'], []);

      expect(attributes).toHaveLength(1);
      expect(attributes[0].name).toBe('Color');
    });

    it('should deduplicate attributes by id', async () => {
      vi.mocked(attributeService.fetchAttributesByCategoryLevels).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'attr-1',
            name: 'Color',
            data_type: 'text',
            display_order: 1,
          },
        ],
      });

      const attributes = await fetchAttributesByCategoryLevels(['subcat-1', 'subcat-2'], []);

      expect(attributes).toHaveLength(1);
    });

    it('should prioritize L3 attributes over L2', async () => {
      vi.mocked(attributeService.fetchAttributesByCategoryLevels)
        .mockResolvedValueOnce({
          success: true,
          data: [
            {
              id: 'attr-1',
              name: 'Color (L2)',
              data_type: 'text',
              display_order: 1,
            },
          ],
        })
        .mockResolvedValueOnce({
          success: true,
          data: [
            {
              id: 'attr-1',
              name: 'Color (L3)',
              data_type: 'text',
              display_order: 1,
            },
          ],
        });

      const attributes = await fetchAttributesByCategoryLevels(['subcat-1'], ['subsubcat-1']);

      expect(attributes).toHaveLength(1);
      expect(attributes[0].name).toBe('Color (L3)');
    });

    it('should sort attributes by display_order then name', async () => {
      vi.mocked(attributeService.fetchAttributesByCategoryLevels).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'attr-2',
            name: 'Brand',
            data_type: 'text',
            display_order: 2,
          },
          {
            id: 'attr-1',
            name: 'Color',
            data_type: 'text',
            display_order: 1,
          },
        ],
      });

      const attributes = await fetchAttributesByCategoryLevels(['subcat-1'], []);

      expect(attributes[0].name).toBe('Color');
      expect(attributes[1].name).toBe('Brand');
    });
  });
});
