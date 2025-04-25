import "./App.css";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import routes from "./routes";
import Container from "./constants/Container";
import { Outlet } from 'react-router-dom';

function App() {
  const token = localStorage.getItem("token");
  const isAuthenticated = !!token;

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
                  element={
                    isAuthenticated ? (
                      <Container>
                        <Outlet/>
                      </Container>
                    ) : (
                      <Navigate to="/login" replace />
                    )
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
          
          {/* Redirect to login for any unmatched routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
