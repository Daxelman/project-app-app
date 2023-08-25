import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Sidebar/Sidebar";

const Layout = () => {
  return (
    <div>
      <Sidebar />
      <h1>Welcome Pluto!</h1>
      <br />
      <Outlet />
    </div>
  );
};

export default Layout;
