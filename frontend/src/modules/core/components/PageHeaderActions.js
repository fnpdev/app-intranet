import React from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem
} from '@mui/material';

export default function PageHeaderActions({
  onPrint,
  onExportExcel,
  reports = [],
  onReportSelect
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectReport = (reportName) => {
    handleClose();
    if (onReportSelect) {
      onReportSelect(reportName);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {/* 🖨️ Imprimir */}
      <Button
        variant="outlined"
        onClick={onPrint}
      >
        Imprimir
      </Button>

      {/* 📊 Excel */}
      <Button
        variant="outlined"
        onClick={onExportExcel}
      >
        Exportar Excel
      </Button>

      {/* 📄 Relatórios */}
      {reports.length > 0 && (
        <>
          <Button
            variant="contained"
            onClick={handleOpen}
          >
            Relatórios
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            {reports.map((r) => (
              <MenuItem
                key={r.name}
                onClick={() => handleSelectReport(r.name)}
              >
                {r.description || r.name}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
}
