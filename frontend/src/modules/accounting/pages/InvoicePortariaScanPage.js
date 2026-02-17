import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Typography,
  TextField,
  Alert
} from "@mui/material";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL;

export default function InvoicePortariaScanPage() {
  const { token, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [invoiceKey, setInvoiceKey] = useState("");
  const [feedback, setFeedback] = useState(null);

  const inputRef = useRef();

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 200);
    }
  }, [open]);

  const handleRegister = async () => {
    if (!invoiceKey.trim()) return;

    try {
      await axios.post(
        `${API_URL}/api/contabil/nf`,
        {
          user_id: user?.id,
          invoice_key: invoiceKey.trim(),
          current_step: "portaria"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedback({ type: "success", message: "NF registrada com sucesso!" });
      setInvoiceKey("");

      setTimeout(() => {
        setFeedback(null);
        setOpen(false);
      }, 1200);

    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.error || "Erro ao registrar NF"
      });
      setInvoiceKey("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 4
      }}
    >
      <Typography variant="h4" fontWeight="bold">
        Portaria - Leitura de NF
      </Typography>

      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: 22, padding: "20px 60px" }}
        onClick={() => setOpen(true)}
      >
        Nova NF
      </Button>

      <Dialog open={open} fullWidth maxWidth="sm">
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            padding: 4
          }}
        >
          <Typography variant="h6">
            Aguardando leitura do código de barras...
          </Typography>

          <TextField
            inputRef={inputRef}
            value={invoiceKey}
            onChange={(e) => setInvoiceKey(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            fullWidth
          />

          {feedback && (
            <Alert severity={feedback.type} sx={{ fontSize: 18 }}>
              {feedback.message}
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
