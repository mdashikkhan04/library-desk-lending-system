import Home from './pages/Home.jsx';
import MemberPage from './pages/MemberPage.jsx';
import StaffPage from './pages/StaffPage.jsx';

// Two separate screens, no login for now:
//   /member  members browse the catalogue and borrow books
//   /staff   staff see every book, who holds it, and the history
const PAGES = { '/member': MemberPage, '/staff': StaffPage };

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const Page = PAGES[path] ?? Home;
  return <Page />;
}
