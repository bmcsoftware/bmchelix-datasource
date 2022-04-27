import { SelectableValue } from '@grafana/data';
import { TypeaheadInput, TypeaheadOutput } from '@grafana/ui';
import { useEffect, useCallback } from 'react';
import { useFields } from './useFields';

export const cleanText = (s: string): string => {
  const parts = s.split(' ');
  const last: string | undefined = parts.pop();
  return last ?? '';
};

export const useTypeahead = () => {
  const getFields = useCallback(useFields([]), []);
  useEffect(() => {
    getFields();
  }, [getFields]);
  const onTypeAhead = useCallback(
    async (typeahead: TypeaheadInput): Promise<TypeaheadOutput> => {
      if (!typeahead.prefix) {
        return { suggestions: [] };
      }
      const result = await getFields();
      return {
        suggestions: [
          {
            label: 'Fields',
            items: result.map((val: SelectableValue<string>) => {
              return {
                label: val.value ?? '',
              };
            }),
            // prefixMatch: true,
          },
        ],
      };
    },
    [getFields]
  );

  return { onTypeAhead };
};
