import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Button, Card, Row, Col, Spinner, Alert, Nav, Table, Form, Navbar} from "react-bootstrap";
import logo from "../images/logo.png";

const PatientDetail = () => {
  const { id } = useParams();
  const [patientData, setPatientData] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [suggestedDiagnoses, setSuggestedDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [showSuggestionTable, setShowSuggestionTable] = useState(false);  // Controls visibility of suggestion table
  const [showDiagnosisInput, setShowDiagnosisInput] = useState(false); // Controls the visibility of the textbox
  const [newDiagnosis, setNewDiagnosis] = useState(""); // Stores the diagnosis input
  //const [showPatientSummaryIframe, setShowPatientSummaryIframe] = useState(false);

  const username = "superuser";
  const password = "ISCDEMO";
  const apiUrl = `http://13.55.11.210/csp/healthshare/demo/fhir/r4/Patient/${id}/$everything`;
  const suggestUrl = `http://13.55.11.210/csp/healthshare/demo/fhir/r4/Patient/${id}/$vector-diagnosis`

  const capitalizeName = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return "N/A";
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  useEffect(() => {
    fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": "Basic " + btoa(username + ":" + password),
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch patient details");
        }
        return response.json();
      })
      .then((data) => {
        const patientEntry = data.entry.find((entry) => entry.resource.resourceType === "Patient");
        if (!patientEntry) throw new Error("Patient data not found");

        const patient = patientEntry.resource;
        const fullName = patient.name
          ? capitalizeName(`${patient.name[0]?.given?.join(" ") || ""} ${patient.name[0]?.family || ""}`.trim())
          : "N/A";
        const gender = patient.gender ? capitalizeName(patient.gender) : "N/A";
        const birthDate = patient.birthDate || "N/A";
        const age = calculateAge(birthDate);

        setPatientData({ name: fullName, gender, birthDate, age });

        const extractedConditions = [];
        const extractedDiagnoses = [];

        data.entry.forEach((entry) => {
          if (entry.resource.resourceType === "Condition") {
            const categoryCodes = entry.resource.category?.flatMap(cat => cat.coding?.map(c => c.code)) || [];
            const displayText = entry.resource.code?.coding?.[0]?.display || "Unknown Condition";

            if (categoryCodes.includes("problem-list-item")) {
              extractedConditions.push(displayText);
            } else if (categoryCodes.includes("encounter-diagnosis")) {
              extractedDiagnoses.push(displayText);
            }
          }
        });

        setConditions(extractedConditions);
        setDiagnoses(extractedDiagnoses);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const fetchDiagnosisSuggestions = () => {
    //setShowPatientSummaryIframe(false);
    setShowDiagnosisInput(false);
    setFetchingSuggestions(true);
    fetch(suggestUrl, {
      method: "GET",
      headers: {
        "Authorization": "Basic " + btoa(username + ":" + password),
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch diagnosis suggestions");
        }
        return response.json();
      })
      .then((data) => {
        if (!data.entry) throw new Error("Invalid API response format");

        const patients = {};
        
        // First, collect all patients
        data.entry.forEach((entry) => {
          if (entry.resource.resourceType === "Patient") {
            const patientId = entry.resource.id;
            patients[patientId] = {
              gender: entry.resource.gender || "N/A",
              age: calculateAge(entry.resource.birthDate),
              conditions: [],
              diagnoses: [],
            };
          }
        });

        // Next, associate conditions & diagnoses with patients
        data.entry.forEach((entry) => {
          if (entry.resource.resourceType === "Condition") {
            const subjectRef = entry.resource.subject?.reference; // e.g., "Patient/henderson-lucas"
            if (subjectRef) {
              const patientId = subjectRef.split("/")[1]; // Extracts "henderson-lucas"
              if (patients[patientId]) {
                const displayText = entry.resource.code?.coding?.[0]?.display || "Unknown Condition";
                const categoryCodes = entry.resource.category?.flatMap(cat => cat.coding?.map(c => c.code)) || [];

                if (categoryCodes.includes("problem-list-item")) {
                  patients[patientId].conditions.push(displayText);
                } else if (categoryCodes.includes("encounter-diagnosis")) {
                  patients[patientId].diagnoses.push(displayText);
                }
              }
            }
          }
        });

        // Convert to array format for rendering
        const formattedData = Object.values(patients).map((patient) => ({
          gender: patient.gender,
          age: patient.age,
          condition: patient.conditions.join(", ") || "N/A",
          diagnosis: patient.diagnoses.join(", ") || "N/A",
        }));

        setSuggestedDiagnoses(formattedData);
        setFetchingSuggestions(false);
        setShowSuggestionTable(true);
      })
      .catch((err) => {
        console.error("Error fetching diagnosis suggestions:", err);
        setFetchingSuggestions(false);
      });
  };

  const handleAddDiagnosisClick = () => {
    // setShowPatientSummaryIframe(false); 
    setShowSuggestionTable(false)
    setShowDiagnosisInput(true);
  };

  const handleSaveDiagnosis = () => {
    
    if (!newDiagnosis.trim()) {
      alert("Please enter a diagnosis before saving.");
      return;
    }
  
    const requestBody = {
      patientId: id,  // Patient ID from useParams()
      gender: patientData?.gender?.toLowerCase() || "unknown",
      dob: patientData?.birthDate || "unknown",
      conditions: conditions.length > 0 ? conditions.join(", ") : "N/A",
      diagnosis: newDiagnosis.trim(),
    };
  
    fetch("http://13.55.11.210/demo/fhirlens/adddiagnosis", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(username + ":" + password),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to save diagnosis");
        }
        return response;
      })
      .then((data) => {
        alert("Diagnosis saved successfully!");
        setDiagnoses([...diagnoses, newDiagnosis]); // Update the UI
        setShowDiagnosisInput(false);
        setNewDiagnosis(""); // Clear input
        window.location.reload()
      })
      .catch((error) => {
        console.error("Error saving diagnosis:", error);
        alert("Error saving diagnosis. Please try again.");
      });
  };

  // const handleTogglePatientSummaryIframe = () => {
  //   setShowPatientSummaryIframe(prev => !prev);
  // };




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
      <Row className="px-4">
        { (
          <Col md={3} className="border-end bg-light p-3">
            <h5>Menu</h5>
            <Button
              variant="outline-primary"
              className="w-100 mb-2"
              onClick={fetchDiagnosisSuggestions}
              disabled={fetchingSuggestions}
            >
              {fetchingSuggestions ? "Fetching..." : "Diagnosis Suggestions"}
            </Button>
            <Button variant="outline-success" className="w-100 mb-2" onClick={handleAddDiagnosisClick}>
              Add Diagnosis
            </Button>
           
          </Col>
        )} 

      <Col md={diagnoses.length === 0 ? 7 : 9} className="p-4">
        {/* {showPatientSummaryIframe ? (
          // 👇 Only show iframe, everything else is hidden
          <div style={{ width: "100%", height: "100%" }}>
            <h2>Assistant</h2>
            <iframe
              src="http://ec2-3-24-22-245.ap-southeast-2.compute.amazonaws.com:8051/"
              title="Assistent"
              width="100%"
              height="600px"
              style={{ border: "1px solid #ccc", borderRadius: "8px" }}
            />
          </div>
        ) : ( */}
        <>
            <h3>Patient Details</h3>
            {loading && <Spinner animation="border" />}
            {error && <Alert variant="danger">{error}</Alert>}

            {patientData && (
              <Card className="p-3 mb-4">
                <Card.Body>
                  <Card.Title className="mb-2">{patientData.name}</Card.Title>
                  <Card.Text className="mb-2"><strong>Gender:</strong> {patientData.gender}</Card.Text>
                  <Card.Text className="mb-2"><strong>Birth Date:</strong> {patientData.birthDate}</Card.Text>
                  <Card.Text className="mb-2"><strong>Age:</strong> {patientData.age} years</Card.Text>
                </Card.Body>
              </Card>
            )}

            {/* Conditions Section */}
            <h4>Conditions</h4>
            {conditions.length > 0 ? (
              <ul>
                {conditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No conditions listed.</p>
            )}

            {/* Diagnoses Section */}
            {diagnoses.length > 0 && (
              <>
                <h4>Diagnosis</h4>
                <ul>
                  {diagnoses.map((diagnosis, index) => (
                    <li key={index}>{diagnosis}</li>
                  ))}
                </ul>
              </>
            )}

            {/* Suggested Diagnoses Table */}
            {showSuggestionTable && suggestedDiagnoses.length > 0 && (
              <>
                <h4>Suggestions</h4>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Gender</th>
                      <th>Age</th>
                      <th>Conditions</th>
                      <th>Diagnosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestedDiagnoses.map((suggestion, index) => (
                      <tr key={index}>
                        <td>{suggestion.gender}</td>
                        <td>{suggestion.age}</td>
                        <td>{suggestion.condition}</td>
                        <td>{suggestion.diagnosis}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}

            {/* Add Diagnosis */}
            {showDiagnosisInput && (
              <div className="mb-3">
                <h4>Add Diagnosis</h4>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter diagnosis"
                  value={newDiagnosis}
                  onChange={(e) => setNewDiagnosis(e.target.value)}
                />
                <Button variant="primary" className="mt-2" onClick={handleSaveDiagnosis}>
                  Save Diagnosis
                </Button>
              </div>
            )}
          </>
        {/* )} */}
      </Col>
      </Row>
    </Container>
    </>
  );
};

export default PatientDetail;
