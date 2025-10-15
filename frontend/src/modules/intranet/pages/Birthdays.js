import React from 'react';
import { Paper, Typography, Avatar, Grid } from '@mui/material';

const birthdaysToday = [
  { name: 'Marcelo Dias', dept: 'Financeiro', photo: '' },
  { name: 'Sueli Soares', dept: 'RH', photo: '' },
];

export default function Birthdays() {
  return (
    <Paper sx={{ p:4 }}>
      <Typography variant="h4" gutterBottom>Aniversariantes de Hoje</Typography>
      <Grid container spacing={2}>
        {birthdaysToday.map((b, i) => (
          <Grid item xs={12} sm={6} key={i}>
            <Avatar sx={{ width:56, height:56, mb:1 }}>{b.name[0]}</Avatar>
            <Typography><b>{b.name}</b></Typography>
            <Typography variant="body2">{b.dept}</Typography>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
