import InvoiceBasePage from './InvoiceBasePage';

export default function InvoicePortariaPage() {
  return (
    <InvoiceBasePage
      title="NF - Portaria"
      step="portaria"
      allowCreate // ✅ Pode criar
      allowUpdate={false} // ❌ Bloqueia atualizações
      allowClose={false}
    />
  );
}
