import React from 'react';
import { Tabs, Tab, Badge, Tooltip } from '@mui/material';

export default function InvoiceStepsTabs({
  steps = [],
  step = '',
  setStep = () => {},
  counts = {},
  countsLoading = false
}) {
  if (!steps.length) return null;

  const currentIndex = steps.indexOf(step);
  const handleChange = (e, value) => {
    const newStep = steps[value];
    setStep(newStep);
  };

  return (
    <Tabs
      value={currentIndex >= 0 ? currentIndex : 0}
      onChange={handleChange}
      variant="scrollable"
      allowScrollButtonsMobile
      scrollButtons="auto"
      sx={{
        mb: 2,
        bgcolor: '#f4f8fb',
        borderRadius: 1,
        '& .MuiTab-root': {
          fontWeight: 600,
          fontSize: '0.9rem',
          minWidth: 140,
          maxWidth: 200,
          textTransform: 'uppercase',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          mr: 1
        },
        '& .MuiTabs-indicator': {
          height: 3,
          borderRadius: 2,
          backgroundColor: '#1976d2'
        }
      }}
    >
      {steps.map((s) => {
        const count = countsLoading ? '...' : (counts[s] ?? 0);

        return (
          <Tooltip key={s} title={s.toUpperCase()} arrow>
            <Tab
              label={
                <Badge
                  color="primary"
                  badgeContent={count}
                  max={999}
                  sx={{
                    '& .MuiBadge-badge': {
                      right: -16,
                      top: 0,
                      fontSize: '0.7em',
                      minWidth: 18,
                      height: 18
                    }
                  }}
                >
                  {s}
                </Badge>
              }
            />
          </Tooltip>
        );
      })}
    </Tabs>
  );
}
