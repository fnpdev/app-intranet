import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText } from '@mui/material';

const posts = [
  { title: 'Bem-vindo à Intranet!', text: 'Novo portal disponível a todos.', date: '07/10/2025' },
  { title: 'Ponto facultativo', text: 'Dia 13/10 não haverá expediente (decreto municipal).', date: '05/10/2025' },
];

export default function Posts() {
  return (
    <Paper sx={{ p:4 }}>
      <Typography variant="h4" gutterBottom>Comunicados Recentes</Typography>
      <List>
        {posts.map((p, i) => (
          <ListItem key={i} alignItems="flex-start">
            <ListItemText 
              primary={p.title}
              secondary={
                <>
                  <Typography variant="body2">{p.text}</Typography>
                  <Typography variant="caption">{p.date}</Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
