// frontend/src/modules/core/components/TabelaAtributos.js

import React from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Checkbox
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { materialPalette } from '../../../utils/materialPalette';

const REACT_APP_LINK = process.env.REACT_APP_LINK;

// 🔹 Função para formatar datas YYYYMMDD → DD/MM/YYYY
const formatarData = (valor) => {
  if (!valor) return valor;
  const str = valor.toString().trim();
  if (!/^\d{8}$/.test(str)) return valor;
  return `${str.substring(6, 8)}/${str.substring(4, 6)}/${str.substring(0, 4)}`;
};

// 🔹 Função para formatar valores monetários
const formatarValor = (valor) => {
  if (valor === null || valor === undefined) return valor;
  const numero = Number(valor);
  if (isNaN(numero)) return valor;
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export default function TabelaAtributos({
  dados = [],
  selectable = false,
  selectedRows = [],
  onToggleRow
}) {
  if (!dados || dados.length === 0) {
    return (
      <Typography sx={{ mt: 2, ml: 2, color: '#999' }}>
        Nenhum dado cadastrado para este grupo.
      </Typography>
    );
  }

  const temCorFundo = dados.some(item => item.cor_status);

  const todasColunas = Object.keys(dados[0]);
  const colunas = todasColunas.filter(
    col => !col.toLowerCase().startsWith('link_') && col !== 'cor_status'
  );

  const handleLinkClick = (e, url) => {
    e.stopPropagation();
    if (url && url.toString().trim()) {
      window.open(`${REACT_APP_LINK}${url}`, '_blank', 'noopener,noreferrer');
    }
  };

  const getPaletteColor = (corFundo) => {
    if (!corFundo) return undefined;
    const match = corFundo.match(/^([a-zA-Z]+)\[(\w+)\]$/);
    if (match) {
      const cor = match[1];
      const tonalidade = match[2];
      return materialPalette[cor]?.[tonalidade];
    }
    return corFundo;
  };

  const formatarValorColuna = (col, valor) => {
    if (col.startsWith('data_')) return formatarData(valor);
    if (col.startsWith('valor_')) return formatarValor(valor);
    return valor;
  };

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {selectable && (
            <TableCell sx={{ width: 40, bgcolor: '#e3eaf2' }} />
          )}

          {temCorFundo && (
            <TableCell sx={{ width: 40, bgcolor: '#e3eaf2' }} />
          )}

          {colunas.map(col => (
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
        {dados.map((linha, idx) => {
          const selecionada = selectable && selectedRows.includes(idx);

          return (
            <TableRow
              key={idx}
              hover
              selected={selecionada}
              onClick={() => selectable && onToggleRow?.(idx)}
              sx={{
                cursor: selectable ? 'pointer' : 'default',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                }
              }}
            >
              {selectable && (
                <TableCell
                  onClick={(e) => e.stopPropagation()}
                  padding="checkbox"
                >
                  <Checkbox
                    size="small"
                    checked={selecionada}
                    onChange={() => onToggleRow?.(idx)}
                  />
                </TableCell>
              )}

              {temCorFundo && (
                <TableCell align="center">
                  {'cor_status' in linha && linha.cor_status && (
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: getPaletteColor(linha.cor_status),
                        border: '1.5px solid #eee',
                        display: 'inline-block'
                      }}
                    />
                  )}
                </TableCell>
              )}

              {colunas.map(col => {
                const link = linha[`link_${col}`];

                return (
                  <TableCell
                    key={col}
                    sx={{
                      fontFamily: 'Roboto Mono, monospace',
                      fontSize: '0.93rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatarValorColuna(col, linha[col])}

                    {!!link && (
                      <IconButton
                        size="small"
                        sx={{
                          ml: 1,
                          color: '#1976d2',
                          '&:hover': {
                            color: '#1565c0',
                            backgroundColor: 'rgba(25,118,210,0.04)'
                          }
                        }}
                        onClick={(e) => handleLinkClick(e, link)}
                        title="Abrir link"
                      >
                        <OpenInNew fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
