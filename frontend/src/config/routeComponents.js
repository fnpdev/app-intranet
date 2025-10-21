import Home from '../pages/Home';
import Login from '../pages/Login';
import NotAuthorizedPage from '../pages/NotAuthorizedPage';
import NotFound from '../pages/NotFound';
import IntranetDashboard from '../modules/intranet/pages/DashboardPage';
import SuprimentosConsultaProdutoPage from '../modules/suprimentos/pages/ConsultaProdutoPage';
import SuprimentosConsultaSCPage from '../modules/suprimentos/pages/ConsultaSCPage';
import SuprimentosConsultaSAPage from '../modules/suprimentos/pages/ConsultaSAPage';
import RHPage from '../modules/rh/pages/SolicitacoesPage';

// Map path string 100% igual ao JSON
const routeComponents = {
  "/": Home,
  "/login": Login,
  "/intranet/dashboard": IntranetDashboard,
  "/suprimentos/consulta-produto/:produto?": SuprimentosConsultaProdutoPage,
  "/suprimentos/consulta-sc/:sc?": SuprimentosConsultaSCPage,
  "/suprimentos/consulta-sa/:sa?": SuprimentosConsultaSAPage,
  "/rh/solicitacoes": RHPage,
  "/not-authorized": NotAuthorizedPage,
  "*": NotFound
};

export default routeComponents;
