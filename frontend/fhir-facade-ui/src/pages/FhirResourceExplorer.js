import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Accordion, Button, Form, Navbar, Nav, ListGroup } from "react-bootstrap";
import logo from "../images/logo.png";

const FHIR_BASE_URL = "http://13.55.11.210/csp/healthshare/demo/fhir/r4";
const username = "superuser";
const password = "ISCDEMO";
const ALLOWED_RESOURCES = ["Patient", "Condition", "Practitioner", "Observation", "Questionnaire", "Encounter", "Location"];

const FhirResourceExplorer = () => {
  const [resourceTypes, setResourceTypes] = useState([]);
  const [expandedResource, setExpandedResource] = useState(null);
  const [resourceElements, setResourceElements] = useState({});
  const [selectedElements, setSelectedElements] = useState({});
  const [vectorTableName, setVectorTableName] = useState("");
  const [fhirOperationName, setFhirOperationName] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    axios.get(`${FHIR_BASE_URL}/metadata`)
      .then(response => {
        if (!response.data.rest) {
          throw new Error("Invalid FHIR response format");
        }
        const resources = response.data.rest[0]?.resource?.map(res => res.type) || [];
        const filteredResources = resources.filter(res => ALLOWED_RESOURCES.includes(res));
        setResourceTypes(filteredResources.sort());
        setError(null);
      })
      .catch(() => setError("Failed to fetch FHIR resource types."));
  }, []);

  const fetchResourceElements = (resourceType) => {
    if (resourceElements[resourceType]) {
      setExpandedResource(expandedResource === resourceType ? null : resourceType);
      return;
    }
    axios.get(`${FHIR_BASE_URL}/StructureDefinition/${resourceType}`, {
      headers: {
        "Authorization": "Basic " + btoa(username + ":" + password)
      }
    })
      .then(response => {
        if (!response.data.snapshot) {
          throw new Error("Invalid response format");
        }
        const elements = response.data.snapshot?.element?.map(el => el.path) || [];
        setResourceElements(prev => ({ ...prev, [resourceType]: elements }));
        setExpandedResource(resourceType);
      })
      .catch(() => setResourceElements(prev => ({ ...prev, [resourceType]: ["No structure available"] })));
  };

  const toggleElementSelection = (resourceType, element) => {
    setSelectedElements(prev => {
      const updatedSelections = { ...prev };
      if (!updatedSelections[resourceType]) {
        updatedSelections[resourceType] = [];
      }
      if (updatedSelections[resourceType].includes(element)) {
        updatedSelections[resourceType] = updatedSelections[resourceType].filter(el => el !== element);
      } else {
        updatedSelections[resourceType] = [...updatedSelections[resourceType], element];
      }
      return { ...updatedSelections };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      VectorTableName: vectorTableName,
      FhirOperationName: fhirOperationName,
      ResourceItems: [
        { ResourceType: "Patient", Items: "Gender,DOB" },
        { ResourceType: "Condition", Items: "Code" },
      ],
    };

    fetch("http://13.55.11.210/demo/fhirlens/generatorvector", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(username + ":" + password),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch data. Please try again.");
        }
        return response.json();
      })
      .then((data) => {
        setResponseData(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleReset = () => {
    setVectorTableName("");
    setFhirOperationName("");
    setResponseData(null);
    setDisabled(false);
    setSelectedElements({}); // Reset selected checkboxes
    setError(null); // Clear any error messages
};

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
        <h2 className="mb-3">FHIR Resource Explorer</h2>
        <Row>
          <Col md={8}>
            {error && <p className="text-danger">{error}</p>}
            <Card className="mb-3">
              <Card.Body>
                <h4>Available FHIR Resources (R4)</h4>
                <Accordion>
                  {resourceTypes.map((resource, index) => (
                    <Accordion.Item eventKey={index.toString()} key={index}>
                      <Accordion.Header onClick={() => fetchResourceElements(resource)}>
                        {resource}
                      </Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          {resourceElements[resource]?.map((element, idx) => (
                            <li key={idx}>
                              <Form.Check
                                type="checkbox"
                                label={element}
                                checked={selectedElements[resource]?.includes(element) || false}
                                onChange={() => toggleElementSelection(resource, element)}
                              />
                            </li>
                          ))}
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <h4>Generator</h4>
                <Card className="mb-3">
                  <Card.Body>
                    <h5>Selected Elements</h5>
                    {Object.keys(selectedElements).length === 0 ? (
                      <p>No elements selected</p>
                    ) : (
                      <ul>
                        {Object.entries(selectedElements).map(([resource, elements]) => (
                          elements.length > 0 && (
                            <li key={resource}>
                              <strong>{resource}:</strong>
                              <ul>
                                {elements.map((element, idx) => (
                                  <li key={idx}>{element}</li>
                                ))}
                              </ul>
                            </li>
                          )
                        ))}
                      </ul>
                    )}
                  </Card.Body>
                </Card>
                <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Vector Table Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={vectorTableName}
                    onChange={(e) => setVectorTableName(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>FHIR Operation Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={fhirOperationName}
                    onChange={(e) => setFhirOperationName(e.target.value)}
                    required
                  />
                </Form.Group>
                <div className="d-flex gap-2 mt-3">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                  <Button variant="success" onClick={handleReset}>
                    Reset
                  </Button>
              </div>
              </Form>
              </Card.Body>
            </Card>
            {responseData && (
            <Card className="mt-4 p-4 text-center shadow bg-white border-primary">
              <p>The following class templates have been generated</p>
              <ListGroup variant="flush" className="text-start">
                <ListGroup.Item><strong>Vector Table Name:</strong> {responseData.VectorTableName}</ListGroup.Item>
                <ListGroup.Item><strong>FHIR OP Class Name:</strong> {responseData.FhirOPClassName}</ListGroup.Item>
              </ListGroup>
            </Card>
          )}
          </Col>
        </Row>
      </Container>
      
    </>
  );
};

export default FhirResourceExplorer;
