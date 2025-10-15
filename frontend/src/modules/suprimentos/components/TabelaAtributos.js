import React from 'react';
import {
  Typography, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';

export default function TabelaAtributos({ dados }) {
  if (!dados || dados.length === 0) return (
    <Typography sx={{ mt: 2, ml: 2, color: '#999' }}>
      Nenhum dado cadastrado para este grupo.
    </Typography>
  );

  // Filtra as colunas, removendo qualquer atributo que contenha "link"
  const todasColunas = Object.keys(dados[0]);
  const linkCols = todasColunas.filter(col=>col.toLowerCase().startsWith('link_'));
  const colunas = todasColunas.filter(col => !col.toLowerCase().startsWith('link_'));

  // Função para abrir link em nova aba
  const handleLinkClick = (url) => {
    if (url && url.toString().trim()) {
      // Adapta para sua base, pode ajustar se quiser outro prefixo ou usar url absoluto das APIs
      const finalUrl = url.startsWith('http') ? url : `http://192.168.50.14:3000/suprimentos/${url}`;
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {colunas.map((col) => (
            <TableCell
              key={col}
              sx={{
                fontWeight: 700,
                fontSize: '0.98rem',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                bgcolor: '#e3eaf2'
              }}
            >
              {col.replace(/_/g, ' ').toUpperCase()}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {dados.map((linha, idx) => (
          <TableRow key={idx} hover>
            {colunas.map((col) => {
              // Procura o link correspondente
              const linkKey = `link_${col}`;
              const link = linha[linkKey];
              return (
                <TableCell
                  key={col}
                  sx={{
                    fontFamily: 'Roboto Mono, monospace',
                    fontSize: '0.93rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {linha[col]}
                  {/* Se houver link específico para essa coluna, coloca o botão */}
                  {link && link.toString().trim() && (
                    <IconButton
                      size="small"
                      onClick={() => handleLinkClick(link)}
                      sx={{
                        ml: 1,
                        color: '#1976d2',
                        '&:hover': {
                          color: '#1565c0',
                          backgroundColor: 'rgba(25, 118, 210, 0.04)'
                        }
                      }}
                      title="Abrir link"
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

