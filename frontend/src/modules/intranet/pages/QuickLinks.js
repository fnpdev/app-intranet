import React from 'react';
import { Grid, Paper, Typography, Link as MuiLink } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const systemsLinks = [
  { label: 'ERP', url: 'https://erp.empresa.com', icon: <AccountBalanceIcon fontSize="large" color="primary" /> },
  { label: 'RH Online', url: 'https://rh.empresa.com', icon: <BusinessIcon fontSize="large" color="secondary" /> },
  { label: 'Helpdesk', url: 'https://suporte.empresa.com', icon: <SupportAgentIcon fontSize="large" color="success" /> },
];

export default function QuickLinks() {
  return (
    <div>
      <Typography variant="h4" gutterBottom>Links Rápidos</Typography>
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {systemsLinks.map((sys, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Paper sx={{ p:3, textAlign:'center' }}>
              <MuiLink href={sys.url} target="_blank" underline="none">
                {sys.icon}
                <Typography sx={{ mt:1 }}>{sys.label}</Typography>
              </MuiLink>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
