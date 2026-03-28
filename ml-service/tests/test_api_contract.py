from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_endpoint_shape():
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert "status" in payload
