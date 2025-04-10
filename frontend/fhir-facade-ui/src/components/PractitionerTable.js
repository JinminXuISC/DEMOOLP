import React, { Component } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { Table, Container, Spinner, Alert } from 'react-bootstrap';

class Practitioners extends Component {
  constructor(props) {
    super(props);
    this.state = {
      practitioners: [],
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    // Hardcoded API credentials
    const username = "superuser";
    const password = "ISCDEMO";
    const apiUrl = "http://13.55.11.210/csp/healthshare/demo/fhir/r4";

    fetch(`${apiUrl}/Practitioner`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(username + ":" + password),
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch practitioners');
        }
        return response.json();
      })
      .then((data) => {
        const entries = data.entry || [];
        const formattedData = entries.map((item) => {
          const practitioner = item.resource;

          // Extract name
          const name = practitioner.name?.[0] || {};
          const fullName = `${name.prefix?.[0] || ''} ${name.given?.join(' ') || ''} ${name.family || ''}`.trim();

          // Extract telecom details
          const email = practitioner.telecom?.find(t => t.system === "email")?.value || "N/A";
          const phone = practitioner.telecom?.find(t => t.system === "phone")?.value || "N/A";

          // Extract address
          const address = practitioner.address?.[0]
            ? `${practitioner.address[0].line?.[0] || ''}, ${practitioner.address[0].city || ''}, ${practitioner.address[0].state || ''} ${practitioner.address[0].postalCode || ''}`
            : "N/A";

          // Extract gender
          const gender = practitioner.gender ? practitioner.gender.charAt(0).toUpperCase() + practitioner.gender.slice(1) : "N/A";

          // Extract qualification
          const qualification = practitioner.qualification?.[0]?.code?.text || "N/A";

          return {
            id: practitioner.id,
            name: fullName,
            email,
            phone,
            address,
            gender,
            qualification
          };
        });

        this.setState({ practitioners: formattedData, loading: false });
      })
      .catch((err) => {
        this.setState({ error: err.message, loading: false });
      });
  }

  render() {
    const { practitioners, loading, error } = this.state;

    return (
      <Container className="mt-4">
        {loading && <Spinner animation="border" />}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Gender</th>
                <th>Qualification</th>
              </tr>
            </thead>
            <tbody>
              {practitioners.length > 0 ? (
                practitioners.map((practitioner) => (
                  <tr key={practitioner.id}>
                    <td>{practitioner.name}</td>
                    <td>{practitioner.email}</td>
                    <td>{practitioner.phone}</td>
                    <td>{practitioner.address}</td>
                    <td>{practitioner.gender}</td>
                    <td>{practitioner.qualification}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">No practitioners found</td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Container>
    );
  }
}

export default Practitioners;