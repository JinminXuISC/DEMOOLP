import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Tabs, Tab, Navbar, Nav } from "react-bootstrap";
import PractitionerTable from "../components/PractitionerTable";
import PatientTable from "../components/PatientsTable";
import FhirResourceExplorer from "../pages/FhirResourceExplorer";
import logo from "../images/logo.png";

function Home() {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract the tab from URL (default to "practitioners")
    const getTabFromURL = () => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get("tab") || "practitioners";
    };

    const [key, setKey] = useState(getTabFromURL());

    useEffect(() => {
        // Sync URL when tab changes
        navigate(`/?tab=${key}`, { replace: true });
    }, [key, navigate]);

    return (
        <>
            <Navbar style={{ backgroundColor: "white", borderBottom: "1px solid #D1D1D1" }} expand="lg">
                    <Container>
                      <Navbar.Brand href="/">
                      <img src={logo} alt="FHIRLens Logo" height="40" className="me-2" />
                      <span style={{ color: "#253A94", fontWeight: "bold" }}>FHIRLens</span>
                      </Navbar.Brand>
                      <Navbar.Toggle aria-controls="basic-navbar-nav" />
                      <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                          <Nav.Link href="/" style={{ color: "black" }}>Home</Nav.Link>
                          <Nav.Link href="/fhirexplorer" style={{ color: "black" }}>FHIR Explorer</Nav.Link>
                        </Nav>
                      </Navbar.Collapse>
                    </Container>
                  </Navbar>
            <Container className="mt-4">
                <h2>Clinical Data Navigator</h2>
                <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
                    <Tab eventKey="practitioners" title={<strong>Practitioners</strong>}>
                        <PractitionerTable />
                    </Tab>
                    <Tab eventKey="patients" title={<strong>Patients</strong>}>
                        <PatientTable />
                    </Tab>
                </Tabs>
            </Container>
        </>
    );
}

export default Home;