import { useState } from 'react';
import * as Select from '@radix-ui/react-select';

const ALL_VALUE = '__all_technologies__';
const OPTION_PREFIX = 'technology:';
const ALL_LABEL = 'All technologies';

function Chevron({ up = false }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={up ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} /></svg>;
}

function TechnologyItem({ value, children }) {
  return <Select.Item className="technology-select-item" value={value} textValue={children}>
    <Select.ItemText className="technology-select-item-text">{children}</Select.ItemText>
    <Select.ItemIndicator className="technology-select-item-check"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6" /></svg></Select.ItemIndicator>
  </Select.Item>;
}

export default function TechnologySelect({ id, labelledBy, value = '', onValueChange, options = [], resultsId, describedBy }) {
  const [open, setOpen] = useState(false);
  // Prefix real options so even a tag matching the private All value stays distinct.
  const selectedValue = value === '' ? ALL_VALUE : `${OPTION_PREFIX}${value}`;
  return <Select.Root open={open} onOpenChange={setOpen} value={selectedValue} onValueChange={nextValue => onValueChange?.(nextValue === ALL_VALUE ? '' : nextValue.slice(OPTION_PREFIX.length))}>
    <Select.Trigger id={id} className="technology-select-trigger" aria-labelledby={labelledBy} aria-describedby={describedBy} aria-details={resultsId}>
      <Select.Value className="technology-select-value">{value === '' ? ALL_LABEL : value}</Select.Value>
      <Select.Icon className="technology-select-icon"><Chevron /></Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content className="technology-select-content" position="popper" sideOffset={8} collisionPadding={12} align="end" aria-labelledby={labelledBy} inert={!open || undefined} aria-hidden={!open || undefined}>
        <Select.ScrollUpButton className="technology-select-scroll"><Chevron up /></Select.ScrollUpButton>
        <Select.Viewport className="technology-select-viewport">
          <TechnologyItem value={ALL_VALUE}>{ALL_LABEL}</TechnologyItem>
          {options.map(option => <TechnologyItem key={option} value={`${OPTION_PREFIX}${option}`}>{option}</TechnologyItem>)}
        </Select.Viewport>
        <Select.ScrollDownButton className="technology-select-scroll"><Chevron /></Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}
