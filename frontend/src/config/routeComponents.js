// src/config/routeComponents.js
import Home from '../pages/Home';
import Login from '../pages/Login';
import NotAuthorizedPage from '../pages/NotAuthorizedPage';
import NotFound from '../pages/NotFound';
import DynamicConsultaPage from '../modules/core/pages/DynamicConsultaPage'; // ✅ novo caminho base
import DynamicConsultaPageComSelecao from '../modules/core/pages/DynamicConsultaPageComSelecao'; // ✅ novo caminho base
import DynamicConsultaAutoPage from '../modules/core/pages/DynamicConsultaAutoPage'; // ✅ novo caminho base
import DashboardPage  from '../modules/intranet/pages/DashboardPage';
import UsersPage from '../modules/admin/pages/UsersPage'



import InvoiceFiscalPage from '../modules/accounting/pages/InvoiceFiscalPage'
import InvoiceSuprimentosPage from '../modules/accounting/pages/InvoiceSuprimentosPage'
import InvoiceEstoquePage from '../modules/accounting/pages/InvoiceEstoquePage'
import InvoicePortariaPage from '../modules/accounting/pages/InvoicePortariaPage'
import InvoiceCountPage from '../modules/accounting/pages/InvoiceCountPage'
import InvoiceInsumoPage from '../modules/accounting/pages/InvoiceInsumoPage'
import InvoiceCombustivelPage from '../modules/accounting/pages/InvoiceCombustivelPage'
import InvoiceGadoPage from '../modules/accounting/pages/InvoiceGadoPage'
import InvoicePortariaScanPage from '../modules/accounting/pages/InvoicePortariaScanPage'

/**
 * 🔹 Função que carrega componentes dinâmicos a partir do nome vindo do backend
 */
export const loadDynamicComponent = (name) => {
  try {
    const components = {
      Home,
      Login,
      NotAuthorizedPage,
      NotFound,
      DynamicConsultaPage, // ✅ inclui componente genérico dinâmico
      DynamicConsultaAutoPage,
      DynamicConsultaPageComSelecao,
      DashboardPage,
      UsersPage,
      InvoiceFiscalPage,
      InvoiceSuprimentosPage,
      InvoiceEstoquePage,
      InvoicePortariaPage,
      InvoiceCountPage,
      InvoiceInsumoPage,
      InvoiceCombustivelPage,
      InvoiceGadoPage,
      InvoicePortariaScanPage
    };

    // Normaliza o nome (aceita variações vindas do banco)
    const key = Object.keys(components).find(
      (k) => k.toLowerCase() === (name || '').toLowerCase()
    );

    return components[key] || NotFound;
  } catch (err) {
    console.error(`❌ Erro ao carregar componente dinâmico: ${name}`, err);
    return NotFound;
  }
};

/**
 * 🔹 Rotas fixas (públicas, login, 404, etc.)
 */
export const staticRoutes = {
  publicNoLayout: [
    { path: '/login', element: Login },
  ],
  publicWithLayout: [
    { path: '/', element: Home },
  ],
  NotAuthorized: NotAuthorizedPage,
  NotFound: NotFound,
};
