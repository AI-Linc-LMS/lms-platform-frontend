import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import routes from "./routes";
import Container from "./constants/Container";
import { Navigate, Outlet } from 'react-router-dom';
function App() {
  return (
    <>
      <Router>
        <Routes>
          {routes.map((route) => {
            if (route.isPrivate) {
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  // TODO: Need to implement later in the production.
                  // element={
                  //   <ProtectedRoute
                  //     requiredPermissions={route.requiredPermissions}
                  //     isAuthenticated={Boolean(isAuthenticated)}
                  //   />
                  // }
                  element={
                    <Container>
                      <Outlet/>
                      </Container>
                  }
                >
                  <Route index element={<route.component />} />
                </Route>
              );
            }

            return (
              <Route
                key={route.path}
                path={route.path}
                element={<route.component />}
              />
            );
          })}
        </Routes>
      </Router>
    </>
  );
}

export default App;
