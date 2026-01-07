from flask import Flask, request, jsonify, Response
import requests

app = Flask(__name__)

ODK_BASE = "https://odk.zanzibar.openg2p.org"

# -----------------------------
# Login
# -----------------------------
@app.route("/v1/sessions", methods=["POST"])
def login():
    resp = requests.post(
        f"{ODK_BASE}/v1/sessions",
        json=request.json,
        headers={"Content-Type": "application/json"},
        verify=True
    )
    return jsonify(resp.json()), resp.status_code


# -----------------------------
# All submissions
# -----------------------------
@app.route(
    "/v1/projects/3/forms/zups_beneficiary_form/submissions",
    methods=["GET"]
)
def submissions():
    auth = request.headers.get("Authorization")
    if not auth:
        return {"error": "Authorization header missing"}, 401

    resp = requests.get(
        f"{ODK_BASE}/v1/projects/3/forms/zups_beneficiary_form/submissions",
        headers={"Authorization": auth},
        params=request.args,
        verify=True
    )

    return Response(
        resp.content,
        resp.status_code,
        {"Content-Type": resp.headers.get("Content-Type")}
    )


# -----------------------------
# Single submission (XML)
# -----------------------------
@app.route(
    "/v1/projects/3/forms/zups_beneficiary_form/submissions/<path:submission_id>",
    methods=["GET"]
)
def single_submission(submission_id):
    auth = request.headers.get("Authorization")
    if not auth:
        return {"error": "Authorization header missing"}, 401

    resp = requests.get(
        f"{ODK_BASE}/v1/projects/3/forms/zups_beneficiary_form/submissions/{submission_id}",
        headers={"Authorization": auth},
        verify=True
    )

    return Response(
        resp.content,
        resp.status_code,
        {"Content-Type": resp.headers.get("Content-Type")}
    )


# -----------------------------
# Health check
# -----------------------------
@app.route("/health")
def health():
    return {"status": "ok"}, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
