import React from 'react';
import { Button } from '@grafana/ui';
import { StandardEditorProps } from '@grafana/data';

export const SimpleEditor: React.FC<StandardEditorProps<boolean>> = ({ value, onChange }) => {
  return <Button onClick={() => onChange(!value)}>{value ? 'Disable' : 'Enable'}</Button>;
};