// frontend/src/modules/accounting/components/InvoicePrint.js
import React from "react";

export default function InvoicePrint({ nfSaam, items, mode = "count" }) {
  if (!nfSaam) return null;

  const handlePrint = () => {
    const printWin = window.open("", "_blank", "width=900,height=1200");

    const html = `
      <html>
        <head>
          <title>Impressão da NF</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 25px; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 20px; }
            h2 { font-size: 17px; margin-top: 30px; border-bottom: 1px solid #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #333; padding: 6px; font-size: 13px; }
            th { background: #eee; }
          </style>
        </head>
        <body>

          <h1>${mode === "count" ? "RELATÓRIO DE CONTAGEM" : "RELATÓRIO FISCAL"}</h1>

          <h2>Dados da NF (SAAM)</h2>
          <table>
            <tr><td><b>Emitente</b></td><td>${nfSaam.nome_emitente}</td></tr>
            <tr><td><b>CNPJ</b></td><td>${nfSaam.cnpj_emitente}</td></tr>
            <tr><td><b>Número</b></td><td>${nfSaam.numero_nota}</td></tr>
            <tr><td><b>Data Emissão</b></td><td>${new Date(nfSaam.data_emissao).toLocaleDateString("pt-BR")}</td></tr>
            <tr><td><b>Natureza</b></td><td>${nfSaam.natureza_operacao}</td></tr>
            <tr><td><b>Status</b></td><td>${nfSaam.status}</td></tr>
            <tr><td><b>Observação</b></td><td>${nfSaam.observacao || "-"}</td></tr>
          </table>

          <h2>${mode === "count" ? "Itens da Contagem" : "Itens ERP (Conferência)"}</h2>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Descrição</th>
                ${mode === "count" ? "<th>Part Number</th>" : "<th>Código</th>"}
                ${mode === "count" ? "<th>Qtd Contada</th>" : "<th>Qtd NF</th>"}
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (it) => `
                <tr>
                  <td>${it.item_number || it.item}</td>
                  <td>${it.ncm || it.produto || ""}</td>
                  <td>${it.description || it.produto_desc}</td>
                  <td style="text-align:center">
                    ${
                      mode === "count"
                        ? it.qty_counted ?? ""
                        : it.qtede ?? ""
                    }
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>

        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();

    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 400);
  };

  return (
    <button
      onClick={handlePrint}
      style={{
        padding: "8px 18px",
        background: "#1976d2",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      Imprimir
    </button>
  );
}
