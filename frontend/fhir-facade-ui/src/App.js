import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import PatientDetail from "./pages/PatientDetail";
import FhirResourceExplorer from "./pages/FhirResourceExplorer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/patient/:id" element={<PatientDetail />} />
        <Route path = "/fhirexplorer" element={<FhirResourceExplorer />} />
      </Routes>
    </Router>
  );
}

export default App;

