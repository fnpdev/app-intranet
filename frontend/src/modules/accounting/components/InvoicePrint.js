// frontend/src/modules/accounting/components/InvoicePrint.js
import React, { useEffect, useRef } from "react";

export default function InvoicePrint() {
  const printInProgress = useRef(false);

  useEffect(() => {
    const listener = (ev) => {
      const { nfSaam, items = [], mode = "count" } = ev.detail || {};

      if (!nfSaam) {
        console.warn("InvoicePrint: nfSaam missing, abort print.");
        return;
      }

      // evitar prints concorrentes
      if (printInProgress.current) {
        console.warn("InvoicePrint: print already in progress");
        return;
      }
      printInProgress.current = true;

      try {
        // Abre a janela imediatamente — isso ocorre dentro do handler gerado por um clique do usuário,
        // então o popup não deve ser bloqueado.
        const win = window.open("", "_blank", "width=900,height=1200");
        if (!win) {
          alert("Popup bloqueado. Permita popups para este site para imprimir.");
          printInProgress.current = false;
          return;
        }

        const isCount = mode === "count";
        const title = isCount ? "RELATÓRIO DE CONTAGEM" : "RELATÓRIO FISCAL";

        const html = `
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #222; }
                h1 { text-align:center; font-size:20px; margin-bottom:10px; }
                h2 { font-size:16px; margin-top:18px; border-bottom:1px solid #000; padding-bottom:6px; }
                table { width:100%; border-collapse:collapse; margin-top:10px; }
                th, td { border:1px solid #444; padding:6px 8px; font-size:13px; }
                th { background:#f0f0f0; font-weight:700; }
                td.center { text-align:center; }
              </style>
            </head>
            <body>
              <h1>${title}</h1>

              <h2>Dados da NF</h2>
              <table>
                <tr><td><strong>Emitente</strong></td><td>${nfSaam.nome_emitente || ""}</td></tr>
                <tr><td><strong>CNPJ</strong></td><td>${nfSaam.cnpj_emitente || ""}</td></tr>
                <tr><td><strong>Número</strong></td><td>${nfSaam.numero_nota || ""}</td></tr>
                <tr><td><strong>Data Emissão</strong></td><td>${nfSaam.data_emissao ? new Date(nfSaam.data_emissao).toLocaleDateString('pt-BR') : ""}</td></tr>
                <tr><td><strong>Natureza</strong></td><td>${nfSaam.natureza_operacao || ""}</td></tr>
                <tr><td><strong>Status</strong></td><td>${nfSaam.status || ""}</td></tr>
              </table>

              <h2>${isCount ? "Itens da Contagem" : "Itens ERP (Conferência)"}</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>${isCount ? "Código" : "Produto"}</th>
                    <th>Descrição</th>
                    ${isCount ? "<th>Part Number</th>" : "<th>Código</th>"}
                    <th>${isCount ? "Qtd Contada" : "Qtd NF"}</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(it => {
                    const itemIdx = isCount ? (it.item_number ?? "") : (it.item ?? "");
                    const codigo = isCount ? (it.codigo ?? "") : (it.produto ?? "");
                    const desc = isCount ? (it.description ?? "") : (it.produto_desc ?? "");
                    const part = it.ncm ?? "";
                    const qtd = isCount ? (it.qty_counted ?? "") : "";
                    return `<tr>
                      <td>${itemIdx}</td>
                      <td>${codigo}</td>
                      <td>${escapeHtml(desc)}</td>
                      <td class="center">${part}</td>
                      <td class="center">${qtd}</td>
                    </tr>`;
                  }).join("")}
                </tbody>
              </table>
            </body>
          </html>
        `;

        // escreve no documento e imprime
        win.document.open();
        win.document.write(html);
        win.document.close();

        // dar pequeno delay para o navegador montar o DOM
        setTimeout(() => {
          try {
            win.focus();
            win.print();
            // não fechar automaticamente caso queira ver preview — opção: fechar após imprimir
            win.close();
          } catch (errPrint) {
            console.error("Erro ao imprimir:", errPrint);
          } finally {
            printInProgress.current = false;
          }
        }, 250);
      } catch (err) {
        console.error("InvoicePrint listener error:", err);
        printInProgress.current = false;
      }
    };

    window.addEventListener("invoicePrint", listener);
    return () => window.removeEventListener("invoicePrint", listener);
  }, []);

  // helper: escape simples para descrição
  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"'`=\/]/g, function(s) {
      return ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
      })[s];
    });
  }

  // componente invisível (serviço)
  return null;
}
