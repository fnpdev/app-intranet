import React from 'react';
import {
  Menu,
  MenuItem,
  Button
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';

export default function ReportsMenu({ reports = [], onSelect }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  if (!reports.length) return null;

  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<DescriptionIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Relatórios
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
      >
        {reports.map((r) => (
          <MenuItem
            key={r.name}
            onClick={() => {
              onSelect(r.name);
              setAnchorEl(null);
            }}
          >
            {r.description}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
