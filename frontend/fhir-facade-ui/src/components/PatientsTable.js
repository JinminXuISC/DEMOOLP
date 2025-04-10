import React, { Component } from 'react'; 
import "bootstrap/dist/css/bootstrap.min.css";
import { Table, Container, Spinner, Alert, Button } from 'react-bootstrap';
import { BsSearch } from 'react-icons/bs';
import { Link } from 'react-router-dom';

class Patients extends Component {
  constructor(props) {
    super(props);
    this.state = {
      patients: [],
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    const username = "superuser";
    const password = "ISCDEMO";
    const apiUrl = "http://127.0.0.1/csp/healthshare/demo/fhir/r4";
    
    fetch(`${apiUrl}/Condition`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(username + ":" + password),
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }
        return response.json();
      })
      .then((data) => {
        const entries = data.entry || [];
        const patientMap = new Map();

        entries.forEach((item) => {
          const reference = item.resource.subject?.reference || "";
          const id = reference.replace("Patient/", "");
          const displayName = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          
          let problem = "";
          let diagnosis = "";

          item.resource.category?.forEach(category => {
            category.coding?.forEach(coding => {
              if (coding.code === "problem-list-item") {
                problem += (problem ? ", " : "") + (item.resource.code?.coding?.[0]?.display || "N/A");
              } else if (coding.code === "encounter-diagnosis") {
                diagnosis += (diagnosis ? ", " : "") + (item.resource.code?.coding?.[0]?.display || "N/A");
              }
            });
          });

          if (patientMap.has(id)) {
            const existing = patientMap.get(id);
            existing.problem = existing.problem ? existing.problem + ", " + problem : problem;
            existing.diagnosis = existing.diagnosis ? existing.diagnosis + ", " + diagnosis : diagnosis;
          } else {
            patientMap.set(id, { id, name: displayName, problem, diagnosis });
          }
        });

        this.setState({ patients: Array.from(patientMap.values()), loading: false });
      })
      .catch((err) => {
        this.setState({ error: err.message, loading: false });
      });
  }

  render() {
    const { patients, loading, error } = this.state;

    return (
      <Container className="mt-4">
        {loading && <Spinner animation="border" />}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Conditions</th>
                <th>Diagnosis</th>
                <th className="text-center">View</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.name}</td>
                    <td>{patient.problem}</td>
                    <td>{patient.diagnosis}</td>
                    <td className="text-center">
                      <Link to={`/patient/${patient.id}`}>
                        <Button variant="light" size="sm" style={{ padding: 0, border: "none", background: "none" }}>
                          <BsSearch />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">No patients found</td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Container>
    );
  }
}

export default Patients;
