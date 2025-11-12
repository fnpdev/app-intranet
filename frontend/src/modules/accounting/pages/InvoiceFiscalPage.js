import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Tabs, Tab, Badge, CircularProgress, Typography
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import InvoiceBasePage from './InvoiceBasePage';

const API_URL = process.env.REACT_APP_API_URL;

const STEPS = [
  { key: 'fiscal', label: 'Fiscal' },
  { key: 'portaria', label: 'Portaria' },
  { key: 'estoque', label: 'Estoque' },
  { key: 'suprimentos', label: 'Suprimentos' },
  { key: 'recebimento', label: 'Recebimento' },
];

export default function InvoiceFiscalPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invoicesByStep, setInvoicesByStep] = useState({});
  const [activeTab, setActiveTab] = useState('fiscal');
  const [refreshKey, setRefreshKey] = useState(0); // força atualização

  // loadAllSteps como callback para satisfazer o hook lint
  const loadAllSteps = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const results = {};
      for (const s of STEPS) {
        const resp = await axios.get(`${API_URL}/contabil/nf/step/${s.key}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        results[s.key] = Array.isArray(resp.data) ? resp.data : [];
      }
      setInvoicesByStep(results);
    } catch (err) {
      console.error('Erro ao carregar etapas:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // useEffect escuta token, refreshKey e o próprio callback loadAllSteps
  useEffect(() => {
    loadAllSteps();
  }, [loadAllSteps, refreshKey]);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        NF - Fiscal (Controle de Etapas)
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              bgcolor: '#f4f8fb',
              '& .MuiTab-root': {
                fontWeight: 500,
                fontSize: '0.95rem',
                minWidth: 160,
                maxWidth: 180,
                textTransform: 'none',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                mr: 1,
              },
            }}
          >
            {STEPS.map((s) => (
              <Tab
                key={s.key}
                value={s.key}
                label={
                  <Badge
                    color="primary"
                    badgeContent={invoicesByStep[s.key]?.length || 0}
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -18,
                        top: 0,
                        fontSize: '0.7em',
                        minWidth: 18,
                        height: 18,
                      },
                    }}
                  >
                    {s.label}
                  </Badge>
                }
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            ))}
          </Tabs>

          {/* Renderiza a tabela da aba ativa */}
          <InvoiceBasePage
            key={`${activeTab}-${refreshKey}`} // força reload do conteúdo
            title={`NF - ${STEPS.find((x) => x.key === activeTab)?.label}`}
            step={activeTab}
            allowUpdate={true}  // Fiscal pode atualizar qualquer uma
            allowCreate={false}
            allowClose={activeTab === 'recebimento'}
            onDataChange={() => setRefreshKey((k) => k + 1)} // força recarregar tudo
          />
        </>
      )}
    </Box>
  );
}
