import React, { Component } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Spinner, Alert } from 'react-bootstrap';

class Assistant extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    // Simulate iframe load delay
    // You can replace this logic with onLoad/error event listeners if needed
    setTimeout(() => {
      this.setState({ loading: false });
    }, 1000);
  }

  render() {
    const { loading, error } = this.state;

    return (
      <Container className="mt-4">
        {loading && <Spinner animation="border" />}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && (
          <div style={{ width: "100%", height: "100%" }}>
            <iframe
              src="http://ec2-3-24-22-245.ap-southeast-2.compute.amazonaws.com:8051/"
              title="Assistant"
              width="100%"
              height="600px"
              style={{ border: "1px solid #ccc", borderRadius: "8px" }}
            />
          </div>
        )}
      </Container>
    );
  }
}

export default Assistant;